# 오늘 뭐 했어요? 개발 로드맵

50~60대 중장년층이 하루 활동을 카테고리로 기록하고, 같은 활동을 한 사람과 자연스럽게 연결되는 일상 기록 소셜 서비스

## 개요

**오늘 뭐 했어요?**는 50~60대 중장년층을 위한 일상 기록 기반 소셜 연결 서비스로 다음 기능을 제공합니다:

- **체크인 작성**: 카테고리, 한 줄 설명, 선택적 사진 최대 3장으로 하루 활동을 피드 내 인라인으로 간단히 기록
- **오늘의 피드**: KST 기준 오늘 다른 사용자들의 활동을 등록순으로 확인하고 같은 카테고리를 선택한 사람과 자연스럽게 연결
- **소셜 인터랙션**: 감정 반응 5종(좋아요/맛있겠다/잘하셨다/부럽다/수고하셨어요)과 댓글로 가볍고 따뜻한 교류
- **나의 활동 히스토리**: 단일 페이지 내 월별 캘린더와 카테고리별 통계, 월간 리포트로 내 일상의 변화를 시각적으로 확인
- **가족 연결**: 가족 그룹을 만들어 서로의 일상을 공유하고 응원하는 패밀리 링크
- **칭찬 카드**: 응원 메시지를 카드 형태로 전달하는 따뜻한 소통 수단
- **옛 인연 다시 만나기**: 카카오 친구 또는 연락처 기반으로 아는 사람과 연결

웹앱으로 시작하여 Phase 8에서 React Native WebView 앱(iOS/Android)으로 확장 예정. 웹 코드베이스를 그대로 유지하면서 JS Bridge를 통해 네이티브 기능(연락처, 카메라, 푸시 알림)을 점진적으로 활성화한다.

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

### Phase 1: 애플리케이션 골격 구축 ✅

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

### Phase 2: UI/UX 완성 (더미 데이터 활용) ✅

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

### Phase 3: 백엔드 API 구현 ✅

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

- [x] **Task 012: 좋아요 도메인 API** ✅
  - `Like` 엔티티: `id`, `user_id`, `checkin_id`, `created_at` + UNIQUE KEY `(user_id, checkin_id)`
  - `POST /api/checkins/{id}/likes` — 좋아요 추가 (이미 좋아요 상태 재요청 시 200 OK, 멱등)
  - `DELETE /api/checkins/{id}/likes` — 좋아요 취소 (이미 취소 상태 재요청 시 200 OK, 멱등)
  - Playwright MCP로 Swagger UI를 통한 토글 동작 검증

- [x] **Task 013: 댓글 도메인 API** ✅
  - `Comment` 엔티티: `id`, `user_id`, `checkin_id`, `content` (VARCHAR 200), `created_at`
  - `GET /api/checkins/{id}/comments` — 등록순 댓글 목록 (작성자 닉네임 포함)
  - `POST /api/checkins/{id}/comments` — 댓글 작성 (content 최대 200자 검증)
  - Playwright MCP로 Swagger UI를 통한 댓글 작성/조회 검증

### Phase 4: 프론트엔드-백엔드 연동 ✅

Phase 2에서 완성한 UI의 더미 데이터를 실제 API 호출로 교체합니다. TanStack Query 훅을 작성하고 Playwright MCP로 전체 사용자 플로우를 검증합니다.

- [x] **Task 014: 인증 플로우 API 연동** ✅ - 우선순위
  - 회원가입 페이지: `useAuth.ts`의 `register` mutation 연결; 닉네임 입력 시 디바운스로 `check-nickname` API 실시간 호출; 성공 시 로그인 페이지 이동 + 성공 토스트
  - 로그인 페이지: `useAuth.ts`의 `login` mutation 연결; 성공 시 오늘의 피드(`/`)로 자동 리다이렉트
  - 헤더 드롭다운 로그아웃: `logout` mutation 연결
  - 프로필 드롭다운: `useCurrentUser()` 훅으로 닉네임 표시
  - Playwright MCP로 회원가입 → 로그인 → 로그아웃 → 재로그인 E2E 시나리오 검증

