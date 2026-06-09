# 프로덕션 시드 데이터 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** pcgear.store 프로덕션 공개 피드를 "진짜 사용자가 꾸준히 써온 것처럼" 보이는 활성 콘텐츠(회원 12명, 글 40개, 좋아요·댓글, 일부 사진)로 채운다.

**Architecture:** 로컬 PC에서 실행하는 독립 Node 스크립트가 `https://pcgear.store/api`를 HTTP로 호출해 가입·글작성·상호작용을 수행하고, 가입 시 필요한 이메일 인증코드와 작성시각 분산은 SSH로 프로덕션 MySQL에서 직접 처리한다. 프로덕션 백엔드 코드는 수정하지 않으며, 모든 가짜 데이터는 `@seed.bloom` 이메일 패턴으로 격리되어 롤백 가능하다.

**Tech Stack:** Node.js 22 (내장 fetch, ESM), OpenSSH (child_process로 호출), 프로덕션 MySQL(docker exec), AWS S3 presigned URL.

> **참고 — 이 계획의 검증 방식:** 시드 스크립트는 외부 시스템(프로덕션 API/SSH/S3)을 호출하는 통합 도구다. 의미 있는 검증은 단위 테스트가 아니라 "드라이런 → 소규모 실제 실행 → 결과 관찰"이다. 각 태스크는 실제 명령 실행과 기대 출력으로 검증한다. **프로덕션에 실제 데이터를 쓰는 태스크(8 이후)는 사용자 확인 후에만 진행한다.**

> **레퍼런스 — 코드 검증 완료된 사실** (spec `docs/superpowers/specs/2026-06-08-production-seed-data-design.md` 참조):
> - SSH: `ssh -i ~/.ssh/bloom_key ubuntu@129.154.59.53`
> - DB 쿼리: `docker exec bloom-mysql-1 mysql -uroot -p"$DB_PASSWORD" ... bloom_prod` (`$DB_PASSWORD`는 서버 `~/bloom/.env`에 있음)
> - 인증코드 테이블: `email_verification(email, code, verified, expires_at, created_at)`
> - 가입 자격: `birthYear <= 1976` → MEMBER (공개 피드 노출)
> - 피드 노출: `isSimple = false`인 글만. 날짜 필터 없음
> - 카테고리: `WALK, COOKING, READING, GARDENING, EXERCISE, MEETING, OTHER`
> - 리액션: `LIKE, DELICIOUS, GREAT, ENVIOUS, WELL_DONE`

---

## File Structure

| 파일 | 책임 |
|------|------|
| `scripts/seed/package.json` | ESM 선언, 실행 스크립트 정의. 외부 의존성 없음 |
| `scripts/seed/config.js` | 상수 (API base URL, SSH 호스트·키 경로, 컨테이너명, 이메일 패턴, 공통 비밀번호) |
| `scripts/seed/ssh.js` | SSH로 프로덕션 DB에 쿼리하는 헬퍼. 인증코드 조회, created_at UPDATE, 임의 SQL 실행 |
| `scripts/seed/api.js` | HTTP 호출 래퍼. email/send·verify·register·체크인·좋아요·댓글·presigned URL |
| `scripts/seed/data.js` | 콘텐츠 데이터. 12명 페르소나, 40개 글, 댓글 풀, 사진 파일명 매핑 |
| `scripts/seed/photos.js` | 로컬 사진 파일 → presigned URL로 S3 업로드 |
| `scripts/seed/run.js` | 메인 오케스트레이터. 가입→글→상호작용→시각분산 순서 실행 |
| `scripts/seed/rollback.js` | `@seed.bloom` 패턴으로 시드 데이터 일괄 삭제 (드라이런 지원) |
| `scripts/seed/photos/` | CC0 사진 보관 폴더 (사용자 검수 대상) |
| `scripts/seed/README.md` | 실행·롤백 방법, 안전 주의사항 |

---

## Task 1: 스크립트 프로젝트 골격 + config

**Files:**
- Create: `scripts/seed/package.json`
- Create: `scripts/seed/config.js`
- Create: `scripts/seed/.gitignore`

- [ ] **Step 1: package.json 작성**

`scripts/seed/package.json`:

```json
{
  "name": "bloom-seed",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "pcgear.store 프로덕션 시드 데이터 도구 (일회성 운영 스크립트)",
  "scripts": {
    "seed": "node run.js",
    "rollback": "node rollback.js",
    "rollback:dry": "node rollback.js --dry-run"
  }
}
```

- [ ] **Step 2: .gitignore 작성 (사진 원본은 커밋하지 않음)**

`scripts/seed/.gitignore`:

```
photos/*
!photos/.gitkeep
```

- [ ] **Step 3: config.js 작성**

`scripts/seed/config.js`:

```js
// 프로덕션 시드 설정. 일회성 운영 스크립트 — 민감정보(SSH 키 경로)는 로컬 환경 기준.
import os from 'node:os';
import path from 'node:path';

export const API_BASE = 'https://pcgear.store/api';

// SSH 접속 (spec에서 검증된 값)
export const SSH = {
  key: path.join(os.homedir(), '.ssh', 'bloom_key'),
  user: 'ubuntu',
  host: '129.154.59.53',
  container: 'bloom-mysql-1',
  database: 'bloom_prod',
};

// 시드 계정 공통값
export const SEED = {
  emailDomain: 'seed.bloom',        // seedNN@seed.bloom — 롤백 식별 패턴
  password: 'SeedBloom2026!',       // 모든 시드 계정 공통 비밀번호
};

// created_at 분산 범위 (과거 N일)
export const SPREAD_DAYS = 21;
```

