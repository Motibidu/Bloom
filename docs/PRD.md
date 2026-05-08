# 오늘 뭐 했어요? MVP PRD

## 핵심 정보

**목적**: 50~60대 중장년층이 하루 활동을 구조화된 형식으로 기록하고, 같은 활동을 한 사람과 자연스럽게 연결되어 외로움을 해소할 수 있도록 돕는다
**사용자**: 일상의 소소한 활동을 공유하고 공감을 나누고 싶은 50~60대 중장년층
**기준 타임존**: Asia/Seoul (KST) — "오늘" 기준은 KST 자정(00:00~23:59)

---

## 사용자 여정

```
1. 랜딩/홈 페이지 (비로그인)
   ↓ 회원가입 버튼 클릭

2. 회원가입 페이지
   ↓ 이메일 + 비밀번호 + 닉네임 + 자기소개 입력 후 가입 완료
   → 로그인 페이지로 이동

3. 로그인 페이지
   ↓ 이메일 + 비밀번호 입력 후 로그인 성공
   → 오늘의 피드 페이지로 자동 리다이렉트

4. 오늘의 피드 페이지 (메인)
   ↓ 상단 "오늘 뭐 했어요?" 영역 클릭
   → 인라인 작성 폼 확장 (별도 페이지 이동 없음)
   ↓ 카테고리 + 한 줄 설명 (+ 선택적 사진) 입력 후 등록
   → 피드 목록 상단에 즉시 반영

   또는 특정 활동 카드 클릭
   → 활동 상세 페이지로 이동

5. 활동 상세 페이지
   ↓ 댓글 작성 또는 좋아요
   → 현재 페이지 유지 (댓글 목록 갱신)

6. 나의 활동 페이지
   ↓ 캘린더에서 특정 날짜 클릭
   → 해당 날짜 활동 목록 표시 (페이지 내 인라인)
```

---

## 기능 명세

### 1. MVP 핵심 기능

| ID | 기능명 | 설명 | MVP 필수 이유 | 관련 페이지 |
|----|--------|------|---------------|-------------|
| **F001** | 체크인 작성 | 카테고리 + 제목(최대 50자) + 한 줄 설명(최대 100자) + 선택적 사진(1장, S3 업로드)으로 하루 활동 등록 | 서비스의 핵심 콘텐츠 생산 수단 | 오늘의 피드 페이지 (인라인) |
| **F002** | 오늘의 피드 조회 | 오늘 날짜(KST 기준)의 모든 사용자 체크인을 등록순으로 표시 | 서비스의 핵심 소비 화면, 연결감 제공 | 오늘의 피드 페이지 |
| **F003** | 같은 카테고리 활동자 표시 | 내가 오늘 체크인한 카테고리 중 하나 이상 동일한 카테고리로 체크인한 사용자 수 강조 표시 ("나와 같은 활동을 한 N명", 본인 제외 고유 사용자 수 — 다중 카테고리 체크인 시 합산 기준) | 서비스 핵심 차별점, 연결감 유도 | 오늘의 피드 페이지 |
| **F004** | 좋아요 | 다른 사람의 체크인에 좋아요 토글 | 부담 없는 공감 표현 수단 | 오늘의 피드 페이지, 활동 상세 페이지 |
| **F005** | 댓글 작성 및 조회 | 체크인에 짧은 댓글 작성 및 댓글 목록 조회 | 직접적인 소통 수단 | 활동 상세 페이지 |
| **F006** | 나의 활동 히스토리 | 캘린더 형태로 내 체크인 이력 조회 + 카테고리별 활동 횟수 통계 | 자기 기록의 가치 제공, 재방문 동기 | 나의 활동 페이지 |

### 2. MVP 필수 지원 기능

