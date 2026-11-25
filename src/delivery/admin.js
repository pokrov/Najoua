import { api, escape, run, select, showGallery, sizes, status } from './common.js';

const login = select('#login');
const studio = select('#studio');
const editor = select('#editor');
const search = select('#search');
const upload = select('#upload');
const preview = select('#admin-preview');
const logout = select('#logout');
let page = 0;
let query = '';
let galleries = [];
let current = null;
let currentCode = '';
let files = [];
let retentionDays = 30;

function state(gallery) {
  if (gallery.deleting_at) return 'Suppression à reprendre';
  if (gallery.disabled_at) return 'Désactivée';
  return new Date(gallery.expires_at) <= new Date() ? 'Expirée' : 'Active';
}

async function refresh() {
  const data = await api('list', { page, query });
  retentionDays = data.retentionDays;
  galleries = data.galleries;
  if (page && !galleries.length) {
    page--;
    return refresh();
  }
  select('#usage').textContent = `Médias prêts · ${sizes(data.bytes)}${data.quota ? ` sur ${sizes(data.quota)}` : ''}`;
  select('#upload-limits').textContent = `JPG, PNG, WebP, MP4 et WebM · ${sizes(data.maxBytes)} par fichier · 250 fichiers par galerie.`;
  select('#gallery-list').innerHTML = galleries.map((gallery) => `
    <li><div><strong>${escape(gallery.title)}</strong><small>${escape(gallery.client_name)} · ${state(gallery)}</small></div>
    <button class="button" data-gallery="${escape(gallery.id)}" aria-label="Gérer ${escape(gallery.title)}">Gérer</button></li>`).join('')
    || '<li>Aucune galerie trouvée.</li>';
  select('#previous').disabled = page === 0;
  select('#next').dataset.more = data.more ? 'true' : '';
  select('#next').disabled = !data.more;
}

