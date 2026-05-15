# Claude Code Skills 가이드

설치된 스킬 목록과 사용법 요약.

---

## 사용 방법

슬래시 명령어로 호출: `/skill-name [인자]`

---

## 설치된 스킬

### 스킬 탐색

| 슬래시 명령어 | 설명 |
|---|---|
| `/find-skills` | 새로운 스킬 검색 및 설치 |

#### `/find-skills`
"이런 기능 스킬 있어?", "X 하는 방법 찾아줘" 같은 요청에 자동 트리거.  
[skills.sh](https://skills.sh/) 에코시스템에서 스킬을 검색하고 설치 명령어를 안내함.

**관련 CLI 명령어:**
```bash
npx skills find [검색어]   # 스킬 검색
npx skills add <패키지>    # 스킬 설치
npx skills check           # 업데이트 확인
npx skills update          # 전체 업데이트
```

---

### UI / 프론트엔드

| 슬래시 명령어 | 설명 |
|---|---|
| `/web-design-guidelines [파일]` | UI 코드 접근성·웹 표준 감사 |
| `/frontend-design` | 고품질 프론트엔드 컴포넌트/페이지 생성 |

#### `/web-design-guidelines <파일 경로>`
Vercel의 Web Interface Guidelines를 실시간으로 가져와 파일을 검사.  
매 실행마다 최신 규칙을 적용하며, 위반 사항을 `파일:줄번호` 형식으로 출력.

검사 항목:
- 접근성 (aria, 키보드 접근, 포커스 상태)
- 이미지 최적화 (width/height, lazy-load)
- 애니메이션 (`prefers-reduced-motion` 준수)
- 타이포그래피, 터치 타겟, 시맨틱 HTML 등

```
/web-design-guidelines src/components/ui/domain/checkin/checkin-card.tsx
```

#### `/frontend-design`
디자인 품질이 높은 프론트엔드 컴포넌트·페이지를 생성.  
일반적인 AI 스타일을 피하고 프로덕션 수준의 UI를 만들어냄.

---

### 코드 품질

| 슬래시 명령어 | 설명 |
|---|---|
| `/simplify` | 변경된 코드의 재사용성·품질·효율성 검토 후 개선 |
| `/security-review` | 현재 브랜치 변경사항 보안 감사 |
| `/review` | Pull Request 코드 리뷰 |

---

### Git / 버전 관리

| 슬래시 명령어 | 설명 |
|---|---|
| `/git:commit` | 이모지 + Conventional Commit 형식으로 커밋 생성 |

```
/git:commit
```

---

### 프로젝트 초기화

| 슬래시 명령어 | 설명 |
|---|---|
| `/init` | 현재 코드베이스를 분석해 CLAUDE.md 자동 생성 |
| `/api-scaffold` | API 엔드포인트 스캐폴딩 |

---

### Claude API 개발

| 슬래시 명령어 | 설명 |
|---|---|
| `/claude-api` | Anthropic SDK 앱 빌드·디버그·최적화 |

`anthropic` / `@anthropic-ai/sdk` 임포트가 있는 파일 작업 시 자동 트리거.  
프롬프트 캐싱, 툴 유즈, 모델 마이그레이션 등을 지원.

---

### 자동화 / 반복 작업

| 슬래시 명령어 | 설명 |
|---|---|
| `/loop [interval] [command]` | 지정 간격으로 명령 반복 실행 |
| `/schedule` | Cron 스케줄로 원격 에이전트 예약 실행 |

```bash
/loop 5m /web-design-guidelines src/     # 5분마다 UI 검사
/schedule                                 # 스케줄 관리 대화 시작
```

---

### 설정

| 슬래시 명령어 | 설명 |
|---|---|
| `/update-config` | settings.json 수정 (훅, 권한, 환경변수 등) |
| `/keybindings-help` | 키보드 단축키 커스터마이징 |
| `/fewer-permission-prompts` | 자주 쓰는 명령어를 허용 목록에 추가 |

---

## 스킬 위치

| 경로 | 범위 |
|---|---|
| `C:\Users\Park\.claude\skills\` | 전체 프로젝트 공통 (글로벌) |
| `C:\Users\Park\workspace\bloom\.claude\skills\` | 이 프로젝트 전용 |
