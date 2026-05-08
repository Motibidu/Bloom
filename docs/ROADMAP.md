# 오늘 뭐 했어요? 개발 로드맵

50~60대 중장년층이 하루 활동을 카테고리로 기록하고, 같은 활동을 한 사람과 자연스럽게 연결되는 일상 기록 소셜 서비스

## 개요

**오늘 뭐 했어요?**는 50~60대 중장년층을 위한 일상 기록 기반 소셜 연결 서비스로 다음 기능을 제공합니다:

- **체크인 작성**: 카테고리, 한 줄 설명, 선택적 사진 한 장으로 하루 활동을 피드 내 인라인으로 간단히 기록
- **오늘의 피드**: KST 기준 오늘 다른 사용자들의 활동을 등록순으로 확인하고 같은 카테고리를 선택한 사람과 자연스럽게 연결
- **소셜 인터랙션**: 좋아요 토글과 댓글로 가볍고 따뜻한 교류
- **나의 활동 히스토리**: 단일 페이지 내 월별 캘린더와 카테고리별 통계로 내 일상의 변화를 시각적으로 확인

## 개발 워크플로우

1. **작업 계획**

- 기존 코드베이스를 학습하고 현재 상태를 파악
- 새로운 작업을 포함하도록 `ROADMAP.md` 업데이트
- 우선순위 작업은 마지막 완료된 작업 다음에 삽입

2. **작업 생성**

- `/tasks` 디렉토리에 새 작업 파일 생성
- 명명 형식: `XXX-description.md` (예: `001-setup.md`)
- 고수준 명세서, 관련 파일, 수락 기준, 구현 단계 포함
- **API/비즈니스 로직 작업 시 "## 테스트 체크리스트" 섹션 필수 포함 (Playwright MCP 테스트 시나리오 작성)**
- 예시를 위해 `/tasks` 디렉토리의 마지막 완료된 작업 참조
- 초기 상태의 샘플로 `000-sample.md` 참조

3. **작업 구현**

- 작업 파일의 명세서를 따름
- 기능과 기능성 구현
- 프론트엔드: `src/lib/api.ts` Axios 인스턴스를 통해 백엔드 API 호출
- 백엔드: 도메인 패키지 구조(`domain/{domain}/`) 내에 구현
- **API 연동 및 비즈니스 로직 구현 시 Playwright MCP로 테스트 수행 필수**
- 각 단계 후 작업 파일 내 단계 진행 상황 업데이트
- 구현 완료 후 Playwright MCP를 사용한 E2E 테스트 실행
- 테스트 통과 확인 후 다음 단계로 진행
- 각 단계 완료 후 중단하고 추가 지시를 기다림

4. **로드맵 업데이트**

- 로드맵에서 완료된 작업을 체크박스 [x]로 표시하고 ✅를 제목에 추가

## 개발 단계

### Phase 1: 애플리케이션 골격 구축

스타터킷에서 불필요한 코드를 제거하고, PRD 기반 전체 라우트 구조와 TypeScript 타입을 먼저 확정합니다. 이후 모든 Phase가 독립적으로 병렬 개발 가능한 상태로 만듭니다.

#### 백엔드

- [x] **Task 001: 스타터킷 클리닝 및 도메인 패키지 골격 생성** ✅
  - 스타터킷에 포함된 샘플 도메인 및 엔드포인트 제거 (auth, user 인증 인프라는 유지)
  - `domain/checkin/`, `domain/like/`, `domain/comment/` 패키지 디렉토리 골격 생성 (controller / service / repository / entity / dto / exception 하위 패키지)
  - `application-dev.yml` DB 기본값을 `localhost:3306/bloom_dev`로 변경 검증
  - `application.yml`에 S3 관련 환경 변수 자리표시자 추가 (`AWS_S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`)
  - SpringDoc OpenAPI 태그 그룹 설정 (auth, user, checkin, like, comment)