- [x] **Task 015: 오늘의 피드 및 체크인 작성 API 연동** ✅ - 우선순위
  - `useTodayFeed()` TanStack Query 훅: `GET /api/checkins/today` 호출, 30초 staleTime 설정
  - 피드 상단 "나와 같은 활동을 한 N명" 배너: `sameCategoryUserCount` 값 표시 (비로그인 또는 미체크인 시 배너 미표시)
  - 인라인 체크인 작성 폼 연동:
    - 사진 없는 경우: `POST /api/checkins` 직접 호출
    - 사진 있는 경우: `POST /api/checkins/photo-upload-url` → presigned URL로 S3 직접 PUT → `POST /api/checkins`(objectKey 포함)
    - 클라이언트에서 이미지 1080px 이하 리사이즈 후 업로드, 업로드 진행률 표시
    - 등록 성공 시 폼 닫힘 + 피드 캐시 무효화(즉시 갱신) + 성공 토스트
  - Playwright MCP로 피드 로딩 → 체크인 작성(사진 포함/미포함) → 피드 즉시 반영 E2E 검증

- [x] **Task 016: 활동 상세 및 소셜 인터랙션 API 연동** ✅
  - `useCheckinDetail(id)` 훅: `GET /api/checkins/{id}` 호출
  - 좋아요 토글: `POST/DELETE /api/checkins/{id}/likes` mutation + 옵티미스틱 업데이트 (`likeCount`, `likedByMe` 즉시 반영)
  - `useComments(id)` 훅: `GET /api/checkins/{id}/comments` 호출
  - 댓글 작성 mutation: `POST /api/checkins/{id}/comments` 성공 후 댓글 목록 캐시 무효화
  - Playwright MCP로 좋아요 토글 + 댓글 작성 + 다른 계정으로 확인하는 통합 E2E 검증

- [x] **Task 017: 나의 활동 페이지 API 연동** ✅
  - `useMyCalendar(year, month)` 훅: `GET /api/checkins/my/calendar` 호출
  - 날짜 클릭 시 `useMyCheckins(date)` 훅: `GET /api/checkins/my?date=YYYY-MM-DD` 호출 → 인라인 표시
  - `useMyCategoryStats(year, month)` 훅: `GET /api/checkins/my/stats` 호출
  - 월 이동 시 year/month 파라미터 갱신 후 캐시 자동 관리
  - Playwright MCP로 월 이동 → 날짜 클릭 → 통계 표시 플로우 검증

- [x] **Task 018: 전체 사용자 플로우 통합 테스트** ✅
  - Playwright MCP로 핵심 사용자 여정 E2E 검증:
    - 회원가입 → 로그인 → 오늘의 피드 확인 → 체크인 작성(사진 포함) → 피드 즉시 반영
    - 다른 계정으로 로그인 → 피드에서 첫 번째 계정 체크인 확인 → 좋아요 → 댓글 작성 → 상세 페이지 확인
    - 나의 활동 페이지 → 캘린더에서 날짜 클릭 → 통계 섹션 확인
    - 401 자동 갱신 인터셉터 동작 검증 (액세스 토큰 만료 시 자동 갱신 후 재요청)
  - 에러 핸들링 및 엣지 케이스 검증: 네트워크 오류, 유효성 검사 실패, 이미 좋아요한 항목 재요청
  - 로딩/에러 상태 UI 검증 (Skeleton, ErrorBoundary, 재시도 버튼)

### Phase 4.5: 기능 확장 — 다중 사진 첨부 ✅

MVP 연동 완료 후 사용자 경험을 개선하는 첫 번째 기능 확장입니다. 체크인 사진을 최대 3장까지 첨부하고 피드에서 슬라이더로 감상할 수 있습니다.

