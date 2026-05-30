package com.starterkit.domain.auth.service;

import com.starterkit.domain.auth.dto.request.LoginRequest;
import com.starterkit.domain.auth.dto.request.RegisterRequest;
import com.starterkit.domain.auth.dto.response.AuthResponse;
import com.starterkit.domain.auth.exception.EmailVerificationException;
import com.starterkit.domain.auth.dto.response.KakaoUserInfo;
import com.starterkit.domain.auth.entity.RefreshToken;
import com.starterkit.domain.auth.exception.TokenRefreshException;
import com.starterkit.domain.auth.repository.RefreshTokenRepository;
import com.starterkit.domain.family.entity.FamilyGroup;
import com.starterkit.domain.family.entity.FamilyMember;
import com.starterkit.domain.family.entity.FamilyMemberRole;
import com.starterkit.domain.family.exception.InvalidInviteCodeException;
import com.starterkit.domain.family.repository.FamilyGroupRepository;
import com.starterkit.domain.family.repository.FamilyMemberRepository;
import com.starterkit.domain.user.entity.User;
import com.starterkit.domain.user.entity.UserRole;
import com.starterkit.domain.user.exception.AgeRestrictionException;
import com.starterkit.domain.user.exception.NicknameDuplicateException;
import com.starterkit.domain.user.exception.UserAlreadyExistsException;
import com.starterkit.domain.user.repository.UserRepository;
import com.starterkit.global.security.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.Year;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@Transactional
public class AuthService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;
    private final RestTemplate restTemplate;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailVerificationService emailVerificationService;
    private final FamilyGroupRepository familyGroupRepository;
    private final FamilyMemberRepository familyMemberRepository;

    @Value("${app.kakao.rest-api-key:}")
    private String kakaoRestApiKey;

    @Value("${app.kakao.client-secret:}")
    private String kakaoClientSecret;

    @Value("${app.kakao.redirect-uri:http://localhost:5173/kakao-callback}")
    private String kakaoRedirectUri;

    @Value("${app.jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider,
                       @Lazy AuthenticationManager authenticationManager,
                       RestTemplate restTemplate,
                       RefreshTokenRepository refreshTokenRepository,
                       EmailVerificationService emailVerificationService,
                       FamilyGroupRepository familyGroupRepository,
                       FamilyMemberRepository familyMemberRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.authenticationManager = authenticationManager;
        this.restTemplate = restTemplate;
        this.refreshTokenRepository = refreshTokenRepository;
        this.emailVerificationService = emailVerificationService;
        this.familyGroupRepository = familyGroupRepository;
        this.familyMemberRepository = familyMemberRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    public AuthResponse register(RegisterRequest req) {
        if (!emailVerificationService.isVerified(req.email())) {
            throw new EmailVerificationException("이메일 인증이 완료되지 않았어요");
        }
        if (userRepository.existsByEmail(req.email())) {
            throw new UserAlreadyExistsException("Email already registered: " + req.email());
        }
        if (userRepository.existsByNickname(req.nickname())) {
            throw new NicknameDuplicateException("Nickname already taken: " + req.nickname());
        }

        boolean hasInviteCode = req.inviteCode() != null && !req.inviteCode().isBlank();
        int age = Year.now().getValue() - req.birthYear();
        boolean isAgeEligible = age >= 50;

        // inviteCode가 있으면 유효성 먼저 검증
        FamilyGroup invitedGroup = null;
        if (hasInviteCode) {
            invitedGroup = familyGroupRepository.findByInviteCode(req.inviteCode())
                    .orElseThrow(() -> new InvalidInviteCodeException("유효하지 않은 초대 코드입니다."));
        }

        // 나이 미충족 + 초대코드 없음 → FAMILY_VIEWER (공개 피드 작성 불가, 가족 피드 열람 가능)
        UserRole role = isAgeEligible ? UserRole.MEMBER : UserRole.FAMILY_VIEWER;

        User user = User.builder()
                .email(req.email())
                .password(passwordEncoder.encode(req.password()))
                .nickname(req.nickname())
                .bio(req.bio())
                .name(req.name())
                .birthYear(req.birthYear())
                .birthMonth(req.birthMonth())
                .birthDay(req.birthDay())
                .role(role)
                .build();
        userRepository.save(user);

        // 초대 코드로 가입한 경우 해당 가족 그룹에 GUEST로 자동 등록
        if (invitedGroup != null && !familyMemberRepository.existsByGroupIdAndUserId(invitedGroup.getId(), user.getId())) {
            familyMemberRepository.save(
                    FamilyMember.builder()
                            .group(invitedGroup)
                            .user(user)
                            .role(FamilyMemberRole.GUEST)
                            .build()
            );
        }

        AuthResponse pair = generateTokenPair(user.getEmail());
        saveRefreshToken(pair.refreshToken(), user);
        return pair;
    }

    public AuthResponse login(LoginRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.email(), req.password()));

        User user = (User) loadUserByUsername(req.email());
        AuthResponse pair = generateTokenPair(req.email());
        saveRefreshToken(pair.refreshToken(), user);
        return pair;
    }

    public AuthResponse refresh(String rawToken) {
        if (rawToken == null || !tokenProvider.validateToken(rawToken)) {
            throw new TokenRefreshException("Invalid or expired refresh token");
        }

        String hash = tokenProvider.hashToken(rawToken);
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new TokenRefreshException("Invalid refresh token"));

        if (stored.isRevoked()) {
            throw new TokenRefreshException("Refresh token already used");
        }

        if (stored.getExpiresAt().isBefore(java.time.LocalDateTime.now())) {
            throw new TokenRefreshException("Refresh token expired");
        }

        // refresh token은 rotation하지 않고 재사용, access token만 새로 발급
        User user = stored.getUser();
        String newAccessToken = tokenProvider.generateAccessToken(user.getEmail());
        return new AuthResponse(newAccessToken, rawToken, "Bearer", false);
    }

    public void logout(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }
        String hash = tokenProvider.hashToken(rawToken);
        refreshTokenRepository.findByTokenHash(hash)
                .ifPresent(rt -> rt.setRevoked(true));
    }

    public AuthResponse kakaoLogin(String code) {
        String kakaoAccessToken = exchangeKakaoToken(code);
        KakaoUserInfo kakaoUser = fetchKakaoUserInfo(kakaoAccessToken);

        Optional<User> byKakaoId = userRepository.findByKakaoId(kakaoUser.id());
        if (byKakaoId.isPresent()) {
            User user = byKakaoId.get();
            AuthResponse pair = generateTokenPair(user.getEmail());
            saveRefreshToken(pair.refreshToken(), user);
            return pair;
        }

        String kakaoEmail = kakaoUser.getEmail();
        if (kakaoEmail != null) {
            Optional<User> byEmail = userRepository.findByEmail(kakaoEmail);
            if (byEmail.isPresent()) {
                User user = byEmail.get();
                user.setKakaoId(kakaoUser.id());
                AuthResponse pair = generateTokenPair(user.getEmail());
                saveRefreshToken(pair.refreshToken(), user);
                return pair;
            }
        }

        // 신규 가입: 닉네임 미설정 임시 계정 (비밀번호 로그인 불가 처리)
        String tempEmail = kakaoEmail != null ? kakaoEmail : "kakao_" + kakaoUser.id() + "@kakao.local";
        User newUser = User.builder()
                .email(tempEmail)
                .password(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
                .kakaoId(kakaoUser.id())
                .birthYear(1970)
                .build();
        userRepository.save(newUser);

        AuthResponse tokenPair = generateTokenPair(newUser.getEmail());
        saveRefreshToken(tokenPair.refreshToken(), newUser);
        return new AuthResponse(tokenPair.accessToken(), tokenPair.refreshToken(), tokenPair.tokenType(), true);
    }

    public void setKakaoNickname(Long userId, String nickname, Integer birthYear) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userId));
        if (user.getNickname() != null) {
            throw new IllegalStateException("Nickname already set");
        }
        if (userRepository.existsByNickname(nickname)) {
            throw new NicknameDuplicateException("Nickname already taken: " + nickname);
        }
        user.setNickname(nickname);
        user.setBirthYear(birthYear);
    }

    private void saveRefreshToken(String rawToken, User user) {
        String hash = tokenProvider.hashToken(rawToken);
        LocalDateTime expiresAt = LocalDateTime.now().plus(refreshTokenExpirationMs, ChronoUnit.MILLIS);
        RefreshToken rt = RefreshToken.builder()
                .tokenHash(hash)
                .user(user)
                .expiresAt(expiresAt)
                .build();
        refreshTokenRepository.save(rt);
    }

    private String exchangeKakaoToken(String code) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", kakaoRestApiKey);
        params.add("redirect_uri", kakaoRedirectUri);
        params.add("code", code);
        if (!kakaoClientSecret.isEmpty()) {
            params.add("client_secret", kakaoClientSecret);
        }

        log.info("[Kakao] rest-api-key={}, redirect-uri={}, code={}",
                kakaoRestApiKey.isEmpty() ? "EMPTY!" : kakaoRestApiKey.substring(0, 6) + "...",
                kakaoRedirectUri, code.substring(0, Math.min(10, code.length())) + "...");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    "https://kauth.kakao.com/oauth/token", request, Map.class);
            if (response.getBody() == null || !response.getBody().containsKey("access_token")) {
                throw new IllegalArgumentException("Failed to exchange kakao token");
            }
            return (String) response.getBody().get("access_token");
        } catch (HttpClientErrorException e) {
            log.error("[Kakao] 토큰 교환 실패: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new IllegalArgumentException("Kakao token exchange failed: " + e.getResponseBodyAsString());
        }
    }

    private KakaoUserInfo fetchKakaoUserInfo(String kakaoAccessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(kakaoAccessToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);
        ResponseEntity<KakaoUserInfo> response = restTemplate.exchange(
                "https://kapi.kakao.com/v2/user/me", HttpMethod.GET, request, KakaoUserInfo.class);

        if (response.getBody() == null) {
            throw new IllegalArgumentException("Failed to fetch kakao user info");
        }
        return response.getBody();
    }

    private AuthResponse generateTokenPair(String email) {
        return new AuthResponse(
                tokenProvider.generateAccessToken(email),
                tokenProvider.generateRefreshToken(email),
                "Bearer",
                false);
    }
}