- [x] **Task 002: 데이터베이스 스키마 설계 및 마이그레이션 준비** ✅
  - PRD 데이터 모델 기반 테이블 ERD 확정: `users`, `checkins`, `likes`, `comments`
  - `checkins.category` ENUM 정의: `WALK`, `COOKING`, `READING`, `GARDENING`, `EXERCISE`, `MEETING`, `OTHER`
  - `users.bio` VARCHAR(50), `users.nickname` VARCHAR(50) UNIQUE 확정 (PRD 기준)
  - `likes` 테이블 복합 UNIQUE KEY `(user_id, checkin_id)` 인덱스 설계
  - `checkins` 테이블 `(user_id, created_at)`, `(created_at, category)` 인덱스 설계
  - JPA `ddl-auto` 정책 결정 및 초기 스키마 SQL 스크립트 작성 (`backend/src/main/resources/db/`)
  - `GlobalExceptionHandler`에 도메인별 예외 핸들러 슬롯 마련 및 Bean Validation 에러 응답 표준화

#### 프론트엔드

- [x] **Task 003: 라우팅 구조 및 공통 타입 정의** ✅
  - React Router v7 기준 전체 라우트 확정 (PRD 메뉴 구조 기반):
    - 비로그인: `/login`, `/register`
    - 로그인 후: `/`(오늘의 피드 + 인라인 체크인 작성), `/checkin/:id`(활동 상세), `/me`(나의 활동 — 캘린더 + 통계 단일 페이지)
  - `src/types/index.ts`에 PRD 데이터 모델 기반 TypeScript 타입 정의:
    - `User`, `CheckIn`, `Category` (ENUM 값 포함), `Comment`, `Like`
    - `TodayFeedResponse` (checkins 배열 + `sameCategoryUserCount` 포함)
    - `CalendarDayEntry` (`{ date, categories[] }`), `CategoryStats`
    - `PhotoUploadUrlRequest`, `PhotoUploadUrlResponse` (`{ uploadUrl, objectKey, expiresIn }`)
  - `App.tsx`의 `ProtectedRoute`/`PublicOnlyRoute`에 신규 라우트 매핑
  - 각 라우트에 빈 페이지 컴포넌트(stub) 배치하여 네비게이션 동작 확인

### Phase 2: UI/UX 완성 (더미 데이터 활용)

백엔드 API 없이 하드코딩된 더미 데이터로 모든 페이지 UI를 먼저 완성합니다. 50~60대 친화 디자인 시스템과 반응형 레이아웃을 이 단계에서 완전히 확정합니다.

- [x] **Task 004: 디자인 시스템 및 공통 컴포넌트 구현** ✅
  - Header.tsx 라우트 버그 수정: 로고/피드 링크 `/feed` → `/`, 나의 활동 `/my-activity` → `/me`
  - `src/lib/categories.ts` 생성: 7개 카테고리 Lucide 아이콘 + 한국어 라벨 매핑 (WALK=Footprints, COOKING=ChefHat, READING=BookOpen, GARDENING=Sprout, EXERCISE=Dumbbell, MEETING=Users, OTHER=MoreHorizontal)
  - `BottomTabBar.tsx` 신규 생성: 모바일 전용(`md:hidden`) 하단 고정 탭바, 오늘의 피드(`/`) 이동 버튼 1개, 현재 경로 활성 강조
  - `Layout.tsx` 업데이트: BottomTabBar 추가, main에 `pb-16 md:pb-0` 패딩 적용
  - `CategoryIconGrid` 컴포넌트: 7개 카테고리 그리드(grid-cols-4 모바일/grid-cols-7 PC), 선택 상태 ring-2 ring-primary 강조, 최소 터치 영역 64x64px
  - `CheckInCard` 컴포넌트: 카테고리 아이콘+라벨, 닉네임, 상대 시간, 설명(피드 2줄 클램프), 사진 썸네일, LikeButton, 댓글 수 포함
  - `LikeButton` 컴포넌트: Heart 아이콘 + 숫자, likedByMe 상태별 색상 구분, 최소 터치 44x44px
  - `BigButton` 컴포넌트: 높이 56px h-14, text-lg font-semibold, loading 상태 지원
  - See: /docs/tasks/004-design-system.md