| ID | 기능명 | 설명 | MVP 필수 이유 | 관련 페이지 |
|----|--------|------|---------------|-------------|
| **F010** | 기본 인증 | 이메일 + 비밀번호 회원가입 / 로그인 / 로그아웃 | 서비스 이용을 위한 최소 인증 | 로그인 페이지, 회원가입 페이지 |
| **F011** | 닉네임 + 자기소개 프로필 | 회원가입 시 닉네임과 간단한 자기소개 등록 | 피드에서 사용자 식별 및 친근감 형성 | 회원가입 페이지 |

### 3. MVP 이후 기능 (제외)

- 프로필 이미지 업로드 및 수정
- 팔로우/친구 맺기 기능
- 실시간 알림 (좋아요, 댓글)
- 푸시 알림
- 고급 검색 및 필터링
- 피드 무한스크롤 페이지네이션 (초기에는 당일 전체 로드)
- 체크인 수정 및 삭제
- 신고/차단 기능

---

## 메뉴 구조

```
오늘 뭐 했어요? 내비게이션 (반응형 웹)

[비로그인 상태]
├── 홈(랜딩)
├── 로그인        - F010
└── 회원가입      - F010, F011

[로그인 후]
├── 오늘의 피드   - F002, F003, F004 (피드 내에서 체크인 작성 - F001 포함)
└── [프로필 드롭다운] 나의 활동 - F006, 로그아웃

[피드 카드 클릭 시]
└── 활동 상세     - F004, F005

[레이아웃 반응형 동작]

| 영역           | PC                                              | 모바일                   |
|----------------|-------------------------------------------------|--------------------------|
| 상단 헤더 좌측 | 로고                                            | 로고                     |
| 상단 헤더 우측 | 사진(오늘의 피드 이동) · 프로필 사진 버튼       | 프로필 사진 버튼         |
| 프로필 드롭다운 | 나의 활동 · 로그아웃                           | 나의 활동 · 로그아웃     |
| 사이드바       | -                                               | -                        |
| 하단 탭 바     | —                                               | 사진(오늘의 피드 이동)   |

- 체크인 작성: 오늘의 피드 페이지 내 인라인 작성 (별도 페이지/탭 없음)
```

---

## 페이지별 상세 기능

### 회원가입 페이지

> **구현 기능:** `F010`, `F011` | **인증:** 비로그인 전용 (로그인 상태에서 접근 시 피드로 리다이렉트)

| 항목 | 내용 |
|------|------|
| **역할** | 신규 사용자 계정 생성 전용 페이지 |
| **진입 경로** | 랜딩 페이지에서 "회원가입" 버튼 클릭, 또는 로그인 페이지의 "회원가입" 링크 클릭 |
| **사용자 행동** | 이메일, 비밀번호, 닉네임, 자기소개(선택)를 입력하고 가입 버튼을 누른다 |
| **주요 기능** | - 이메일 형식 유효성 검사<br>- 비밀번호 최소 8자 검사<br>- 닉네임 중복 확인 (실시간 또는 제출 시)<br>- 자기소개 입력 (선택, 최대 50자)<br>- **가입하기** 버튼 |
| **다음 이동** | 성공 → 로그인 페이지 (성공 토스트 메시지 표시), 실패 → 에러 메시지 인라인 표시 |

---

### 로그인 페이지

> **구현 기능:** `F010` | **인증:** 비로그인 전용

| 항목 | 내용 |
|------|------|
| **역할** | 기존 사용자 인증 전용 페이지 |
| **진입 경로** | 직접 접근, 랜딩 페이지의 "로그인" 버튼, 보호된 페이지 접근 시 자동 리다이렉트 |
| **사용자 행동** | 이메일과 비밀번호를 입력하고 로그인 버튼을 누른다 |
| **주요 기능** | - 이메일 + 비밀번호 입력 폼<br>- 입력값 유효성 검사<br>- 로그인 실패 시 에러 메시지 표시<br>- 회원가입 페이지 이동 링크<br>- **로그인** 버튼 |
| **다음 이동** | 성공 → 오늘의 피드 페이지 자동 리다이렉트, 실패 → 에러 메시지 표시 |