- [ ] **Step 4: 폴더 placeholder 생성**

```bash
cd scripts/seed && mkdir -p photos && touch photos/.gitkeep
```

- [ ] **Step 5: 커밋**

```bash
git add scripts/seed/package.json scripts/seed/config.js scripts/seed/.gitignore scripts/seed/photos/.gitkeep
git commit -m "🌱 chore: 시드 스크립트 프로젝트 골격 및 설정"
```

---

## Task 2: SSH DB 헬퍼

**Files:**
- Create: `scripts/seed/ssh.js`

- [ ] **Step 1: ssh.js 작성**

`scripts/seed/ssh.js`:

```js
// SSH로 프로덕션 MySQL에 쿼리를 실행하는 헬퍼.
// 서버에서 `source ~/bloom/.env`로 DB_PASSWORD를 읽어 docker exec로 mysql 실행.
import { execFileSync } from 'node:child_process';
import { SSH } from './config.js';

// 단일 SQL 실행. -N(헤더 없음) -B(탭 구분) 결과를 문자열로 반환.
export function query(sql) {
  // 작은따옴표를 SQL 안에서 안전히 쓰기 위해 mysql -e 문자열은 큰따옴표로 감싼다.
  // sql 내부의 큰따옴표는 이스케이프.
  const escaped = sql.replace(/"/g, '\\"');
  const remote = `cd ~/bloom && set -a && . ./.env && set +a && ` +
    `docker exec ${SSH.container} mysql -uroot -p"$DB_PASSWORD" -N -B ` +
    `-e "${escaped}" ${SSH.database}`;

  const out = execFileSync('ssh', [
    '-i', SSH.key,
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'BatchMode=yes',
    `${SSH.user}@${SSH.host}`,
    remote,
  ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

  return out.trim();
}

// 이메일로 가장 최근 인증코드 조회. 없으면 null.
export function fetchVerificationCode(email) {
  const sql = `SELECT code FROM email_verification WHERE email='${email}' ` +
    `ORDER BY created_at DESC LIMIT 1`;
  const code = query(sql);
  return code || null;
}
```

- [ ] **Step 2: 읽기 전용 쿼리로 동작 검증**

Run:
```bash
cd scripts/seed && node -e "import('./ssh.js').then(m => console.log('USERS:', m.query('SELECT COUNT(*) FROM users')))"
```
Expected: `USERS: 3` (현재 프로덕션 회원 수. spec 기준 3명. 숫자가 출력되면 SSH·DB 경로 정상)

- [ ] **Step 3: fetchVerificationCode가 빈 이메일에 null 반환하는지 확인**

Run:
```bash
cd scripts/seed && node -e "import('./ssh.js').then(m => console.log('CODE:', m.fetchVerificationCode('nonexistent@seed.bloom')))"
```
Expected: `CODE: null`

- [ ] **Step 4: 커밋**

```bash
git add scripts/seed/ssh.js
git commit -m "🌱 feat: SSH 프로덕션 DB 쿼리 헬퍼 및 인증코드 조회"
```

---

## Task 3: HTTP API 래퍼

**Files:**
- Create: `scripts/seed/api.js`

- [ ] **Step 1: api.js 작성**

`scripts/seed/api.js`:

```js
// pcgear.store REST API 호출 래퍼. Node 22 내장 fetch 사용.
import { API_BASE } from './config.js';

async function request(method, pathname, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${pathname}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }
  if (!res.ok) {
    throw new Error(`${method} ${pathname} → ${res.status}: ${text}`);
  }
  return data;
}

export const api = {
  sendEmailCode: (email) =>
    request('POST', '/auth/email/send', { body: { email } }),

  verifyEmailCode: (email, code) =>
    request('POST', '/auth/email/verify', { body: { email, code } }),

  // 가입 성공 시 accessToken 반환
  register: (payload) =>
    request('POST', '/auth/register', { body: payload }),

  createCheckin: (token, payload) =>
    request('POST', '/checkins', { token, body: payload }),

  // presigned PUT URL + objectKey 반환
  photoUploadUrl: (token, filename, contentType) =>
    request('POST', '/checkins/photo-upload-url', {
      token, body: { filename, contentType },
    }),

  reaction: (token, checkinId, reactionType) =>
    request('POST', `/checkins/${checkinId}/likes`, {
      token, body: { reactionType },
    }),

  comment: (token, checkinId, content, parentId) =>
    request('POST', `/checkins/${checkinId}/comments`, {
      token, body: { content, commentType: 'TEXT', parentId: parentId ?? null },
    }),
};
```

- [ ] **Step 2: 읽기 안전한 호출로 검증 (잘못된 코드 검증 → 에러 throw 확인)**

