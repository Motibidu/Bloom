# 게시판 기능 설계

날짜: 2026-07-28
브랜치: worktree-feat+board

## 배경 및 목적

현재 서비스의 "공개 피드"는 활동 기록(체크인) 전용이며, 상세 기록만 노출된다 (`docs/decisions/ADR-001`). 자유 주제 대화, 질문, 정보 공유 등 활동 기록 포맷에 담기지 않는 콘텐츠 수요가 있다. 이를 흡수해 네이버 카페·밴드 같은 기존 커뮤니티 서비스를 대체할 수 있는 포지셔닝을 확보하기 위해 별도의 "게시판" 기능을 신설한다.

활동 기록(checkin) 도메인과는 명확히 분리된 신규 콘텐츠 유형이며, 기존 "공개 피드 = 상세 기록만" 원칙(ADR-001)을 건드리지 않는다 — 게시판은 별도 탭으로 완전히 분리된다.

## 범위

- 하단 탭바에 "게시판" 탭 신설 (5번째 탭)
- 고정 카테고리 3종: 자유게시판 / 질문공간 / 정보공유
- 게시글 CRUD, 목록 페이지네이션, 상세 조회
- 기존 댓글·대댓글·5종 반응·신고·차단·카카오톡/밴드 공유 기능을 게시글에도 연동

### 범위 밖 (MVP 제외)

- 칭찬카드 (활동 기록 전용 개념으로 유지, 게시글에는 미적용)
- 사용자 개설 게시판/소모임 형태
- 게시글 수정 이력, 임시저장

## 하단 탭바 변경

기존 4탭(피드·가족·찾기·나의활동) → 5탭으로 확장:

```
피드 · 가족 · 게시판 · 찾기 · 나의활동
```

`frontend/src/components/layout/BottomTabBar.tsx`에 탭 아이템 추가. 경로는 `/board`.

## 데이터 모델

### 신규 도메인: `board`

```
backend/src/main/java/com/starterkit/domain/board/
  entity/Post.java
  entity/PostCategory.java   (enum: FREE, QNA, INFO)
  entity/PostPhoto.java
  controller/PostController.java
  dto/request/CreatePostRequest.java
  dto/request/UpdatePostRequest.java
  dto/response/PostResponse.java
  dto/response/PostListResponse.java (페이지네이션 응답)
  repository/PostRepository.java
  service/PostService.java
  exception/PostNotFoundException.java
```

`Post` 엔티티는 `Checkin`과 동일한 패턴을 따른다 (author, title, content, photos, createdAt). `Checkin`과 달리 `category`는 `PostCategory`(FREE/QNA/INFO) enum이며, `isSimple`/`viewCount` 같은 체크인 전용 필드는 없다.

`PostPhoto`는 `CheckinPhoto`와 동일 구조(`post_id` FK, `object_key`, `sort_order`), 최대 3장.

### 기존 도메인 확장: comment / like / report

`Comment`와 `Like`는 현재 `checkin_id`를 필수 FK로 직접 참조하는 구조다(polymorphic 아님). 이 구조를 유지한 채 확장한다:

- `comments` 테이블에 `post_id` 컬럼 추가 (nullable)
- `likes` 테이블에 `post_id` 컬럼 추가 (nullable)
- 기존 `checkin_id` 컬럼도 nullable로 완화
- 애플리케이션 레벨에서 "checkin_id, post_id 중 정확히 하나만 존재" 불변식을 보장 (DB CHECK 제약 또는 서비스 레이어 검증)
- `ReportTargetType`에 `POST` 추가 (`CHECKIN, COMMENT` → `CHECKIN, COMMENT, POST`)
- `Block` 도메인은 사용자 단위 차단이라 변경 불필요 — 게시판 목록/댓글 조회 시 기존처럼 차단 사용자 필터링 재사용

이 방식은 댓글·반응 조회/집계 로직(`CommentService`, `LikeService`)의 기존 쿼리 패턴을 그대로 재사용할 수 있게 하되, 대상이 checkin인지 post인지 분기하는 조건을 추가하는 정도로 확장 범위를 제한한다.

### 마이그레이션 주의

`docs/decisions` 및 메모리에 기록된 대로, 프로덕션은 Flyway로 관리된다. 신규 컬럼은 전부 nullable로 추가해 기존 데이터(checkin 댓글/좋아요)에 영향 없이 배포되어야 한다.

## API 설계 (개요)

- `GET /api/posts?category=FREE&page=0&size=10` — 목록, 카테고리 필터(생략 시 전체), 페이지네이션
- `GET /api/posts/{id}` — 상세
- `POST /api/posts` — 작성 (MEMBER만)
- `PATCH /api/posts/{id}` — 수정 (작성자 본인)
- `DELETE /api/posts/{id}` — 삭제 (작성자 본인)
- 댓글/반응/신고: 기존 `CommentController`, `LikeController`, `ReportController`에 `postId` 파라미터 분기 추가 (신규 컨트롤러 불필요)

작성 권한: `MEMBER`만 (기존 공개 피드 원칙과 동일, `FAMILY_VIEWER`는 열람만 — ADR-002 원칙 유지).

## 프론트엔드 화면

### 목록 (`/board`)

- 상단: 카테고리 pill 탭 (전체 / 자유게시판 / 질문공간 / 정보공유)
- 목록 행: 좌측에 제목 + 본문 1줄 미리보기(회색, ellipsis) + 작성자·날짜·댓글수, 우측에 정사각 썸네일(첫 사진 있을 때만)
- 하단: 페이지네이션 (10개/페이지, 페이지 번호 네비게이션 — 무한스크롤 아님)
- 우측 하단 또는 상단에 글쓰기 버튼 (MEMBER만 노출)

### 작성 (`/board/write`)

- 기존 `CheckinWritePage` 패턴 재사용: 제목 + 본문 + 사진 업로드(최대 3장, presigned URL 방식 재사용)
- 카테고리 선택 UI 추가 (필수)

### 상세 (`/board/:id`)

- 기존 checkin 상세 레이아웃 재사용: 제목/본문/사진, 5종 반응, 댓글+대댓글, 카카오톡/밴드 공유
- 칭찬카드 UI는 제외

## 신규 훅 (프론트)

`frontend/src/hooks/usePost.ts`:
- `usePostList(category, page)`
- `usePostDetail(id)`
- `useCreatePost()`
- `useDeletePost()`
- 댓글/좋아요는 기존 `useComment.ts`, `useCheckin.ts`의 `useLikeToggle` 등을 `targetType: 'post' | 'checkin'` 파라미터로 확장하거나, API 경로만 다르고 로직이 동일하면 기존 훅에 `postId` 옵션을 추가하는 방식으로 재사용 (구현 계획 단계에서 기존 훅 시그니처를 보고 최종 결정)

## 검증 계획

- 백엔드: `PostService` 단위 테스트 (카테고리 필터, 페이지네이션, MEMBER 권한 검증)
- 프론트: Playwright로 목록 조회 → 카테고리 필터 → 글쓰기 → 상세 → 댓글 작성 → 반응 → 신고 골든 패스 검증
- `/web-design-guidelines` 스킬로 목록/작성/상세 화면 디자인 시스템 준수 확인
