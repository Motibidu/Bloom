# 게시판 댓글 UI 개편 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 게시판 댓글/답글 UI를 당근마켓 스타일(아바타 오른쪽에 닉네임/상대시간, 우측 상단 케밥 메뉴)로 개편하고, 케밥 메뉴에서 본인 댓글 삭제·타인 댓글 신고를 지원한다.

**Architecture:** 백엔드는 기존 `CommentResponse`(comment 도메인, checkin/post 공용)에 `profileImageUrl` 필드를 추가하고, `PostController`에 댓글 삭제 라우트를 신설해 기존 `CommentService.deleteComment`를 재사용한다. 프론트엔드는 `usePost.ts`에 타입/훅을 추가하고 `BoardDetailPage.tsx`의 댓글 렌더링 블록과 케밥 메뉴용 바텀시트를 새로 작성한다.

**Tech Stack:** Spring Boot(Java), React + TypeScript, TanStack Query, Tailwind CSS 4.

## Global Constraints

- 프론트 컬러/폰트/버튼/모달 스타일은 `frontend/src/CLAUDE.md`의 디자인 시스템 상수(`main`/`dark`/`light`/`mA`/`grad`)와 바텀시트 규칙(`rounded-t-3xl`, `boxShadow: '0 -8px 40px oklch(0.62 0.15 220 / 0.18)'`)을 따른다.
- 본문 최소 `text-base`(18px), 터치 타겟 최소 `min-h-[48px]`, 아이콘 전용 버튼은 `aria-label` 필수.
- `alert()`/`confirm()` 금지 — 커스텀 모달만 사용.
- 체크인 도메인 댓글(`useComment.ts`, `CommentController`의 `/api/checkins/...`)은 변경하지 않는다. 게시판 댓글(`/api/posts/...`)만 대상.
- 커밋 전 미사용 import·변수 제거를 확인한다.

---

## Task 1: 백엔드 — CommentResponse에 profileImageUrl 추가

**Files:**
- Modify: `backend/src/main/java/com/starterkit/domain/comment/dto/response/CommentResponse.java`
- Modify: `backend/src/main/java/com/starterkit/domain/comment/service/CommentService.java`
- Test: `backend/src/test/java/com/starterkit/domain/comment/service/CommentServiceTest.java` (없으면 신규 생성)

**Interfaces:**
- Consumes: `User.getProfileImageObjectKey()` (기존, `backend/src/main/java/com/starterkit/domain/user/entity/User.java:55`)
- Produces: `CommentResponse` 레코드에 `String profileImageUrl` 필드 추가. `CommentResponse.from(Comment, String s3BaseUrl)` / `CommentResponse.fromReply(Comment, String s3BaseUrl)` — 시그니처가 바뀌므로 모든 호출부(`CommentService`)를 함께 수정.

기존 `PostResponse.of(...)`의 패턴(`p.getUser().getProfileImageObjectKey() != null ? s3BaseUrl + "/" + ... : null`)과 동일한 방식을 사용한다.

- [ ] **Step 1: CommentResponse에 profileImageUrl 필드와 s3BaseUrl 파라미터 추가**

`backend/src/main/java/com/starterkit/domain/comment/dto/response/CommentResponse.java` 전체를 다음으로 교체:

