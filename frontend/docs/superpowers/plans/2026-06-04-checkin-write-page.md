# CheckinWritePage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 피드 FAB에서 진입하는 상세 기록(제목+본문+사진 최대 3장) 전용 작성 페이지를 `/checkin/write` 라우트로 구현한다.

**Architecture:** 신규 `CheckinWritePage.tsx`를 만들고 App.tsx에 라우트를 추가한다. FeedPage의 인라인 상세 모드 폼(isFormOpen + detail 모드 관련 state/JSX)을 제거하고 FAB를 navigate로 교체한다. 사진 업로드는 FeedPage에서 사용하던 presigned URL → S3 PUT → objectKey 수집 패턴을 그대로 사용한다.

**Tech Stack:** React 18, TypeScript, React Router v6, TanStack Query, Tailwind CSS 4, ShadcnUI (Input, Textarea), Lucide React, sonner toast

---

## File Map

| 파일 | 작업 |
|------|------|
| `src/pages/CheckinWritePage.tsx` | 신규 생성 — 작성 폼 페이지 |
| `src/App.tsx` | `/checkin/write` 라우트 추가 |
| `src/pages/FeedPage.tsx` | FAB onClick 교체 + 인라인 폼 관련 코드 제거 |

---

## Task 1: CheckinWritePage 골격 생성 및 라우트 등록

**Files:**
- Create: `src/pages/CheckinWritePage.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: CheckinWritePage 기본 골격 작성**

`src/pages/CheckinWritePage.tsx` 파일을 생성한다:

```tsx
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
const lA = (a: number) => `oklch(0.76 0.12 220 / ${a})`
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
                  <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: 'oklch(0 0 0 / 0.40)' }}>
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
```

- [ ] **Step 2: App.tsx에 라우트 추가**

`src/App.tsx` 상단 import에 추가:
```tsx
import CheckinWritePage from '@/pages/CheckinWritePage'
```

Layout 하위 ProtectedRoute 블록 안에 라우트 추가 (기존 `<Route path="checkin/:id" ...>` 바로 아래):
```tsx
<Route path="checkin/write" element={<CheckinWritePage />} />
```

- [ ] **Step 3: 빌드 확인**

```bash
cd frontend && npm run build
```

Expected: `✓ built in` 로 끝나는 성공 출력. 타입 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/pages/CheckinWritePage.tsx frontend/src/App.tsx
git commit -m "✨ feat: CheckinWritePage 추가 및 라우트 등록"
```

---

## Task 2: FeedPage FAB 교체 및 인라인 폼 코드 제거

**Files:**
- Modify: `src/pages/FeedPage.tsx`

> FeedPage는 1000줄 이상의 대형 파일이다. 변경 범위를 최소화하고 제거 후 미사용 import가 남지 않도록 주의한다.

- [ ] **Step 1: FAB onClick 교체 (3곳)**

FeedPage에서 `setIsFormOpen(true)`를 호출하는 곳을 모두 `navigate('/checkin/write')`로 교체한다.

**변경 위치:**
1. 줄 ~459: FAB 버튼 `onClick={() => setIsFormOpen(true)}`
2. 줄 ~933: 빈 피드 "지금 기록하기" 버튼 `onClick={() => setIsFormOpen(true)}`
3. 줄 ~955: `FeedCheckinCard`의 `onAlsoCheckin` 콜백 내 `setIsFormOpen(true)`

각각을 아래와 같이 교체:
```tsx
// 변경 전
onClick={() => setIsFormOpen(true)}

// 변경 후
onClick={() => navigate('/checkin/write')}
```

`onAlsoCheckin` 콜백 (줄 ~953~959) 전체를 다음으로 교체:
```tsx
onAlsoCheckin={() => navigate('/checkin/write')}
```

- [ ] **Step 2: isFormOpen 관련 JSX 블록 제거**

제거 대상 JSX 블록:
1. **줄 ~455~460**: FAB의 `!isFormOpen` 조건 제거 — `{canWriteFeed && !isFormOpen && (` → `{canWriteFeed && (`
2. **줄 ~572~845**: `{canWriteFeed && isFormOpen && ( ... </section> )}` 블록 전체 제거 (인라인 폼 섹션)

- [ ] **Step 3: isFormOpen 관련 state 및 로직 제거**

