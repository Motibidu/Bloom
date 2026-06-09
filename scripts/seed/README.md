# bloom 프로덕션 시드 도구

pcgear.store 공개 피드를 시드 콘텐츠로 채우는 일회성 운영 스크립트.

## 사전 조건

- Node.js 22+
- `~/.ssh/bloom_key` (OCI 서버 SSH 키)
- `scripts/seed/photos/`에 검수 완료된 사진 파일

## 실행

```bash
cd scripts/seed
node run.js --dry-run   # 가입 12명만 (글·상호작용 생략) — 안전 점검용
node run.js             # 전체 시딩
```

## 롤백

```bash
npm run rollback:dry    # 삭제 대상 건수만 확인
npm run rollback        # @seed.bloom 데이터 전체 삭제
```

S3 사진은 별도 정리 필요 (`checkins/{seedUserId}/`).

## 주의

- 프로덕션 DB에 직접 쓰는 도구다. 실행 전 `rollback:dry`로 기존 시드 상태를 확인하라.
- 모든 시드 계정은 `@seed.bloom` 도메인으로 격리된다.
- 재실행 전 반드시 `npm run rollback`으로 이전 데이터를 정리하라.
