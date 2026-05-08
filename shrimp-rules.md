# Development Guidelines — 오늘 뭐 했어요?

## 1. 프로젝트 개요

- **서비스**: 50~60대 중장년층 대상 일상 활동 기록 및 소셜 연결 플랫폼
- **구조**: 모노레포 (Spring Boot 백엔드 + React 프론트엔드)
- **기반 패키지**: `com.starterkit` (백엔드), `@/` → `frontend/src/` (프론트엔드)

---

## 2. 모노레포 구조 및 실행 순서

```
bloom/
├── backend/          ← Spring Boot (포트 8080)
├── frontend/         ← React/Vite (포트 5173)
├── docs/PRD.md       ← 서비스 상세 기획
└── shrimp-rules.md
```

- **실행 순서**: 백엔드 먼저(`./gradlew.bat bootRun`) → 프론트엔드(`npm run dev`)
- Vite `/api` 프록시 → `localhost:8080` 자동 전달, CORS 설정 불필요
- DB: `localhost:3306/starterkit_dev` (root / 1234)

---

## 3. 백엔드 개발 규칙

### 3-1. 새 도메인 추가

새 도메인(예: `checkin`) 추가 시 **아래 6개 패키지 전부 생성**:

```
backend/src/main/java/com/starterkit/domain/{domain}/
├── controller/
├── service/
├── repository/
├── entity/
├── dto/
│   ├── request/
│   └── response/
└── exception/        ← 도메인 전용 예외 클래스
```

- `global/` 하위에 도메인 코드 배치 금지
- `domain/auth/`가 `domain/user/`의 `UserRepository`를 직접 참조하는 패턴은 허용된 의도적 설계

### 3-2. 예외 처리 패턴

- 도메인 예외 클래스 → `domain/{domain}/exception/` 하위에 생성
- **`GlobalExceptionHandler`(`global/exception/handler/`)에만** `@ExceptionHandler` 메서드 추가
- 범용 404 예외 → `global/exception/ResourceNotFoundException` 사용
- **별도 `@ControllerAdvice` 또는 `@RestControllerAdvice` 추가 금지**

```java
// 올바른 예외 등록 방법
// 1. domain/checkin/exception/CheckinNotFoundException.java 생성
// 2. GlobalExceptionHandler에 @ExceptionHandler(CheckinNotFoundException.class) 메서드 추가
```

### 3-3. 인증 및 보안 규칙

- 공개 엔드포인트(인증 없이 접근 가능): `/api/auth/**`, `/swagger-ui/**`, `/v3/api-docs/**`
- **새 공개 엔드포인트 추가 시 반드시 `SecurityConfig.java`의 `authorizeHttpRequests`에 `permitAll()` 등록**
- 신규 엔드포인트는 기본적으로 인증 필요(`authenticated()`)
- ADMIN 전용 엔드포인트에는 `@PreAuthorize("hasRole('ADMIN')")` 적용
- 컨트롤러에서 현재 사용자 조회: `@AuthenticationPrincipal UserDetails userDetails` → `userDetails.getUsername()` → 서비스 조회

### 3-4. 엔티티 규칙

- 모든 엔티티는 `@Entity` + `@Table(name = "...")` 명시
- `createdAt`/`updatedAt`은 `@PrePersist`/`@PreUpdate`로 자동 설정 (User 엔티티 패턴 참조)
- `ddl-auto: update` 사용 중 — **엔티티 컬럼 삭제/타입 변경 시 기존 데이터 손실 위험**
- Lombok 사용: `@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder`
- DTO는 Java record 사용 권장: `public record XxxRequest(...) {}`

### 3-5. 컨트롤러 규칙

- `@RestController` + `@RequestMapping("/api/{domain}")` 기본 구조
- Swagger 어노테이션 필수: `@Tag(name = "...")`, `@Operation(summary = "...")`
- 인증 필요 컨트롤러에 `@SecurityRequirement(name = "bearerAuth")` 추가
- Request DTO에 Bean Validation(`@Valid`) 사용

### 3-6. 서비스 규칙

- `@Service` + `@Transactional` 클래스 수준 적용
- 조회 전용 메서드에 `@Transactional(readOnly = true)` 적용

---

## 4. 프론트엔드 개발 규칙

### 4-1. API 호출 규칙

- **반드시 `src/lib/api.ts`의 default export(`api`)를 사용**
- `axios` 직접 import 또는 별도 axios 인스턴스 생성 금지
- `api` 인스턴스를 통해야만 자동 토큰 갱신, Bearer 헤더 주입 동작

```typescript
// 올바른 방법
import api from '@/lib/api'
const data = await api.get('/checkins').then(r => r.data)

// 금지
import axios from 'axios'
axios.get(...)
```

### 4-2. 인증 상태 관리 규칙

- **`accessToken`은 localStorage에 절대 저장 금지** (XSS 방지 — 메모리에만 유지)
- `user` 객체만 `auth-storage` 키로 localStorage 영속화
- 페이지 새로고침 후 accessToken 유실은 정상 동작 — `/api/auth/refresh` 쿠키로 자동 복구됨
- Zustand store 직접 수정 금지 — `setAccessToken`, `setUser`, `logout` 액션 사용

```typescript
// 올바른 방법
const { setAccessToken, setUser } = useAuthStore()

// 금지 — 직접 상태 조작
useAuthStore.setState({ accessToken: '...' })
```

### 4-3. 새 페이지 추가 규칙

**`frontend/src/App.tsx`에 라우트 등록 필수:**