---

### 오늘의 피드 페이지

> **구현 기능:** `F002`, `F003`, `F004` | **인증:** 로그인 필수

| 항목 | 내용 |
|------|------|
| **역할** | 서비스의 메인 화면. 오늘 다른 사람들의 활동을 확인하고 공감하는 페이지 |
| **진입 경로** | 로그인 성공 후 자동 이동, 헤더의 "사진" 버튼 클릭 |
| **사용자 행동** | 오늘 올라온 활동들을 스크롤하며 확인하고, 좋아요를 누르거나 카드를 클릭해 상세 보기로 이동한다. 페이지 내에서 체크인을 바로 작성할 수 있다 |
| **주요 기능** | - 오늘 날짜(KST 기준)의 체크인 카드 목록 (등록순 정렬)<br>- 각 카드: 닉네임, 카테고리 아이콘, 제목, 한 줄 설명, 사진 썸네일(있을 경우), 좋아요 버튼 + 수(likeCount) + 내가 좋아요 눌렀는지 여부(likedByMe), 댓글 수(commentCount)<br>- 로그인 사용자의 카테고리와 일치하는 활동 상단에 "나와 같은 활동을 한 N명 (본인 제외)" 배너 표시<br>- 카드 클릭 시 활동 상세 페이지 이동<br>- **오늘 뭐 했어요?** 인라인 작성 영역 (피드 상단 고정, 클릭 시 입력 폼 확장) |
| **다음 이동** | 카드 클릭 → 활동 상세 페이지, 체크인 등록 성공 → 피드 목록 상단에 즉시 반영 |

---

### 체크인 작성 (오늘의 피드 페이지 내 인라인)

> **구현 기능:** `F001` | **인증:** 로그인 필수

| 항목 | 내용 |
|------|------|
| **역할** | 오늘의 피드 페이지 상단에 고정된 인라인 작성 영역. 별도 페이지로 이동하지 않는다 |
| **진입 경로** | 오늘의 피드 페이지 상단의 "오늘 뭐 했어요?" 영역 클릭 시 입력 폼 확장 |
| **사용자 행동** | 카테고리를 고르고, 한 줄 설명을 입력한 뒤 선택적으로 사진을 첨부하고 등록한다 |
| **주요 기능** | - 카테고리 선택: 산책, 요리, 독서, 정원 가꾸기, 운동, 친구 만남, 기타 (아이콘 그리드)<br>- 제목 입력 (최대 50자, 글자 수 카운터 표시)<br>- 한 줄 설명 텍스트 입력 (최대 100자, 글자 수 카운터 표시)<br>- 사진 첨부 버튼 (선택, 1장) — JPG/PNG, 최대 10MB, 클라이언트에서 1080px 이하 리사이즈 후 S3에 직접 업로드<br>- **등록하기** 버튼 |
| **사진 업로드 흐름** | ① `POST /api/checkins/photo-upload-url` 호출<br>&nbsp;&nbsp;&nbsp;요청: `{ contentType: "image/jpeg"\|"image/png", fileSize: number(bytes) }`<br>&nbsp;&nbsp;&nbsp;응답: `{ uploadUrl, objectKey, expiresIn: 300 }` (서버가 contentType·fileSize 검증 후 발급)<br>② 클라이언트가 uploadUrl로 S3에 직접 PUT 업로드 — PUT 헤더의 Content-Type은 ①에서 보낸 값과 동일해야 함 (불일치 시 S3 서명 오류)<br>③ `POST /api/checkins` 요청 body에 objectKey 포함하여 체크인 등록 |
| **objectKey 보안 정책** | - 네이밍 규칙: `checkins/{userId}/{uuid}.{ext}` (예: `checkins/42/a3f8c1d2.jpg`) → DB의 `photo_object_key` 컬럼에 저장<br>- 백엔드가 Presigned URL 발급 시 현재 로그인 사용자의 userId로 prefix 고정<br>- 체크인 등록 시 서버가 objectKey prefix(`checkins/{currentUserId}/`)를 검증 → 불일치 시 403 Forbidden<br>- 피드/상세 응답 시 `photo_object_key`에 S3 base URL을 조합하여 `photoUrl` 필드로 반환 |
| **다음 이동** | 성공 → 폼 닫힘 + 피드 목록 상단에 즉시 반영, 실패 → 에러 토스트 표시 |

