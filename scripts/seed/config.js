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
