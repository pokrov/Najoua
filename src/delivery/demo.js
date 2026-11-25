import { select } from './common.js';

const samples = [
  ['Décor de fête', '2026-05-12', 'Active', ['ballons.jpg', 'detail.mp4']],
  ['Étude florale', '2026-03-08', 'Désactivée', ['fleurs.jpg']],
  ['Carnet de couleurs', '2025-10-02', 'Expirée', ['fleurs.jpg', 'ballons.jpg']],
];

export function openDemo() {
  // Replace the live controls with identical markup free of production handlers.
  const studio = select('#studio').cloneNode(true);
  select('#studio').replaceWith(studio);
  select('#demo-banner').hidden = false;
  studio.hidden = false;
  select('#status').textContent = '';
  const editor = select('#editor');
  for (const field of editor.elements) field.disabled = true;
  for (const control of studio.querySelectorAll('#upload input, #upload button, #purge, #previous, #next')) control.disabled = true;
  select('#upload').onsubmit = editor.onsubmit = event => event.preventDefault();
  select('#usage').textContent = '3 galeries fictives';

  function display(sample) {
    editor.reset();
    select('#editor-title').textContent = sample?.[0] || 'Nouvelle galerie';
    select('#save').textContent = sample ? 'Enregistrer' : 'Créer la galerie';
    select('#disabled-label').hidden = !sample;
    select('#media-panel').hidden = !sample;
    select('#admin-preview').hidden = true;
    select('#new-gallery').hidden = !sample;
    select('#code-help').textContent = 'Aucun code attribué en démonstration.';
    if (!sample) return;
    const [title, date, state, assets] = sample;
    editor.elements.title.value = title;
    editor.elements.client_name.value = 'Exemple fictif';
    editor.elements.session_date.value = date;
    editor.elements.expires_at.value = (state === 'Expirée' ? '2025-11-02' : '2099-01-01') + 'T18:00';
    editor.elements.disabled.checked = state === 'Désactivée';
    select('#file-list').innerHTML = assets.map(name =>
      '<li>' + name + '<button class="button danger" disabled>Supprimer</button></li>').join('');
    select('#preview-gallery').onclick = () => {
      const preview = select('#admin-preview');
      preview.innerHTML = '<h2>Aperçu de la galerie</h2><div class="demo-media">' + assets.map(name =>
        '<figure>' + (name.endsWith('.mp4')
          ? '<video controls playsinline preload="metadata" src="/demo/detail.mp4"></video>'
          : '<img src="/demo/' + name + '" alt="Détail du décor">') +
          '<figcaption>' + name + '</figcaption></figure>').join('') + '</div>';
      preview.hidden = false;
      preview.focus();
    };
  }

  function list() {
    const query = select('#search').elements.query.value.trim().toLocaleLowerCase('fr');
    const rows = samples.filter(([title]) => title.toLocaleLowerCase('fr').includes(query));
    const items = rows.map(sample => {
      const li = document.createElement('li');
      li.innerHTML = '<div><strong>' + sample[0] + '</strong><small>' + sample[1] + ' · ' + sample[2] +
        '</small></div><button class="button">Gérer</button>';
      li.querySelector('button').onclick = () => display(sample);
      return li;
    });
    select('#gallery-list').replaceChildren(...items);
    if (!items.length) select('#gallery-list').textContent = 'Aucune galerie trouvée.';
  }
  select('#search').onsubmit = event => { event.preventDefault(); list(); };
  select('#new-gallery').onclick = () => display(null);
  list();
  display(samples[0]);
}
