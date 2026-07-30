import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PenLine } from 'lucide-react'
import { usePostList, type PostCategoryValue } from '@/hooks/usePost'
import PostCategoryTabs from '@/components/ui/domain/board/post-category-tabs'
import PostListRow from '@/components/ui/domain/board/post-list-row'
import Pagination from '@/components/ui/domain/board/pagination'
import { useAuthStore } from '@/store/authStore'

const main = 'oklch(0.62 0.15 220)'
const light = 'oklch(0.76 0.12 220)'
const grad = `linear-gradient(135deg, ${main}, ${light})`

export default function BoardListPage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const [category, setCategory] = useState<PostCategoryValue | null>(null)
  const [page, setPage] = useState(0)

  const { data, isLoading } = usePostList(category, page)

  const handleCategoryChange = (next: string | null) => {
    setCategory(next as PostCategoryValue | null)
    setPage(0)
  }

  return (
    <main className="pb-24">
      <PostCategoryTabs value={category} onChange={handleCategoryChange} />

      {isLoading ? (
        <p role="status" aria-live="polite" className="text-center py-12 text-base text-foreground/50">
          불러오는 중이에요...
        </p>
      ) : data && data.posts.length > 0 ? (
        <div
          className="flex flex-col gap-2 py-2"
          style={{ background: 'oklch(0.62 0.15 220 / 0.05)' }}
        >
          {data.posts.map(post => (
            <PostListRow key={post.id} post={post} onClick={() => navigate(`/board/${post.id}`)} />
          ))}
        </div>
      ) : (
        <p className="text-center py-12 text-base text-foreground/50">아직 게시글이 없어요</p>
      )}

      {data && (
        <div className="px-4 pt-4">
          <Pagination currentPage={data.currentPage} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}

      {user?.canWriteFeed && (
        <button
          type="button"
          onClick={() => navigate('/board/write')}
          aria-label="게시글 작성하기"
          className="fixed z-40 right-5 bottom-24 md:bottom-8 inline-flex items-center gap-2 min-h-[56px] px-6 rounded-full text-base font-black text-white transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: grad, boxShadow: '0 6px 20px oklch(0.62 0.15 220 / 0.35)' }}
        >
          <PenLine size={18} aria-hidden="true" />
          글쓰기
        </button>
      )}
    </main>
  )
}
