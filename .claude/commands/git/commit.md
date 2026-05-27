---
description: '이모지와 컨벤셔널 커밋 메시지로 잘 포맷된 커밋을 생성합니다'
allowed-tools:
  [
    'Bash(git add:*)',
    'Bash(git status:*)',
    'Bash(git commit:*)',
    'Bash(git diff:*)',
    'Bash(git log:*)',
  ]
---

# Claude 명령어: Commit

이모지와 컨벤셔널 커밋 메시지로 잘 포맷된 커밋을 생성합니다.

## 사용법

```
/commit
```

## 프로세스

1. 스테이지된 파일 확인, 스테이지된 파일이 있으면 해당 파일만 커밋
2. 여러 논리적 변경사항에 대한 diff 분석
3. **커밋 전 검증 스킬 추천** — diff를 보고 해당하는 스킬을 안내한 뒤 사용자의 응답을 기다린다. 커밋은 사용자가 검증을 마쳤다고 확인한 후에만 진행한다.
4. 필요시 분할 제안
5. 이모지 컨벤셔널 포맷으로 커밋 생성

## 커밋 전 검증 스킬 추천 기준

diff를 분석해 해당하는 항목만 추천한다. 해당 없는 항목은 표시하지 않는다.

| 조건 | 추천 스킬 |
|---|---|
| UI 컴포넌트·페이지·스타일 변경 | `/verify` — 브라우저에서 직접 동작 확인 |
| UI 컴포넌트·페이지·스타일 변경 | `/web-design-guidelines` — 디자인 시스템·접근성 점검 |
| 비즈니스 로직·서비스·쿼리 변경 | `/code-review` — 버그·로직 오류 검사 |
| 인증·권한·외부 입력 처리 변경 | `/security-review` — 보안 취약점 검사 |

추천 후 출력 형식 예시:
```
커밋 전 아래 검증을 먼저 진행하는 걸 추천합니다:
- /verify — 스크롤 복원 동작 및 모바일 레이아웃 확인
- /web-design-guidelines — 카드 레이아웃 디자인 시스템 준수 확인

검증 후 완료되면 알려주세요. 그때 커밋을 진행합니다.
```

## 커밋 포맷

`<이모지> <타입>: <설명>`

**타입:**

- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서화
- `style`: 포맷팅
- `refactor`: 코드 리팩토링
- `perf`: 성능 개선
- `test`: 테스트
- `chore`: 빌드/도구

**규칙:**

- 명령형 어조 ("추가" not "추가됨")
- 첫 줄 72자 미만
- 원자적 커밋 (단일 목적)
- 관련 없는 변경사항 분할

## 이모지 맵

✨ feat | 🐛 fix | 📝 docs | 💄 style | ♻️ refactor | ⚡ perf | ✅ test | 🔧 chore | 🚀 ci | 🚨 warnings | 🔒️ security | 🚚 move | 🏗️ architecture | ➕ add-dep | ➖ remove-dep | 🌱 seed | 🧑‍💻 dx | 🏷️ types | 👔 business | 🚸 ux | 🩹 minor-fix | 🥅 errors | 🔥 remove | 🎨 structure | 🚑️ hotfix | 🎉 init | 🔖 release | 🚧 wip | 💚 ci-fix | 📌 pin-deps | 👷 ci-build | 📈 analytics | ✏️ typos | ⏪️ revert | 📄 license | 💥 breaking | 🍱 assets | ♿️ accessibility | 💡 comments | 🗃️ db | 🔊 logs | 🔇 remove-logs | 🙈 gitignore | 📸 snapshots | ⚗️ experiment | 🚩 flags | 💫 animations | ⚰️ dead-code | 🦺 validation | ✈️ offline

## 분할 기준

**기능 단위로 분할한다. 프론트엔드/백엔드 레이어 구분이 아니라, 사용자에게 제공하는 기능(feature) 단위로 묶는다.**

예시:
- ❌ 잘못된 분할: "백엔드 변경사항", "프론트엔드 변경사항"
- ✅ 올바른 분할: "팔로우 기능 추가", "칭찬카드 댓글 타입 추가", "사용자 검색 기능 추가"

추가 분할 트리거: 다른 관심사 | 혼합된 타입 | 큰 변경사항

## 참고사항

- 스테이지된 파일이 있으면 해당 파일만 커밋
- 분할 제안을 위한 diff 분석
- **커밋에 Claude 서명 절대 추가하지 않음**
- **커밋은 `/commit` 호출 시에만 실행한다. 작업 완료 시점에 Claude가 자동으로 커밋을 실행하지 않는다.**