- [x] **Task 019: 다중 사진 첨부 — 백엔드 DB 및 API 수정** ✅ - 우선순위
  - `checkin_photos` 테이블 신규 생성 (`checkins`와 1:N, ON DELETE CASCADE)
  - `CheckinPhoto` 엔티티 생성 (id, checkin_id, object_key, sort_order)
  - `Checkin` 엔티티에 `@OneToMany photos` 컬렉션 추가 (기존 `photoObjectKey` 필드 유지, 하위 호환)
  - `CreateCheckinRequest.photoObjectKey` → `photoObjectKeys(List<String>, @Size(max=3))`
  - `CheckinResponse.photoUrl` → `photoUrls(List<String>)`; `of()` 팩토리에서 photos 정렬 후 URL 생성, 기존 `photoObjectKey` 폴백 포함
  - `CheckinService.create()`: 각 objectKey prefix 검증 후 `CheckinPhoto` 저장
  - `CheckinService.delete()`: photos 순회 S3 일괄 삭제
  - `CheckinPhotoRepository` 신규 생성

- [x] **Task 020: 다중 사진 첨부 — 프론트엔드 UI 및 타입 수정** ✅
  - `CheckIn` 타입의 `photoUrl?: string` → `photoUrls?: string[]` 교체
  - `useCreateCheckin` mutationFn의 `photoObjectKey` → `photoObjectKeys(string[])` 교체
  - `FeedPage` 사진 첨부 UI: 썸네일 미리보기 가로 행 + 개별 삭제 버튼 + 추가 버튼 (N/3 카운터, 3장 달성 시 숨김), 파일 선택 창에서 한 번에 여러 장 선택 가능(`multiple`)
  - `handleSubmit`: 각 파일 순차 presigned URL 발급 → S3 PUT → objectKeys 배열로 `createCheckin` 호출
  - `checkin-card.tsx`: 1장이면 전체 너비 이미지, 2~3장이면 `snap-x` 가로 스크롤 슬라이더
  - `ActivityDetailPage.tsx`: photoUrls 배열 처리로 수정

- [x] **Task 021: 사진 클릭 확대 (라이트박스)** ✅
  - `ActivityDetailPage` 사진 클릭 시 전체화면 오버레이로 원본 비율 확대 표시
  - 배경 클릭 또는 X 버튼으로 닫기
  - 2~3장일 경우 좌우 화살표로 탐색 + 하단 페이지 표시 (`1 / 3`)
  - 외부 라이브러리 없이 `lightboxIndex` 상태로 인라인 구현

### Phase 5: 배포 및 인프라

MVP 외부 공개를 위한 배포 파이프라인과 인프라를 구축합니다.

- [x] **Task 022: Docker 컨테이너화** - 우선순위
  - `backend/Dockerfile`: 멀티스테이지 빌드 (Gradle build → OpenJDK 21 런타임)
  - `frontend/Dockerfile`: Node 20 빌드 → Nginx 정적 서빙
  - 루트 `docker-compose.yml`: backend + frontend + MySQL 8.x 로컬 통합 실행
  - `.env.example` 작성: `DB_PASSWORD`, `JWT_SECRET`, `AWS_S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`
  - Nginx 설정: `/api` → backend:8080, `/` → frontend:80 리버스 프록시

- [ ] **Task 023: AWS 인프라 구축**
  - EC2 인스턴스 프로비저닝 (Ubuntu 22.04), Docker 및 Docker Compose 설치
  - RDS MySQL 8.x 생성 및 보안 그룹 설정 (EC2에서만 접근 허용)
  - S3 버킷 생성 + CORS 정책(프론트엔드 도메인에서 PUT 허용) + IAM 정책(presigned PUT 전용) 구성
  - S3 Standard-IA 스토리지 클래스 + Lifecycle 정책 (90일 후 Glacier) 설정
  - 도메인 연결 및 Nginx 리버스 프록시 구성
  - Certbot으로 Let's Encrypt HTTPS 인증서 발급 및 자동 갱신

