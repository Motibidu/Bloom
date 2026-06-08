import { execFileSync } from 'node:child_process';
import { SSH } from './config.js';

// 단일 SQL 실행. -N(헤더 없음) -B(탭 구분) 결과를 문자열로 반환.
export function query(sql) {
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
  const sql = `SELECT code FROM email_verifications WHERE email='${email}' ` +
    `ORDER BY created_at DESC LIMIT 1`;
  const code = query(sql);
  return code || null;
}