function localDateTime(value) {
  const date = new Date(value);
  return new Date(+date - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function renderEditor() {
  editor.reset();
  editor.hidden = Boolean(current?.deleting_at);
  preview.hidden = true;
  preview.replaceChildren();
  select('#upload-progress').replaceChildren();
  select('#editor-title').textContent = current ? current.title : 'Nouvelle galerie';
  select('#new-gallery').hidden = !current;
  select('#disabled-label').hidden = !current;
  select('#save').textContent = current ? 'Enregistrer' : 'Créer la galerie';
  select('#code-help').textContent = current
    ? '8 à 64 lettres, chiffres ou tirets. Laissez vide pour conserver le code actuel.'
    : '8 à 64 lettres, chiffres ou tirets. Laissez vide pour générer un code.';
  select('#share').hidden = !current || Boolean(current.deleting_at);
  select('#media-panel').hidden = !current;
  upload.hidden = !current || Boolean(current.deleting_at);
  select('#preview-gallery').hidden = !current || Boolean(current.deleting_at);
  select('#file-list').hidden = !current || Boolean(current.deleting_at);
  if (current) {
    for (const field of ['client_name', 'title', 'session_date', 'message']) editor.elements[field].value = current[field];
    editor.elements.disabled.checked = Boolean(current.disabled_at);
    editor.elements.expires_at.value = localDateTime(current.expires_at);
    select('#share-url').value = new URL(`/galerie/?g=${current.id}`, location.origin).href;
    select('#share-code').value = currentCode;
    select('#share-code-label').hidden = !currentCode;
    select('#copy-code').hidden = !currentCode;
    select('#share-hint').textContent = currentCode
      ? 'Copiez le code maintenant. Il ne sera plus affiché après avoir quitté cette galerie.'
      : 'Vous pouvez générer un nouveau code si le client a perdu le sien.';
  } else {
    editor.elements.expires_at.value = localDateTime(Date.now() + retentionDays * 86400000);
  }
}

async function refreshFiles() {
  files = current?.deleting_at ? [] : (await api('detail', { id: current.id })).files;
  select('#file-list').innerHTML = files.map((file) => `
    <li><div><strong>${escape(file.name)}</strong><small>${sizes(file.size)} · ${
      { ready: 'Disponible', pending: 'À vérifier ou à retirer', deleting: 'Suppression à reprendre' }[file.state]
    }</small></div>
    <div class="delivery-actions">
      ${file.state === 'pending' ? `<button class="button" data-finalize="${file.id}">Vérifier</button>` : ''}
      <button class="button danger" data-remove="${file.id}" aria-label="Supprimer ${escape(file.name)}">Supprimer</button>
    </div></li>`).join('') || '<li>Aucun fichier.</li>';
}

function sessionError(error) {
  if (error.status === 401) {
    current = null;
    currentCode = '';
    studio.hidden = true;
    logout.hidden = true;
    login.hidden = false;
    for (const id of ['share-code', 'share-url']) select(`#${id}`).value = '';
    editor.reset();
    preview.replaceChildren();
    select('#gallery-list').replaceChildren();
    select('#file-list').replaceChildren();
    select('#upload-progress').replaceChildren();
    files = [];
    galleries = [];
  }
}

let working = false;
function task(button, action) {
  if (working) return;
  working = true;
  run(button, action, sessionError).finally(() => {
    working = false;
    if (!studio.hidden) {
      select('#previous').disabled = page === 0;
      select('#next').disabled = !select('#next').dataset.more;
    }
  });
}

async function loadStudio() {
  await refresh();
  renderEditor();
  login.hidden = true;
  studio.hidden = false;
  logout.hidden = false;
}

login.onsubmit = (event) => {
  event.preventDefault();
  task(event.submitter, async () => {
    const data = Object.fromEntries(new FormData(login));
    login.elements.password.value = '';
    await api('login', data);
    await loadStudio();
  });
};
logout.onclick = () => task(logout, async () => {
  await api('logout');
  sessionError({ status: 401 });
  login.elements.username.focus();
});

search.onsubmit = (event) => {
  event.preventDefault();
  task(event.submitter, async () => {
    query = search.elements.query.value.trim();
    page = 0;
    await refresh();
  });
};
select('#previous').onclick = () => task(select('#previous'), async () => { page--; await refresh(); });
select('#next').onclick = () => task(select('#next'), async () => { page++; await refresh(); });

select('#gallery-list').onclick = (event) => {
  const button = event.target.closest('button[data-gallery]');
  if (!button) return;
  task(button, async () => {
    current = galleries.find(({ id }) => id === button.dataset.gallery);
    currentCode = '';
    renderEditor();
    await refreshFiles();
    editor.elements.client_name.focus();
  });
};
select('#new-gallery').onclick = () => {
  if (working) return;
  current = null;
  currentCode = '';
  renderEditor();
  editor.elements.client_name.focus();
};

function editorValues() {
  const { expires_at, ...fields } = Object.fromEntries(new FormData(editor));
  return { ...fields, expires_at: new Date(expires_at).toISOString(), disabled: editor.elements.disabled.checked };
}

async function save(regenerate = false) {
  const values = editorValues();
  const data = current ? await api('update', { ...values, id: current.id, regenerate })
    : await api('create', values);
  current = data.gallery;
  if (data.code) currentCode = data.code;
  renderEditor();
  status.textContent = data.code ? 'Galerie enregistrée. Le code est prêt à être copié.' : 'Galerie enregistrée.';
  await refresh();
  await refreshFiles();
}

editor.onsubmit = (event) => {
  event.preventDefault();
  task(event.submitter, () => save());
};
select('#rotate').onclick = () => {
  if (working || !editor.reportValidity() || !confirm('Générer un nouveau code et invalider l’ancien ?')) return;
  editor.elements.code.value = '';
  task(select('#rotate'), () => save(true));
};
for (const [button, input, label] of [
  ['#copy-link', '#share-url', 'Lien copié.'], ['#copy-code', '#share-code', 'Code copié.'],
]) {
  select(button).onclick = () => task(select(button), async () => {
    const field = select(input);
    try {
      await navigator.clipboard.writeText(field.value);
      status.textContent = label;
    } catch {
      field.focus();
      field.select();
      status.textContent = 'Copiez le texte sélectionné.';
    }
  });
}

function transfer(file, { target, token, key }, progress) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', target);
    request.timeout = 30 * 60 * 1000;
    request.setRequestHeader('Authorization', `Bearer ${token}`);
    request.setRequestHeader('apikey', key);
    request.setRequestHeader('Content-Type', file.type);
    request.setRequestHeader('Cache-Control', 'no-store');
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) progress.value = event.loaded / event.total;
    };
    const interrupted = () => reject(new Error('Transfert interrompu. Vérifiez la connexion puis réessayez.'));
    request.onerror = interrupted;
    request.ontimeout = interrupted;
    request.onload = () => request.status >= 200 && request.status < 300 ? resolve()
      : reject(new Error(`Le stockage a refusé le transfert (HTTP ${request.status}).`));
    request.send(file);
  });
}

