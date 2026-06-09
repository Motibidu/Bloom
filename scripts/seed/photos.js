// 로컬 사진 파일을 presigned URL로 S3에 업로드하고 objectKey를 반환.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { api } from './api.js';

const here = path.dirname(fileURLToPath(import.meta.url));

// 확장자 기반 content type 감지 (실제 파일이 PNG일 수 있음)
function contentTypeFor(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') return 'image/png';
  return 'image/jpeg';
}

// token: 업로드 주체(작성자) accessToken, filename: photos/ 안 파일명
// 반환: objectKey (체크인 생성 시 photoObjectKeys에 넣음)
export async function uploadPhoto(token, filename) {
  const contentType = contentTypeFor(filename);
  const { uploadUrl, objectKey } = await api.photoUploadUrl(token, filename, contentType);
  const bytes = await readFile(path.join(here, 'photos', filename));

  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: bytes,
  });
  if (!res.ok) {
    throw new Error(`S3 PUT 실패 ${filename}: ${res.status}`);
  }
  return objectKey;
}