- [x] **Task 024: GitHub Actions CI/CD 파이프라인** - 우선순위
  - **브랜치 전략 (GitHub Flow)**:
    - `main` 브랜치는 항상 배포 가능한 상태 유지
    - 모든 작업은 `feature/xxx` 브랜치에서 개발 → PR → CI 통과 → `main` 머지 → 자동 배포
  - **PR CI 워크플로우** (`.github/workflows/ci.yml`): `feature/**` → `main` PR 시 트리거
    - 백엔드: JDK 21 설정 → `./gradlew build` (테스트 포함)
    - 프론트엔드: Node 20 설정 → `npm ci` → `npm run build`
    - 경로 필터(`paths`) 적용: `backend/**` 변경 시 백엔드 job만, `frontend/**` 변경 시 프론트엔드 job만 실행
  - **배포 워크플로우** (`.github/workflows/deploy.yml`): `main` 브랜치 push 시 트리거
    - 백엔드: `./gradlew build -x test` → EC2 SSH(`appleboy/ssh-action`) 접속 → jar 파일 업로드 → systemd 서비스 재시작
    - 프론트엔드: `npm run build` → EC2 SSH 접속 → `dist/` 디렉토리 rsync → Nginx reload
    - 배포 후 헬스체크: `curl -f http://localhost:8080/actuator/health` 성공 확인, 실패 시 이전 jar로 롤백
  - **GitHub Secrets 설정**: `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`, `DATABASE_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`, `AWS_S3_BUCKET`
  - Spring Boot Actuator 의존성 추가 (헬스체크 엔드포인트 `/actuator/health` 활성화)

### Phase 6: 한국 5060 차별화 기능 — MVP+1

핵심 MVP 이후 50~60대 사용자의 감성과 생활 패턴에 맞춘 차별화 기능을 우선 구현합니다. 백엔드 변경이 적거나 없는 항목부터 시작하여 빠른 사이클로 배포합니다.

- [ ] **Task 025: 오늘의 한 마디 (간편 체크인)** - 우선순위
  - 프론트엔드 전용 변경 (백엔드 API 변경 없음), 예상 공수 1~2일
  - `FeedPage` 인라인 체크인 폼을 **간편 모드 / 상세 모드** 2단계로 리팩토링:
    - 간편 모드: 카테고리 선택만으로 제목 자동 생성 (예: "산책했어요", "요리했어요") 후 즉시 등록 가능
    - 상세 모드: 현재 방식 그대로 (설명 직접 입력)
  - `category-icon-grid.tsx` 재활용, 카테고리 탭 시 자동 제목 매핑 상수(`AUTO_TITLES`) 추가
  - 간편/상세 모드 토글 버튼(텍스트 링크 스타일), 모드 선택 상태 localStorage에 기억
  - Playwright MCP로 간편 모드 체크인 등록 → 피드 즉시 반영 E2E 검증

- [ ] **Task 026: 감정 반응 표현판 (리액션 5종)**
  - 예상 공수 3~4일, like 도메인 확장
  - **백엔드**:
    - `likes` 테이블에 `reaction_type` 컬럼 추가 (ENUM: `LIKE`, `DELICIOUS`, `GREAT`, `ENVIOUS`, `WELL_DONE`, DEFAULT: `LIKE`)
    - 기존 `POST /api/checkins/{id}/likes` 요청 body에 `reactionType` 필드 추가 (생략 시 `LIKE` 기본값)
    - `CheckinDetailResponse`에 `reactionCounts` 맵 (`{ LIKE: 3, DELICIOUS: 1, ... }`) 추가
    - DB 마이그레이션 스크립트 (`ALTER TABLE likes ADD COLUMN reaction_type ...`)
  - **프론트엔드**:
    - `reaction-picker.tsx` 신규 컴포넌트: ShadcnUI `Popover` 기반, 5개 이모지 반응 버튼
    - 피드 카드: 기존 하트 버튼 옆 "반응 더보기" 버튼(▾) 클릭 시 팝오버 표시
    - 상세 화면: 5개 반응 버튼 항상 노출 + 각 반응 수 표시
    - `useLikeToggle` 훅 확장: `reactionType` 파라미터 추가
  - Playwright MCP로 반응 선택 → 카운트 즉시 반영 → 다른 계정으로 확인 E2E 검증

