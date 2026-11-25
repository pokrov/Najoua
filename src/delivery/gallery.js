import { Zip, ZipPassThrough } from 'fflate';
import { activateDownload, api, run, select, showGallery, status } from './common.js';

const id = new URLSearchParams(location.search).get('g');
const form = select('#unlock');
const container = select('#gallery');

function accessError(error) {
  if (error.status === 401 || error.status === 410 || error.status === 404) {
    if (error.status === 404 && !container.hidden) return;
    container.replaceChildren();
    container.hidden = true;
    form.hidden = error.status !== 401;
  }
}

async function downloadAll() {
  const { files } = await api('zip', { id });
  const chunks = [];
  const zip = new Zip((error, data) => {
    if (error) throw error;
    chunks.push(data);
  });
  for (const [index, file] of files.entries()) {
    status.textContent = `Préparation du ZIP · ${index + 1} / ${files.length}`;
    const { url } = await api('media', { id, file: file.id });
    const response = await fetch(url, { referrerPolicy: 'no-referrer' });
    if (!response.ok || !response.body) throw new Error('Le ZIP est indisponible. Réessayez ou téléchargez les fichiers séparément.');
    const entry = new ZipPassThrough(`${String(index + 1).padStart(3, '0')}-${file.name}`);
    zip.add(entry);
    const reader = response.body.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      entry.push(value);
    }
    entry.push(new Uint8Array(), true);
  }
  zip.end();
  const url = URL.createObjectURL(new Blob(chunks, { type: 'application/zip' }));
  activateDownload(url, 'galerie-najoua.zip');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  status.textContent = 'Le téléchargement du ZIP a été lancé.';
}

function render({ gallery, files, zipLimit }) {
  form.hidden = true;
  form.reset();
  container.hidden = false;
  const zip = files.length && files.reduce((sum, file) => sum + file.size, 0) <= zipLimit;
  showGallery(container, gallery, files, (file, download) =>
    api('media', { id, file: file.id, download }).catch((error) => { accessError(error); throw error; }),
  zip ? () => downloadAll().catch((error) => { accessError(error); throw error; }) : null);
}

form.onsubmit = (event) => {
  event.preventDefault();
  run(event.submitter, async () => render(await api('unlock', { id, code: form.elements.code.value })), accessError);
};

if (id) {
  run(null, async () => render(await api('view', { id })), accessError);
} else {
  status.textContent = 'Ouvrez le lien privé que Najoua vous a transmis.';
}