```java
package com.starterkit.domain.comment.dto.response;

import com.starterkit.domain.comment.entity.Comment;
import com.starterkit.domain.comment.entity.CommentType;
import com.starterkit.domain.comment.entity.PraiseCardType;

import java.time.LocalDateTime;
import java.util.List;

public record CommentResponse(
        Long id,
        Long userId,
        String nickname,
        String profileImageUrl,
        String content,
        LocalDateTime createdAt,
        CommentType commentType,
        PraiseCardType praiseCardType,
        Long parentId,
        List<CommentResponse> replies
) {
    public static CommentResponse from(Comment comment, String s3BaseUrl) {
        List<CommentResponse> replyList = comment.getReplies().stream()
                .map(reply -> CommentResponse.fromReply(reply, s3BaseUrl))
                .toList();
        return new CommentResponse(
                comment.getId(),
                comment.getUser().getId(),
                comment.getUser().getNickname(),
                resolveProfileImageUrl(comment, s3BaseUrl),
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getCommentType(),
                comment.getPraiseCardType(),
                comment.getParent() != null ? comment.getParent().getId() : null,
                replyList
        );
    }

    public static CommentResponse fromReply(Comment comment, String s3BaseUrl) {
        return new CommentResponse(
                comment.getId(),
                comment.getUser().getId(),
                comment.getUser().getNickname(),
                resolveProfileImageUrl(comment, s3BaseUrl),
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getCommentType(),
                comment.getPraiseCardType(),
                comment.getParent() != null ? comment.getParent().getId() : null,
                List.of()
        );
    }

    private static String resolveProfileImageUrl(Comment comment, String s3BaseUrl) {
        return comment.getUser().getProfileImageObjectKey() != null
                ? s3BaseUrl + "/" + comment.getUser().getProfileImageObjectKey()
                : null;
    }
}
```

- [ ] **Step 2: CommentService에 s3BaseUrl 설정과 헬퍼 추가, 모든 CommentResponse 호출부 수정**

`backend/src/main/java/com/starterkit/domain/comment/service/CommentService.java`의 클래스 필드 선언부(기존 `private final BlockService blockService;` 아래)에 추가:

```java
    @org.springframework.beans.factory.annotation.Value("${app.s3.bucket}")
    private String s3Bucket;

    @org.springframework.beans.factory.annotation.Value("${app.s3.region}")
    private String s3Region;

    private String s3BaseUrl() {
        return "https://" + s3Bucket + ".s3." + s3Region + ".amazonaws.com";
    }
```

그리고 다음 4곳의 `CommentResponse.from(...)` / `CommentResponse.fromReply(...)` 호출을 `s3BaseUrl()` 인자를 추가하도록 수정:

1. `getComments` 메서드 내 두 곳: `.map(CommentResponse::from)` → `.map(c -> CommentResponse.from(c, s3BaseUrl()))`
2. `addComment` 메서드: `CommentResponse.fromReply(commentRepository.save(comment))` → `CommentResponse.fromReply(commentRepository.save(comment), s3BaseUrl())`
3. `getCommentsForPost` 메서드 내 두 곳: `.map(CommentResponse::from)` → `.map(c -> CommentResponse.from(c, s3BaseUrl()))`
4. `addCommentToPost` 메서드: `CommentResponse.fromReply(commentRepository.save(comment))` → `CommentResponse.fromReply(commentRepository.save(comment), s3BaseUrl())`
5. `updateComment` 메서드: `CommentResponse.from(comment)` → `CommentResponse.from(comment, s3BaseUrl())`

- [ ] **Step 3: 백엔드 컴파일 확인**

Run: `cd backend && .\gradlew.bat compileJava`
Expected: BUILD SUCCESSFUL (컴파일 에러 없음 — 특히 `CommentResponse.from`/`fromReply` 호출부 시그니처 불일치 여부 확인)

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/starterkit/domain/comment/dto/response/CommentResponse.java backend/src/main/java/com/starterkit/domain/comment/service/CommentService.java
git commit -m "✨ feat: 댓글 응답에 profileImageUrl 추가"
```

---

## Task 2: 백엔드 — 게시판 댓글 삭제 API 신설

**Files:**
- Modify: `backend/src/main/java/com/starterkit/domain/board/controller/PostController.java`

**Interfaces:**
- Consumes: `CommentService.deleteComment(Long commentId, UserDetails userDetails)` (기존, `backend/src/main/java/com/starterkit/domain/comment/service/CommentService.java:136` — 본인 확인 로직 포함, 이미 checkin/post 공용)
- Produces: `DELETE /api/posts/{id}/comments/{commentId}` — 204 No Content

- [ ] **Step 1: PostController에 삭제 엔드포인트 추가**

`backend/src/main/java/com/starterkit/domain/board/controller/PostController.java`의 기존 `addComment` 메서드(현재 90~98번 줄) 바로 다음에 추가:

```java
    @DeleteMapping("/{id}/comments/{commentId}")
    @Operation(summary = "게시글 댓글 삭제")
    public ResponseEntity<Void> deleteComment(
            @PathVariable("id") Long id,
            @PathVariable("commentId") Long commentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        commentService.deleteComment(commentId, userDetails);
        return ResponseEntity.noContent().build();
    }