Run:
```bash
cd scripts/seed && node -e "import('./api.js').then(async m => { try { await m.api.verifyEmailCode('x@seed.bloom','000000'); console.log('NO ERROR (unexpected)'); } catch(e){ console.log('OK threw:', e.message.slice(0,60)); } })"
```
Expected: `OK threw: POST /auth/email/verify → 4xx...` (인증코드 없는 이메일이라 4xx 에러. fetch·에러 처리 정상 동작 확인. 프로덕션에 데이터 안 씀)

- [ ] **Step 3: 커밋**

```bash
git add scripts/seed/api.js
git commit -m "🌱 feat: pcgear.store HTTP API 래퍼"
```

---

## Task 4: 콘텐츠 데이터 (페르소나·글·댓글)

**Files:**
- Create: `scripts/seed/data.js`

> 네이버 카페 "소소한 일상과 행복" 톤 참고: 담백·나눔 중심, `~네요/~어요/~ㅎㅎ/~^^/…`, 짧은 줄바꿈. 제목≤30자, 본문≤300자, 댓글≤200자.

- [ ] **Step 1: 페르소나 12명 정의**

`scripts/seed/data.js` (첫 부분):

```js
// 시드 콘텐츠 데이터. 코드 로직과 분리.
// 제약: 제목≤30, 본문≤300, 댓글≤200, birthYear≤1976.

// idx: seed 이메일 번호(seed01~seed12)와 매칭
export const personas = [
  { idx: 1,  nickname: '텃밭지기',   name: '김순자', birthYear: 1958, birthMonth: 3,  birthDay: 12 },
  { idx: 2,  nickname: '새벽산책',   name: '박영호', birthYear: 1962, birthMonth: 7,  birthDay: 5  },
  { idx: 3,  nickname: '장미여사',   name: '이정숙', birthYear: 1965, birthMonth: 11, birthDay: 23 },
  { idx: 4,  nickname: '백두산',     name: '최강식', birthYear: 1955, birthMonth: 1,  birthDay: 9  },
  { idx: 5,  nickname: '책읽는노을', name: '정미경', birthYear: 1968, birthMonth: 4,  birthDay: 17 },
  { idx: 6,  nickname: '손맛집사',   name: '한복례', birthYear: 1960, birthMonth: 9,  birthDay: 2  },
  { idx: 7,  nickname: '소소한행복', name: '오태원', birthYear: 1963, birthMonth: 6,  birthDay: 28 },
  { idx: 8,  nickname: '들꽃향기',   name: '윤경애', birthYear: 1970, birthMonth: 8,  birthDay: 14 },
  { idx: 9,  nickname: '뚜벅이영감', name: '서병철', birthYear: 1957, birthMonth: 12, birthDay: 1  },
  { idx: 10, nickname: '가을하늘',   name: '문선희', birthYear: 1966, birthMonth: 10, birthDay: 30 },
  { idx: 11, nickname: '아침이슬',   name: '강옥분', birthYear: 1959, birthMonth: 2,  birthDay: 19 },
  { idx: 12, nickname: '느림보걸음', name: '임재근', birthYear: 1973, birthMonth: 5,  birthDay: 8  },
];

export function emailFor(idx) {
  return `seed${String(idx).padStart(2, '0')}@seed.bloom`;
}
```

- [ ] **Step 2: 글 40개 정의 (authorIdx, category, title, description, photo?)**

`data.js`에 이어서 추가. **40개 전부** 작성한다 (아래는 형식과 처음 8개 예시. 구현 시 카테고리별 골고루 40개로 채운다 — WALK 8, COOKING 8, GARDENING 8, READING 6, EXERCISE 6, MEETING 4):

```js
// photo: data.js와 같은 폴더의 photos/ 안 파일명. 없으면 생략.
export const checkins = [
  { authorIdx: 1, category: 'GARDENING', title: '상추가 이만큼 자랐어요',
    description: '아침에 텃밭 나가보니 상추가 제법 컸네요.\n오늘 저녁은 삼겹살에 쌈으로 먹어야겠어요 ㅎㅎ\n비온 뒤라 그런지 쑥쑥 자랍니다~', photo: 'gardening-01.jpg' },
  { authorIdx: 6, category: 'COOKING', title: '건강 비빔밥 차려봤어요',
    description: '나물 몇 가지 무쳐서 비빔밥 했어요.\n색깔도 곱고 먹으니 속이 편하네요^^\n나이 드니 이런 소박한 밥이 제일입니다.', photo: 'cooking-01.jpg' },
  { authorIdx: 2, category: 'WALK', title: '새벽 공원 한 바퀴',
    description: '오늘도 다섯 시에 눈이 떠져서 공원 다녀왔어요.\n공기가 어찌나 좋던지…\n걷고 나면 하루가 가벼워집니다.', photo: null },
  { authorIdx: 4, category: 'EXERCISE', title: '뒷산 등산 다녀왔습니다',
    description: '오랜만에 친구들이랑 뒷산 올랐어요.\n정상에서 마시는 막걸리 한 잔이 꿀맛이네요 ㅎㅎ\n다리는 좀 뻐근해도 기분은 최고입니다.', photo: 'exercise-01.jpg' },
  { authorIdx: 5, category: 'READING', title: '요즘 읽는 책 한 권',
    description: '도서관에서 빌려온 소설을 읽고 있어요.\n나이 들어 읽으니 또 다르게 다가오네요.\n노을 보며 한 장씩 넘기는 재미가 쏠쏠합니다.', photo: null },
  { authorIdx: 3, category: 'GARDENING', title: '장미가 활짝 폈네요',
    description: '주식보다 수익난 우리집 장미들…ㅎㅎ\n올해는 유난히 색이 곱게 폈어요.\n지나가는 분들이 다 한 번씩 보고 가시네요^^', photo: 'gardening-02.jpg' },
  { authorIdx: 9, category: 'WALK', title: '강변 따라 걸었어요',
    description: '날이 선선해서 강변을 한참 걸었습니다.\n물 흐르는 소리 들으며 걸으니 마음이 편하네요.\n이런 게 행복이지 싶어요.', photo: null },
  { authorIdx: 7, category: 'MEETING', title: '오랜 친구들과 점심',
    description: '동창들 모여서 칼국수 한 그릇 했어요.\n수십 년 친구들이라 말 안 해도 통하네요 ㅎㅎ\n다음 달에 또 보기로 했습니다.', photo: 'meeting-01.jpg' },
  // ... 나머지 32개를 같은 형식으로 카테고리 골고루 채운다.
  // 각 authorIdx는 1~12를 고르게 분배하고, 인당 2~5개가 되도록 한다.
];
```

