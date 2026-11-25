import '@fontsource/baskervville/400.css';
import '@fontsource/instrument-sans/400.css';
import '@fontsource/instrument-sans/500.css';
import '@fontsource/instrument-sans/600.css';
import '../style.css';
import './delivery.css';

export const select = (selector) => document.querySelector(selector);
export const status = select('#status');
export const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

export async function api(action, fields = {}) {
  const response = await fetch('/api/delivery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...fields, action }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
    throw Object.assign(new Error(data.error || 'L’espace galeries est indisponible. Réessayez dans un instant.'),
      { status: response.status });
  }
  return data;
}

export const sizes = (bytes) => bytes < 1048576
  ? `${Math.ceil(bytes / 1024).toLocaleString('fr')} Kio`
  : `${(bytes / 1048576).toLocaleString('fr', { maximumFractionDigits: 1 })} Mio`;

export const dateLabel = (date, withTime = false) => new Intl.DateTimeFormat('fr', {
  dateStyle: 'long',
  ...(withTime && { timeStyle: 'short' }),
}).format(new Date(date));

export function activateDownload(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noreferrer';
  document.body.append(link);
  link.click();
  link.remove();
}

export function showGallery(container, gallery, files, openFile, zipAction) {
  container.replaceChildren();
  container.insertAdjacentHTML('beforeend', `
    <div class="gallery-note">
      <h2>${escape(gallery.title)}</h2>
      <p>Séance du ${dateLabel(`${gallery.session_date}T12:00:00`)} · Disponible jusqu’au ${dateLabel(gallery.expires_at, true)}</p>
      ${gallery.message ? `<p class="personal-message">${escape(gallery.message)}</p>` : ''}
    </div>
    <div class="delivery-actions gallery-downloads"></div>
    <div class="media-view" hidden tabindex="-1"></div>
    <ul class="delivery-list client-files">${files.map((file) => `
      <li>
        <div><strong>${escape(file.name)}</strong><small>${file.mime.startsWith('image/') ? 'Photo' : 'Vidéo'} · ${sizes(file.size)}</small></div>
        <div class="delivery-actions">
          <button class="button" data-preview="${escape(file.id)}" aria-label="Prévisualiser ${escape(file.name)}">Aperçu</button>
          <button class="button" data-download="${escape(file.id)}" aria-label="Télécharger ${escape(file.name)}">Télécharger</button>
        </div>
      </li>`).join('')}</ul>
    ${files.length ? '' : '<p>Aucun fichier à afficher pour cette galerie.</p>'}`);
  if (zipAction) {
    const zip = document.createElement('button');
    zip.textContent = 'Télécharger toute la galerie (ZIP)';
    zip.className = 'button button-solid';
    zip.onclick = () => run(zip, zipAction);
    container.querySelector('.gallery-downloads').append(zip);
  }
  const media = container.querySelector('.media-view');
  container.onclick = (event) => {
    const button = event.target.closest('button[data-preview], button[data-download]');
    if (!button) return;
    const file = files.find(({ id }) => id === (button.dataset.preview || button.dataset.download));
    run(button, async () => {
      const download = Boolean(button.dataset.download);
      const { url } = await openFile(file, download);
      if (download) {
        activateDownload(url, file.name);
        return;
      }
      const element = document.createElement(file.mime.startsWith('video/') ? 'video' : 'img');
      if (element.tagName === 'VIDEO') {
        element.controls = true;
        element.playsInline = true;
        element.preload = 'metadata';
      } else {
        element.alt = file.name;
      }
      element.addEventListener('error', () => {
        status.textContent = 'Aperçu indisponible. Rouvrez l’aperçu ou téléchargez le fichier.';
      });
      const close = document.createElement('button');
      close.className = 'button';
      close.textContent = 'Fermer l’aperçu';
      close.onclick = () => {
        media.replaceChildren();
        media.hidden = true;
        button.focus();
      };
      media.replaceChildren(close, element);
      element.src = url;
      media.hidden = false;
      media.focus();
    });
  };
}

export async function run(button, task, onError) {
  if (button) button.disabled = true;
  status.textContent = 'Chargement…';
  try {
    await task();
    if (status.textContent === 'Chargement…') status.textContent = '';
  } catch (error) {
    status.textContent = error.message;
    onError?.(error);
  } finally {
    if (button) button.disabled = false;
  }
}