---

### 활동 상세 페이지

> **구현 기능:** `F004`, `F005` | **인증:** 로그인 필수

| 항목 | 내용 |
|------|------|
| **역할** | 특정 체크인의 상세 내용을 보고 좋아요와 댓글로 소통하는 페이지 |
| **진입 경로** | 오늘의 피드 페이지에서 활동 카드 클릭 |
| **사용자 행동** | 활동 전체 내용을 확인하고, 좋아요를 누르거나 댓글을 작성한다 |
| **주요 기능** | - 체크인 전체 정보 표시 (닉네임, 카테고리, 설명, 사진(있을 경우), 좋아요 수)<br>- 좋아요 토글 버튼<br>- 댓글 목록 (작성자 닉네임 + 댓글 내용 + 작성 시간)<br>- 댓글 입력창 + **댓글 등록** 버튼<br>- 뒤로가기 버튼 |
| **다음 이동** | 뒤로가기 → 오늘의 피드 페이지, 댓글 등록 성공 → 현재 페이지 댓글 목록 갱신 |

---

### 나의 활동 페이지

> **구현 기능:** `F006` | **인증:** 로그인 필수

| 항목 | 내용 |
|------|------|
| **역할** | 내 체크인 이력을 캘린더로 조회하고 카테고리별 활동 통계를 확인하는 페이지 |
| **진입 경로** | 헤더 우측 프로필 사진 버튼 클릭 → 드롭다운에서 "나의 활동" 선택 |
| **사용자 행동** | 캘린더에서 활동이 있는 날짜를 클릭해 해당 날의 체크인 목록을 확인하고, 통계 섹션에서 자신의 주요 활동 카테고리를 파악한다 |
| **주요 기능** | - 월별 캘린더 뷰: `GET /api/checkins/my/calendar`로 날짜·카테고리만 경량 조회 → 활동 있는 날짜에 도트 또는 카테고리 아이콘 표시<br>- 날짜 클릭 시: `GET /api/checkins/my?date=YYYY-MM-DD`로 해당 날 체크인 상세 목록 인라인 표시<br>- 카테고리별 활동 횟수 막대 통계 (이번 달 기준)<br>- 이전/다음 달 이동 버튼 |
| **다음 이동** | 현재 페이지 내에서 인라인 처리 (별도 페이지 이동 없음) |

---

## 데이터 모델

### users (사용자)

| 필드 | 설명 | 타입/관계 |
|------|------|-----------|
| id | 고유 식별자 | BIGINT (PK) |
| email | 로그인용 이메일 | VARCHAR(255), UNIQUE |
| password | 암호화된 비밀번호 | VARCHAR(255) |
| nickname | 화면에 표시되는 이름 | VARCHAR(50), UNIQUE |
| bio | 자기소개 | VARCHAR(50), NULL |
| created_at | 가입 일시 | DATETIME |

### checkins (체크인)

| 필드 | 설명 | 타입/관계 |
|------|------|-----------|
| id | 고유 식별자 | BIGINT (PK) |
| user_id | 작성자 | → users.id |
| category | 활동 카테고리 | ENUM('WALK','COOKING','READING','GARDENING','EXERCISE','MEETING','OTHER') |
| title | 활동 제목 | VARCHAR(50) |
| description | 한 줄 설명 | VARCHAR(100) |
| photo_object_key | S3 objectKey (`checkins/{userId}/{uuid}.ext` 형식) — 응답 시 S3 base URL과 조합하여 full URL로 반환 | VARCHAR(300), NULL |
| created_at | 작성 일시 | DATETIME (KST 기준) |

