const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`

interface Props {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ currentPage, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, i) => i)

  return (
    <nav aria-label="게시글 페이지 이동" className="flex items-center justify-center gap-1.5 pt-4 flex-wrap">
      {pages.map(p => {
        const selected = p === currentPage
        return (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={selected ? 'page' : undefined}
            aria-label={`${p + 1}페이지`}
            className="min-w-[44px] min-h-[44px] rounded-xl text-base font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={selected
              ? { background: main, color: 'white' }
              : { background: mA(0.06), color: dark }}
          >
            {p + 1}
          </button>
        )
      })}
    </nav>
  )
}
