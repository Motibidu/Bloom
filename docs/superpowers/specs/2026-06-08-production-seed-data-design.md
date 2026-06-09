# 프로덕션 시드 데이터 설계

작성일: 2026-06-08
상태: 승인됨

## 목적

`pcgear.store`(프로덕션)의 공개 피드를 "진짜 사용자가 꾸준히 써온 것처럼" 보이는 활성 콘텐츠로 채운다. 실사용자가 첫 진입 시 휑한 피드를 보고 이탈하는 것을 방지하는 것이 목표다.

시드 계정은 실사용자가 가짜인지 구분할 수 없어야 한다(구분 불가 수준).

## 범위

- 회원 12명
- 활동 기록(체크인) 약 40개
- 시드 계정 간 좋아요(리액션)·댓글·대댓글
- 일부 글에 CC0 사진 첨부

비범위(하지 않음):
- 프로덕션 백엔드 코드 수정
- 매일 자동으로 글을 추가하는 크론/스케줄러 (일회성 대량 투입으로 충분)
- 팔로우 관계 시딩 (이번 범위 밖)

## 핵심 사실 (코드 검증 완료)

1. **공개 피드 쿼리는 날짜 필터가 없다.** `CheckinRepository.findAllByCursorOrderByIdDesc`(90번 줄)는 `WHERE c.isSimple = false`만 걸고 ID 역순으로 전체를 반환한다. 따라서 글을 한 번에 만들어도 계속 노출되며, created_at을 과거로 분산해도 노출에 지장 없다.
2. **간편 기록은 공개 피드에서 자동 제외된다.** 위 쿼리의 `isSimple = false` 조건 때문. 시드 글은 모두 `isSimple:false`(상세 기록)로 만든다.
3. **사진은 공개 피드 노출의 필수 조건이 아니다.** 피드 쿼리는 사진 유무로 필터링하지 않는다.
4. **가입은 이메일 인증을 먼저 통과해야 한다.** `AuthService.register`(105번 줄)가 `emailVerificationService.isVerified(email)`을 강제한다. 인증 코드는 `email_verification` 테이블에 저장되므로, 실제 메일 수신 없이 DB에서 코드를 직접 조회해 우회할 수 있다.
5. **공개 피드 노출 자격은 birthYear ≤ 1976(MEMBER).** 시드 계정은 모두 1955~1973년생으로 둔다.
6. **프로덕션 접근 검증됨.** `ssh -i ~/.ssh/bloom_key ubuntu@129.154.59.53` 접속 성공. `bloom-mysql-1` 컨테이너에서 `bloom_prod` 쿼리 가능. 현재 프로덕션은 회원 3명·체크인 2개로 거의 비어 있음.

## 접근 방식

로컬 PC에서 Node 스크립트를 실행한다. HTTP 호출은 `https://pcgear.store/api`로, 인증 코드 조회는 매 계정마다 SSH로 프로덕션 DB에서 가져온다. 프로덕션 코드를 전혀 수정하지 않으며, 모든 가짜 데이터는 명확한 이메일 패턴으로 격리되어 SQL 한 번으로 롤백된다.

대안으로 검토했으나 채택하지 않은 방식:
- 서버에서 직접 스크립트 실행 → 서버 오염, 실행환경 준비 부담
- 백엔드에 임시 시드 엔드포인트 추가 → 프로덕션에 위험한 엔드포인트 배포, 미삭제 시 보안 구멍

## 구성 요소

| 파일 | 역할 |
|------|------|
| `scripts/seed/run.js` | 메인 오케스트레이터. 가입→글 작성→상호작용→시각 분산 순서 실행 |
| `scripts/seed/data.js` | 콘텐츠 데이터. 12명 페르소나, 40개 글, 댓글 풀. 코드와 분리 |
| `scripts/seed/ssh.js` | SSH로 프로덕션 DB 쿼리하는 헬퍼 (인증코드 조회, created_at UPDATE) |
| `scripts/seed/rollback.js` | 이메일 패턴으로 시드 데이터 일괄 삭제 |
| `scripts/seed/photos/` | CC0 사진 보관 폴더. 검수 통과분만 사용 |

## 데이터 흐름

### 1. 계정 생성 (계정당, 12회 반복)

```
POST https://pcgear.store/api/auth/email/send   { email: "seedNN@seed.bloom" }
ssh ubuntu@129.154.59.53 "docker exec bloom-mysql-1 mysql ...
   SELECT code FROM email_verification WHERE email='seedNN@seed.bloom' ORDER BY created_at DESC LIMIT 1"
POST /api/auth/email/verify   { email, code }
POST /api/auth/register   { email, password, nickname, name, birthYear, birthMonth, birthDay }
   → accessToken 저장 (메모리)
```

### 2. 글 작성 (글당, 약 40회)

```
(사진 있는 글만)
  POST /api/checkins/photo-upload-url   { filename, contentType: "image/jpeg" }
     → presigned PUT URL + objectKey
  PUT <presigned URL>   ← 이미지 바이트 업로드 (S3 직행)
POST /api/checkins   { category, title, description, photoObjectKeys?, isSimple:false }   (작성자 토큰)
```

