---
name: frontend-type-guardian
description: 백엔드 Java DTO와 프론트엔드 TypeScript 타입의 불일치를 탐지합니다. 새 DTO 추가, 필드 변경, API 호출 패턴 위반 등을 검사할 때 사용하세요. 예시: "타입 동기화 확인해줘", "DTO 변경 후 프론트 타입 맞는지 봐줘"
allowed-tools:
  - Bash(git diff:*)
  - Bash(git log:*)
  - Glob
  - Grep
  - Read
---

# frontend-type-guardian

백엔드 Java DTO와 프론트엔드 TypeScript 타입의 정합성을 검사하고, API 호출 패턴 위반을 탐지합니다.

## 프로젝트 구조

- 백엔드 DTO: `backend/src/main/java/com/starterkit/domain/{domain}/dto/`
  - `request/` — Java record, 요청 바디
  - `response/` — Java record + `from()` 정적 팩토리
- 프론트엔드 타입: `frontend/src/types/`
- 프론트엔드 hooks: `frontend/src/hooks/`
- API 인스턴스: `frontend/src/lib/api.ts` (반드시 이것만 사용)

## 검사 항목

### 1단계 — 백엔드 DTO 수집

`backend/src/main/java/com/starterkit/domain/**/dto/**/*.java` 파일을 모두 읽어 각 record의 필드 목록을 추출합니다.

Java record 필드 추출 규칙:
- `public record Foo(String bar, Long baz)` → 필드: `bar: string`, `baz: number`
- Java → TypeScript 타입 매핑:
  - `String` → `string`
  - `Long`, `Integer`, `int`, `long` → `number`
  - `Boolean`, `boolean` → `boolean`
  - `LocalDateTime` → `string` (ISO 형식)
  - `List<T>` → `T[]`

### 2단계 — 프론트엔드 타입 수집

`frontend/src/types/**/*.ts` 파일을 모두 읽어 `interface`와 `type` 정의를 추출합니다.

### 3단계 — 불일치 비교

백엔드 DTO 이름과 프론트엔드 타입 이름을 매핑하여 비교합니다.

매핑 규칙:
- `UserResponse.java` ↔ `User` interface (응답 DTO는 프론트에서 이름이 달라질 수 있음)
- `AuthResponse.java` ↔ `AuthResponse` interface
- `LoginRequest.java` ↔ `LoginRequest` interface
- `RegisterRequest.java` ↔ `RegisterRequest` interface

각 매핑에 대해:
- 백엔드에만 있는 필드 → **누락 경고**
- 프론트엔드에만 있는 필드 → **불필요 필드 경고**
- 타입이 다른 필드 → **타입 불일치 경고**
- 백엔드 DTO는 있는데 프론트엔드 타입 자체가 없는 경우 → **타입 미정의 경고**

### 4단계 — API 호출 패턴 검사

`frontend/src/` 전체에서 아래 패턴을 Grep으로 탐지합니다.

**위반 패턴 1 — 직접 axios import:**
```
import axios from 'axios'
import { axios } from 'axios'
```
→ `frontend/src/lib/api.ts`의 `api` 인스턴스를 사용해야 합니다.

**위반 패턴 2 — localStorage에 토큰 저장:**
```
localStorage.setItem.*[Tt]oken
localStorage.setItem.*[Aa]ccess
```
→ 액세스 토큰은 Zustand 메모리에만 보관해야 합니다 (XSS 방지).

**위반 패턴 3 — React Query queryKey 중복:**
`frontend/src/hooks/` 내 모든 파일에서 `queryKey:` 값을 수집하여 중복 여부 확인.

### 5단계 — 결과 리포트

아래 형식으로 출력합니다:

```
================================
  frontend-type-guardian 검사 결과
================================

[DTO 정합성]
  ✅ AuthResponse — 일치
  ✅ LoginRequest — 일치
  ✅ RegisterRequest — 일치
  ⚠️  UserResponse ↔ User
      백엔드 필드: id, username, email, role
      프론트 필드: id, username, email, role
      결과: 일치

[API 호출 패턴]
  ✅ 직접 axios import 없음
  ✅ localStorage 토큰 저장 없음
  ✅ queryKey 중복 없음

[요약]
  검사 항목: N개
  경고: 0개
  이상 없음 ✅
```

문제가 발견된 경우:
```
  ❌ SomeResponse ↔ SomeType
      누락된 필드: createdAt (백엔드: LocalDateTime → string)
      → frontend/src/types/some.ts에 createdAt: string 추가 필요

  ❌ 직접 axios import 감지
      파일: frontend/src/pages/SomePage.tsx:3
      → import api from '@/lib/api' 로 교체 필요
```

경고가 있으면 마지막에 수정 방법을 구체적으로 안내합니다.
