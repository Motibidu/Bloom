# 게시판 댓글 UI 개편 설계

## 배경

당근마켓 댓글 UI(스크린샷 참고: `Screenshot_20260730_134045_Karrot.jpg`)처럼 게시판 댓글의 레이아웃을 변경한다. 프로필 사진 오른쪽에 윗줄 닉네임·아랫줄 상대시간, 우측 상단에 케밥(⋮) 메뉴를 배치한다.

대상: `frontend/src/pages/BoardDetailPage.tsx`의 댓글/답글 렌더링 영역 (게시판 도메인, `usePost.ts`의 `PostComment`).

## 현재 상태

- `PostComment`(프론트, `usePost.ts`)와 `CommentResponse`(백엔드, comment 도메인)에는 `profileImageUrl`이 없음. 게시글 작성자(`PostDetail.profileImageUrl`)에는 이미 있어 동일 패턴 사용 가능.
- 게시판 댓글에는 삭제 API가 없음. `CommentService.deleteComment(commentId, userDetails)`는 이미 범용(체크인/게시글 공용)으로 구현되어 있고 본인 확인 로직 포함. `PostController`에 라우트만 없는 상태.
- 신고는 `ReportTargetType.COMMENT`가 이미 존재하고 프론트 `useCreateReport`도 `targetType: 'COMMENT'`를 지원함 — 백엔드 변경 불필요, 프론트에서 댓글 대상으로 호출만 하면 됨.
- 상대시간 포맷 함수 `formatRelativeDate`가 `BoardDetailPage.tsx`에 이미 존재.

## 변경 사항

### 백엔드

1. `CommentResponse`에 `profileImageUrl` 필드 추가. `from`/`fromReply` 양쪽에서 `comment.getUser().getProfileImageUrl()` 채움.
2. `PostController`에 `DELETE /{id}/comments/{commentId}` 추가. `CommentService.deleteComment` 재사용 (신규 서비스 로직 불필요).

### 프론트엔드

1. `PostComment` 타입에 `profileImageUrl: string | null` 추가.
2. `useDeletePostComment(postId)` 훅 신규 추가 (`usePost.ts`) — `useDeleteComment`(checkin용)와 동일 패턴, `queryKey: ['postComments', postId]` invalidate.
3. 댓글/답글 아이템 레이아웃 변경:
   - 좌측: 아바타 (44px, `profileImageUrl` 있으면 이미지, 없으면 그라디언트 배경 + 닉네임 첫 글자)
   - 우측 영역 첫 줄: 닉네임(굵게, 좌측) + 케밥 버튼(⋮, 최우측)
   - 둘째 줄: 상대시간 (`formatRelativeDate`, 연한 회색 소형 텍스트)
   - 셋째 줄: 댓글 본문
   - 답글도 동일 레이아웃, 들여쓰기 유지
4. 케밥 버튼 클릭 → 바텀시트 메뉴 노출:
   - 본인 댓글(`userId === 로그인 사용자 id`): "삭제" — 확인 모달 후 `useDeletePostComment` 호출
   - 타인 댓글: "신고" — 기존 `ReportModal` 패턴 재사용, `targetType: 'COMMENT'`, `targetId: comment.id`
5. 삭제/신고 확인 모달은 게시글 삭제/신고 모달과 동일한 바텀시트 스타일(`rounded-t-3xl`, `boxShadow` 등) 재사용.

## 범위 밖

- 댓글 수정 기능은 다루지 않음 (기존에도 없음).
- 체크인 도메인 댓글(`useComment.ts`)은 변경하지 않음 — 게시판 댓글만 대상.
