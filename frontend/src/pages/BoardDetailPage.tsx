import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import {
  usePostDetail,
  usePostComments,
  useCreatePostComment,
  usePostLikeToggle,
  useDeletePost,
} from '@/hooks/usePostMock'
import { useAuthStore } from '@/store/authStore'
import ReactionPicker from '@/components/ui/domain/checkin/reaction-picker'

const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`
const serifStyle = { fontFamily: "'Noto Serif KR', serif" }

const CATEGORY_LABELS: Record<string, string> = {
  FREE: '자유게시판',
  QNA: '질문공간',
  INFO: '정보공유',
}

export default function BoardDetailPage() {
  const { id } = useParams()
  const postId = Number(id)
  const navigate = useNavigate()
  const currentUser = useAuthStore(s => s.user)

  const { data: post, isLoading } = usePostDetail(postId)
  const { data: comments } = usePostComments(postId)
  const createComment = useCreatePostComment(postId)
  const likeToggle = usePostLikeToggle(postId)
  const deletePost = useDeletePost(postId)

  const [commentText, setCommentText] = useState('')

  if (isLoading || !post) {
    return <p role="status" aria-live="polite" className="text-center py-16 text-base text-foreground/50">불러오는 중이에요...</p>
  }

  const isOwner = currentUser?.id === post.userId

  const handleCommentSubmit = () => {
    if (!commentText.trim()) return
    createComment.mutate(
      { content: commentText.trim(), commentType: 'TEXT' },
      { onSuccess: () => setCommentText('') }
    )
  }

  const handleDelete = async () => {
    await deletePost.mutateAsync()
    toast.success('게시글을 삭제했어요.')
    navigate('/board')
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="이전 페이지로 돌아가기"
          className="inline-flex items-center gap-1.5 min-h-[48px] px-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: dark, '--tw-ring-color': main } as React.CSSProperties}
        >
          <ArrowLeft size={20} aria-hidden="true" />
          <span className="text-base font-bold">돌아가기</span>
        </button>
        {isOwner && (
          <button
            type="button"
            onClick={handleDelete}
            aria-label="게시글 삭제"
            className="inline-flex items-center gap-1.5 min-h-[48px] px-3 rounded-xl text-base font-bold text-destructive focus-visible:outline-none focus-visible:ring-2"
          >
            <Trash2 size={18} aria-hidden="true" />
            삭제
          </button>
        )}
      </div>

      <article className="rounded-2xl bg-white px-6 py-7 space-y-4" style={{ boxShadow: `0 2px 16px ${mA(0.08)}` }}>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-sm font-bold" style={{ background: mA(0.10), border: `1px solid ${mA(0.22)}`, color: dark }}>
            {CATEGORY_LABELS[post.category]}
          </span>
          <span className="text-sm text-foreground/50 font-medium">{post.nickname}</span>
        </div>
        <h1 className="text-2xl font-black text-foreground leading-snug" style={serifStyle}>{post.title}</h1>
        <p className="text-base text-foreground/80 leading-relaxed whitespace-pre-wrap">{post.content}</p>

        {post.photoUrls.length > 0 && (
          <div className="grid grid-cols-1 gap-3">
            {post.photoUrls.map((url, i) => (
              <img key={i} src={url} alt={`첨부 사진 ${i + 1}`} className="w-full rounded-xl object-cover" loading="lazy" />
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2" style={{ borderTop: `1px solid ${mA(0.10)}` }}>
          <ReactionPicker
            checkinId={postId}
            myReactionType={post.myReactionType}
            reactionCounts={post.reactionCounts}
            onReact={(reactionType: string) => likeToggle.mutate({ reactionType })}
            disabled={likeToggle.isPending}
          />
          <div className="flex items-center gap-1 min-h-[48px]" style={{ color: 'oklch(0.55 0.05 220)' }}>
            <MessageCircle size={20} aria-hidden="true" />
            <span className="text-sm font-bold">{post.commentCount}</span>
          </div>
        </div>
      </article>

      <section aria-labelledby="comments-label" className="space-y-4">
        <h2 id="comments-label" className="text-lg font-black text-foreground">댓글 {comments.length}개</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="댓글을 입력해 주세요"
            className="flex-1 h-14 text-base px-4 rounded-xl border-2 focus-visible:ring-0 outline-none"
            style={{ borderColor: mA(0.15) }}
          />
          <button
            type="button"
            onClick={handleCommentSubmit}
            disabled={!commentText.trim() || createComment.isPending}
            className="min-h-[56px] px-6 rounded-2xl text-base font-black text-white disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${main}, oklch(0.76 0.12 220))` }}
          >
            등록
          </button>
        </div>
        <div className="space-y-3">
          {comments.map(c => (
            <div key={c.id} className="rounded-xl px-4 py-3" style={{ background: mA(0.04) }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-black text-foreground">{c.nickname}</span>
              </div>
              <p className="text-base text-foreground/80">{c.content}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