- [ ] **Step 3: 댓글 풀 정의 (카테고리별 어울리는 댓글 문구)**

`data.js`에 이어서. 댓글은 작성 시 "다른 페르소나"가 단다:

```js
// 카테고리별 댓글 후보. 작성 시 랜덤 선택. 어미는 5060 톤 유지.
export const commentPool = {
  GARDENING: ['어머 잘 키우셨네요^^', '저도 텃밭 하는데 부럽습니다 ㅎㅎ', '색이 참 곱네요~', '정성이 느껴져요.'],
  COOKING:   ['보기만 해도 군침이 도네요 ㅎㅎ', '솜씨가 좋으십니다^^', '건강한 밥상이네요~', '저도 따라 해봐야겠어요.'],
  WALK:      ['저도 아침 산책 좋아해요^^', '공기 좋았겠어요~', '걷는 게 최고지요 ㅎㅎ', '사진만 봐도 시원하네요.'],
  EXERCISE:  ['대단하십니다 ㅎㅎ', '저질 체력이라 부럽네요^^', '건강이 최고지요~', '막걸리 한 잔 생각나네요 ㅎㅎ'],
  READING:   ['무슨 책인지 궁금하네요^^', '저도 요즘 책 읽어요~', '노을 보며 읽으니 좋겠어요.', '추천 좀 해주세요 ㅎㅎ'],
  MEETING:   ['보기 좋습니다^^', '오랜 친구가 최고지요~', '저도 친구들 보고 싶네요 ㅎㅎ', '즐거우셨겠어요.'],
};

// 대댓글용 짧은 반응
export const replyPool = ['맞아요 ㅎㅎ', '감사합니다^^', '그러게요~', '담에 같이 해요^^'];
```

- [ ] **Step 4: 데이터 정합성 자체 검증 스크립트 실행**

Run:
```bash
cd scripts/seed && node -e "import('./data.js').then(m => { const bad = m.checkins.filter(c => c.title.length>30 || c.description.length>300); console.log('총 글:', m.checkins.length, '| 길이초과:', bad.length); const idxs=[...new Set(m.checkins.map(c=>c.authorIdx))]; console.log('작성자 수:', idxs.length); })"
```
Expected: `총 글: 40 | 길이초과: 0` 그리고 `작성자 수:`가 8 이상 (모든 페르소나가 골고루 쓸 필요는 없지만 다양해야 함)

- [ ] **Step 5: 커밋**

```bash
git add scripts/seed/data.js
git commit -m "🌱 feat: 시드 콘텐츠 데이터 (페르소나 12명·글 40개·댓글 풀)"
```

---

## Task 5: CC0 사진 수집 + 검수 게이트

**Files:**
- 사진 파일: `scripts/seed/photos/*.jpg`

> 이 태스크는 코드가 아니라 자료 수집이다. Claude가 CC0 사진을 다운로드하고, 사용자가 검수한다.

- [ ] **Step 1: data.js가 참조하는 photo 파일명 목록 추출**

Run:
```bash
cd scripts/seed && node -e "import('./data.js').then(m => console.log([...new Set(m.checkins.filter(c=>c.photo).map(c=>c.photo))].join('\n')))"
```
Expected: 필요한 사진 파일명 목록 (예: `gardening-01.jpg`, `cooking-01.jpg`, ...). 이 목록만큼 사진을 준비한다.

- [ ] **Step 2: CC0 사진 다운로드**

픽사베이/펙셀스 등에서 CC0(출처표시 불필요) 사진을 카테고리에 맞게 받아 `scripts/seed/photos/`에 위 파일명으로 저장한다.
- 형식: JPEG (`image/jpeg`)
- 소박한 실사진 우선 (전문 스튜디오 느낌 회피)
- 스크린샷 금지, 원본 다운로드

- [ ] **Step 3: 사용자 검수 게이트 (필수 정지점)**

사용자에게 알린다:
> "`scripts/seed/photos/` 폴더에 CC0 사진을 모았습니다. 폴더를 열어 부적절하거나 어색한 사진을 삭제해 주세요. 검수가 끝나면 알려주세요."

