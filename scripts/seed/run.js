// 시드 전체 실행: 가입 → 글 작성 → 좋아요·댓글 → created_at 분산.
import { personas, emailFor, checkins, commentPool, replyPool } from './data.js';
import { api } from './api.js';
import { query, fetchVerificationCode } from './ssh.js';
import { uploadPhoto } from './photos.js';
import { SEED, SPREAD_DAYS } from './config.js';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// idx → { token } 매핑
const accounts = new Map();

async function registerAll() {
  for (const p of personas) {
    const email = emailFor(p.idx);
    console.log(`\n[가입] ${p.nickname} (${email})`);

    await api.sendEmailCode(email);
    await sleep(800);

    const code = fetchVerificationCode(email);
    if (!code) throw new Error(`코드 조회 실패: ${email}`);
    console.log(`  코드: ${code}`);

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
    console.log(`  완료 ✓`);
    await sleep(300);
  }
}

// checkin 데이터 → 생성된 checkinId 매핑
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
    console.log(`  글 작성: [${c.category}] ${c.title} (id=${res.id})`);
    await sleep(200);
  }
}

const REACTIONS = ['LIKE', 'DELICIOUS', 'GREAT', 'ENVIOUS', 'WELL_DONE'];

function reactionFor(cat) {
  if (cat === 'COOKING') return pick(['DELICIOUS', 'LIKE', 'WELL_DONE']);
  if (cat === 'EXERCISE') return pick(['WELL_DONE', 'GREAT', 'LIKE']);
  if (cat === 'GARDENING') return pick(['ENVIOUS', 'GREAT', 'LIKE']);
  return pick(REACTIONS);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function addInteractions() {
  const allIdx = personas.map(p => p.idx);
  for (const ch of createdCheckins) {
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
        await sleep(150);
      }
    }
  }
}

// 시드 계정의 checkins.created_at을 과거 SPREAD_DAYS 범위에 랜덤 분산.
// updated_at 컬럼 없음 확인됨 — SET 절에서 제외.
function spreadTimestamps() {
  const domain = SEED.emailDomain;

  const sql1 = `
    UPDATE checkins c
    JOIN users u ON c.user_id = u.id
    SET c.created_at = DATE_SUB(NOW(), INTERVAL FLOOR(RAND()*${SPREAD_DAYS}*24*60) MINUTE)
    WHERE u.email LIKE '%@${domain}'`;
  query(sql1);

  // 댓글을 글 시각 이후로 (글 시각 + 0~48시간)
  const sql2 = `
    UPDATE comments cm
    JOIN checkins c ON cm.checkin_id = c.id
    JOIN users u ON c.user_id = u.id
    SET cm.created_at = c.created_at + INTERVAL FLOOR(RAND()*48*60) MINUTE
    WHERE u.email LIKE '%@${domain}'`;
  query(sql2);

  console.log('created_at 분산 완료');
}

async function main() {
  const dry = process.argv.includes('--dry-run');
  console.log(`=== 시드 실행 ${dry ? '(DRY RUN — 가입만, 글/상호작용 생략)' : '(전체)'} ===`);

  await registerAll();
  if (dry) { console.log('\nDRY RUN 종료'); return; }

  console.log('\n=== 글 작성 ===');
  await createCheckins();

  console.log('\n=== 좋아요·댓글 ===');
  await addInteractions();

  spreadTimestamps();
  console.log('=== 시드 완료 ===');
}

main().catch(e => { console.error('실패:', e); process.exit(1); });
