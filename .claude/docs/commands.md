## 개발 명령어

### 프론트엔드 (`frontend/` 디렉토리)

```bash
npm run dev       # Vite 개발 서버 (포트 5173)
npm run build     # TypeScript 타입 체크 + Vite 빌드
npm run lint      # ESLint 검사
```

### 백엔드 (루트 또는 `backend/` 디렉토리)

```bash
./gradlew.bat bootRun                                        # Spring Boot 개발 서버 (포트 8080), Windows
./gradlew.bat test                                           # 전체 테스트
./gradlew.bat test --tests "com.starterkit.SomeTest"         # 단일 테스트
./gradlew.bat clean build                                    # 클린 빌드 (패키지 이동 후 반드시 실행)
```

백엔드를 먼저 실행한 뒤 프론트엔드를 실행. Vite의 `/api` 프록시가 `localhost:8080`으로 요청을 전달하므로 CORS 설정 없이 개발 가능.

### 환경 변수

백엔드는 `application-dev.yml` 기준으로 동작하며 기본값이 설정되어 있음:
- DB: `localhost:3306/starterkit_dev` (username: `root`, password: `1234`)
- JWT secret, CORS origins: `application.yml`의 `${ENV_VAR:default}` 패턴으로 오버라이드 가능
