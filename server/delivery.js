import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { DeliveryError, fail, fingerprint, hashCode, newCode, seal, unseal, uuid, validateFile, validSignature, verifyCode } from './security.js';

const bucket = 'delivery-private';
const MiB = 1048576;
const zipLimit = 100 * MiB;
const signedTTL = 120;
const galleryFields = 'id,client_name,title,session_date,message,expires_at,disabled_at,deleting_at,created_at';
const fileFields = 'id,name,mime,size,state,created_at';

export function deliveryConfig(env) {
  const { SUPABASE_URL: url, SUPABASE_ANON_KEY: anonKey, SUPABASE_SERVICE_ROLE_KEY: serviceKey,
    DELIVERY_SESSION_SECRET: secret } = env;
  if (!url || !anonKey || !serviceKey || !secret || secret.length < 32) {
    fail(503, 'L’espace galeries est en cours de configuration.');
  }
  function positive(value, fallback, maximum = Number.MAX_SAFE_INTEGER) {
    const number = Number(value || fallback);
    if (!Number.isSafeInteger(number) || number < 1 || number > maximum) {
      fail(503, 'Les limites de l’espace galeries doivent être vérifiées.');
    }
    return number;
  }
  return {
    url: new URL(url).origin, anonKey, serviceKey, secret,
    maxBytes: positive(env.DELIVERY_MAX_FILE_MB, 50, 500) * MiB,
    retentionDays: positive(env.DELIVERY_RETENTION_DAYS, 30, 3650),
    quotaBytes: env.DELIVERY_STORAGE_QUOTA_MB ? positive(env.DELIVERY_STORAGE_QUOTA_MB) * MiB : null,
  };
}

function result({ data, error }) {
  if (error) throw new Error('Delivery provider operation failed');
  return data;
}

function requiredId(value) {
  if (typeof value !== 'string' || !uuid.test(value)) fail(404, 'Galerie ou fichier introuvable.');
  return value;
}

function textField(value, label, max, optional = false) {
  if (typeof value !== 'string' || value.length > max || (!optional && !value.trim())) {
    fail(400, `Vérifiez le champ « ${label} ».`);
  }
  return value.trim();
}

function dateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) fail(400, 'Indiquez une date de séance valide.');
  const date = new Date(value);
  if (!Number.isFinite(+date) || date.toISOString().slice(0, 10) !== value) fail(400, 'Indiquez une date de séance valide.');
  return value;
}

function galleryInput(input, mustBeFuture = true) {
  const expires = new Date(input.expires_at);
  if (typeof input.expires_at !== 'string' || !Number.isFinite(+expires) || (mustBeFuture && +expires <= Date.now())) {
    fail(400, 'Choisissez une date d’expiration future.');
  }
  return {
    client_name: textField(input.client_name, 'Client', 120),
    title: textField(input.title, 'Titre', 140),
    session_date: dateOnly(input.session_date),
    expires_at: expires.toISOString(),
    message: textField(input.message ?? '', 'Message', 1800, true),
  };
}

export function activeGallery(gallery, now = Date.now()) {
  if (!gallery || gallery.deleting_at) fail(404, 'Cette galerie est introuvable.');
  if (gallery.disabled_at) fail(410, 'Cette galerie a été désactivée.');
  if (Date.parse(gallery.expires_at) <= now) fail(410, 'Cette galerie a expiré.');
}

export function galleryAccess(secret, token, gallery, now = Date.now()) {
  activeGallery(gallery, now);
  const data = unseal(secret, token, now);
  if (data?.kind !== 'gallery' || data.id !== gallery.id || data.version !== gallery.access_version) {
    fail(401, 'Saisissez le code d’accès de cette galerie.');
  }
}

function publicGallery({ title, session_date, expires_at, message }) {
  return { title, session_date, expires_at, message };
}

const objectPath = (file) => `${file.gallery_id}/${file.id}`;
const cookieName = (galleryId) => `gallery_${galleryId.replaceAll('-', '')}`;
const authOptions = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };

