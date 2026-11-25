import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { createDeliveryHandler, deliveryConfig } from '../server/delivery.js';

const requested = process.env.DELIVERY_INTEGRATION === '1';

test('real local Supabase: authentication, uploads, signed downloads and isolation', { skip: !requested }, async (t) => {
  const config = deliveryConfig(process.env);
  assert.match(config.url, /^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
  const db = createClient(config.url, config.serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const handler = createDeliveryHandler(config);
  const prefix = randomUUID();
  const email = `test-${prefix}@example.com`;
  const password = randomUUID();
  const { data: { user }, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  assert.equal(error, null);
  t.after(async () => { await db.auth.admin.deleteUser(user.id); });

  const ip = prefix;
  const endpoint = 'http://127.0.0.1:5173/api/delivery';
  async function call(action, params = {}, cookie = '', expected = 200, origin = 'http://127.0.0.1:5173') {
    const response = await handler(new Request(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json', origin, cookie },
      body: JSON.stringify({ ...params, action }),
    }), { ip });
    const data = await response.json();
    assert.equal(response.status, expected, `${action}: ${data.error ?? 'unexpected status'}`);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    return { data, cookie: response.headers.get('set-cookie')?.split(';')[0] };
  }

  await call('list', {}, '', 401);
  await call('login', { email, password }, '', 403, 'http://example.org');
  await call('login', { email, password }, '', 401);
  assert.equal((await db.from('delivery_admins').insert({ user_id: user.id })).error, null);
  await call('login', { email, password: 'invalid123' }, '', 401);
  const { cookie: admin } = await call('login', { email, password });
  assert.match(admin, /^studio_admin=/);
  const fields = { client_name: 'Famille fictive', title: `Séance ${prefix}`, message: 'Votre séance',
    session_date: '2026-11-25', expires_at: new Date(Date.now() + 3600000).toISOString(), code: 'Galerie-123' };
  const ids = [];
  t.after(async () => {
    for (const id of ids) {
      const { data } = await db.from('delivery_files').select('id').eq('gallery_id', id);
      if (data?.length) await db.storage.from('delivery-private').remove(data.map((f) => `${id}/${f.id}`));
      await db.from('delivery_galleries').delete().eq('id', id);
    }
  });
  const { data: { gallery: primary, code } } = await call('create', fields, admin);
  ids.push(primary.id);
  const { data: { gallery: secondary } } = await call('create', { ...fields, title: 'Autre galerie' }, admin);
  ids.push(secondary.id);
  const { data: list } = await call('list', { query: prefix, page: 0 }, admin);
  assert.equal(list.galleries.length, 1);
  assert(!JSON.stringify(list).includes('code_hash'));
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lOUAAAAASUVORK5CYII=', 'base64');
  const metadata = { name: 'photo.png', mime: 'image/png', size: png.length };
  await call('reserve', { id: primary.id, ...metadata, mime: 'image/svg+xml' }, admin, 400);
  const { data: slot } = await call('reserve', { id: primary.id, ...metadata }, admin);
  const headers = { Authorization: `Bearer ${slot.token}`, apikey: slot.key, 'Content-Type': metadata.mime, 'Cache-Control': 'no-store' };
  const anonymous = await fetch(slot.target, { method: 'POST', headers: { apikey: slot.key, 'Content-Type': metadata.mime }, body: png });
  assert(!anonymous.ok);
  const outside = await fetch(slot.target.replace(slot.file.id, randomUUID()), { method: 'POST', headers, body: png });
  assert(!outside.ok);
  const upload = await fetch(slot.target, { method: 'POST', headers, body: png });
  assert(upload.ok, `storage upload returned ${upload.status}: ${await upload.text()}`);
  const pendingDownload = await fetch(slot.target.replace('/object/', '/object/public/'));
  assert(!pendingDownload.ok);
  await call('finalize', { id: primary.id, file: slot.file.id }, admin);
  const bad = Buffer.from('<html>not a PNG</html>');
  const { data: invalid } = await call('reserve', { id: primary.id, ...metadata, size: bad.length }, admin);
  assert((await fetch(invalid.target, { method: 'POST', headers, body: bad })).ok);
  await call('finalize', { id: primary.id, file: invalid.file.id }, admin, 422);
  await call('remove', { id: primary.id, file: invalid.file.id }, admin);

  const raw = await fetch(slot.target);
  assert(!raw.ok);
  const asAdmin = await fetch(slot.target, { headers });
  assert(!asAdmin.ok);
  await call('view', { id: primary.id }, '', 401);
  await call('unlock', { id: primary.id, code: 'wrong-code' }, '', 401);
  const { data: view, cookie: access } = await call('unlock', { id: primary.id, code });
  assert.equal(view.files.length, 1);
  assert(!Object.hasOwn(view.gallery, 'client_name'));
  await call('view', { id: secondary.id }, access, 401);
  const { cookie: otherAccess } = await call('unlock', { id: secondary.id, code });
  await call('media', { id: secondary.id, file: slot.file.id }, otherAccess, 404);
  await call('media', { id: primary.id, file: slot.file.id, download: true }, '', 401);
  const { data: media } = await call('media', { id: primary.id, file: slot.file.id, download: true }, access);
  const response = await fetch(media.url);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-disposition'), /attachment/i);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), png);
  const { data: pack } = await call('zip', { id: primary.id }, access);
  assert.equal(pack.files.length, 1);
  await call('update', { ...fields, id: primary.id, code: '', regenerate: true }, admin);
  await call('view', { id: primary.id }, access, 401);
  await call('update', { ...fields, id: primary.id, code: '', disabled: true }, admin);
  await call('view', { id: primary.id }, access, 410);
  await call('update', { ...fields, id: secondary.id, code: '', expires_at: new Date(0).toISOString() }, admin);
  await call('view', { id: secondary.id }, otherAccess, 410);
  for (let attempt = 0; attempt < 7; attempt++) {
    await call('unlock', { id: secondary.id, code }, '', 410);
  }
  await call('unlock', { id: secondary.id, code }, '', 429);
  await call('remove', { id: primary.id, file: slot.file.id }, admin);
  const absent = await db.storage.from('delivery-private').exists(`${primary.id}/${slot.file.id}`);
  assert.equal(absent.data, false);
  await call('purge', { id: primary.id }, admin);
  await call('view', { id: primary.id }, access, 404);
  assert.match((await call('logout', {}, admin)).cookie, /^studio_admin=$/);
});
