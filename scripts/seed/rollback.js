// @seed.bloom 시드 데이터 일괄 삭제. 외래키 고려해 자식→부모 순.
// --dry-run: 삭제 대상 건수만 출력하고 실제 삭제 안 함.
import { query } from './ssh.js';
import { SEED } from './config.js';

const domain = SEED.emailDomain;
const userFilter = `(SELECT id FROM users WHERE email LIKE '%@${domain}')`;

const steps = [
  { label: 'likes',              sql: `DELETE FROM likes WHERE checkin_id IN (SELECT id FROM checkins WHERE user_id IN ${userFilter})` },
  { label: 'comments',           sql: `DELETE FROM comments WHERE checkin_id IN (SELECT id FROM checkins WHERE user_id IN ${userFilter})` },
  { label: 'checkin_photos',     sql: `DELETE FROM checkin_photos WHERE checkin_id IN (SELECT id FROM checkins WHERE user_id IN ${userFilter})` },
  { label: 'checkins',           sql: `DELETE FROM checkins WHERE user_id IN ${userFilter}` },
  { label: 'refresh_tokens',     sql: `DELETE FROM refresh_tokens WHERE user_id IN ${userFilter}` },
  { label: 'family_members',     sql: `DELETE FROM family_members WHERE user_id IN ${userFilter}` },
  { label: 'email_verifications', sql: `DELETE FROM email_verifications WHERE email LIKE '%@${domain}'` },
  { label: 'users',              sql: `DELETE FROM users WHERE email LIKE '%@${domain}'` },
];

function countDryRun() {
  console.log('=== DRY RUN: 삭제 대상 건수 ===');
  const userCount = query(`SELECT COUNT(*) FROM users WHERE email LIKE '%@${domain}'`);
  console.log(`시드 사용자: ${userCount}`);
  const checkinCount = query(`SELECT COUNT(*) FROM checkins WHERE user_id IN ${userFilter}`);
  console.log(`시드 체크인: ${checkinCount}`);
  const commentCount = query(`SELECT COUNT(*) FROM comments WHERE checkin_id IN (SELECT id FROM checkins WHERE user_id IN ${userFilter})`);
  console.log(`시드 댓글: ${commentCount}`);
  const likeCount = query(`SELECT COUNT(*) FROM likes WHERE checkin_id IN (SELECT id FROM checkins WHERE user_id IN ${userFilter})`);
  console.log(`시드 좋아요: ${likeCount}`);
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