- [ ] **Task 027: 월간 리포트 (이달의 나)**
  - 예상 공수 3~4일, 집계 API 신설
  - **백엔드**:
    - `GET /api/users/me/monthly-report?year={year}&month={month}` 신규 엔드포인트
    - 응답: `{ totalDays, totalCheckins, topCategory, categoryBreakdown[], streakDays, comparedToLastMonth }` (활동한 날 수, 총 체크인 수, 가장 많이 한 활동, 카테고리별 비율, 연속 기록일, 전달 대비 증감)
    - `UserController` / `UserService`에 월간 집계 로직 추가
  - **프론트엔드**:
    - `/me/report` 라우트 신규 추가 (쿼리파라미터 `?month=2026-05`)
    - `useMonthlyReport(year, month)` TanStack Query 훅
    - 기존 `useMyCalendar`, `useMyCategoryStats` 훅 재활용하여 달력 미리보기 포함
    - 나의 활동 페이지 상단에 "이달의 리포트 보기" 버튼 추가
    - 공유 가능한 카드 이미지 생성 (`html2canvas` 또는 Canvas API)
  - Playwright MCP로 리포트 페이지 진입 → 데이터 표시 → 월 변경 E2E 검증

- [ ] **Task 028: 가족 연결 (패밀리 링크)**
  - 예상 공수 7~10일, 신규 `domain/family/` 패키지
  - **백엔드**:
    - `family_groups`, `family_members` 테이블 신규 생성
    - `POST /api/families` — 가족 그룹 생성 (그룹명, 초대 코드 자동 생성)
    - `POST /api/families/join` — 초대 코드로 가족 그룹 참여
    - `GET /api/families/my` — 내가 속한 가족 그룹 및 멤버 목록
    - `GET /api/families/{id}/feed` — 가족 그룹 피드 (멤버 체크인만 조회)
    - 이메일 알림: 가족 참여 시 그룹 내 기존 멤버에게 가입 알림 발송 (Spring Mail + Gmail SMTP)
  - **프론트엔드**:
    - `/family` 라우트 신규 추가 (가족 그룹 홈)
    - `/family/invite` — 초대 코드 입력 또는 카카오 JS SDK로 초대 링크 공유
    - 카카오 JS SDK 연동 (`window.Kakao.Link.sendDefault`): 앱 설치 유도 + 초대 딥링크 포함
    - 하단 탭바에 "가족" 탭 추가 (집 아이콘)
  - Playwright MCP로 그룹 생성 → 초대 코드 공유 → 참여 → 가족 피드 조회 E2E 검증

### Phase 7: 한국 5060 차별화 기능 — MVP+2

Phase 6 완료 후 사용자 피드백을 반영하여 소셜 연결 기능을 심화합니다.

- [ ] **Task 029: 칭찬 카드 (응원 메시지)**
  - 예상 공수 2~3일, comment 도메인 확장
  - **백엔드**:
    - `comments` 테이블에 `comment_type` 컬럼 추가 (ENUM: `TEXT`, `PRAISE_CARD`, DEFAULT: `TEXT`)
    - `praise_card_type` 컬럼 추가 (ENUM: `GREAT_JOB`, `KEEP_IT_UP`, `IMPRESSIVE`, `HEALTHY`, `INSPIRING`, NULL 허용)
    - `POST /api/checkins/{id}/comments` 요청에 `commentType`, `praiseCardType` 필드 추가
    - DB 마이그레이션 스크립트
  - **프론트엔드**:
    - 댓글 입력 영역에 "칭찬 카드 보내기" 탭 추가
    - `praise-card-picker.tsx` 신규 컴포넌트: 5종 칭찬 카드 선택 UI (카드 디자인 포함)
    - 댓글 목록: `PRAISE_CARD` 타입 댓글은 카드 형태로 렌더링 (배경색 + 이모지 + 텍스트)
  - Playwright MCP로 칭찬 카드 전송 → 카드 형태 표시 E2E 검증

