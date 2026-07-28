import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ImagePlus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/shadcn/input'
import { Textarea } from '@/components/ui/shadcn/textarea'
import { useCreatePost, type PostCategoryValue } from '@/hooks/usePostMock'

const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const light = 'oklch(0.76 0.12 220)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`
const grad  = `linear-gradient(135deg, ${main}, ${light})`
const serifStyle = { fontFamily: "'Noto Serif KR', serif" }

const CATEGORY_OPTIONS: { value: PostCategoryValue; label: string }[] = [
  { value: 'FREE', label: '자유게시판' },
  { value: 'QNA', label: '질문공간' },
  { value: 'INFO', label: '정보공유' },
]

export default function BoardWritePage() {
  const navigate = useNavigate()
  const [category, setCategory] = useState<PostCategoryValue | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const createPost = useCreatePost()

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    if (selected.length === 0) return
    const remaining = 3 - photoPreviews.length
    const toAdd = selected.slice(0, remaining)
    toAdd.forEach(file => {
      const reader = new FileReader()
      reader.onload = () => setPhotoPreviews(prev => [...prev, reader.result as string])
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const removePhoto = (index: number) => {
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!category || !title.trim() || !content.trim()) return
    setIsSubmitting(true)
    try {
      const newPost = await createPost.mutateAsync({
        category,
        title: title.trim(),
        content: content.trim(),
        photoObjectKeys: photoPreviews.length > 0 ? photoPreviews : undefined,
      })
      toast.success('게시글을 등록했어요 🎉')
      navigate(`/board/${newPost.id}`)
    } catch {
      toast.error('등록에 실패했어요. 다시 시도해 주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = !!category && !!title.trim() && !!content.trim() && !isSubmitting

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="이전 페이지로 돌아가기"
          className="inline-flex items-center gap-1.5 min-h-[48px] px-2 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: dark, '--tw-ring-color': main } as React.CSSProperties}
        >
          <ArrowLeft size={20} aria-hidden="true" />
          <span className="text-base font-bold">돌아가기</span>
        </button>
      </div>

      <div className="rounded-2xl bg-card px-6 py-7 space-y-7" style={{ border: `2px solid ${mA(0.20)}` }}>
        <h1 className="text-xl font-black text-foreground leading-snug" style={serifStyle}>
          게시글 작성하기
        </h1>

        <section aria-labelledby="category-label" className="space-y-3">
          <p id="category-label" className="text-lg font-bold text-foreground">
            게시판 선택 <span className="text-base font-medium text-muted-foreground">(필수)</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORY_OPTIONS.map(opt => {
              const selected = category === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCategory(opt.value)}
                  aria-pressed={selected}
                  className="min-h-[56px] rounded-2xl px-3 py-3 text-base font-bold transition-all focus-visible:outline-none focus-visible:ring-2"
                  style={selected
                    ? { background: grad, color: 'white' }
                    : { background: mA(0.06), color: dark, border: `1px solid ${mA(0.15)}` }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </section>

        <section aria-labelledby="title-label" className="space-y-2">
          <div className="flex justify-between items-center">
            <label id="title-label" htmlFor="write-title" className="text-lg font-bold text-foreground">
              제목 <span className="text-base font-medium text-muted-foreground">(필수)</span>
            </label>
            <span className="text-base font-medium text-foreground/50" aria-live="polite">{title.length}/50</span>
          </div>
          <Input
            id="write-title"
            className="h-14 text-lg px-4 rounded-xl border-2 focus-visible:ring-0"
            style={title.length > 0 ? { borderColor: mA(0.45) } : undefined}
            maxLength={50}
            placeholder="제목을 입력해 주세요"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoComplete="off"
          />
        </section>

        <section aria-labelledby="content-label" className="space-y-2">
          <div className="flex justify-between items-center">
            <label id="content-label" htmlFor="write-content" className="text-lg font-bold text-foreground">
              내용 <span className="text-base font-medium text-muted-foreground">(필수)</span>
            </label>
            <span className="text-base font-medium text-foreground/50" aria-live="polite">{content.length}/2000</span>
          </div>
          <Textarea
            id="write-content"
            className="text-lg px-4 py-3 resize-none rounded-xl border-2 focus-visible:ring-0"
            style={content.length > 0 ? { borderColor: mA(0.45) } : undefined}
            rows={8}
            maxLength={2000}
            placeholder="내용을 자유롭게 적어보세요"
            value={content}
            onChange={e => setContent(e.target.value)}
            autoComplete="off"
          />
        </section>

        <section aria-labelledby="photo-label" className="space-y-3">
          <p id="photo-label" className="text-lg font-bold text-foreground">
            사진 첨부 <span className="text-base font-medium text-muted-foreground">(선택, 최대 3장)</span>
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handlePhotoChange}
          />
          <div className="grid grid-cols-3 gap-3">
            {photoPreviews.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden" style={{ border: `2px solid ${mA(0.15)}` }}>
                <img src={src} alt={`첨부 사진 ${i + 1} 미리보기`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  aria-label={`${i + 1}번째 사진 제거`}
                  className="absolute top-1 right-1 min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  style={{ background: 'oklch(0 0 0 / 0.65)' }}
                >
                  <X size={18} className="text-white" aria-hidden="true" />
                </button>
              </div>
            ))}
            {photoPreviews.length < 3 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="사진 추가하기"
                className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ borderColor: mA(0.22), '--tw-ring-color': main } as React.CSSProperties}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: mA(0.10) }} aria-hidden="true">
                  <ImagePlus size={20} style={{ color: main }} />
                </div>
                <span className="text-sm font-bold" style={{ color: mA(0.6) }}>{photoPreviews.length}/3</span>
              </button>
            )}
          </div>
        </section>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          aria-busy={isSubmitting}
          className="w-full h-16 text-xl font-black text-white rounded-2xl transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: grad, '--tw-ring-color': main } as React.CSSProperties}
        >
          {isSubmitting ? '등록하는 중이에요...' : '등록하기'}
        </button>
      </div>
    </main>
  )
}