- [x] **Task 005: 회원가입 / 로그인 페이지 UI 완성** ✅
  - RegisterPage 닉네임 유효성 강화: 2~12자 + 한글/영문/숫자 정규식(`/^[가-힣a-zA-Z0-9]+$/`) 적용 (현재 maxLength:50만 적용)
  - RegisterPage 비밀번호 정책 추가: 영문+숫자 조합 필수(`/^(?=.*[a-zA-Z])(?=.*d).+$/`)
  - RegisterPage bio 필드: Input → Textarea(3행)로 교체 + 글자 수 카운터(N/50) 추가
  - Phase 2에서 더미 제출 핸들러로 교체 (console.log + alert), 실제 API 연동은 Task 014
  - 기존 LoginPage/RegisterPage의 h-14 text-lg 스타일 유지 확인
  - See: /docs/tasks/005-auth-pages.md

- [x] **Task 006: 오늘의 피드 페이지 UI 완성 (더미 데이터)** ✅
  - App.tsx 라우팅 수정: ProtectedRoute Layout 내부에 index 라우트로 FeedPage 추가, RootPage를 Navigate로 단순화
  - 더미 데이터: sameCategoryUserCount=3, 체크인 3개(산책/요리/독서)
  - "나와 같은 활동을 한 N명" 배너: sameCategoryUserCount > 0 조건부 표시
  - 인라인 체크인 작성: 접힌 상태(클릭 유도) / 펼친 상태(CategoryIconGrid + 설명 Textarea + 글자 수 카운터 + 등록 버튼) 2단계 전환
  - 카테고리 선택 전에는 설명 입력창 미표시, 등록 버튼은 설명 미입력 시 비활성화
  - CheckInCard 목록 렌더링, 카드 클릭 시 `/checkin/:id` 이동, LikeButton 더미 토글 동작
  - EmptyState 빈 상태 처리
  - See: /docs/tasks/006-feed-page.md

- [x] **Task 007: 활동 상세 페이지 UI 완성 (더미 데이터)** ✅
  - 더미 데이터: 요리 체크인(사진 포함) + 댓글 3개
  - 체크인 상세: 카테고리 아이콘+라벨, 닉네임, 상대 시간, 설명(전체), 사진(있을 때)
  - LikeButton 더미 토글 (likeCount 즉시 반영)
  - 댓글 목록: 닉네임 + 내용 + 상대 시간, bg-muted/50 카드 스타일
  - 댓글 입력: Textarea 3행 + 글자 수 카운터(N/200) + 등록 버튼, 더미 댓글 추가 동작
  - "오늘의 피드로" 뒤로가기 버튼
  - See: /docs/tasks/007-activity-detail-page.md

- [x] **Task 008: 나의 활동 페이지 UI 완성 (더미 데이터)** ✅
  - 더미 데이터: 5월 활동 10일치 캘린더 + 날짜별 체크인 + 카테고리 통계 6종
  - 이전/다음 달 이동 버튼, 월 변경 시 selectedDate 초기화
  - 캘린더 그리드: grid-cols-7, 날짜 셀 min-h-[60px], 활동 있는 날짜에 카테고리 도트(최대 3개), 오늘 날짜 bg-accent 강조, 활동 없는 날짜 disabled
  - 날짜 클릭 시 체크인 목록 인라인 표시(토글), 동일 날짜 재클릭 시 숨김
  - 카테고리별 통계 막대: 최대값 기준 상대 너비 퍼센트, transition 애니메이션
  - 활동 없는 달 빈 상태 메시지
  - See: /docs/tasks/008-my-activity-page.md

### Phase 3: 백엔드 API 구현

프론트엔드 UI가 완성된 상태에서 백엔드 API를 도메인별로 구현합니다. Swagger UI로 각 엔드포인트를 검증합니다.

#### 인증/사용자 도메인

