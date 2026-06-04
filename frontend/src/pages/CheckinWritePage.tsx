import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ImagePlus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/shadcn/input'
import { Textarea } from '@/components/ui/shadcn/textarea'
import CategoryIconGrid from '@/components/ui/domain/checkin/category-icon-grid'
import { useCreateCheckin, usePhotoUploadUrl } from '@/hooks/useCheckin'
import type { Category } from '@/types'

const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const light = 'oklch(0.76 0.12 220)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`
const grad  = `linear-gradient(135deg, ${main}, ${light})`
const serifStyle = { fontFamily: "'Noto Serif KR', serif" }

export default function CheckinWritePage() {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [uploadingCount, setUploadingCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const createCheckin = useCreateCheckin()
  const getUploadUrl = usePhotoUploadUrl()

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    if (selected.length === 0) return
    const remaining = 3 - photoFiles.length
    const toAdd = selected.slice(0, remaining)
    setPhotoFiles(prev => [...prev, ...toAdd])
    toAdd.forEach(file => {
      const reader = new FileReader()
      reader.onload = () => setPhotoPreviews(prev => [...prev, reader.result as string])
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const removePhoto = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index))
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!selectedCategory || !title.trim()) return
    setIsSubmitting(true)
    try {
      const objectKeys: string[] = []
      setUploadingCount(photoFiles.length)
      for (const file of photoFiles) {
        const { uploadUrl, objectKey } = await getUploadUrl.mutateAsync({
          filename: file.name,
          contentType: file.type,
        })
        await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        })
        objectKeys.push(objectKey)
        setUploadingCount(prev => prev - 1)
      }
      await createCheckin.mutateAsync({
        category: selectedCategory,
        title: title.trim(),
        content: content.trim(),
        photoObjectKeys: objectKeys.length > 0 ? objectKeys : undefined,
        isSimple: false,
      })
      toast.success('활동을 기록했어요 🎉')
      navigate('/')
    } catch {
      toast.error('기록에 실패했어요. 다시 시도해 주세요.')
    } finally {
      setIsSubmitting(false)
      setUploadingCount(0)
    }
  }

  const canSubmit = !!selectedCategory && !!title.trim() && !isSubmitting

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* 상단 뒤로가기 */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="이전 페이지로 돌아가기"
          className="inline-flex items-center gap-1.5 min-h-[48px] px-2 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: dark, '--tw-ring-color': main } as React.CSSProperties}
          onMouseEnter={e => { e.currentTarget.style.background = mA(0.08) }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          <ArrowLeft size={20} aria-hidden="true" />
          <span className="text-base font-bold">돌아가기</span>
        </button>
      </div>

      {/* 폼 카드 */}
      <div
        className="rounded-2xl bg-card px-6 py-7 space-y-7"
        style={{ border: `2px solid ${mA(0.20)}` }}
      >
        {/* 페이지 제목 */}
        <h1
          className="text-2xl font-black text-foreground leading-snug"
          style={serifStyle}
        >
          오늘 활동 기록하기
        </h1>

        {/* 1. 카테고리 */}
        <section aria-labelledby="category-label" className="space-y-4">
          <p id="category-label" className="text-lg font-bold text-foreground">
            어떤 활동을 했나요?{' '}
            <span className="text-base font-medium text-muted-foreground">(필수)</span>
          </p>
          <CategoryIconGrid selected={selectedCategory} onSelect={setSelectedCategory} />
        </section>

        {/* 2. 제목 */}
        <section aria-labelledby="title-label" className="space-y-2">
          <div className="flex justify-between items-center">
            <label id="title-label" htmlFor="write-title" className="text-lg font-bold text-foreground">
              제목 <span className="text-base font-medium text-muted-foreground">(필수)</span>
            </label>
            <span className="text-base font-medium text-foreground/50" aria-live="polite">
              {title.length}/50
            </span>
          </div>
          <Input
            id="write-title"
            className="h-14 text-lg px-4 rounded-xl border-2 focus-visible:ring-0"
            style={title.length > 0 ? { borderColor: mA(0.45) } : undefined}
            maxLength={50}
            placeholder="활동 제목을 입력해 주세요"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoComplete="off"
          />
        </section>

        {/* 3. 본문 */}
        <section aria-labelledby="content-label" className="space-y-2">
          <div className="flex justify-between items-center">
            <label id="content-label" htmlFor="write-content" className="text-lg font-bold text-foreground">
              내용 <span className="text-base font-medium text-muted-foreground">(선택)</span>
            </label>
            <span className="text-base font-medium text-foreground/50" aria-live="polite">
              {content.length}/500
            </span>
          </div>
          <Textarea
            id="write-content"
            className="text-lg px-4 py-3 resize-none rounded-xl border-2 focus-visible:ring-0"
            style={content.length > 0 ? { borderColor: mA(0.45) } : undefined}
            rows={6}
            maxLength={500}
            placeholder="오늘 활동을 자유롭게 적어보세요"
            value={content}
            onChange={e => setContent(e.target.value)}
            autoComplete="off"
          />
        </section>

        {/* 4. 사진 첨부 */}
        <section aria-labelledby="photo-label" className="space-y-3">
          <p id="photo-label" className="text-lg font-bold text-foreground">
            사진 첨부{' '}
            <span className="text-base font-medium text-muted-foreground">(선택, 최대 3장)</span>
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handlePhotoChange}
          />

          {/* 3칸 그리드 */}
          <div className="grid grid-cols-3 gap-3">
            {photoPreviews.map((src, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-xl overflow-hidden"
                style={{ border: `2px solid ${mA(0.15)}` }}
              >
                {/* 업로드 중 스피너 */}
                {isSubmitting && uploadingCount > 0 && i < uploadingCount && (
                  <div
                    className="absolute inset-0 z-10 flex items-center justify-center"
                    style={{ background: 'oklch(0 0 0 / 0.40)' }}
                  >
                    <svg className="animate-spin h-7 w-7 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  </div>
                )}
                <img
                  src={src}
                  alt={`첨부 사진 ${i + 1} 미리보기`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  aria-label={`${i + 1}번째 사진 제거`}
                  className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  style={{ background: 'oklch(0 0 0 / 0.65)' }}
                >
                  <X size={15} className="text-white" aria-hidden="true" />
                </button>
              </div>
            ))}

            {/* 빈 슬롯 — 3장 미만일 때만 표시 */}
            {photoPreviews.length < 3 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="사진 추가하기"
                className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  borderColor: mA(0.22),
                  '--tw-ring-color': main,
                } as React.CSSProperties}
                onMouseEnter={e => { e.currentTarget.style.borderColor = mA(0.45); e.currentTarget.style.background = mA(0.04) }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = mA(0.22); e.currentTarget.style.background = 'transparent' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: mA(0.10) }}
                  aria-hidden="true"
                >
                  <ImagePlus size={20} style={{ color: main }} />
                </div>
                <span className="text-sm font-bold" style={{ color: mA(0.6) }}>
                  {photoPreviews.length}/3
                </span>
              </button>
            )}
          </div>
        </section>

        {/* 5. 제출 버튼 */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          aria-busy={isSubmitting}
          className="w-full h-16 text-xl font-black text-white rounded-2xl transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: grad,
            '--tw-ring-color': main,
          } as React.CSSProperties}
          onMouseEnter={e => { if (canSubmit) e.currentTarget.style.opacity = '0.88' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          {isSubmitting ? '등록하는 중이에요...' : '등록하기'}
        </button>
      </div>
    </main>
  )
}
