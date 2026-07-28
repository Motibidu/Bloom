import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PenLine } from 'lucide-react'
import { usePostList, type PostCategoryValue } from '@/hooks/usePostMock'
import PostCategoryTabs from '@/components/ui/domain/board/post-category-tabs'
import PostListRow from '@/components/ui/domain/board/post-list-row'
import Pagination from '@/components/ui/domain/board/pagination'
import { useAuthStore } from '@/store/authStore'

const main = 'oklch(0.62 0.15 220)'
const light = 'oklch(0.76 0.12 220)'
const grad = `linear-gradient(135deg, ${main}, ${light})`
const serifStyle = { fontFamily: "'Noto Serif KR', serif" }

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
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground" style={serifStyle}>게시판</h1>
        {user?.canWriteFeed && (
          <button
            type="button"
            onClick={() => navigate('/board/write')}
            className="inline-flex items-center gap-1.5 min-h-[48px] px-5 rounded-2xl text-base font-black text-white transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: grad }}
          >
            <PenLine size={18} aria-hidden="true" />
            글쓰기
          </button>
        )}
      </div>

      <PostCategoryTabs value={category} onChange={handleCategoryChange} />

      {isLoading ? (
        <p role="status" aria-live="polite" className="text-center py-12 text-base text-foreground/50">
          불러오는 중이에요...
        </p>
      ) : data && data.posts.length > 0 ? (
        <div className="space-y-3">
          {data.posts.map(post => (
            <PostListRow key={post.id} post={post} onClick={() => navigate(`/board/${post.id}`)} />
          ))}
        </div>
      ) : (
        <p className="text-center py-12 text-base text-foreground/50">아직 게시글이 없어요</p>
      )}

      {data && (
        <Pagination currentPage={data.currentPage} totalPages={data.totalPages} onPageChange={setPage} />
      )}
    </main>
  )
}
