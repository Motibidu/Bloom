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