### likes (좋아요)

| 필드 | 설명 | 타입/관계 |
|------|------|-----------|
| id | 고유 식별자 | BIGINT (PK) |
| user_id | 좋아요 누른 사용자 | → users.id |
| checkin_id | 대상 체크인 | → checkins.id |
| created_at | 좋아요 일시 | DATETIME |

> UNIQUE KEY (user_id, checkin_id) — 중복 좋아요 방지

### comments (댓글)

| 필드 | 설명 | 타입/관계 |
|------|------|-----------|
| id | 고유 식별자 | BIGINT (PK) |
| user_id | 작성자 | → users.id |
| checkin_id | 대상 체크인 | → checkins.id |
| content | 댓글 내용 | VARCHAR(200) |
| created_at | 작성 일시 | DATETIME |

### 리프레시 토큰 — Stateless JWT

DB 테이블 없음. 서명 검증만으로 처리하는 Stateless 방식 (스타터킷 기존 구현 그대로 사용).
리프레시 토큰은 HTTP-only 쿠키로 발급되며, `/api/auth/refresh` 호출 시 서명 유효성만 검증하여 새 액세스 토큰 발급.
쿠키 속성: `HttpOnly; Secure; SameSite=Strict; Path=/api/auth/refresh`
- `HttpOnly`: JavaScript 접근 차단 (XSS 방어)
- `Secure`: HTTPS 연결에서만 전송
- `SameSite=Strict`: 타 사이트 요청에 쿠키 미포함 (CSRF 방어)
- `Path=/api/auth/refresh`: 갱신 요청에만 쿠키 전달, 불필요한 노출 차단

> **Nice to Have**: Refresh Token Rotation — 갱신 시 새 리프레시 토큰 재발급 + 구 토큰 폐기로 탈취 감지 가능

---

## 백엔드 패키지 구조

```
com.starterkit
├── domain/
│   ├── auth/
│   │   ├── controller/       AuthController.java
│   │   ├── service/          AuthService.java
│   │   ├── dto/
│   │   │   ├── request/      LoginRequest.java, RegisterRequest.java, RefreshTokenRequest.java
│   │   │   └── response/     TokenResponse.java
│   │   └── exception/        InvalidCredentialsException.java
│   │
│   ├── user//
│   │   ├── controller/       UserController.java
│   │   ├── service/          UserService.java
│   │   ├── repository/       UserRepository.java
│   │   ├── entity/           User.java
│   │   ├── dto/
│   │   │   ├── request/      UpdateProfileRequest.java
│   │   │   └── response/     UserProfileResponse.java
│   │   └── exception/        UserNotFoundException.java, NicknameDuplicateException.java
│   │
│   ├── checkin/
│   │   ├── controller/       CheckinController.java
│   │   ├── service/          CheckinService.java
│   │   ├── repository/       CheckinRepository.java
│   │   ├── entity/           Checkin.java
│   │   ├── dto/
│   │   │   ├── request/      CreateCheckinRequest.java
│   │   │   └── response/     CheckinResponse.java, CheckinDetailResponse.java, MyCheckinSummaryResponse.java, PhotoUploadUrlResponse.java, CalendarDayResponse.java
│   │   └── exception/        CheckinNotFoundException.java
│   │
│   ├── like/
│   │   ├── controller/       LikeController.java
│   │   ├── service/          LikeService.java
│   │   ├── repository/       LikeRepository.java
│   │   ├── entity/           Like.java
│   │   └── dto/
│   │       └── response/     LikeResponse.java
│   │
│   └── comment/
│       ├── controller/       CommentController.java
│       ├── service/          CommentService.java
│       ├── repository/       CommentRepository.java
│       ├── entity/           Comment.java
│       ├── dto/
│       │   ├── request/      CreateCommentRequest.java
│       │   └── response/     CommentResponse.java
│       └── exception/        CommentNotFoundException.java
│
└── global/
    ├── config/               SecurityConfig.java, OpenApiConfig.java, S3Config.java
    ├── security/             JwtTokenProvider.java, JwtAuthenticationFilter.java
    └── exception/
        ├── handler/          GlobalExceptionHandler.java
        ├── ResourceNotFoundException.java
        └── dto/              ErrorResponse.java
```