사용자 확인을 받기 전에는 다음 태스크로 진행하지 않는다.

- [ ] **Step 4: 검수 후 누락 점검**

Run:
```bash
cd scripts/seed && node -e "import('./data.js').then(async m => { const fs=await import('node:fs'); const need=[...new Set(m.checkins.filter(c=>c.photo).map(c=>c.photo))]; const miss=need.filter(f=>!fs.existsSync('photos/'+f)); console.log('필요:', need.length, '| 누락:', miss.length, miss.join(',')); })"
```
Expected: `누락: 0`. 누락이 있으면 data.js에서 해당 글의 `photo`를 `null`로 바꾸거나 사진을 채운다.

> 사진은 .gitignore로 커밋하지 않으므로 이 태스크는 커밋 없음.

---

## Task 6: 사진 업로드 모듈

**Files:**
- Create: `scripts/seed/photos.js`

- [ ] **Step 1: photos.js 작성**

`scripts/seed/photos.js`:

```js
// 로컬 사진 파일을 presigned URL로 S3에 업로드하고 objectKey를 반환.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { api } from './api.js';

const here = path.dirname(fileURLToPath(import.meta.url));

// token: 업로드 주체(작성자) accessToken, filename: photos/ 안 파일명
// 반환: objectKey (체크인 생성 시 photoObjectKeys에 넣음)
export async function uploadPhoto(token, filename) {
  const { uploadUrl, objectKey } = await api.photoUploadUrl(token, filename, 'image/jpeg');
  const bytes = await readFile(path.join(here, 'photos', filename));

  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/jpeg' },
    body: bytes,
  });
  if (!res.ok) {
    throw new Error(`S3 PUT 실패 ${filename}: ${res.status}`);
  }
  return objectKey;
}
```

> **주의:** `api.photoUploadUrl` 응답 필드명이 `uploadUrl`/`objectKey`인지 백엔드 `PhotoUploadUrlResponse`로 확인한다. spec 기준 presigned URL + objectKey + 만료초를 반환한다. 실제 필드명이 다르면(`url` 등) 이 구조분해를 맞춘다.

- [ ] **Step 2: 응답 필드명 확인**

Run:
```bash
grep -A3 "record PhotoUploadUrlResponse" "C:/Users/Park/workspace/bloom/backend/src/main/java/com/starterkit/domain/checkin/dto/response/PhotoUploadUrlResponse.java"
```
Expected: 필드 순서·이름 출력. `photos.js`의 구조분해(`uploadUrl`, `objectKey`)를 실제 필드명과 일치시킨다.

- [ ] **Step 3: 커밋**

```bash
git add scripts/seed/photos.js
git commit -m "🌱 feat: 사진 S3 업로드 모듈"
```

---

## Task 7: 메인 오케스트레이터 (run.js)

**Files:**
- Create: `scripts/seed/run.js`

- [ ] **Step 1: 가입 단계 작성**

`scripts/seed/run.js`:

```js
// 시드 전체 실행: 가입 → 글 작성 → 좋아요·댓글 → created_at 분산.
import { personas, emailFor, checkins, commentPool, replyPool } from './data.js';
import { api } from './api.js';
import { query } from './ssh.js';
import { uploadPhoto } from './photos.js';
import { SEED, SPREAD_DAYS } from './config.js';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// idx → { token, userId } 매핑
const accounts = new Map();

async function registerAll() {
  for (const p of personas) {
    const email = emailFor(p.idx);
    await api.sendEmailCode(email);
    await sleep(500);

    // DB에서 방금 발송된 코드 조회 (SSH)
    const { fetchVerificationCode } = await import('./ssh.js');
    const code = fetchVerificationCode(email);
    if (!code) throw new Error(`코드 조회 실패: ${email}`);

    await api.verifyEmailCode(email, code);
    const auth = await api.register({
      email,
      password: SEED.password,
      nickname: p.nickname,
      name: p.name,
      birthYear: p.birthYear,
      birthMonth: p.birthMonth,
      birthDay: p.birthDay,
    });
    accounts.set(p.idx, { token: auth.accessToken });
    console.log(`가입 완료: ${p.nickname} (${email})`);
    await sleep(300);
  }
}
```

- [ ] **Step 2: 글 작성 단계 추가**

`run.js`에 이어서:

```js
// checkin 데이터 → 생성된 checkinId 매핑 (인덱스 기준)
const createdCheckins = []; // { id, authorIdx, category }

async function createCheckins() {
  for (const c of checkins) {
    const acc = accounts.get(c.authorIdx);
    let photoObjectKeys;
    if (c.photo) {
      const key = await uploadPhoto(acc.token, c.photo);
      photoObjectKeys = [key];
    }
    const res = await api.createCheckin(acc.token, {
      category: c.category,
      title: c.title,
      description: c.description,
      photoObjectKeys,
      isSimple: false,
    });
    createdCheckins.push({ id: res.id, authorIdx: c.authorIdx, category: c.category });
    console.log(`글 작성: [${c.category}] ${c.title} (id=${res.id})`);
    await sleep(200);
  }
}
```

