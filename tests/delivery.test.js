import test from 'node:test';
import assert from 'node:assert/strict';
import { activeGallery, deliveryConfig, galleryAccess, handleDelivery } from '../server/delivery.js';
import { hashCode, newCode, seal, unseal, validateFile, validSignature, verifyCode } from '../server/security.js';

const secret = 'server-only-secret-for-tests-at-least-32-characters';
const id = '218ba34a-9f9e-47b1-9ec9-ee8d4a81cbf4';
const other = '0a36b08c-c31d-4329-897c-23e61fc04123';
const now = Date.now();
const gallery = { id, access_version: 'abc', expires_at: new Date(now + 60000).toISOString() };

test('generated and custom codes are salted, hashed and verified', async () => {
  const code = newCode();
  const a = await hashCode(code);
  const b = await hashCode(code);
  assert.notEqual(a, b);
  assert(!a.includes(code));
  assert(await verifyCode(code, a));
  assert.equal(await verifyCode('wrong-code', a), false);
  assert.throws(() => newCode('1234'), { status: 400 });
});

test('client session is scoped to one gallery and one access version', () => {
  const token = seal(secret, { kind: 'gallery', id, version: 'abc', exp: now + 10000 });
  galleryAccess(secret, token, gallery, now);
  assert.throws(() => galleryAccess(secret, token, { ...gallery, id: other }, now), { status: 401 });
  assert.throws(() => galleryAccess(secret, token, { ...gallery, access_version: 'changed' }, now), { status: 401 });
  assert.equal(unseal(secret, token + 'x', now), null);
  assert.equal(unseal(secret, token, now + 10000), null);
});

test('expired, deleted and disabled galleries refuse access', () => {
  assert.throws(() => activeGallery({ ...gallery, expires_at: new Date(now).toISOString() }, now), { status: 410 });
  assert.throws(() => activeGallery({ ...gallery, disabled_at: 'today' }, now), { status: 410 });
  assert.throws(() => activeGallery({ ...gallery, deleting_at: 'today' }, now), { status: 404 });
});

test('files require a supported extension, MIME, size and matching signature', () => {
  const file = { name: 'photo.jpg', mime: 'image/jpeg', size: 10 };
  assert.deepEqual(validateFile(file, 100), file);
  for (const changes of [{ name: '../photo.jpg' }, { mime: 'image/svg+xml' }, { name: 'photo.png' }, { size: 101 }]) {
    assert.throws(() => validateFile({ ...file, ...changes }, 100), { status: 400 });
  }
  assert(validSignature(Buffer.from([255, 216, 255, 224]), 'image/jpeg'));
  assert(validSignature(Buffer.from('....ftypisom'), 'video/mp4'));
  assert(!validSignature(Buffer.from('....ftypheic'), 'video/mp4'));
  assert(!validSignature(Buffer.from('<html>'), 'image/jpeg'));
});

test('missing service configuration fails closed', async () => {
  assert.throws(() => deliveryConfig({}), { status: 503 });
  const response = await handleDelivery(new Request('http://localhost/api/delivery'), {}, {});
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});