- [x] **Task 009: User 엔티티 확장 및 인증 API 검증** ✅ - 우선순위
  - `User` 엔티티 필드 확정: `id`, `email`, `password`, `nickname` (VARCHAR 50, UNIQUE), `bio` (VARCHAR 50, NULL), `created_at`
  - `POST /api/auth/register` 요청 DTO에 `nickname` (2~12자, 한글/영문/숫자, UNIQUE) 및 `bio` (선택, 최대 50자) 추가
  - 비밀번호 정책 적용: 최소 8자, 영문+숫자 포함
  - `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout` 동작 검증
  - `GET /api/users/me` — `UserProfileResponse` DTO (id, email, nickname, bio, createdAt) 반환
  - `GET /api/users/check-nickname?nickname=` — `{ available: boolean }` 반환, 닉네임 형식 검증 포함
  - Swagger UI에서 전체 인증 플로우 검증

#### 체크인 도메인

- [x] **Task 010: 체크인 엔티티 및 기본 CRUD API** ✅
  - `CheckIn` 엔티티: `id`, `user_id`, `category` (ENUM), `description` (VARCHAR 100), `photo_object_key` (VARCHAR 300, NULL), `created_at`
  - `POST /api/checkins` — 카테고리, 설명, objectKey(선택)로 체크인 생성; 사진 포함 시 `HeadObject`로 실제 크기 검증(10MB 초과 시 S3 객체 삭제 후 403 반환); objectKey prefix(`checkins/{currentUserId}/`) 검증 (불일치 시 403)
  - `GET /api/checkins/{id}` — 단일 체크인 상세 (`likeCount`, `likedByMe`, `commentCount` 포함)
  - `GET /api/checkins/today` — KST 기준 오늘 체크인 목록 (등록순); 응답 최상위에 `sameCategoryUserCount` 포함 (내가 오늘 체크인한 카테고리와 1개 이상 겹치는 고유 사용자 수, 본인 제외)
  - `GET /api/checkins/my` — 내 체크인 목록 (쿼리 파라미터: `?date=YYYY-MM-DD`)
  - `GET /api/checkins/my/calendar` — 월별 경량 조회 `[{ date, categories[] }]` (쿼리 파라미터: `?year=&month=`)
  - `GET /api/checkins/my/stats` — 카테고리별 활동 횟수 통계 (쿼리 파라미터: `?year=&month=`)
  - Playwright MCP로 Swagger UI를 통한 API 동작 검증

- [x] **Task 011: S3 Presigned URL 발급 API** ✅
  - `POST /api/checkins/photo-upload-url` — 요청: `{ contentType: "image/jpeg"|"image/png", fileSize: number }` / 응답: `{ uploadUrl, objectKey, expiresIn: 300 }`
  - 객체 키 네이밍: `checkins/{userId}/{uuid}.{ext}` (현재 로그인 사용자 userId로 prefix 고정)
  - contentType 화이트리스트 검증 (jpeg, png만 허용); fileSize는 체크인 등록 시 HeadObject로 사후 검증
  - AWS SDK for Java v2 의존성 추가, `S3Client` Bean 구성 (`global/config/S3Config.java`)
  - 로컬 개발 가이드 문서화 (실제 S3 버킷 또는 LocalStack)

#### 소셜 도메인

- [x] ✅ **Task 012: 좋아요 도메인 API**
  - `Like` 엔티티: `id`, `user_id`, `checkin_id`, `created_at` + UNIQUE KEY `(user_id, checkin_id)`
  - `POST /api/checkins/{id}/likes` — 좋아요 추가 (이미 좋아요 상태 재요청 시 200 OK, 멱등)
  - `DELETE /api/checkins/{id}/likes` — 좋아요 취소 (이미 취소 상태 재요청 시 200 OK, 멱등)
  - Playwright MCP로 Swagger UI를 통한 토글 동작 검증

- [x] ✅ **Task 013: 댓글 도메인 API**
  - `Comment` 엔티티: `id`, `user_id`, `checkin_id`, `content` (VARCHAR 200), `created_at`
  - `GET /api/checkins/{id}/comments` — 등록순 댓글 목록 (작성자 닉네임 포함)
  - `POST /api/checkins/{id}/comments` — 댓글 작성 (content 최대 200자 검증)
  - Playwright MCP로 Swagger UI를 통한 댓글 작성/조회 검증

### Phase 4: 프론트엔드-백엔드 연동