제거 대상:
```tsx
// 줄 ~134
const [isFormOpen, setIsFormOpen] = useState(false)

// 줄 ~194~198 (promptIdFromState 처리 useEffect 내)
if (promptIdFromState !== null) {
  setIsFormOpen(true)
  window.history.replaceState({}, '')
}

// 줄 ~243~250 handleCloseForm 함수 전체
const handleCloseForm = () => { ... }
```

`promptIdFromState` useEffect는 `setIsFormOpen(true)` 줄과 `window.history.replaceState` 줄만 제거한다. useEffect 자체를 삭제하지 않는다 (respondPrompt 연동 시 필요할 수 있음). 단, useEffect 내용이 비면 useEffect 전체 제거.

- [ ] **Step 4: 상세 모드(detail) 전용 state 제거**

상세 모드 폼을 페이지로 분리했으므로 FeedPage에서 더 이상 불필요한 state:
```tsx
// 제거 대상
const [title, setTitle] = useState('')
const [content, setContent] = useState('')
const [photoFiles, setPhotoFiles] = useState<File[]>([])
const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
const fileInputRef = useRef<HTMLInputElement>(null)
const formRef = useRef<HTMLElement>(null)
const getUploadUrl = usePhotoUploadUrl()
```

`handlePhotoChange`, `removePhoto`, `handleSubmit` 함수 전체 제거.

`checkinMode`, `handleModeToggle`은 간편 모드가 남아있으면 유지. 간편 모드 폼도 함께 제거한다면 `checkinMode`, `handleModeToggle`, `AUTO_TITLES` import도 제거.

> **주의:** 간편 모드(`checkinMode === 'simple'`) JSX 블록도 `isFormOpen` 조건 안에 있으므로 Step 2에서 이미 제거됨. `checkinMode`, `handleModeToggle`, `setCheckinMode`, `isSubmitting`, `setIsSubmitting`, `AUTO_TITLES` 모두 제거.

- [ ] **Step 5: 미사용 import 정리**

제거한 state/함수/컴포넌트에 따라 미사용 import 제거:
```tsx
// 제거 가능성 있는 것들 (실제 FeedPage 상단 import 확인 후 처리)
import { X, ImagePlus, AlignLeft, Zap } from 'lucide-react'  // 사용 여부 확인
import { Textarea } from '@/components/ui/shadcn/textarea'    // 제거
import { Input } from '@/components/ui/shadcn/input'          // 제거
import { usePhotoUploadUrl } from '@/hooks/useCheckin'        // 제거 (getUploadUrl 제거했으므로)
import { AUTO_TITLES } from '@/lib/categories'               // 제거
```

`BigButton`은 간편 모드 버튼에 사용되었으므로 제거 여부 확인.

- [ ] **Step 6: 빌드 확인**

```bash
cd frontend && npm run build
```

Expected: `✓ built in` 성공. TypeScript 타입 에러 없음, 미사용 변수 경고 없음.

- [ ] **Step 7: 커밋**

```bash
git add frontend/src/pages/FeedPage.tsx
git commit -m "♻️ refactor: FeedPage 인라인 폼 제거, FAB를 /checkin/write로 교체"
```

---

## Self-Review

**스펙 커버리지 체크:**
- [x] `/checkin/write` 라우트 → Task 1 Step 2
- [x] FAB → navigate 교체 → Task 2 Step 1
- [x] 카테고리 선택 (CategoryIconGrid, 필수) → Task 1 Step 1
- [x] 제목 Input (최대 50자, 필수) → Task 1 Step 1
- [x] 본문 Textarea (최대 500자, 선택) → Task 1 Step 1
- [x] 사진 3칸 그리드, 최대 3장 → Task 1 Step 1
- [x] presigned URL → S3 PUT → objectKey → Task 1 Step 1
- [x] 업로드 중 스피너 → Task 1 Step 1
- [x] 성공 시 navigate('/') + toast.success → Task 1 Step 1
- [x] 실패 시 toast.error → Task 1 Step 1
- [x] isFormOpen 코드 제거 → Task 2

**Placeholder 없음** — 모든 step에 실제 코드 포함.

**타입 일관성** — `Category`, `useCreateCheckin`, `usePhotoUploadUrl` 모두 기존 타입/훅 그대로 사용.