> **주의:** `createCheckin` 응답에서 체크인 id 필드명이 `id`인지 백엔드 `CheckinResponse`로 확인한다(Step 6 검증에서 처리).

- [ ] **Step 3: 좋아요·댓글 단계 추가**

`run.js`에 이어서:

```js
const REACTIONS = ['LIKE', 'DELICIOUS', 'GREAT', 'ENVIOUS', 'WELL_DONE'];
// 카테고리별 어울리는 리액션 가중치
const reactionFor = (cat) => {
  if (cat === 'COOKING') return pick(['DELICIOUS', 'LIKE', 'WELL_DONE']);
  if (cat === 'EXERCISE') return pick(['WELL_DONE', 'GREAT', 'LIKE']);
  if (cat === 'GARDENING') return pick(['ENVIOUS', 'GREAT', 'LIKE']);
  return pick(REACTIONS);
};

async function addInteractions() {
  const allIdx = personas.map(p => p.idx);
  for (const ch of createdCheckins) {
    // 자기 글 제외한 다른 계정들
    const others = allIdx.filter(i => i !== ch.authorIdx);

    // 좋아요 1~6개
    const likeCount = 1 + Math.floor(Math.random() * 6);
    const likers = shuffle(others).slice(0, likeCount);
    for (const idx of likers) {
      await api.reaction(accounts.get(idx).token, ch.id, reactionFor(ch.category));
      await sleep(120);
    }

    // 절반 정도 글에 댓글 1~3개
    if (Math.random() < 0.5) {
      const commenters = shuffle(others).slice(0, 1 + Math.floor(Math.random() * 3));
      let firstCommentId = null;
      for (const idx of commenters) {
        const text = pick(commentPool[ch.category] ?? commentPool.WALK);
        const res = await api.comment(accounts.get(idx).token, ch.id, text);
        if (!firstCommentId) firstCommentId = res.id;
        await sleep(150);
      }
      // 일부 글에 대댓글
      if (firstCommentId && Math.random() < 0.3) {
        const replier = pick(others);
        await api.comment(accounts.get(replier).token, ch.id, pick(replyPool), firstCommentId);
      }
    }
  }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
```

> **주의:** `comment` 응답의 댓글 id 필드명을 백엔드 `CommentResponse`로 확인한다(Step 6).

- [ ] **Step 4: created_at 분산 단계 추가**

`run.js`에 이어서:

```js
// 시드 계정의 checkins.created_at을 과거 SPREAD_DAYS 범위에 랜덤 분산.
// 댓글/좋아요는 해당 글 시각 이후가 되도록 글보다 0~2일 뒤로 맞춘다.
function spreadTimestamps() {
  const domain = SEED.emailDomain;
  // 1) 각 시드 체크인을 랜덤 과거 시각으로
  const sql1 = `
    UPDATE checkins c
    JOIN users u ON c.user_id = u.id
    SET c.created_at = DATE_SUB(NOW(), INTERVAL FLOOR(RAND()*${SPREAD_DAYS}*24*60) MINUTE),
        c.updated_at = c.created_at
    WHERE u.email LIKE '%@${domain}'`;
  query(sql1);

  // 2) 댓글을 글 시각 이후로 (글 시각 + 0~48시간)
  const sql2 = `
    UPDATE comments cm
    JOIN checkins c ON cm.checkin_id = c.id
    JOIN users u ON c.user_id = u.id
    SET cm.created_at = c.created_at + INTERVAL FLOOR(RAND()*48*60) MINUTE
    WHERE u.email LIKE '%@${domain}'`;
  query(sql2);

  console.log('created_at 분산 완료');
}
```

> **주의:** `comments` 테이블의 글 참조 컬럼명(`checkin_id`)과 `checkins`의 시각 컬럼(`created_at`/`updated_at`) 존재를 Step 6에서 확인한다. `updated_at`이 없으면 해당 SET 절을 제거한다.

- [ ] **Step 5: main 진입점 + 드라이런 가드 추가**

`run.js` 끝에:

```js
async function main() {
  const dry = process.argv.includes('--dry-run');
  console.log(`=== 시드 실행 ${dry ? '(DRY RUN — 가입만, 글/상호작용 생략)' : '(전체)'} ===`);

  await registerAll();
  if (dry) { console.log('DRY RUN 종료'); return; }

  await createCheckins();
  await addInteractions();
  spreadTimestamps();
  console.log('=== 시드 완료 ===');
}

main().catch(e => { console.error('실패:', e); process.exit(1); });
```

- [ ] **Step 6: 백엔드 응답 필드명·테이블 컬럼 확인 후 코드 정합**

Run:
```bash
grep -rn "record CheckinResponse" "C:/Users/Park/workspace/bloom/backend/src/main/java/com/starterkit/domain/checkin/dto/response/CheckinResponse.java" | head -1
grep -rn "record CommentResponse" "C:/Users/Park/workspace/bloom/backend/src/main/java/com/starterkit/domain/comment/dto/response/CommentResponse.java" | head -1
cd scripts/seed && node -e "import('./ssh.js').then(m => { console.log('checkins cols:'); console.log(m.query(\"SHOW COLUMNS FROM checkins\")); console.log('comments cols:'); console.log(m.query(\"SHOW COLUMNS FROM comments\")); })"
```
Expected: CheckinResponse/CommentResponse의 id 필드명, checkins·comments 테이블 컬럼명 확인. `run.js`의 `res.id`, `cm.checkin_id`, `c.created_at`/`c.updated_at`을 실제와 일치시킨다.