export function createDeliveryHandler(config, dependencies = {}) {
  const db = dependencies.db ?? createClient(config.url, config.serviceKey, { auth: authOptions });
  const auth = () => (dependencies.auth ?? createClient(config.url, config.anonKey, { auth: authOptions })).auth;
  const storage = db.storage.from(bucket);
  const galleries = () => db.from('delivery_galleries');
  const files = () => db.from('delivery_files');

  async function getGallery(id) {
    return result(await galleries().select(`${galleryFields},access_version,code_hash`).eq('id', id).maybeSingle());
  }

  async function getFile(galleryId, fileId, ready = false) {
    const file = result(await files().select('*').eq('gallery_id', galleryId).eq('id', requiredId(fileId)).maybeSingle());
    if (!file || (ready && file.state !== 'ready')) fail(404, 'Ce fichier est introuvable.');
    return file;
  }

  async function listFiles(id, onlyReady) {
    let query = files().select(fileFields).eq('gallery_id', id).order('created_at').order('id');
    if (onlyReady) query = query.eq('state', 'ready');
    return result(await query);
  }

  async function admitted(userId) {
    return Boolean(result(await db.from('delivery_admins').select('user_id').eq('user_id', userId).maybeSingle()));
  }

  async function rate(key, maximum, seconds) {
    const attempts = result(await db.rpc('delivery_attempt', {
      attempt_scope: fingerprint(config.secret, key), window_seconds: seconds,
    }));
    if (attempts > maximum) fail(429, 'Trop de tentatives. Réessayez dans quelques minutes.');
  }

  function responseCookie(request, name, value, seconds) {
    const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
    return `${name}=${value}; Path=/api/delivery; HttpOnly; SameSite=Strict; Max-Age=${seconds}${secure}`;
  }

  function readCookie(request, name) {
    return request.headers.get('cookie')?.split(';').map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
  }

  async function admin(request) {
    const token = readCookie(request, 'studio_admin');
    if (!token) fail(401, 'Connectez-vous à l’administration.');
    const { data, error } = await auth().getUser(token);
    if (error || !data.user || !await admitted(data.user.id)) fail(401, 'Votre session a expiré ou votre accès a été retiré.');
    return token;
  }

  async function signFile(file, download, seconds = signedTTL) {
    const data = result(await storage.createSignedUrl(objectPath(file), seconds,
      download ? { download: file.name } : undefined));
    return data.signedUrl;
  }

  async function verifyObject(file) {
    const path = objectPath(file);
    const { data, error } = await storage.info(path);
    if (error && ['404', 'not_found', 'NoSuchKey'].includes(String(error.status ?? error.statusCode ?? error.code))) {
      fail(409, 'Le fichier est encore absent du stockage. Relancez le téléversement.');
    }
    if (error || !data) throw new Error('Storage information unavailable');
    if (Number(data.size) !== file.size || data.contentType !== file.mime) {
      fail(422, 'La taille ou le type reçu ne correspond pas au fichier annoncé. Supprimez ce fichier puis réessayez.');
    }
    const url = await signFile(file, false, 30);
    const response = await (dependencies.fetch ?? fetch)(url, { headers: { Range: 'bytes=0-511' } });
    if (!response.ok || !response.body) throw new Error('Storage verification unavailable');
    const reader = response.body.getReader();
    let prefix = Buffer.alloc(0);
    try {
      while (prefix.length < 512) {
        const { done, value } = await reader.read();
        if (done) break;
        prefix = Buffer.concat([prefix, Buffer.from(value.subarray(0, 512 - prefix.length))]);
      }
    } finally {
      await reader.cancel().catch(() => {});
    }
    if (!validSignature(prefix, file.mime)) fail(422, 'Le contenu du fichier ne correspond pas au format annoncé.');
  }

  function remainingTTL(gallery) {
    const seconds = Math.floor((Date.parse(gallery.expires_at) - Date.now()) / 1000);
    if (seconds < 1) fail(410, 'Cette galerie a expiré.');
    return Math.min(signedTTL, seconds);
  }

  async function clientAction(input, request, ip, setCookie) {
    const id = requiredId(input.id);
    if (input.action === 'unlock') {
      await rate(`gallery:ip:${ip}`, 30, 900);
      await rate(`gallery:${id}:${ip}`, 8, 900);
      await rate(`gallery:${id}`, 90, 900);
    }
    const gallery = await getGallery(id);
    activeGallery(gallery);
    if (input.action === 'unlock') {
      if (!await verifyCode(input.code, gallery.code_hash)) fail(401, 'Le code d’accès est incorrect.');
      const exp = Math.min(Date.now() + 8 * 3600000, Date.parse(gallery.expires_at));
      const token = seal(config.secret, { id, version: gallery.access_version, kind: 'gallery', exp });
      setCookie(responseCookie(request, cookieName(id), token, Math.max(1, Math.floor((exp - Date.now()) / 1000))));
    } else {
      galleryAccess(config.secret, readCookie(request, cookieName(id)), gallery);
    }
    if (input.action === 'media') {
      const file = await getFile(id, input.file, true);
      return { url: await signFile(file, input.download === true, remainingTTL(gallery)) };
    }
    if (input.action === 'zip') {
      const fileList = await listFiles(id, true);
      if (!fileList.length || fileList.reduce((sum, file) => sum + file.size, 0) > zipLimit) {
        fail(422, 'Le ZIP est réservé aux galeries de 100 Mio maximum. Téléchargez les fichiers individuellement.');
      }
      return { files: fileList };
    }
    return { gallery: publicGallery(gallery), files: await listFiles(id, true), zipLimit };
  }

  async function adminAction(input, token) {
    if (input.action === 'list') {
      const page = Number(input.page ?? 0);
      if (!Number.isSafeInteger(page) || page < 0 || page > 100000) fail(400, 'Page invalide.');
      const rows = result(await db.rpc('delivery_list', {
        term: textField(input.query ?? '', 'Recherche', 100, true), page_start: page * 20,
      }).select(galleryFields));
      return { galleries: rows.slice(0, 20), more: rows.length > 20,
        bytes: result(await db.rpc('delivery_usage')), quota: config.quotaBytes,
        maxBytes: config.maxBytes, retentionDays: config.retentionDays };
    }
    if (input.action === 'create') {
      const values = galleryInput(input);
      const code = newCode(input.code);
      const gallery = result(await galleries().insert({ ...values, code_hash: await hashCode(code) })
        .select(galleryFields).single());
      return { gallery, code };
    }

    const id = requiredId(input.id);
    const gallery = await getGallery(id);
    if (!gallery || (gallery.deleting_at && input.action !== 'purge')) fail(404, 'Galerie introuvable ou en cours de suppression.');

    switch (input.action) {
      case 'detail': return { files: await listFiles(id, false) };
      case 'update': {
        const dates = galleryInput(input, false);
        const disabled = input.disabled === true;
        const code = input.code || input.regenerate === true ? newCode(input.code) : null;
        const change = { ...dates, disabled_at: disabled ? gallery.disabled_at || new Date().toISOString() : null };
        if (code) change.code_hash = await hashCode(code);
        if (code || disabled !== Boolean(gallery.disabled_at) || +new Date(gallery.expires_at) <= Date.now()) {
          change.access_version = randomUUID();
        }
        const updated = result(await galleries().update(change).eq('id', id).is('deleting_at', null).select(galleryFields).maybeSingle());
        if (!updated) fail(409, 'Cette galerie est en cours de suppression.');
        return { gallery: updated, code };
      }
      case 'reserve': {
        const info = validateFile(input, config.maxBytes);
        const file = result(await db.rpc('delivery_reserve', {
          gallery: id, asset: randomUUID(), filename: info.name, content_type: info.mime, bytes: info.size,
        }));
        if (!file?.id) fail(409, 'La galerie est en cours de suppression ou a atteint 250 fichiers.');
        return { file, target: `${config.url}/storage/v1/object/${bucket}/${objectPath(file)}`, token, key: config.anonKey };
      }
      case 'finalize': {
        const file = await getFile(id, input.file);
        if (file.state === 'ready') return { ok: true };
        if (file.state !== 'pending') fail(409, 'Ce fichier est en cours de suppression.');
        await verifyObject(file);
        const updated = result(await files().update({ state: 'ready' }).eq('id', file.id).eq('state', 'pending').select('id').maybeSingle());
        if (!updated) fail(409, 'Le fichier a été modifié. Actualisez la galerie.');
        return { ok: true };
      }
      case 'remove': {
        const file = await getFile(id, input.file);
        result(await files().update({ state: 'deleting' }).eq('id', file.id));
        result(await storage.remove([objectPath(file)]));
        result(await files().delete().eq('id', file.id));
        return { ok: true };
      }
      case 'purge': {
        result(await galleries().update({ deleting_at: new Date().toISOString(), access_version: randomUUID() }).eq('id', id));
        const rows = await listFiles(id, false);
        if (rows.length) result(await storage.remove(rows.map((file) => objectPath({ ...file, gallery_id: id }))));
        result(await galleries().delete().eq('id', id));
        return { ok: true };
      }
      case 'preview': {
        const file = await getFile(id, input.file, true);
        return { url: await signFile(file, input.download === true) };
      }
      default: fail(400, 'Action inconnue.');
    }
  }

  const clientActions = new Set(['unlock', 'view', 'media', 'zip']);
  return async (request, { ip = 'unknown' } = {}) => {
    const headers = new Headers({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow, noarchive',
      'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' });
    try {
      if (request.method !== 'POST') fail(405, 'Méthode non autorisée.');
      if (request.headers.get('origin') !== new URL(request.url).origin) fail(403, 'Origine de la requête refusée.');
      if (!request.headers.get('content-type')?.startsWith('application/json')) fail(415, 'Format de requête non pris en charge.');
      const body = await request.text();
      if (body.length > 12000) fail(413, 'Requête trop volumineuse.');
      let input;
      try { input = JSON.parse(body); } catch { fail(400, 'Requête invalide.'); }
      if (!input || typeof input.action !== 'string') fail(400, 'Action manquante.');
      const setCookie = (value) => headers.append('Set-Cookie', value);
      let data;
      if (input.action === 'login') {
        await rate(`admin:${ip}`, 10, 900);
        const email = textField(input.email, 'E-mail', 250).toLowerCase();
        textField(input.password, 'Mot de passe', 256);
        await rate(`admin:account:${email}`, 25, 900);
        const { data: login, error } = await auth().signInWithPassword({ email, password: input.password });
        if (error || !login.session || !await admitted(login.user.id)) fail(401, 'Identifiants administrateur incorrects.');
        setCookie(responseCookie(request, 'studio_admin', login.session.access_token, Math.min(login.session.expires_in, 3600)));
        data = { ok: true };
      } else if (input.action === 'logout') {
        const token = readCookie(request, 'studio_admin');
        if (token) await db.auth.admin.signOut(token, 'local');
        setCookie(responseCookie(request, 'studio_admin', '', 0));
        data = { ok: true };
      } else if (clientActions.has(input.action)) {
        data = await clientAction(input, request, ip, setCookie);
      } else {
        data = await adminAction(input, await admin(request));
      }
      return Response.json(data, { headers });
    } catch (error) {
      const known = error instanceof DeliveryError;
      return Response.json({ error: known ? error.message : 'Le service est temporairement indisponible. Réessayez.' },
        { headers, status: known ? error.status : 502 });
    }
  };
}

export async function handleDelivery(request, context, env = process.env) {
  let config;
  try {
    config = deliveryConfig(env);
  } catch (error) {
    return Response.json({ error: error instanceof DeliveryError ? error.message : 'La configuration du service est invalide.' },
      { status: 503, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
  }
  return createDeliveryHandler(config)(request, context);
}