- [ ] **Task 030: 옛 인연 다시 만나기 (팔로우 + 카카오 친구 연동)**
  - 예상 공수 10~14일, 신규 `domain/follow/` 패키지 + 카카오 친구 API
  - **백엔드**:
    - `follows` 테이블 신규 생성 (`follower_id`, `following_id`, UNIQUE KEY)
    - `POST /api/follows/{userId}` — 팔로우
    - `DELETE /api/follows/{userId}` — 언팔로우
    - `GET /api/follows/following` — 내가 팔로우하는 사람 목록
    - `GET /api/follows/followers` — 나를 팔로우하는 사람 목록
    - `GET /api/checkins/following` — 팔로우한 사람들의 피드 (커서 기반 페이지네이션)
    - `GET /api/users/search?nickname=` — 닉네임 검색으로 사용자 찾기
  - **프론트엔드**:
    - `/discover` 라우트 신규 추가 (사용자 검색 + 카카오 친구 목록)
    - 카카오 JS SDK 친구 API: `Kakao.API.request({ url: '/v1/api/talk/friends' })`로 카카오 친구 중 서비스 가입자 조회
    - Android Chrome 환경에서 Contacts Picker API(`navigator.contacts.select`) 추가 지원 (조건부 활성화)
    - 피드 페이지에 "전체 피드 / 팔로우 피드" 탭 추가
    - 하단 탭바에 "찾기" 탭 추가 (돋보기 아이콘)
  - Playwright MCP로 닉네임 검색 → 팔로우 → 팔로우 피드 확인 E2E 검증

### Phase 8: 플랫폼 확장 — React Native WebView 앱

웹 코드베이스를 유지하면서 iOS/Android 네이티브 앱 경험을 제공합니다. JS Bridge를 통해 네이티브 기능을 점진적으로 활성화합니다.

- [ ] **Task 031: React Native WebView 앱 래퍼 구축** - 우선순위
  - React Native 프로젝트 신규 생성 (`mobile/` 디렉토리, Expo 또는 RN CLI)
  - `react-native-webview`로 웹앱 전체 래핑 (iOS + Android)
  - JS Bridge 구현:
    - `window.ReactNativeWebView.postMessage` / `window.addEventListener('message')` 양방향 통신 채널
    - 네이티브 연락처 접근: `react-native-contacts` → 웹앱에서 `window.ReactNativeWebView` 감지 시 Bridge로 연락처 요청
    - 카메라 접근: `react-native-image-picker` → 사진 촬영 후 base64로 웹앱 전달
    - 푸시 알림 토큰: FCM 토큰을 웹앱에 전달하여 서버 등록
  - 웹앱 코드에 `isNativeApp()` 헬퍼 함수 추가: `window.ReactNativeWebView !== undefined` 감지로 웹/앱 환경 자동 분기
  - App Store (iOS) / Play Store (Android) 심사 준비 및 배포

- [ ] **Task 032: 웹 푸시 알림 (Web Push API / FCM)**
  - Web Push API 구현 (웹 환경):
    - Service Worker 등록 (`/sw.js`)
    - `PushManager.subscribe()`로 구독 정보 서버 저장
    - `POST /api/push-subscriptions` — 구독 정보 저장
    - `web-push` 라이브러리(백엔드)로 서버 발송
  - FCM 네이티브 푸시 (React Native 앱 환경):
    - Task 031의 JS Bridge를 통해 FCM 토큰 수신
    - `POST /api/push-tokens` — FCM 토큰 저장
    - Firebase Admin SDK(백엔드)로 서버 발송
  - 알림 트리거: 가족 그룹 참여, 내 체크인에 좋아요/댓글, 팔로우 알림
  - Phase 6 Task 028의 이메일 알림을 웹 푸시로 대체

- [ ] **Task 033: 카카오 로그인 연동**
  - 카카오 친구 API(Task 030) 사용을 위한 전제조건
  - **백엔드**:
    - `users` 테이블에 `kakao_id` 컬럼 추가 (UNIQUE, NULL 허용)
    - `POST /api/auth/kakao` — 카카오 액세스 토큰 검증 후 자체 JWT 발급 (신규 가입 또는 기존 계정 연결)
    - 기존 이메일/비밀번호 계정과 카카오 계정 병합 로직
  - **프론트엔드**:
    - 로그인 페이지에 "카카오로 시작하기" 버튼 추가 (카카오 공식 버튼 가이드라인 준수)
    - 카카오 JS SDK `Kakao.Auth.authorize()` → 리다이렉트 콜백 처리
    - 카카오 연결 후 닉네임 미설정 시 닉네임 입력 온보딩 페이지로 이동
  - Playwright MCP로 카카오 로그인 → 기존 계정 연결 → 친구 API 호출 플로우 검증