- [ ] **Step 7: 커밋**

```bash
git add scripts/seed/run.js
git commit -m "🌱 feat: 시드 메인 오케스트레이터 (가입·글·상호작용·시각분산)"
```

---

## Task 8: 롤백 스크립트

**Files:**
- Create: `scripts/seed/rollback.js`

- [ ] **Step 1: rollback.js 작성**

`scripts/seed/rollback.js`:

```js
// @seed.bloom 시드 데이터 일괄 삭제. 외래키 고려해 자식→부모 순.
// --dry-run: 삭제 대상 건수만 출력하고 실제 삭제 안 함.
import { query } from './ssh.js';
import { SEED } from './config.js';

const domain = SEED.emailDomain;
const userFilter = `(SELECT id FROM users WHERE email LIKE '%@${domain}')`;

const steps = [
  // 좋아요 (시드 글에 달린 것 전부 — 시드끼리만 상호작용하므로 시드 글 기준)
  { label: 'likes',     sql: `DELETE FROM likes WHERE checkin_id IN (SELECT id FROM checkins WHERE user_id IN ${userFilter})` },
  { label: 'comments',  sql: `DELETE FROM comments WHERE checkin_id IN (SELECT id FROM checkins WHERE user_id IN ${userFilter})` },
  { label: 'checkin_photos', sql: `DELETE FROM checkin_photos WHERE checkin_id IN (SELECT id FROM checkins WHERE user_id IN ${userFilter})` },
  { label: 'checkins',  sql: `DELETE FROM checkins WHERE user_id IN ${userFilter}` },
  { label: 'refresh_token', sql: `DELETE FROM refresh_token WHERE user_id IN ${userFilter}` },
  { label: 'family_member',  sql: `DELETE FROM family_member WHERE user_id IN ${userFilter}` },
  { label: 'email_verification', sql: `DELETE FROM email_verification WHERE email LIKE '%@${domain}'` },
  { label: 'users',     sql: `DELETE FROM users WHERE email LIKE '%@${domain}'` },
];

function countDryRun() {
  console.log('=== DRY RUN: 삭제 대상 건수 ===');
  const userCount = query(`SELECT COUNT(*) FROM users WHERE email LIKE '%@${domain}'`);
  console.log(`시드 사용자: ${userCount}`);
  const checkinCount = query(`SELECT COUNT(*) FROM checkins WHERE user_id IN ${userFilter}`);
  console.log(`시드 체크인: ${checkinCount}`);
  console.log('(실제 삭제는 --dry-run 없이 실행)');
}

function runDelete() {
  console.log('=== 시드 데이터 삭제 ===');
  for (const s of steps) {
    query(s.sql);
    console.log(`삭제: ${s.label}`);
  }
  console.log('=== 롤백 완료 ===');
  console.log('주의: S3 사진(checkins/{seedUserId}/)은 별도 정리 필요 (S3 콘솔 또는 aws cli)');
}

const dry = process.argv.includes('--dry-run');
(dry ? countDryRun : runDelete)();
```

> **주의:** 테이블명(`likes`, `checkin_photos`, `refresh_token`, `family_member`)은 Task 7 Step 6에서 확인한 실제 스키마와 일치시킨다. 엔티티명과 테이블명이 다를 수 있다(예: `family_member` vs `family_members`).

- [ ] **Step 2: 테이블명 실제 확인**

Run:
```bash
cd scripts/seed && node -e "import('./ssh.js').then(m => console.log(m.query(\"SHOW TABLES\")))"
```
Expected: 전체 테이블 목록. `rollback.js`의 테이블명을 실제와 일치시킨다.

- [ ] **Step 3: 드라이런 검증 (실삭제 없음)**

Run:
```bash
cd scripts/seed && npm run rollback:dry
```
Expected: `시드 사용자: 0`, `시드 체크인: 0` (아직 시딩 전이므로 0. 쿼리·필터가 정상 동작하는지 확인)

- [ ] **Step 4: 커밋**

```bash
git add scripts/seed/rollback.js
git commit -m "🌱 feat: 시드 데이터 롤백 스크립트 (드라이런 지원)"
```

---

## Task 9: README + 드라이런 가입 실증

**Files:**
- Create: `scripts/seed/README.md`

- [ ] **Step 1: README 작성**

`scripts/seed/README.md`:

```markdown
# bloom 프로덕션 시드 도구

pcgear.store 공개 피드를 시드 콘텐츠로 채우는 일회성 운영 스크립트.

## 사전 조건
- Node.js 22+
- `~/.ssh/bloom_key` (OCI 서버 SSH 키)
- `scripts/seed/photos/`에 검수 완료된 CC0 사진

## 실행
\`\`\`bash
cd scripts/seed
node run.js --dry-run   # 가입 12명만 (글·상호작용 생략) — 안전 점검용
node run.js             # 전체 시딩
\`\`\`

## 롤백
\`\`\`bash
npm run rollback:dry    # 삭제 대상 건수만 확인
npm run rollback        # @seed.bloom 데이터 전체 삭제
\`\`\`
S3 사진은 별도 정리 필요 (`checkins/{seedUserId}/`).

## 주의
- 프로덕션 DB에 직접 쓰는 도구다. 실행 전 rollback:dry로 기존 시드 상태를 확인하라.
- 모든 시드 계정은 `@seed.bloom` 도메인으로 격리된다.
```