---

## REST API 엔드포인트

### 인증 (auth)

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| POST | /api/auth/register | 회원가입 | 불필요 |
| POST | /api/auth/login | 로그인 (액세스 토큰 반환 + 리프레시 쿠키 설정) | 불필요 |
| POST | /api/auth/refresh | 액세스 토큰 갱신 (리프레시 쿠키 사용) | 불필요 |
| POST | /api/auth/logout | 로그아웃 (리프레시 쿠키 삭제) — 액세스 토큰 만료 후에도 로그아웃 가능하도록 인증 불필요 | 불필요 |

### 사용자 (user)

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | /api/users/me | 내 프로필 조회 | 필요 |
| GET | /api/users/check-nickname?nickname= | 닉네임 중복 확인 — 응답: `{ available: boolean }` / IP당 분당 30회 Rate Limit | 불필요 |

### 체크인 (checkin)

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| POST | /api/checkins/photo-upload-url | S3 Presigned PUT URL 발급 — 요청: `{ contentType, fileSize }` / 응답: `{ uploadUrl, objectKey, expiresIn: 300 }` / 서버가 contentType 화이트리스트(jpeg·png) 검증; 파일 크기는 체크인 등록 시 HeadObject로 사후 검증 (발급 시점에는 크기 강제 불가 — AWS Presigned PUT 한계) | 필요 |
| GET | /api/checkins/today | 오늘의 피드 목록 조회 — 각 체크인 카드에 `likeCount`, `likedByMe`, `commentCount` 포함; 응답 최상위에 `sameCategoryUserCount: number` (내가 오늘 체크인한 카테고리 중 1개 이상 겹치는 고유 사용자 수, 본인 제외) 포함 | 필요 |
| POST | /api/checkins | 체크인 등록 — 사진 포함 시 objectKey를 `HeadObject`로 실제 크기 검증 (10MB 초과 시 S3 객체 삭제 후 403 반환) | 필요 |
| GET | /api/checkins/{id} | 체크인 상세 조회 (likeCount, likedByMe, commentCount 포함) | 필요 |
| GET | /api/checkins/my/calendar | 월별 캘린더 경량 조회 — `[{ date, categories[] }]` 반환 (쿼리 파라미터: ?year=&month=) | 필요 |
| GET | /api/checkins/my | 날짜 클릭 시 해당 날 체크인 상세 목록 조회 (쿼리 파라미터: ?date=YYYY-MM-DD) | 필요 |
| GET | /api/checkins/my/stats | 내 카테고리별 활동 통계 (쿼리 파라미터: ?year=&month=) | 필요 |

### 좋아요 (like)

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| POST | /api/checkins/{id}/likes | 좋아요 추가 — 이미 좋아요 상태에서 재요청 시 200 OK (멱등, 변경 없음) | 필요 |
| DELETE | /api/checkins/{id}/likes | 좋아요 취소 — 이미 취소 상태에서 재요청 시 200 OK (멱등, 변경 없음) | 필요 |

### 댓글 (comment)

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | /api/checkins/{id}/comments | 댓글 목록 조회 | 필요 |
| POST | /api/checkins/{id}/comments | 댓글 등록 | 필요 |

---

## 구현 우선순위

### Must Have (출시 필수)

| 기능 | 관련 기능 ID |
|------|-------------|
| 회원가입 / 로그인 / 로그아웃 | F010, F011 |
| 체크인 작성 (카테고리 + 설명 + 선택적 사진) | F001 |
| 오늘의 피드 조회 | F002 |
| 같은 카테고리 활동자 수 표시 | F003 |
| 좋아요 토글 | F004 |
| 댓글 작성 및 조회 | F005 |
| 나의 활동 캘린더 히스토리 + 카테고리별 활동 횟수 통계 | F006 |

