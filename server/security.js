import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const derive = promisify(scrypt);
export const uuid = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/;
const codePattern = /^[a-zA-Z0-9-]{8,64}$/;

export class DeliveryError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function fail(status, message) {
  throw new DeliveryError(status, message);
}

export const fingerprint = (secret, value) => createHmac('sha256', secret).update(value).digest('base64url');

export function newCode(value) {
  const code = value || randomBytes(9).toString('base64url').replaceAll('_', '-');
  if (typeof code !== 'string' || !codePattern.test(code)) {
    fail(400, 'Le code doit contenir 8 à 64 lettres, chiffres ou tirets.');
  }
  return code;
}

export async function hashCode(code) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${(await derive(code, salt, 64)).toString('hex')}`;
}

export async function verifyCode(code, stored) {
  if (typeof code !== 'string' || !codePattern.test(code)) return false;
  const [salt, key] = stored.split(':');
  return timingSafeEqual(await derive(code, salt, 64), Buffer.from(key, 'hex'));
}

export function seal(secret, value) {
  const payload = Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${payload}.${fingerprint(secret, payload)}`;
}

export function unseal(secret, token, now = Date.now()) {
  if (!token || token.length > 3800) return null;
  const [payload, signature, extra] = token.split('.');
  const expected = fingerprint(secret, payload);
  if (!signature || extra !== undefined || signature.length !== expected.length ||
    !/^[\w-]+$/.test(signature) ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.exp > now ? data : null;
  } catch {
    return null;
  }
}

export const formats = {
  'image/jpeg': /\.jpe?g$/i,
  'image/png': /\.png$/i,
  'image/webp': /\.webp$/i,
  'video/mp4': /\.mp4$/i,
  'video/webm': /\.webm$/i,
};

export function validateFile(input, maxBytes) {
  const { name, mime, size } = input;
  if (typeof name !== 'string' || !name.trim() || name.length > 180 || /[\x00-\x1f\x7f/\\]/.test(name) ||
    !Object.hasOwn(formats, mime) || !formats[mime].test(name)) {
    fail(400, 'Formats acceptés : JPG, PNG, WebP, MP4 et WebM.');
  }
  if (!Number.isSafeInteger(size) || size < 1 || size > maxBytes) {
    fail(400, `Chaque fichier doit peser au maximum ${Math.floor(maxBytes / 1048576)} Mio.`);
  }
  return { name, mime, size };
}

export function validSignature(bytes, mime) {
  const text = bytes.toString('latin1');
  switch (mime) {
    case 'image/jpeg': return text.startsWith('\xff\xd8\xff');
    case 'image/png': return text.startsWith('\x89PNG\r\n\x1a\n');
    case 'image/webp': return text.startsWith('RIFF') && text.slice(8, 12) === 'WEBP';
    case 'video/mp4': return text.slice(4, 8) === 'ftyp' && /^(isom|iso[2-9]|mp4[12]|avc1|dash|M4V |MSNV)/.test(text.slice(8, 12));
    case 'video/webm': return text.startsWith('\x1a\x45\xdf\xa3') && text.includes('webm');
    default: return false;
  }
}
