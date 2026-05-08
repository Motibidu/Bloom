// FeedPage.tsx
// 역할: 오늘의 피드 메인 페이지 — 실제 API에서 피드 목록 조회, 체크인 작성 폼 표시
// 사용처: / (인덱스 라우트, Layout 내부)

import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, X, ImagePlus, PenLine } from 'lucide-react'
import { Textarea } from '@/components/ui/shadcn/textarea'
import { Input } from '@/components/ui/shadcn/input'
import CheckInCard from '@/components/ui/domain/checkin/checkin-card'
import CategoryIconGrid from '@/components/ui/domain/checkin/category-icon-grid'
import BigButton from '@/components/ui/common/big-button'
import { useTodayFeed, useCreateCheckin, usePhotoUploadUrl } from '@/hooks/useCheckin'
import type { Category } from '@/types'

export default function FeedPage() {
  const navigate = useNavigate()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: feed, isLoading, isError } = useTodayFeed()
  const createCheckin = useCreateCheckin()
  const getUploadUrl = usePhotoUploadUrl()

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setSelectedCategory(null)
    setTitle('')
    setContent('')
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!selectedCategory || !title.trim() || !content.trim()) return
    setIsSubmitting(true)
    try {
      let photoObjectKey: string | undefined

      if (photoFile) {
        // 1. S3 presigned URL 발급
        const { uploadUrl, objectKey } = await getUploadUrl.mutateAsync({
          filename: photoFile.name,
          contentType: photoFile.type,
        })
        // 2. S3에 직접 PUT (인터셉터 불필요하므로 fetch 사용)
        await fetch(uploadUrl, {
          method: 'PUT',
          body: photoFile,
          headers: { 'Content-Type': photoFile.type },
        })
        photoObjectKey = objectKey
      }

      // 3. 체크인 생성
      await createCheckin.mutateAsync({
        category: selectedCategory,
        title: title.trim(),
        content: content.trim(),
        photoObjectKey,
      })
      handleCloseForm()
    } catch {
      // 에러는 각 mutation에서 처리됨
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="max-w-6xl mx-auto px-6 py-8 flex justify-center">
        <p className="text-xl text-muted-foreground">불러오는 중...</p>
      </main>
    )
  }

  if (isError) {
    return (
      <main className="max-w-6xl mx-auto px-6 py-8 flex justify-center">
        <p className="text-xl text-destructive">피드를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
      </main>
    )
  }

  const sameCategoryUserCount: number = feed?.sameCategoryUserCount ?? 0
  const checkins = feed?.checkins ?? []

  return (
    <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* 같은 카테고리 활동자 배너 */}
      {sameCategoryUserCount > 0 && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl bg-primary/10 border border-primary/20 px-5 py-5 flex items-center gap-4"
        >
          <Users className="text-primary shrink-0" size={26} aria-hidden="true" />
          <p className="text-lg font-bold text-primary">
            나와 같은 활동을 한{' '}
            <strong>{sameCategoryUserCount}명</strong>이 있어요!
          </p>
        </div>
      )}

      {/* 체크인 작성 영역 */}
      {!isFormOpen ? (
        <button
          type="button"
          aria-label="오늘 활동 기록하기"
          onClick={() => setIsFormOpen(true)}
          className="w-full rounded-2xl border-2 border-primary/30 bg-primary/10 px-6 py-6 flex items-center gap-5 text-left hover:bg-primary/20 hover:border-primary/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[96px]"
        >
          <PenLine
            size={36}
            className="text-primary shrink-0"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <p className="text-xl font-bold text-foreground">오늘 활동 기록하기</p>
            <p className="text-lg font-semibold text-primary">탭하면 바로 시작할 수 있어요</p>
          </div>
        </button>
      ) : (
        <section
          aria-label="활동 기록 작성"
          className="rounded-2xl border border-primary/40 bg-card px-6 py-6 space-y-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">오늘 활동 기록하기</h2>
            <button
              type="button"
              onClick={handleCloseForm}
              aria-label="작성 취소하기"
              className="inline-flex items-center gap-1.5 min-h-[52px] min-w-[52px] px-3 rounded-lg text-xl font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            >
              <X size={24} aria-hidden="true" />
              <span>취소</span>
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-xl font-bold text-foreground">
              어떤 활동을 했나요?
            </p>
            <CategoryIconGrid
              selected={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </div>

          {selectedCategory && (
            <div className="space-y-5">
              {/* 제목 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="activity-title" className="text-xl font-bold text-foreground">
                    제목
                  </label>
                  <span className="text-lg font-medium text-foreground/60" aria-live="polite">
                    {title.length}/50
                  </span>
                </div>
                <Input
                  id="activity-title"
                  aria-label="활동 제목 입력"
                  className="text-lg px-4 py-3 rounded-xl border-2 h-auto"
                  maxLength={50}
                  placeholder="활동 제목을 입력해 주세요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* 내용 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="activity-content" className="text-xl font-bold text-foreground">
                    내용
                  </label>
                  <span className="text-lg font-medium text-foreground/60" aria-live="polite">
                    {content.length}/100
                  </span>
                </div>
                <Textarea
                  id="activity-content"
                  aria-label="활동 내용 입력"
                  className="text-lg px-4 py-3 resize-none rounded-xl border-2"
                  rows={4}
                  maxLength={100}
                  placeholder="오늘 활동을 간단히 설명해 주세요"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              {/* 사진 첨부 */}
              <div className="space-y-2">
                <p className="text-xl font-bold text-foreground">사진 첨부 (선택)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="첨부 사진 미리보기"
                      className="w-full max-h-48 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                      aria-label="사진 제거"
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 min-h-[52px] px-4 rounded-xl border-2 border-dashed border-border text-xl font-medium text-muted-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors w-full"
                  >
                    <ImagePlus size={22} aria-hidden="true" />
                    사진 추가하기
                  </button>
                )}
              </div>
            </div>
          )}

          {selectedCategory && (
            <BigButton
              fullWidth
              disabled={!title.trim() || !content.trim() || isSubmitting}
              aria-label="활동 등록하기"
              onClick={handleSubmit}
            >
              {isSubmitting ? '등록 중...' : '등록하기'}
            </BigButton>
          )}
        </section>
      )}

      {/* 피드 목록 */}
      {checkins.length === 0 ? (
        <div className="flex flex-col items-center gap-5 py-16 px-4 text-center" role="status">
          <p className="text-2xl font-bold text-foreground">아직 오늘의 활동이 없어요</p>
          <p className="text-xl text-muted-foreground leading-relaxed">첫 번째로 오늘 활동을 기록해 보세요!</p>
        </div>
      ) : (
        <section aria-label="오늘의 활동 피드">
          <div className="space-y-6">
            {checkins.map((checkin: any) => (
              <CheckInCard
                key={checkin.id}
                checkin={checkin}
                onClick={() => navigate(`/checkin/${checkin.id}`)}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