### Nice to Have (출시 이후)

| 기능 | 설명 |
|------|------|
| 카테고리별 활동 통계 차트 | 막대 그래프 시각화 |
| 체크인 수정 / 삭제 | 본인 체크인 편집 기능 |
| 프로필 수정 | 닉네임, 자기소개 변경 |
| 알림 | 좋아요, 댓글 알림 |
| 신고 / 차단 | 커뮤니티 안전 기능 |
| Refresh Token Rotation | 갱신 시 새 리프레시 토큰 재발급으로 탈취 감지 보안 강화 |

---

## 기술 스택

### 프론트엔드 프레임워크

- **React 19** - UI 라이브러리 (최신 동시성 기능 활용)
- **TypeScript 5.6+** - 타입 안전성 보장
- **Vite 6** - 빠른 빌드 도구 및 개발 서버

### 스타일링 & UI

- **TailwindCSS v4** - 설정 파일 없는 새로운 CSS 엔진 기반 유틸리티 프레임워크
- **ShandCN** - 접
- **Lucide React** - 아이콘 라이브러리

### 상태 관리 & 데이터 패칭

- **Zustand** - 전역 상태 관리 (인증 상태: 액세스 토큰 메모리 유지, 사용자 정보 localStorage 영속화)
- **TanStack Query v5** - 서버 상태 관리 및 캐싱
- **Axios** - HTTP 클라이언트 (401 자동 갱신 인터셉터 포함)

### 폼 & 검증

- **React Hook Form 7.x** - 폼 상태 관리
- **Zod** - 스키마 검증

### 라우팅

- **React Router v7** - SPA 라우팅 (ProtectedRoute / PublicOnlyRoute 래퍼)

### 백엔드 프레임워크

- **Spring Boot 3.4** - 백엔드 메인 프레임워크
- **Java 21** - LTS 버전, Virtual Threads 활용 가능
- **Spring Security** - 인증 및 인가
- **Spring Data JPA + Hibernate** - ORM 및 데이터 접근
- **JJWT 0.12** - JWT 생성 및 검증
- **SpringDoc OpenAPI 2.x** - Swagger UI 자동 생성 (`/swagger-ui.html`)
- **Lombok** - 보일러플레이트 코드 제거

### 데이터베이스

- **MySQL 8.x** - 관계형 데이터베이스

### 배포 & 인프라

- **AWS EC2** - 애플리케이션 서버 호스팅 (Docker 컨테이너 구동)
- **AWS S3** - 체크인 사진 파일 저장소 (MVP 포함) — Presigned PUT URL 방식으로 백엔드 트래픽 제거, S3 Standard-IA 스토리지 클래스 + Lifecycle 정책(90일 후 Glacier)으로 스토리지 비용 최소화; 고아 객체 정리(업로드 후 체크인 미등록 파일 삭제)는 `@Scheduled` 배치로 처리 — Nice to Have
- **AWS RDS (MySQL)** - 데이터베이스 호스팅 및 자동 백업
- **Nginx** - 리버스 프록시 및 정적 파일 서빙
- **Certbot (Let's Encrypt)** - HTTPS SSL/TLS 인증서 자동 발급

### 컨테이너화 & CI/CD

- **Docker** - 애플리케이션 환경 독립성 확보
- **Docker Compose** - Spring Boot + MySQL 다중 컨테이너 통합 관리
- **Jenkins** - EC2 내부 Docker 이미지로 구동, CI/CD 파이프라인
- **GitHub Webhooks** - 코드 Push 시 Jenkins 빌드 자동 트리거

### 패키지 관리

- **npm** - 프론트엔드 의존성 관리
- **Gradle (Kotlin DSL)** - 백엔드 빌드 도구
