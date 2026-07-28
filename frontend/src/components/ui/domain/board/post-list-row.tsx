import type { PostSummary } from '@/hooks/usePostMock'

const dark = 'oklch(0.48 0.15 220)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`

function formatRelativeDate(createdAt: string): string {
  const date = new Date(createdAt)
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')}`
}

const CATEGORY_LABELS: Record<string, string> = {
  FREE: '자유게시판',
  QNA: '질문공간',
  INFO: '정보공유',
}

interface Props {
  post: PostSummary
  onClick: () => void
}

export default function PostListRow({ post, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-4 text-left rounded-2xl bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{ boxShadow: `0 2px 12px ${mA(0.08)}`, '--tw-ring-color': dark } as React.CSSProperties}
    >
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <span
            className="px-2.5 py-0.5 rounded-full text-sm font-bold shrink-0"
            style={{ background: mA(0.10), border: `1px solid ${mA(0.22)}`, color: dark }}
          >
            {CATEGORY_LABELS[post.category]}
          </span>
          <h3 className="text-lg font-black text-foreground truncate leading-snug">
            {post.title}
          </h3>
        </div>
        <p className="text-base text-foreground/60 truncate">{post.contentPreview}</p>
        <div className="flex items-center gap-2 text-sm text-foreground/50 font-medium">
          <span>{post.nickname}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={post.createdAt}>{formatRelativeDate(post.createdAt)}</time>
          <span aria-hidden="true">·</span>
          <span>댓글 {post.commentCount}</span>
        </div>
      </div>
      {post.thumbnailUrl && (
        <img
          src={post.thumbnailUrl}
          alt=""
          aria-hidden="true"
          width={72}
          height={72}
          className="rounded-xl object-cover shrink-0"
          style={{ width: 72, height: 72 }}
          loading="lazy"
        />
      )}
    </button>
  )
}