- [ ] **Step 2: 드라이런 실증 (실제 가입 12명) — 사용자 확인 필요**

> **정지점:** 이 단계는 프로덕션에 실제 시드 계정 12개를 만든다(글·상호작용은 아직 안 함). 사용자에게 "드라이런으로 가입 12명을 실제로 생성합니다. 진행할까요?"라고 확인받은 뒤 실행한다.

Run:
```bash
cd scripts/seed && node run.js --dry-run
```
Expected: `가입 완료: 텃밭지기 ...` 12줄 출력 후 `DRY RUN 종료`.

- [ ] **Step 3: 가입 결과 DB 확인**

Run:
```bash
cd scripts/seed && node -e "import('./ssh.js').then(m => console.log('seed users:', m.query(\"SELECT COUNT(*) FROM users WHERE email LIKE '%@seed.bloom'\"), '| roles:', m.query(\"SELECT DISTINCT role FROM users WHERE email LIKE '%@seed.bloom'\")))"
```
Expected: `seed users: 12 | roles: MEMBER` (모두 MEMBER 역할이어야 공개 피드 노출됨)

- [ ] **Step 4: 커밋**

```bash
git add scripts/seed/README.md
git commit -m "🌱 docs: 시드 도구 README 및 드라이런 실증"
```

---

## Task 10: 전체 시딩 실행 + 검증

> **정지점:** 이 태스크는 프로덕션에 글 40개와 좋아요·댓글을 실제로 생성한다. 사용자 확인 후 진행한다. Task 9에서 가입한 12명이 이미 있으므로, 전체 실행 전 한 번 롤백하고 깨끗한 상태에서 전체를 돌린다.

- [ ] **Step 1: Task 9의 드라이런 가입분 롤백 (깨끗한 시작)**

Run:
```bash
cd scripts/seed && npm run rollback
```
Expected: 삭제 단계 출력 후 `롤백 완료`. 이어서 `npm run rollback:dry`로 `시드 사용자: 0` 확인.

- [ ] **Step 2: 전체 시딩 실행**

Run:
```bash
cd scripts/seed && node run.js
```
Expected: 가입 12 → 글 40 → 상호작용 → `created_at 분산 완료` → `시드 완료`. 에러 없이 종료.

- [ ] **Step 3: DB 정합성 검증**

Run:
```bash
cd scripts/seed && node -e "import('./ssh.js').then(m => { console.log('users:', m.query(\"SELECT COUNT(*) FROM users WHERE email LIKE '%@seed.bloom'\")); console.log('checkins(공개노출 isSimple=0):', m.query(\"SELECT COUNT(*) FROM checkins c JOIN users u ON c.user_id=u.id WHERE u.email LIKE '%@seed.bloom' AND c.is_simple=0\")); console.log('created_at 범위:', m.query(\"SELECT MIN(c.created_at), MAX(c.created_at) FROM checkins c JOIN users u ON c.user_id=u.id WHERE u.email LIKE '%@seed.bloom'\")); })"
```
Expected: `users: 12`, `checkins: 40`, created_at MIN이 약 3주 전 ~ MAX가 현재 근처.

- [ ] **Step 4: Playwright로 공개 피드 육안 검증**

`mcp__playwright__*`로 `https://pcgear.store` 접속 → 테스트 계정(user1@test.com / 123)으로 로그인 → 공개 피드에서:
- 시드 글이 자연스럽게 노출되는지
- 좋아요·댓글이 달려 있는지
- 작성 시각이 과거로 분산돼 보이는지
- 사진 첨부 글에서 이미지가 정상 로드되는지
- 콘솔 에러 없음 (`mcp__playwright__browser_console_messages`)

스크린샷은 `playwright_screenshot/seed-feed.png`로 저장.

- [ ] **Step 5: 최종 보고**

검증 결과를 사용자에게 보고한다. 문제가 있으면 `npm run rollback` 후 데이터 수정 → 재실행. 정상이면 시딩 완료.

---

## Self-Review 결과

- **Spec 커버리지:** 목적(Task 10 검증), 회원 12·글 40(Task 4·7·10), 인증 우회(Task 2·7), 좋아요·댓글·대댓글(Task 7), 사진 CC0+검수(Task 5·6), created_at 분산(Task 7), 롤백(Task 8) — 모두 태스크 존재.
- **외부 시스템 의존:** 백엔드 응답 필드명·테이블 스키마는 Task 6 Step 2, Task 7 Step 6, Task 8 Step 2에서 실제 확인 후 코드를 일치시키는 단계를 명시 (가정으로 두지 않음).
- **프로덕션 안전:** 실제 쓰기가 발생하는 Task 9 Step 2, Task 10은 사용자 확인 정지점으로 표시. 롤백은 항상 드라이런 먼저.
- **타입 일관성:** `accounts`(idx→token), `createdCheckins`(id·authorIdx·category), 리액션 5종·카테고리 7종 enum 철자 spec과 일치.
