package com.starterkit.domain.auth.controller;

import com.starterkit.domain.auth.dto.request.KakaoLoginRequest;
import com.starterkit.domain.auth.dto.request.KakaoNicknameRequest;
import com.starterkit.domain.auth.dto.request.LoginRequest;
import com.starterkit.domain.auth.dto.request.RegisterRequest;
import com.starterkit.domain.auth.dto.response.AuthResponse;
import com.starterkit.domain.auth.service.AuthService;
import com.starterkit.domain.user.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "회원가입, 로그인, 토큰 갱신")
public class AuthController {

    private final AuthService authService;

    @Value("${app.jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    @PostMapping("/register")
    @Operation(summary = "회원가입")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response) {
        AuthResponse authResponse = authService.register(request);
        setRefreshTokenCookie(response, authResponse.refreshToken());
        return ResponseEntity.ok(AuthResponse.withoutRefreshToken(authResponse));
    }

    @PostMapping("/login")
    @Operation(summary = "로그인 — 액세스 토큰 반환")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        AuthResponse authResponse = authService.login(request);
        setRefreshTokenCookie(response, authResponse.refreshToken());
        return ResponseEntity.ok(AuthResponse.withoutRefreshToken(authResponse));
    }

    @PostMapping("/refresh")
    @Operation(summary = "리프레시 토큰 쿠키로 액세스 토큰 재발급")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest request,
                                                HttpServletResponse response) {
        String refreshToken = extractRefreshTokenFromCookie(request);
        AuthResponse authResponse = authService.refresh(refreshToken);
        setRefreshTokenCookie(response, authResponse.refreshToken());
        return ResponseEntity.ok(AuthResponse.withoutRefreshToken(authResponse));
    }

    @PostMapping("/logout")
    @Operation(summary = "로그아웃 — 리프레시 토큰 쿠키 삭제")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        response.addHeader("Set-Cookie",
                "refreshToken=; HttpOnly; Path=/api/auth/refresh; Max-Age=0; SameSite=Strict");
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/kakao")
    @Operation(summary = "카카오 로그인 — 인가 코드로 자체 JWT 발급")
    public ResponseEntity<AuthResponse> kakaoLogin(
            @Valid @RequestBody KakaoLoginRequest request,
            HttpServletResponse response) {
        AuthResponse authResponse = authService.kakaoLogin(request.code());
        setRefreshTokenCookie(response, authResponse.refreshToken());
        return ResponseEntity.ok(AuthResponse.withoutRefreshToken(authResponse));
    }

    @PatchMapping("/kakao/nickname")
    @Operation(summary = "카카오 신규 가입 닉네임 설정")
    public ResponseEntity<Void> setKakaoNickname(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody KakaoNicknameRequest request) {
        authService.setKakaoNickname(currentUser.getId(), request.nickname(), request.birthYear());
        return ResponseEntity.noContent().build();
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String token) {
        int maxAgeSec = (int) (refreshTokenExpirationMs / 1000);
        response.addHeader("Set-Cookie",
                String.format("refreshToken=%s; HttpOnly; Path=/api/auth/refresh; Max-Age=%d; SameSite=Strict",
                        token, maxAgeSec));
    }

    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> "refreshToken".equals(c.getName()))
                .map(jakarta.servlet.http.Cookie::getValue)
                .findFirst()
                .orElse(null);
    }
}