- **인증 필요 페이지**: `ProtectedRoute`로 감싸고 `Layout` 중첩 라우트(`path="/"`) 내에 `<Route>` 추가
- **비인증 전용 페이지**: `PublicOnlyRoute`로 감싸고 최상위 `<Route>` 추가
- 페이지 컴포넌트는 `frontend/src/pages/` 하위에 생성

```typescript
// 인증 필요 페이지 추가 예시
<Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
  <Route path="feed" element={<FeedPage />} />
  <Route path="new-page" element={<NewPage />} />  {/* 여기에 추가 */}
</Route>
```

### 4-4. 데이터 훅 작성 규칙

- `useQuery` 훅은 `frontend/src/hooks/` 하위에 도메인별 파일로 분리 (`useCheckin.ts` 등)
- `useCurrentUser()` 패턴(`src/hooks/useUser.ts`) 참조하여 작성
- `useMutation` 훅은 성공 시 관련 쿼리 `invalidateQueries` 또는 `setQueryData` 처리

```typescript
// 올바른 쿼리 훅 패턴
export function useCheckins() {
  return useQuery({
    queryKey: ['checkins'],
    queryFn: () => api.get('/checkins').then(r => r.data),
  })
}
```

### 4-5. UI 컴포넌트 규칙 (중장년층 접근성)

- **인풋 크기 규격 유지**: `className="h-14 text-lg px-4"` (터치 영역 확보)
- **버튼 크기 규격 유지**: `className="h-14 text-lg font-semibold"`
- **레이블 크기 유지**: `className="text-lg font-semibold"`
- `src/components/ui/` 기존 컴포넌트 수정 금지 — 있는 것 그대로 사용
- 새 ShadcnUI 컴포넌트 필요 시 `components.json` 기반으로 추가 (수동 작성 금지)
- 공통 컴포넌트 활용: `FormField`, `DataCard`, `EmptyState`, `LoadingSpinner`, `PageHeader`

### 4-6. 폼 처리 규칙

- 폼은 `react-hook-form` 사용
- 단순 폼: `useForm` + `register` 직접 사용 (LoginPage 패턴)
- 복합 폼: `FormField` 공통 컴포넌트 사용 (`control` prop 전달 방식)
- 뮤테이션 에러는 `mutation.error` 체크로 표시

### 4-7. 타입 정의 규칙

- API 응답/요청 타입은 `frontend/src/types/` 하위에 정의
- 현재 타입 파일: `user.ts`, `auth.ts`
- 새 도메인 타입은 `frontend/src/types/{domain}.ts` 파일 생성

---

## 5. **⚠️ 프론트-백엔드 타입 불일치 주의사항**

현재 프론트엔드 타입과 백엔드 엔티티 간 불일치 존재:

| 항목 | 프론트엔드 (`types/user.ts`) | 백엔드 (`User.java`) |
|------|----------------------------|--------------------|
| 사용자 식별자 | `nickname` | `username` |
| 닉네임 | `nickname` | 존재하지 않음 |
| User 필드 | `{ id, email, nickname, bio? }` | `{ id, username, email, password, role }` |

- **User 도메인 API 연동 시 반드시 두 타입을 먼저 일치시킬 것**
- `UserResponse` DTO(`domain/user/dto/response/UserResponse.java`)가 브릿지 역할
- 백엔드 `UserResponse`가 `nickname` 필드를 반환하지 않으므로 연동 전 수정 필요

---

## 6. 동시 수정 필요 파일 규칙

| 작업 | 수정해야 할 파일 |
|------|----------------|
| 새 백엔드 도메인 추가 | `domain/{domain}/` 6개 패키지 + `GlobalExceptionHandler.java` |
| 새 공개 API 엔드포인트 추가 | 컨트롤러 + `SecurityConfig.java` (permitAll 등록) |
| 새 프론트엔드 페이지 추가 | `pages/XxxPage.tsx` + `App.tsx` (라우트 등록) |
| 새 API 클라이언트 훅 추가 | `hooks/useXxx.ts` + `types/xxx.ts` (타입 정의) |
| 새 예외 클래스 추가 | `domain/{domain}/exception/XxxException.java` + `GlobalExceptionHandler.java` |

---

## 7. 금지 사항

### 백엔드
- `global/` 패키지 하위에 도메인 비즈니스 코드 배치 금지
- `GlobalExceptionHandler` 외 별도 `@ControllerAdvice` 추가 금지
- 엔티티에 순환 참조(`@OneToMany` + `@ManyToOne`) 직렬화 시 `@JsonManagedReference`/`@JsonBackReference` 없이 사용 금지
- `ddl-auto: create` 또는 `create-drop`으로 변경 금지 (데이터 삭제 위험)
- JWT 비밀키를 코드에 하드코딩 금지 (`application.yml`의 환경변수 패턴 사용)

### 프론트엔드
- `axios` 직접 import 또는 별도 인스턴스 생성 금지
- `accessToken`을 `localStorage`, `sessionStorage`에 저장 금지
- `src/components/ui/` 기존 컴포넌트 직접 수정 금지
- `useAuthStore.setState(...)` 직접 호출 금지 — 반드시 정의된 액션 사용
- 인증 필요 페이지를 `ProtectedRoute` 없이 라우트에 직접 등록 금지
- `fetch` API 직접 사용 금지 — 반드시 `api` 인스턴스 사용
- UI 인풋/버튼 크기를 `h-14 text-lg` 미만으로 축소 금지 (접근성 위반)