Phase 2에서 완성한 UI의 더미 데이터를 실제 API 호출로 교체합니다. TanStack Query 훅을 작성하고 Playwright MCP로 전체 사용자 플로우를 검증합니다.

- [x] **Task 014: 인증 플로우 API 연동** ✅ - 우선순위
  - 회원가입 페이지: `useAuth.ts`의 `register` mutation 연결; 닉네임 입력 시 디바운스로 `check-nickname` API 실시간 호출; 성공 시 로그인 페이지 이동 + 성공 토스트
  - 로그인 페이지: `useAuth.ts`의 `login` mutation 연결; 성공 시 오늘의 피드(`/`)로 자동 리다이렉트
  - 헤더 드롭다운 로그아웃: `logout` mutation 연결
  - 프로필 드롭다운: `useCurrentUser()` 훅으로 닉네임 표시
  - Playwright MCP로 회원가입 → 로그인 → 로그아웃 → 재로그인 E2E 시나리오 검증

- [ ] **Task 015: 오늘의 피드 및 체크인 작성 API 연동** - 우선순위
  - `useTodayFeed()` TanStack Query 훅: `GET /api/checkins/today` 호출, 30초 staleTime 설정
  - 피드 상단 "나와 같은 활동을 한 N명" 배너: `sameCategoryUserCount` 값 표시 (비로그인 또는 미체크인 시 배너 미표시)
  - 인라인 체크인 작성 폼 연동:
    - 사진 없는 경우: `POST /api/checkins` 직접 호출
    - 사진 있는 경우: `POST /api/checkins/photo-upload-url` → presigned URL로 S3 직접 PUT → `POST /api/checkins`(objectKey 포함)
    - 클라이언트에서 이미지 1080px 이하 리사이즈 후 업로드, 업로드 진행률 표시
    - 등록 성공 시 폼 닫힘 + 피드 캐시 무효화(즉시 갱신) + 성공 토스트
  - Playwright MCP로 피드 로딩 → 체크인 작성(사진 포함/미포함) → 피드 즉시 반영 E2E 검증

- [ ] **Task 016: 활동 상세 및 소셜 인터랙션 API 연동**
  - `useCheckinDetail(id)` 훅: `GET /api/checkins/{id}` 호출
  - 좋아요 토글: `POST/DELETE /api/checkins/{id}/likes` mutation + 옵티미스틱 업데이트 (`likeCount`, `likedByMe` 즉시 반영)
  - `useComments(id)` 훅: `GET /api/checkins/{id}/comments` 호출
  - 댓글 작성 mutation: `POST /api/checkins/{id}/comments` 성공 후 댓글 목록 캐시 무효화
  - Playwright MCP로 좋아요 토글 + 댓글 작성 + 다른 계정으로 확인하는 통합 E2E 검증

- [ ] **Task 017: 나의 활동 페이지 API 연동**
  - `useMyCalendar(year, month)` 훅: `GET /api/checkins/my/calendar` 호출
  - 날짜 클릭 시 `useMyCheckins(date)` 훅: `GET /api/checkins/my?date=YYYY-MM-DD` 호출 → 인라인 표시
  - `useMyCategoryStats(year, month)` 훅: `GET /api/checkins/my/stats` 호출
  - 월 이동 시 year/month 파라미터 갱신 후 캐시 자동 관리
  - Playwright MCP로 월 이동 → 날짜 클릭 → 통계 표시 플로우 검증

- [ ] **Task 018: 전체 사용자 플로우 통합 테스트**
  - Playwright MCP로 핵심 사용자 여정 E2E 검증:
    - 회원가입 → 로그인 → 오늘의 피드 확인 → 체크인 작성(사진 포함) → 피드 즉시 반영
    - 다른 계정으로 로그인 → 피드에서 첫 번째 계정 체크인 확인 → 좋아요 → 댓글 작성 → 상세 페이지 확인
    - 나의 활동 페이지 → 캘린더에서 날짜 클릭 → 통계 섹션 확인
    - 401 자동 갱신 인터셉터 동작 검증 (액세스 토큰 만료 시 자동 갱신 후 재요청)
  - 에러 핸들링 및 엣지 케이스 검증: 네트워크 오류, 유효성 검사 실패, 이미 좋아요한 항목 재요청
  - 로딩/에러 상태 UI 검증 (Skeleton, ErrorBoundary, 재시도 버튼)

