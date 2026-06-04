# 글 작성 페이지 (CheckinWritePage) 설계

## 개요

피드의 FAB에서 진입하는 상세 기록(제목+본문+사진) 작성 전용 페이지.
기존 FeedPage 인라인 폼을 별도 라우트로 분리한다.

## 라우팅

- 경로: `/checkin/write`
- 위치: `App.tsx` Layout 하위, ProtectedRoute 안
- 파일: `src/pages/CheckinWritePage.tsx`

## FeedPage 변경

- FAB `onClick`: `setIsFormOpen(true)` → `navigate('/checkin/write')`
- `isFormOpen` 관련 state, JSX 제거

## 페이지 레이아웃

```
max-w-2xl mx-auto px-4 py-6
├── 상단: "← 돌아가기" 버튼 (navigate(-1))
└── 폼 카드 (rounded-2xl, border: 2px solid mA(0.20), px-7 py-7)
    ├── 1. 카테고리 선택 (CategoryIconGrid, 필수)
    ├── 2. 제목 Input (최대 50자, h-14 text-lg, 필수)
    ├── 3. 본문 Textarea (최대 500자, rows=6, 글자수 카운터, 선택)
    ├── 4. 사진 첨부 (최대 3장, 3칸 그리드, 선택)
    └── 5. 제출 CTA 버튼 (h-16 text-xl font-black)
```

## 사진 업로드

- 최대 3장, 3칸 그리드 (가로 스크롤 없음)
- 빈 슬롯: 점선 테두리 + "+" 아이콘 → 파일 선택
- 채워진 슬롯: 썸네일 + 우상단 X 버튼 (개별 삭제)
- 3장 모두 채워지면 "+" 슬롯 숨김
- 업로드 중: 슬롯에 로딩 스피너
- 업로드 실패: `toast.error`

업로드 흐름:
1. `usePhotoUploadUrl`로 presigned URL 발급
2. 브라우저에서 S3 직접 PUT
3. objectKey 배열에 추가
4. 제출 시 `photoObjectKeys`로 전달

## 제출

- 필수: 카테고리, 제목
- 선택: 본문, 사진
- `useCreateCheckin` 호출 (`isSimple: false`)
- 성공: `navigate('/')` + `toast.success('활동을 기록했어요 🎉')`
- 실패: `toast.error`

## 디자인 시스템

CLAUDE.md 규칙 준수:
- 컬러: `main`, `dark`, `light`, `grad`, `mA()`, `lA()` 상수
- 폰트: 제목 `serifStyle`, 버튼·레이블 Nanum Gothic
- 접근성: 터치 타겟 `min-h-[48px]`, CTA `h-16`, `wordBreak: 'keep-all'`
- 기존 컴포넌트 재사용: `CategoryIconGrid`, `Input`, `Textarea`