upload.onsubmit = (event) => {
  event.preventDefault();
  task(event.submitter, async () => {
    const selected = [...upload.elements.files.files];
    const id = current.id;
    let errors = 0;
    const list = select('#upload-progress');
    list.replaceChildren();
    for (const file of selected) {
      const item = document.createElement('li');
      item.innerHTML = `<div><strong>${escape(file.name)}</strong><small>Préparation…</small></div><progress max="1" value="0" aria-label="Téléversement de ${escape(file.name)}"></progress>`;
      list.append(item);
      const progress = item.querySelector('progress');
      const detail = item.querySelector('small');
      try {
        const reservation = await api('reserve', { id, name: file.name, mime: file.type, size: file.size });
        detail.textContent = 'Téléversement…';
        await transfer(file, reservation, progress);
        progress.value = 1;
        detail.textContent = 'Vérification du fichier…';
        await api('finalize', { id, file: reservation.file.id });
        detail.textContent = 'Disponible dans la galerie.';
      } catch (error) {
        if (error.status === 401) throw error;
        detail.textContent = error.message;
        errors++;
      }
    }
    upload.reset();
    await refreshFiles();
    await refresh();
    status.textContent = errors ? `${errors} fichier(s) à vérifier. Les détails figurent sous le formulaire de téléversement.`
      : 'Les fichiers sont disponibles dans la galerie.';
  });
};

select('#file-list').onclick = (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.remove && !confirm('Supprimer définitivement ce fichier ?')) return;
  task(button, async () => {
    await api(button.dataset.remove ? 'remove' : 'finalize', {
      id: current.id, file: button.dataset.remove || button.dataset.finalize,
    });
    preview.hidden = true;
    preview.replaceChildren();
    await refreshFiles();
    await refresh();
    status.textContent = button.dataset.remove ? 'Fichier supprimé.' : 'Fichier disponible.';
  });
};
select('#purge').onclick = () => {
  if (working || !confirm('Supprimer définitivement cette galerie et tous ses fichiers ?')) return;
  task(select('#purge'), async () => {
    try {
      await api('purge', { id: current.id });
    } catch (error) {
      await refresh();
      current = galleries.find(({ id }) => id === current.id) ?? current;
      renderEditor();
      throw error;
    }
    current = null;
    currentCode = '';
    renderEditor();
    await refresh();
    status.textContent = 'Galerie et fichiers supprimés.';
  });
};
select('#preview-gallery').onclick = () => task(select('#preview-gallery'), async () => {
  const id = current.id;
  showGallery(preview, current, files.filter(({ state }) => state === 'ready'),
    (file, download) => api('preview', { id, file: file.id, download }));
  preview.hidden = false;
  preview.focus();
});

task(null, loadStudio);