### Phase 5: 배포 및 인프라

MVP 외부 공개를 위한 배포 파이프라인과 인프라를 구축합니다.

- [ ] **Task 019: Docker 컨테이너화** - 우선순위
  - `backend/Dockerfile`: 멀티스테이지 빌드 (Gradle build → OpenJDK 21 런타임)
  - `frontend/Dockerfile`: Node 20 빌드 → Nginx 정적 서빙
  - 루트 `docker-compose.yml`: backend + frontend + MySQL 8.x 로컬 통합 실행
  - `.env.example` 작성: `DB_PASSWORD`, `JWT_SECRET`, `AWS_S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`
  - Nginx 설정: `/api` → backend:8080, `/` → frontend:80 리버스 프록시

- [ ] **Task 020: AWS 인프라 구축**
  - EC2 인스턴스 프로비저닝 (Ubuntu 22.04), Docker 및 Docker Compose 설치
  - RDS MySQL 8.x 생성 및 보안 그룹 설정 (EC2에서만 접근 허용)
  - S3 버킷 생성 + CORS 정책(프론트엔드 도메인에서 PUT 허용) + IAM 정책(presigned PUT 전용) 구성
  - S3 Standard-IA 스토리지 클래스 + Lifecycle 정책 (90일 후 Glacier) 설정
  - 도메인 연결 및 Nginx 리버스 프록시 구성
  - Certbot으로 Let's Encrypt HTTPS 인증서 발급 및 자동 갱신

- [ ] **Task 021: Jenkins CI/CD 파이프라인**
  - Jenkins 설치 및 GitHub Webhook 연동 (Push 이벤트 트리거)
  - `Jenkinsfile`: 빌드(gradlew build / npm run build) → 테스트 → Docker 이미지 빌드 → 배포 단계
  - 배포 전 헬스체크, 실패 시 롤백 전략
  - Playwright MCP를 활용한 배포 후 스모크 테스트 자동화

### Phase 6: MVP 이후 기능 (Nice to Have)

MVP 출시 후 사용자 피드백을 반영하여 점진적으로 추가합니다.

- [ ] **Task 022: 체크인 수정 및 삭제**
  - `PATCH /api/checkins/{id}`, `DELETE /api/checkins/{id}` 엔드포인트 (작성자 권한 검증)
  - 피드/상세 페이지에서 본인 체크인에 수정/삭제 버튼 표시

- [ ] **Task 023: 프로필 수정**
  - `PATCH /api/users/me` 엔드포인트 (닉네임, 자기소개 변경)
  - 나의 활동 페이지 또는 별도 프로필 편집 UI

- [ ] **Task 024: 프로필 이미지 업로드**
  - `User` 엔티티에 `profile_image_object_key` 추가
  - 프로필 페이지 이미지 변경 UI + S3 presigned URL 업로드 플로우

- [ ] **Task 025: 팔로우 / 친구 맺기**
  - `follows` 테이블, 팔로우/팔로워 API
  - 팔로우한 사람 위주의 별도 피드 탭

- [ ] **Task 026: 실시간 알림 (좋아요 / 댓글)**
  - SSE 또는 WebSocket 기반 알림 스트림
  - 헤더 알림 아이콘 + 알림 목록 드롭다운

- [ ] **Task 027: 푸시 알림**
  - PWA + Web Push API, 일일 체크인 리마인더

- [ ] **Task 028: 피드 무한스크롤 페이지네이션**
  - 커서 기반 페이지네이션 API, 프론트 IntersectionObserver

- [ ] **Task 029: 신고 / 차단 기능**
  - `reports`, `blocks` 테이블, 어드민 모더레이션 화면

- [ ] **Task 030: Refresh Token Rotation**
  - 갱신 시 새 리프레시 토큰 재발급 + 구 토큰 폐기로 탈취 감지 보안 강화
