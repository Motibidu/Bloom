package com.starterkit.domain.auth.service;

import com.starterkit.domain.auth.dto.request.LoginRequest;
import com.starterkit.domain.auth.dto.request.RegisterRequest;
import com.starterkit.domain.auth.dto.response.AuthResponse;
import com.starterkit.domain.auth.exception.TokenRefreshException;
import com.starterkit.domain.user.entity.User;
import com.starterkit.domain.user.exception.NicknameDuplicateException;
import com.starterkit.domain.user.exception.UserAlreadyExistsException;
import com.starterkit.domain.user.repository.UserRepository;
import com.starterkit.global.security.JwtTokenProvider;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider,
                       @Lazy AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.authenticationManager = authenticationManager;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new UserAlreadyExistsException("Email already registered: " + req.email());
        }
        if (userRepository.existsByNickname(req.nickname())) {
            throw new NicknameDuplicateException("Nickname already taken: " + req.nickname());
        }

        User user = User.builder()
                .email(req.email())
                .password(passwordEncoder.encode(req.password()))
                .nickname(req.nickname())
                .bio(req.bio())
                .build();
        userRepository.save(user);
        return generateTokenPair(user.getEmail());
    }

    public AuthResponse login(LoginRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.email(), req.password()));
        return generateTokenPair(req.email());
    }

    public AuthResponse refresh(String refreshToken) {
        if (refreshToken == null || !tokenProvider.validateToken(refreshToken)) {
            throw new TokenRefreshException("Invalid or expired refresh token");
        }
        String email = tokenProvider.getUsernameFromToken(refreshToken);
        return generateTokenPair(email);
    }

    private AuthResponse generateTokenPair(String email) {
        return new AuthResponse(
                tokenProvider.generateAccessToken(email),
                tokenProvider.generateRefreshToken(email),
                "Bearer");
    }
}