```

(`@DeleteMapping`은 이미 `import org.springframework.web.bind.annotation.*;`로 임포트되어 있으므로 추가 import 불필요.)

- [ ] **Step 2: 백엔드 컴파일 확인**

Run: `cd backend && .\gradlew.bat compileJava`
Expected: BUILD SUCCESSFUL

- [ ] **Step 3: 백엔드 재시작 후 수동 확인**

`.\gradlew.bat bootRun --args='--spring.profiles.active=dev'`로 재시작 후, Swagger UI(`http://localhost:8080/swagger-ui.html`)에서 `DELETE /api/posts/{id}/comments/{commentId}`가 노출되는지 확인.

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/starterkit/domain/board/controller/PostController.java
git commit -m "✨ feat: 게시판 댓글 삭제 API 추가"
```

---

## Task 3: 프론트엔드 — PostComment 타입 및 삭제 훅 추가

**Files:**
- Modify: `frontend/src/hooks/usePost.ts`

**Interfaces:**
- Consumes: 없음 (신규 API 소비)
- Produces: `PostComment.profileImageUrl: string | null` 필드. `useDeletePostComment(postId: number)` — `useMutation<void, unknown, number>` 형태로, `mutate(commentId)` 호출 시 `DELETE /posts/{postId}/comments/{commentId}` 요청.

- [ ] **Step 1: PostComment 인터페이스에 profileImageUrl 추가**

`frontend/src/hooks/usePost.ts`의 `PostComment` 인터페이스(현재 18~28번 줄)를 수정:

```typescript
export interface PostComment {
  id: number
  userId: number
  nickname: string
  profileImageUrl: string | null
  content: string
  createdAt: string
  commentType: 'TEXT' | 'PRAISE_CARD'
  praiseCardType: string | null
  parentId: number | null
  replies: PostComment[]
}
```

- [ ] **Step 2: useDeletePostComment 훅 추가**

`frontend/src/hooks/usePost.ts`의 `useCreatePostComment` 함수(현재 108~122번 줄) 바로 다음에 추가:

```typescript
export function useDeletePostComment(postId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (commentId: number) =>
      api.delete(`/posts/${postId}/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postComments', postId] })
      queryClient.invalidateQueries({ queryKey: ['posts', postId] })
      queryClient.invalidateQueries({
        predicate: q => q.queryKey[0] === 'posts' && typeof q.queryKey[1] === 'string',
      })
    },
  })
}
```

- [ ] **Step 3: 타입체크 확인**

Run: `cd frontend && npm run build`
Expected: 타입 에러 없이 빌드 성공 (이 시점에는 `BoardDetailPage.tsx`가 아직 새 필드를 안 써도 기존 코드와 호환되어야 함 — `profileImageUrl`이 옵셔널이 아니므로 백엔드가 항상 필드를 내려주는 한 문제 없음)

- [ ] **Step 4: Commit**

```bash
git add frontend/src/hooks/usePost.ts
git commit -m "✨ feat: 댓글 프로필 이미지 타입 및 삭제 훅 추가"
```

---

## Task 4: 프론트엔드 — 댓글 케밥 메뉴용 모달 컴포넌트 작성

**Files:**
- Modify: `frontend/src/pages/BoardDetailPage.tsx`

**Interfaces:**
- Consumes: `useCreateReport`(기존, `frontend/src/hooks/useReport.ts`), `useDeletePostComment`(Task 3에서 생성)
- Produces: `CommentReportModal` 컴포넌트 — props `{ commentId: number; onClose: () => void; onSuccess: () => void }`. `CommentDeleteConfirmModal` 컴포넌트 — props `{ onClose: () => void; onConfirm: () => void; isPending: boolean }`.

기존 `ReportModal`(게시글 신고, 120~212번 줄)과 게시글 삭제 확인 모달(파일 상단, `DeleteConfirmModal`류 — 정확한 이름은 파일에서 확인 후 재사용) 패턴을 그대로 따른다. 재사용을 위해 새 컴포넌트로 분리한다 (기존 `ReportModal`은 `targetType: 'POST'`로 하드코딩되어 있어 그대로는 댓글에 못 씀).

- [ ] **Step 1: CommentReportModal, CommentDeleteConfirmModal 컴포넌트 추가**

참고: 게시글 삭제용 모달은 `DeleteConfirmModal`(파일 57~118번 줄 근처)이라는 이름으로 이미 존재하며, 아래 `CommentDeleteConfirmModal`은 동일한 바텀시트 패턴에 문구만 댓글용으로 바꾼 것이다.

`frontend/src/pages/BoardDetailPage.tsx`의 `ReportModal` 컴포넌트 정의(120~212번 줄) 바로 다음에 추가:

```typescript
// ── 댓글 삭제 확인 모달 ──────────────────────────────────────────────────────
function CommentDeleteConfirmModal({
  onClose,
  onConfirm,
  isPending,
}: {
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
}) {
  const overlayRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center pb-[env(safe-area-inset-bottom)]"
      style={{ background: 'oklch(0 0 0 / 0.45)' }}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="댓글 삭제 확인"
    >
      <div
        className="w-full max-w-2xl rounded-t-3xl px-6 pt-5 pb-8 space-y-5"
        style={{ background: 'white', boxShadow: `0 -8px 40px oklch(0.62 0.15 220 / 0.18)` }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto" style={{ background: mA(0.20) }} aria-hidden="true" />
        <div className="text-center space-y-2 pt-2">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
            style={{ background: 'oklch(0.95 0.02 20)' }}
            aria-hidden="true"
          >
            <Trash2 size={24} style={{ color: 'oklch(0.55 0.18 20)' }} />
          </div>
          <h2 className="text-xl font-black text-foreground">댓글을 삭제할까요?</h2>
          <p className="text-base text-foreground/60">삭제한 댓글은 되돌릴 수 없어요.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[56px] rounded-2xl text-lg font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 [-webkit-tap-highlight-color:transparent]"
            style={{ background: mA(0.08), color: dark }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 min-h-[56px] rounded-2xl text-lg font-black text-white disabled:opacity-40 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 [-webkit-tap-highlight-color:transparent]"
            style={{ background: 'oklch(0.55 0.18 20)' }}
          >
            {isPending ? '삭제하는 중...' : '삭제하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 댓글 신고 모달 ────────────────────────────────────────────────────────────
function CommentReportModal({
  commentId,
  onClose,
  onSuccess,
}: {
  commentId: number
  onClose: () => void
  onSuccess: () => void
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const createReport = useCreateReport()
  const overlayRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async () => {
    if (!selected) return
    try {
      await createReport.mutateAsync({
        targetType: 'COMMENT',
        targetId: commentId,
        reason: selected as 'SPAM' | 'INAPPROPRIATE' | 'ABUSE' | 'OTHER',
      })
      onClose()
      onSuccess()
    } catch {
      toast.error('신고 처리 중 오류가 발생했어요.')
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center pb-[env(safe-area-inset-bottom)]"
      style={{ background: 'oklch(0 0 0 / 0.45)' }}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="댓글 신고"
    >
      <div
        className="w-full max-w-2xl rounded-t-3xl px-6 pt-5 pb-8 space-y-5"
        style={{ background: 'white', boxShadow: `0 -8px 40px oklch(0.62 0.15 220 / 0.18)` }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto" style={{ background: mA(0.20) }} aria-hidden="true" />
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-foreground">신고 사유 선택</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center"
            style={{ background: mA(0.06), color: dark }}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="space-y-2">
          {Object.entries(REASON_LABELS).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSelected(value)}
              className="w-full min-h-[56px] flex items-center gap-3 px-5 py-4 rounded-2xl text-base font-bold text-left transition-all"
              style={{
                background: selected === value ? mA(0.10) : mA(0.04),
                border: `2px solid ${selected === value ? mA(0.40) : mA(0.10)}`,
                color: dark,
              }}
            >
              <div
                className="w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center"
                style={{ borderColor: selected === value ? mA(1) : mA(0.30) }}
              >
                {selected === value && <div className="w-2.5 h-2.5 rounded-full" style={{ background: mA(1) }} />}
              </div>
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selected || createReport.isPending}
          className="w-full min-h-[56px] rounded-2xl text-lg font-black text-white flex items-center justify-center disabled:opacity-40 transition-opacity"
          style={{ background: 'oklch(0.55 0.18 20)' }}
        >
          {createReport.isPending ? '신고하는 중...' : '신고하기'}
        </button>
      </div>
    </div>
  )
}

// ── 댓글 케밥 메뉴(액션 시트) ─────────────────────────────────────────────────
function CommentActionSheet({
  isOwner,
  onClose,
  onDelete,
  onReport,
}: {
  isOwner: boolean
  onClose: () => void
  onDelete: () => void
  onReport: () => void
}) {
  const overlayRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center pb-[env(safe-area-inset-bottom)]"
      style={{ background: 'oklch(0 0 0 / 0.45)' }}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="댓글 메뉴"
    >
      <div
        className="w-full max-w-2xl rounded-t-3xl px-6 pt-5 pb-8 space-y-2"
        style={{ background: 'white', boxShadow: `0 -8px 40px oklch(0.62 0.15 220 / 0.18)` }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-3" style={{ background: mA(0.20) }} aria-hidden="true" />
        {isOwner ? (
          <button
            type="button"
            onClick={onDelete}
            className="w-full min-h-[56px] flex items-center gap-3 px-4 rounded-2xl text-lg font-bold text-left"
            style={{ color: 'oklch(0.55 0.18 20)' }}
          >
            <Trash2 size={20} aria-hidden="true" />
            삭제하기
          </button>
        ) : (
          <button
            type="button"
            onClick={onReport}
            className="w-full min-h-[56px] flex items-center gap-3 px-4 rounded-2xl text-lg font-bold text-left"
            style={{ color: dark }}
          >
            <Flag size={20} aria-hidden="true" />
            신고하기
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 타입체크 확인**

Run: `cd frontend && npm run build`
Expected: 새 컴포넌트 정의만으로는 아직 사용처가 없어 "declared but never read" 경고/에러가 날 수 있음 — Task 5에서 사용하므로 이 시점 에러는 무시하고 다음 태스크로 진행 가능. 단, `Flag`, `Trash2`, `X` 아이콘 import가 이미 파일 상단에 있는지 확인 (기존 import 목록: `ArrowLeft, MessageCircle, Trash2, Flag, ShieldOff, X, Link as LinkIcon, MoreVertical, Eye` — 모두 존재하므로 추가 import 불필요).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/BoardDetailPage.tsx
git commit -m "✨ feat: 댓글 삭제/신고 모달 및 액션시트 컴포넌트 추가"
```

---

## Task 5: 프론트엔드 — 댓글/답글 레이아웃을 카로트마켓 스타일로 교체 및 케밥 메뉴 연결

**Files:**
- Modify: `frontend/src/pages/BoardDetailPage.tsx`

**Interfaces:**
- Consumes: `PostComment.profileImageUrl`(Task 3), `useDeletePostComment`(Task 3), `CommentActionSheet`/`CommentDeleteConfirmModal`/`CommentReportModal`(Task 4), `formatRelativeDate`(기존, 41번 줄), `currentUser`(기존, `useAuthStore(s => s.user)`)

- [ ] **Step 1: import 및 훅 추가**

`frontend/src/pages/BoardDetailPage.tsx`의 `usePost` import(현재 6~13번 줄)에 `useDeletePostComment` 추가:

```typescript
import {
  usePostDetail,
  usePostComments,
  useCreatePostComment,
  useDeletePostComment,
  usePostLikeToggle,
  useDeletePost,
  type PostComment,
} from '@/hooks/usePost'
```

`export default function BoardDetailPage()` 내부, 기존 `const deletePost = useDeletePost(postId)`(296번 줄) 다음 줄에 추가:

```typescript
  const deletePostComment = useDeletePostComment(postId)
  const [commentMenuTarget, setCommentMenuTarget] = useState<PostComment | null>(null)
  const [commentDeleteTarget, setCommentDeleteTarget] = useState<number | null>(null)
  const [commentReportTarget, setCommentReportTarget] = useState<number | null>(null)
```

- [ ] **Step 2: 댓글 삭제 핸들러 추가**

`handleReplySubmit` 함수 정의 부근(322~335번 줄 근처)에 다음 핸들러 추가:

```typescript
  const handleCommentDelete = () => {
    if (commentDeleteTarget == null) return
    deletePostComment.mutate(commentDeleteTarget, {
      onSuccess: () => {
        setCommentDeleteTarget(null)
        toast.success('댓글을 삭제했어요.')
      },
      onError: () => {
        toast.error('댓글 삭제 중 오류가 발생했어요.')
      },
    })
  }
```

- [ ] **Step 3: 댓글 렌더링 블록을 새 레이아웃으로 교체**

기존 댓글 목록 렌더링(현재 609~664번 줄, `<div className="space-y-3">...{(comments ?? []).map(...)}...</div>`)을 다음으로 교체:

```typescript
        <div className="space-y-3">
          {(comments ?? []).map((c: PostComment) => (
            <div key={c.id} className="rounded-xl px-4 py-3 space-y-2" style={{ background: mA(0.04) }}>
              <div className="flex items-start gap-3">
                <div
                  className="w-11 h-11 rounded-full shrink-0 overflow-hidden flex items-center justify-center text-base font-black"
                  style={c.profileImageUrl
                    ? { boxShadow: `0 2px 8px ${mA(0.25)}` }
                    : { background: grad, color: 'white', boxShadow: `0 2px 8px ${mA(0.25)}` }}
                  aria-label={`${c.nickname} 아바타`}
                >
                  {c.profileImageUrl ? (
                    <img src={c.profileImageUrl} alt={`${c.nickname} 프로필`} className="w-full h-full object-cover" />
                  ) : (
                    <span aria-hidden="true">{c.nickname[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-black text-foreground">{c.nickname}</p>
                      <p className="text-xs text-foreground/50 mt-0.5">{formatRelativeDate(c.createdAt)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCommentMenuTarget(c)}
                      aria-label="댓글 메뉴 열기"
                      className="min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center shrink-0 focus-visible:outline-none focus-visible:ring-2"
                      style={{ color: mA(0.5) }}
                    >
                      <MoreVertical size={18} aria-hidden="true" />
                    </button>
                  </div>
                  <p className="text-base text-foreground/80 mt-1">{c.content}</p>
                </div>
              </div>

              {/* 대댓글 목록 */}
              {c.replies && c.replies.length > 0 && (
                <div className="space-y-2 pl-4 ml-1" style={{ borderLeft: `3px solid ${mA(0.20)}` }}>
                  {c.replies.map(reply => (
                    <div key={reply.id} className="rounded-xl px-3 py-2.5" style={{ background: 'white' }}>
                      <div className="flex items-start gap-2.5">
                        <div
                          className="w-9 h-9 rounded-full shrink-0 overflow-hidden flex items-center justify-center text-sm font-black"
                          style={reply.profileImageUrl
                            ? { boxShadow: `0 2px 6px ${mA(0.20)}` }
                            : { background: grad, color: 'white', boxShadow: `0 2px 6px ${mA(0.20)}` }}
                          aria-label={`${reply.nickname} 아바타`}
                        >
                          {reply.profileImageUrl ? (
                            <img src={reply.profileImageUrl} alt={`${reply.nickname} 프로필`} className="w-full h-full object-cover" />
                          ) : (
                            <span aria-hidden="true">{reply.nickname[0]}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-black text-foreground">{reply.nickname}</p>
                              <p className="text-xs text-foreground/50 mt-0.5">{formatRelativeDate(reply.createdAt)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setCommentMenuTarget(reply)}
                              aria-label="답글 메뉴 열기"
                              className="min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center shrink-0 focus-visible:outline-none focus-visible:ring-2"
                              style={{ color: mA(0.5) }}
                            >
                              <MoreVertical size={18} aria-hidden="true" />
                            </button>
                          </div>
                          <p className="text-base text-foreground/80 mt-1">{reply.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 답글 달기 버튼 */}
              <button
                type="button"
                onClick={() => setReplyTargetId(replyTargetId === c.id ? null : c.id)}
                className="min-h-[36px] text-sm font-bold rounded-lg px-2 focus-visible:outline-none focus-visible:ring-2"
                style={{ color: mA(0.5), background: mA(0.06) }}
              >
                {replyTargetId === c.id ? '취소' : '↩ 답글 달기'}
              </button>

              {/* 답글 입력창 */}
              {replyTargetId === c.id && (
                <div className="flex gap-2 items-start pt-1">
                  <input
                    type="text"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="답글을 입력해 주세요"
                    className="flex-1 h-12 text-base px-3 rounded-xl border-2 focus-visible:ring-0 outline-none"
                    style={{ borderColor: mA(0.15) }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleReplySubmit(c.id)}
                    disabled={!replyText.trim() || createComment.isPending}
                    className="min-h-[48px] px-4 rounded-xl text-base font-black text-white disabled:opacity-40 shrink-0"
                    style={{ background: grad }}
                  >
                    등록
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {commentMenuTarget && (
          <CommentActionSheet
            isOwner={commentMenuTarget.userId === currentUser?.id}
            onClose={() => setCommentMenuTarget(null)}
            onDelete={() => {
              setCommentDeleteTarget(commentMenuTarget.id)
              setCommentMenuTarget(null)
            }}
            onReport={() => {
              setCommentReportTarget(commentMenuTarget.id)
              setCommentMenuTarget(null)
            }}
          />
        )}

        {commentDeleteTarget != null && (
          <CommentDeleteConfirmModal
            onClose={() => setCommentDeleteTarget(null)}
            onConfirm={handleCommentDelete}
            isPending={deletePostComment.isPending}
          />
        )}

        {commentReportTarget != null && (
          <CommentReportModal
            commentId={commentReportTarget}
            onClose={() => setCommentReportTarget(null)}
            onSuccess={() => toast.success('신고가 접수되었습니다.')}
          />
        )}
```

- [ ] **Step 4: 미사용 import 확인**

`MessageCircle`, `Eye` 아이콘이 여전히 파일 내에서 사용되는지 확인한다 (댓글 블록 교체와 무관한 다른 곳에서 쓰이는지). 사용되지 않는다면 import에서 제거.

Run: `cd frontend && npm run build`
Expected: BUILD SUCCESSFUL, 타입 에러 없음, 미사용 변수/import 경고 없음

- [ ] **Step 5: 프론트 개발 서버로 수동 확인**

프론트 dev 서버 실행 중이라면 게시글 상세 페이지에서:
1. 댓글 작성자 아바타(프로필 사진 있으면 이미지, 없으면 이니셜)가 좌측에 표시되는지 확인
2. 닉네임(윗줄) + 상대시간(아랫줄)이 아바타 오른쪽에, 케밥(⋮)이 우측 상단에 표시되는지 확인
3. 본인 댓글 케밥 클릭 → "삭제하기"만 노출 → 삭제 확인 모달 → 삭제 후 목록에서 사라지는지 확인
4. 타인 댓글 케밥 클릭 → "신고하기"만 노출 → 신고 사유 선택 → 신고 완료 토스트 확인
5. 답글(대댓글)도 동일한 레이아웃과 케밥 동작을 하는지 확인

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/BoardDetailPage.tsx
git commit -m "🎨 feat: 댓글 UI를 카로트마켓 스타일로 개편"
```

---

## Self-Review Checklist (완료 후 실행자가 확인)

- [ ] 스펙의 백엔드 변경사항(`profileImageUrl` 추가, 댓글 삭제 API) 모두 태스크로 커버됨 — Task 1, 2
- [ ] 스펙의 프론트 변경사항(타입 추가, 삭제 훅, 레이아웃 변경, 케밥 메뉴) 모두 태스크로 커버됨 — Task 3, 4, 5
- [ ] `CommentResponse.from`/`fromReply` 시그니처 변경이 모든 호출부(체크인 도메인 포함, `CommentService.java` 내 5곳)에 반영됨
- [ ] 체크인 도메인 UI(`useComment.ts` 사용처)는 변경하지 않음