### 3. 상호작용

```
좋아요: POST /api/checkins/{id}/likes   { reactionType }   (다른 시드 계정 토큰)
댓글:   POST /api/checkins/{id}/comments   { content, commentType: "TEXT", parentId? }   (다른 시드 계정 토큰)
```

규칙: 자기 글에는 좋아요·댓글을 달지 않는다. 글당 좋아요 1~6개, 글 절반 정도에 댓글 1~3개, 일부에 대댓글.

### 4. 작성 시각 분산 (마지막, SSH)

```
ssh로 시드 계정의 checkins.created_at을 과거 2~3주 범위에 랜덤 분산 UPDATE
(comments.created_at도 해당 글 시각 이후로 맞춤)
```

## API 명세 (코드 검증 완료)

| 동작 | 메서드 + 경로 | Body | 비고 |
|------|--------------|------|------|
| 이메일 코드 발송 | `POST /api/auth/email/send` | `{ email }` | 코드는 DB 저장됨 |
| 이메일 코드 검증 | `POST /api/auth/email/verify` | `{ email, code }` | |
| 회원가입 | `POST /api/auth/register` | `{ email, password, nickname, name, birthYear, birthMonth, birthDay }` | birthYear ≤ 1976 → MEMBER |
| 사진 업로드 URL | `POST /api/checkins/photo-upload-url` | `{ filename, contentType }` | JPEG/PNG만, 5분 유효 |
| 체크인 생성 | `POST /api/checkins` | `{ category, title, description, photoObjectKeys?, isSimple:false }` | 제목≤30, 본문≤300, 사진 최대 3 |
| 리액션 | `POST /api/checkins/{id}/likes` | `{ reactionType }` | 토글 방식. 중복 호출 시 취소 주의 |
| 댓글 | `POST /api/checkins/{id}/comments` | `{ content, commentType:"TEXT", parentId? }` | content≤200 |

**카테고리:** `WALK, COOKING, READING, GARDENING, EXERCISE, MEETING, OTHER`
**리액션 타입:** `LIKE`(👍), `DELICIOUS`(😋 맛있겠다), `GREAT`(✨ 대단해요), `ENVIOUS`(😍 부러워요), `WELL_DONE`(👏 잘했어요)

## 콘텐츠 & 페르소나

**톤 레퍼런스:** 네이버 카페 "소소한 일상과 행복" 게시글 7건 참고. 특징:
- 담백한 일상 공유, 자랑이 아닌 나눔·감상 위주
- 어미: `~네요`, `~어요`, `~ㅎㅎ`, `~^^`, 말줄임표(`…`), 물음표 자주 사용
- 짧은 호흡으로 줄바꿈
- 메뉴·장소 등 실용 정보를 곁들임

**페르소나 12명:**
- 생년 1955~1973 분산 (모두 MEMBER 자격)
- 이메일 `seedNN@seed.bloom` (롤백 식별용)
- 닉네임은 자연·식물 키워드형/한자성어형/실명형 혼합 (예: 텃밭지기, 새옹지마, 장미여사)
- 각자 주력 카테고리가 있되 가끔 다른 활동도 섞음

**글 40개:**
- 6개 주요 카테고리(WALK·COOKING·READING·GARDENING·EXERCISE·MEETING) 골고루
- 인당 2~5개
- 제목≤30자, 본문≤300자

## 사진 (CC0)

- 출처 표시 불필요한 **CC0 사진만** 사용 (시드 글에 출처 표기 없이 붙이기 위함, 라이선스 위반 회피)
- Claude가 픽사베이/펙셀스 등에서 카테고리별로 수집 → `scripts/seed/photos/`에 저장 (파일명에 카테고리 표기)
- 사용자가 폴더를 열어 부적절한 것 삭제 (최종 검수)
- 검수 통과분만 사용. 글당 1~3장, 일부 글에만 (모든 글에 사진이 있으면 오히려 부자연스러움)
- 스크린샷이 아닌 원본 다운로드 (화질·UI 혼입 방지)

## 안전장치 & 롤백

- 모든 시드 계정 이메일: `seedNN@seed.bloom` 패턴
- `rollback.js`가 이 패턴으로 user_id를 찾아 연관 데이터를 역순 삭제:
  - S3 사진 객체 (`checkins/{seed_user_id}/`)
  - checkins, checkin_photos, likes, comments, refresh_token, family_member, email_verification
  - 마지막에 users
- 외래키 제약을 고려해 자식 → 부모 순으로 삭제

## 검증 방법

1. 시딩 후 `https://pcgear.store` 로그인 → 공개 피드에 시드 글이 자연스럽게 노출되는지 확인
2. 글에 좋아요·댓글이 달려 있는지, 작성 시각이 과거로 분산됐는지 확인
3. 간편 기록이 없으니 모든 시드 글이 공개 피드에 떠야 함
4. 사진 첨부 글에서 이미지가 정상 로드되는지 확인
5. `rollback.js` 드라이런으로 삭제 대상이 정확히 시드 계정만 잡히는지 확인 (실삭제 전)
