## 백엔드 아키텍처

### 패키지 구조

도메인별 패키지 구조를 사용. 새 도메인 추가 시 이 패턴을 따라야 함:

```
com.starterkit
├── domain/
│   ├── {domain}/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── entity/
│   │   ├── dto/
│   │   │   ├── request/
│   │   │   └── response/
│   │   └── exception/          ← 도메인 전용 비즈니스 예외
└── global/
    ├── config/                 ← SecurityConfig, OpenApiConfig
    ├── security/               ← JwtTokenProvider, JwtAuthenticationFilter
    └── exception/
        ├── handler/            ← GlobalExceptionHandler (@RestControllerAdvice)
        ├── ResourceNotFoundException.java  ← 범용 404 예외
        └── dto/ErrorResponse.java
```

새 도메인의 예외는 `domain/{domain}/exception/`에 위치. `GlobalExceptionHandler`에 `@ExceptionHandler` 메서드만 추가하면 처리됨.

### 인증 흐름

이중 토큰 방식: **액세스 토큰(15분)** + **리프레시 토큰(7일, HTTP-only 쿠키)**.

- 로그인/회원가입 → 액세스 토큰(응답 body) + 리프레시 토큰(HTTP-only 쿠키, path: `/api/auth/refresh`) 발급
- `JwtAuthenticationFilter`: 모든 요청에서 Bearer 토큰 검증 후 `SecurityContext` 설정
- `AuthService`가 `UserDetailsService`를 구현 — Spring Security가 이 Bean을 자동으로 사용
- 공개 엔드포인트: `/api/auth/**`, `/swagger-ui/**`, `/v3/api-docs/**`

### 크로스 도메인 의존성

`AuthService`(auth 도메인)가 `UserRepository`(user 도메인)를 직접 참조함. 의도된 설계이며 현재 규모에서는 허용 범위.
