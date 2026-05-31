# 가족 활동 기록 요청 UI 개선 설계

## 목표

가족 피드 탭에서 개별 멤버 또는 전체 가족에게 "활동 기록 요청"을 보낼 수 있게 한다.
기존 "공유 초대 보내기" (그룹 설정 탭에 숨어있음, direction 필드 무의미)를 제거하고
아바타 기반 인터랙션으로 완전히 교체한다.

---

## 현황 및 문제

| 문제 | 내용 |
|---|---|
| 진입점 위치 | "공유 초대 보내기" 버튼이 그룹 설정 탭에만 있어 가족 피드 탭에서 접근 불가 |
| direction 필드 무의미 | CHILD_TO_PARENT / PARENT_TO_CHILD 선택이 수신자 결정에 전혀 반영되지 않음 |
| recipient 결정 버그 | `otherMembers[0]`으로 항상 첫 번째 멤버에게만 발송 |
| 전체 발송 불가 | 가족 전원에게 한 번에 요청 보내는 기능 없음 |
| 명칭 불일치 | "공유 초대"는 서비스 개념(활동 기록 요청)과 맞지 않음 |

---

## 설계 결정: 시안 C-A

### UX 흐름

```
가족 피드 탭 진입
└─ 그룹 헤더 아바타 행
    ├─ [아빠 아바타] 탭 → 인라인 문구 선택 패널 → 발송 → 완료 메시지
    ├─ [엄마 아바타] 탭 → 인라인 문구 선택 패널 → 발송 → 완료 메시지
    └─ [전체 버튼] 탭  → 인라인 문구 선택 패널 → 전원 발송 → 완료 메시지
```

### 헤더 아바타 행 변경

- 기존: 아바타가 정적 표시 (탭 불가)
- 변경: 각 아바타에 Bell 뱃지(우하단 작은 원) 추가, 탭 시 해당 멤버 선택
- 추가: 아바타 행 끝에 점선 원 "전체" 버튼 (Users 아이콘)
- 선택된 대상은 흰 외곽선(ring)으로 강조

### 인라인 문구 선택 패널

- 위치: 그룹 헤더 바로 아래, 피드 위에 펼쳐짐
- 헤더: "{닉네임}에게 어떤 요청을 보낼까요?" / "가족 전체에게 어떤 요청을 보낼까요?"
- 닫기(X) 버튼
- PROMPT_TEMPLATES 목록 (기존과 동일)
- 문구 선택 즉시 발송 (별도 확인 단계 없음)

### 완료 상태

- 패널이 완료 메시지로 전환: "✓ {닉네임}에게 요청을 보냈어요!"
- "닫기" 버튼으로 패널 닫힘
- 닫힘과 동시에 선택 상태 초기화

---

## 프론트엔드 변경

### `FamilyPage.tsx`

**`FamilyGroupView` 헤더 아바타 영역**
- 아바타 버튼화: `onClick={() => handleAvatarTap(member)}`
- Bell 뱃지: `absolute -bottom-1 -right-1 w-5 h-5` 흰 원 + Bell 아이콘
- 선택 강조: `selectedTarget?.type === 'member' && selectedTarget.id === m.userId` 이면 `boxShadow: '0 0 0 3px white'`
- 전체 버튼: 아바타 행 끝, 점선 원 (`border: '2px dashed rgba(255,255,255,0.6)'`), Users 아이콘

**state 추가**
```ts
type PromptTarget =
  | { type: 'member'; id: number; nickname: string }
  | { type: 'all' }
  | null

const [promptTarget, setPromptTarget] = useState<PromptTarget>(null)
const [promptDone, setPromptDone] = useState(false)
```

**`InlinePromptPanel` 신규 컴포넌트**
- props: `target: PromptTarget`, `onClose: () => void`
- 내부에서 `useSendPrompt` 호출
- 문구 탭 시 즉시 `sendPrompt.mutate(...)` 호출
- 성공 시 `promptDone = true`로 전환

**기존 `PromptSheet` 제거**
- `PromptSheet` 컴포넌트 전체 삭제
- `promptSheetOpen` state 삭제
- 그룹 설정 탭의 "공유 초대 보내기" 버튼 제거

**명칭 변경**
- "공유 초대" → "활동 기록 요청" (모든 문자열)

### `useFamily.ts` / `usePrompt.ts`

변경 없음. `useSendPrompt`를 그대로 사용하되 전체 발송 시 멤버별로 개별 호출 (백엔드 bulk API 없이 프론트에서 `Promise.all`).

---

## 백엔드 변경

### `direction` 필드 제거

`SendPromptRequest`에서 `direction` 필드 제거.
`FamilyPrompt` 엔티티 및 DB 컬럼 제거.
`ReceivedPromptResponse`에서도 제거.

> **주의:** 프로덕션 DB 마이그레이션 필요 — `ALTER TABLE family_prompt DROP COLUMN direction`

### 전체 발송

백엔드 bulk API는 추가하지 않는다. 프론트엔드에서 `Promise.all(members.map(m => sendPrompt(m.id)))` 패턴으로 처리. 가족은 최대 수 명이므로 N+1 부하 없음.

---

## 제거 대상

| 항목 | 위치 |
|---|---|
| `PromptSheet` 컴포넌트 | `FamilyPage.tsx` |
| `promptSheetOpen` state | `FamilyGroupView` |
| "공유 초대 보내기" 버튼 | 그룹 설정 탭 |
| `direction` 선택 UI | (PromptSheet 삭제로 자동 제거) |
| `PromptDirection` enum | 백엔드 entity |
| `direction` DB 컬럼 | `family_prompt` 테이블 |

---

## 검증 기준

- [ ] 아바타 탭 → 문구 선택 패널 인라인 표시
- [ ] 전체 버튼 탭 → "가족 전체에게" 패널 표시
- [ ] 문구 선택 후 해당 멤버(또는 전원)에게 API 호출 확인
- [ ] 완료 메시지 표시 후 닫기 동작
- [ ] 그룹 설정 탭에 "공유 초대" 버튼 없음
- [ ] 콘솔 에러 없음
