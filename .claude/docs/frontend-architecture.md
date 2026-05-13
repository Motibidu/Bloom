## 프론트엔드 아키텍처

### 인증 상태 관리

- **`src/store/authStore.ts`**: Zustand store. 액세스 토큰은 메모리에만 유지(localStorage 제외), `user` 객체만 `auth-storage` 키로 localStorage에 영속화.
- **`src/lib/api.ts`**: 모든 API 호출에 사용하는 Axios 인스턴스. 401 응답 시 `/auth/refresh`로 자동 갱신하며, 갱신 중 들어온 요청은 큐잉하여 중복 refresh 방지. 갱신 실패 시 store 초기화 후 `/login` 리다이렉트.
- **`src/hooks/useAuth.ts`**: login/register/logout React Query mutation 래퍼. 성공 시 `setAccessToken` 호출.
- **`src/hooks/useUser.ts`**: `useCurrentUser()` — `/users/me` 쿼리 래퍼.
- **`src/hooks/useCheckin.ts`**: `useTodayFeed` / `useCheckinDetail` / `useCreateCheckin` / `useDeleteCheckin` / `usePhotoUploadUrl` / `useLikeToggle`
- **`src/hooks/useComment.ts`**: `useComments` / `useCreateComment`
- **`src/hooks/useMyActivity.ts`**: `useMyCalendar` / `useMyCheckins` / `useMyCategoryStats`

**낙관적 업데이트** (`useLikeToggle`): `onMutate`에서 이전 캐시(prevDetail, prevFeed)를 백업하고 likedByMe/likeCount를 즉시 반영. `onError`에서 실패 시 롤백.

API 호출은 반드시 `src/lib/api.ts`의 인스턴스를 사용해야 인터셉터가 동작함.

### 라우팅 및 레이아웃

- **`App.tsx`**: `ProtectedRoute`(인증 필요), `PublicOnlyRoute`(비인증 전용) 래퍼로 접근 제어
- 인증된 사용자의 페이지는 `Layout` 내부에서 `<Outlet />`으로 렌더링 (사이드바 + 헤더 포함)
- 경로 별칭 `@/`는 `src/`를 가리킴

### UI 컴포넌트

`src/components/ui/shadcn/`에 ShadcnUI 기반 기본 컴포넌트(Button, Card, Input, Label 등), `src/components/ui/common/`에 공통 컴포넌트(BigButton, LoadingSpinner 등) 위치.

도메인 특화 컴포넌트는 `src/components/ui/domain/checkin/`에 위치:
- `checkin-card.tsx` — 피드 카드
- `category-icon-grid.tsx` — 카테고리 선택 UI
- `like-button.tsx` — 좋아요 토글 버튼

React Query 전역 설정(`src/lib/queryClient.ts`): staleTime 5분, retry 1, refetchOnWindowFocus false.