### Phase 9: 운영 안정화

서비스 운영 중 발견되는 불편함을 해소하고, 보안 및 성능을 강화합니다.

- [ ] **Task 034: 체크인 수정 및 삭제**
  - `PATCH /api/checkins/{id}` — 설명 및 카테고리 수정 (작성자 권한 검증)
  - `DELETE /api/checkins/{id}` — 체크인 삭제 + S3 사진 일괄 삭제 (작성자 권한 검증)
  - 피드/상세 페이지에서 본인 체크인에 수정/삭제 버튼 표시 (케밥 메뉴 또는 하단 시트)
  - Playwright MCP로 수정 → 반영 확인 → 삭제 → 피드에서 제거 확인 E2E 검증

- [ ] **Task 035: 프로필 수정**
  - `PATCH /api/users/me` 엔드포인트 (닉네임, 자기소개 변경, 닉네임 UNIQUE 검증 포함)
  - 나의 활동 페이지 상단 또는 별도 `/me/edit` 라우트에 프로필 편집 UI
  - React Hook Form + 실시간 닉네임 중복 확인 디바운스 적용
  - 수정 성공 시 `useCurrentUser` 캐시 무효화 + 성공 토스트

- [ ] **Task 036: 프로필 이미지 업로드**
  - `User` 엔티티에 `profile_image_object_key` 컬럼 추가
  - `POST /api/users/me/profile-image-url` — 프로필 이미지용 presigned URL 발급 (경로: `profiles/{userId}/{uuid}.jpg`)
  - `PATCH /api/users/me` 에 `profileImageObjectKey` 필드 추가
  - 프로필 편집 UI에 이미지 변경 버튼 + 원형 미리보기 + S3 업로드 플로우

- [ ] **Task 037: 실시간 알림 (좋아요 / 댓글)**
  - SSE(Server-Sent Events) 기반 알림 스트림: `GET /api/notifications/stream`
  - `notifications` 테이블: `id`, `user_id`, `type` (LIKE / COMMENT / FOLLOW / FAMILY_JOIN), `actor_id`, `target_id`, `is_read`, `created_at`
  - 헤더 알림 아이콘에 읽지 않은 알림 수 뱃지 표시
  - 알림 목록 드롭다운: 최근 20개, 클릭 시 해당 체크인 상세로 이동 + `is_read` 처리

- [ ] **Task 038: 피드 무한스크롤 페이지네이션**
  - `GET /api/checkins/today`: 커서 기반 페이지네이션 (`?cursor=lastCheckinId&limit=20`) 추가
  - `GET /api/checkins/following`: 동일 페이지네이션 적용
  - 프론트엔드: `useInfiniteQuery` + `IntersectionObserver`로 무한스크롤 구현
  - 스켈레톤 로딩 카드 유지하며 자연스러운 추가 로딩 UX

- [ ] **Task 039: 신고 / 차단 기능**
  - `reports` 테이블: 신고 사유 ENUM (SPAM / INAPPROPRIATE / ABUSE / OTHER)
  - `blocks` 테이블: 차단한 사용자 피드/댓글 자동 필터링
  - `POST /api/reports` — 체크인 또는 댓글 신고
  - `POST /api/blocks/{userId}` / `DELETE /api/blocks/{userId}` — 차단/차단 해제
  - 체크인 카드 케밥 메뉴에 "신고하기" / "차단하기" 옵션 추가
  - 어드민 모더레이션 화면 (신고 목록, 처리 상태 관리)

- [ ] **Task 040: Refresh Token Rotation**
  - 갱신 시 새 리프레시 토큰 재발급 + 구 토큰 DB/Redis에 블랙리스트 등록
  - 탈취된 구 토큰 재사용 감지 시 해당 계정 전체 세션 무효화
  - `refresh_tokens` 테이블 또는 Redis TTL 기반 저장소 선택
  - Playwright MCP로 토큰 만료 → 자동 갱신 → 구 토큰 재사용 거부 시나리오 검증
