# 오늘 뭐 했어요?

50~60대 중장년층이 하루 활동을 기록하고, 같은 활동을 한 사람과 자연스럽게 연결되어 외로움을 해소할 수 있도록 돕는 소셜 체크인 서비스입니다.

## 프로젝트 소개

- **목적**: 일상의 소소한 활동(산책, 요리, 독서 등)을 공유하고, 같은 활동을 한 사람과 공감을 나눈다
- **타겟 사용자**: 일상을 기록하고 싶은 50~60대 중장년층

## 주요 페이지 및 기능

| 페이지 | 경로 | 기능 |
|--------|------|------|
| 랜딩/홈 | `/` | 서비스 소개 (비로그인 전용) |
| 로그인 | `/login` | 이메일 + 비밀번호 인증 |
| 회원가입 | `/register` | 이메일 / 비밀번호 / 닉네임 / 자기소개 등록 |
| 오늘의 피드 | `/feed` | 오늘 활동 조회, 인라인 체크인 작성, 좋아요 |
| 활동 상세 | `/activity/:id` | 상세 내용 조회, 댓글 작성, 좋아요 토글 |
| 나의 활동 | `/my-activity` | 캘린더 히스토리, 카테고리별 활동 통계 |

## 기술 스택

### 프론트엔드
- React 19 / TypeScript / Vite
- TailwindCSS v4 / Radix UI / Lucide React
- Zustand / TanStack Query v5 / Axios
- React Hook Form / React Router v7

### 백엔드
- Spring Boot 3.4 / Java 21
- Spring Security / Spring Data JPA / MySQL
- JJWT 0.12 / SpringDoc OpenAPI (Swagger UI)

## 개발 환경 실행 방법

백엔드를 먼저 실행한 뒤 프론트엔드를 실행합니다.

### 백엔드 (포트 8080)

```bash
cd backend
./gradlew.bat bootRun
```

Swagger UI: http://localhost:8080/swagger-ui.html

### 프론트엔드 (포트 5173)

```bash
cd frontend
npm install
npm run dev
```

Vite의 `/api` 프록시가 `localhost:8080`으로 요청을 전달하므로 CORS 설정 없이 개발 가능합니다.

### 환경 변수

백엔드 `application-dev.yml` 기본값:
- DB: `localhost:3306/starterkit_dev` (username: `root`, password: `1234`)

## 개발 상태

- 프로젝트 구조 초기화 완료
- 인증 (회원가입 / 로그인 / 로그아웃) 완료
- 오늘의 피드 — API 연동 예정
- 체크인 작성 (카테고리 + 설명 + 사진) — API 연동 예정
- 좋아요 / 댓글 — API 연동 예정
- 나의 활동 캘린더 + 통계 — API 연동 예정

## 상세 기획

`docs/PRD.md` 참조
