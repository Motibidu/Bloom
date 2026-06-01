# 프론트엔드 규칙

## 아키텍처

### 인증 상태 관리

- **`src/store/authStore.ts`**: Zustand store. 액세스 토큰은 메모리에만 유지(localStorage 제외), `user` 객체만 `auth-storage` 키로 localStorage에 영속화.
- **`src/lib/api.ts`**: 모든 API 호출에 사용하는 Axios 인스턴스. 401 응답 시 `/auth/refresh`로 자동 갱신, 갱신 중 요청은 큐잉하여 중복 refresh 방지. 갱신 실패 시 store 초기화 후 `/login` 리다이렉트.
- API 호출은 반드시 `src/lib/api.ts` 인스턴스를 사용해야 인터셉터가 동작함.

### 훅

- `src/hooks/useAuth.ts` — login/register/logout mutation, 성공 시 `setAccessToken` 호출
- `src/hooks/useUser.ts` — `useCurrentUser()` (`/users/me`)
- `src/hooks/useCheckin.ts` — `useTodayFeed` / `useCheckinDetail` / `useCreateCheckin` / `useDeleteCheckin` / `usePhotoUploadUrl` / `useLikeToggle`
- `src/hooks/useComment.ts` — `useComments` / `useCreateComment`
- `src/hooks/useMyActivity.ts` — `useMyCalendar` / `useMyCheckins` / `useMyCategoryStats`

**낙관적 업데이트** (`useLikeToggle`): `onMutate`에서 prevDetail/prevFeed 백업 후 즉시 반영, `onError`에서 롤백.

### 라우팅 및 레이아웃

- `App.tsx`: `ProtectedRoute`(인증 필요), `PublicOnlyRoute`(비인증 전용)로 접근 제어
- 인증 페이지는 `Layout` 내부 `<Outlet />`으로 렌더링 (사이드바 + 헤더 포함)
- 경로 별칭 `@/` = `src/`
- React Query 전역(`src/lib/queryClient.ts`): staleTime 5분, retry 1, refetchOnWindowFocus false

### UI 컴포넌트 위치

- `src/components/ui/shadcn/` — ShadcnUI 기본 컴포넌트
- `src/components/ui/common/` — 공통 컴포넌트 (BigButton, LoadingSpinner 등)
- `src/components/ui/domain/checkin/` — `checkin-card.tsx` / `category-icon-grid.tsx` / `like-button.tsx`

---

## 디자인 시스템

### 컬러 상수 (모든 페이지 공통)

```tsx
const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const light = 'oklch(0.76 0.12 220)'
const grad  = `linear-gradient(135deg, ${main}, ${light})`
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`
const lA = (a: number) => `oklch(0.76 0.12 220 / ${a})`
const serifStyle = { fontFamily: "'Noto Serif KR', serif" }
```

- `bg-primary` 등 Tailwind 유틸리티 컬러 사용 금지 — 항상 위 상수 + inline style

### 폰트

- **Display**: `'Noto Serif KR', serif` — h1·h2·섹션 제목에 `serifStyle` 적용
- **Body**: `'Nanum Gothic', sans-serif` — 버튼·본문·레이블 (기본값)
- 줄 간격: 본문 `leading-relaxed`, 제목 `leading-snug`

### CSS 유틸리티 클래스 (index.css)

사용 가능: `.lp-card-hover` `.lp-float` `.lp-badge-in` `.lp-orb-pulse`
**사용 금지**: `.lp-coral-btn` `.lp-badge-coral` `.lp-gradient-text` `.lp-hero-bg` `.lp-feature-icon-bg` `.lp-cta-bg` (coral 하드코딩)

### 컴포넌트 규칙

**버튼**
- Primary CTA: `h-16 text-xl font-black px-12 rounded-2xl` + `style={{ background: grad, color: 'white' }}`
- 내부 액션: `min-h-[56px] px-10 text-lg font-bold rounded-2xl` + grad background
- Outline: `h-14 border-2 bg-white` + `style={{ borderColor: main, color: dark }}`
- 탭 선택: grad background / 미선택: `mA(0.08)` background + dark color
- 모든 버튼: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`

**입력 필드**: `h-14 text-lg px-4 rounded-xl border-2 focus-visible:ring-0` + 값 입력 시 `borderColor: mA(0.45)`

**카드**
- 기본: `rounded-2xl bg-white lp-card-hover` + `boxShadow: '0 4px 20px oklch(0 0 0 / 0.08)'`
- 폼 영역: `rounded-2xl bg-card px-7 py-7` + `border: 2px solid mA(0.20)`
- 배너: `background: linear-gradient(135deg, mA(0.08), lA(0.12))` + `border: 1px solid mA(0.15)`

**아바타**: `rounded-full` + `background: linear-gradient(135deg, mA(0.2), lA(0.2))` / 기본 w-11, 대형 w-16

**뱃지/pill**: `px-4 py-1.5 rounded-full font-bold` + `background: mA(0.10)`, `border: 1px solid mA(0.25)`, `color: dark`

**그라디언트 텍스트**: `background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'`

**토스트**: `toast.success/error()` — App.tsx Toaster: `top-center`, `fontSize: 1.0625rem`, `minHeight: 56px`

**바텀시트**: `SheetContent side="bottom" className="rounded-t-3xl max-h-[70vh] overflow-y-auto px-6 pb-8"`

**AuthLayout 카드**: ShadcnUI `<Card>` 사용 금지 → 직접 `div` + `boxShadow: '0 8px 40px oklch(0.62 0.15 220 / 0.12)'`

**내부 페이지 레이아웃**: `max-w-6xl mx-auto px-6 py-8`

### 접근성 기준 (50~60대)

- 본문 최소 `text-base`(18px), 터치 타겟 최소 `min-h-[48px]`, CTA `h-16`(64px)
- `wordBreak: 'keep-all'` — 한국어 줄바꿈 방지
- 장식 요소: `aria-hidden="true"` / 로딩: `role="status" aria-live="polite"` / 에러: `role="alert"`
- 아이콘 전용 버튼: `aria-label` 필수 / 탭: `role="tab" aria-selected`
- `100vh` 금지 → `min-h-screen` / 하단 고정: `pb-[env(safe-area-inset-bottom)]`
- `alert()` / `confirm()` 금지 → 커스텀 모달

---

## 코드 품질 체크리스트

커밋 전 반드시 확인한다. CI는 `npm run build`(tsc 포함)로 타입 에러를 검사하며, 아래 실수가 배포를 막는 주요 원인이다.

- **미사용 import 제거** — 컴포넌트 삭제·리팩토링 후 import 줄 잔여 여부 확인
- **미사용 변수·컴포넌트 제거** — 선언만 하고 JSX에서 쓰지 않는 변수/컴포넌트 제거
- **삭제한 state setter 참조 제거** — `setXxx` 형태의 setter를 state와 함께 지웠다면 호출부도 모두 제거
