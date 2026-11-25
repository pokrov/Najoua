import { presentation, faq, photos, reportages, selection, signature, site } from './content.js';

const navigation = [
  ['portfolio', 'Reportages'], ['a-propos', 'À propos'], ['seances', 'Prestations'], ['faq', 'FAQ'],
];

const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

function image(key, sizes, eager = false, placement = 'portfolio') {
  const { file, width, height, alt } = photos[key];
  const sources = [420, 760, width].map((size) => `/photos/${file}-${size}.webp ${size}w`).join(', ');
  const [frame, focus] = presentation[placement]?.[key] || ['full', '50% 50%'];
  return `<img class="plate plate-${frame}" style="--focus:${focus}" src="/photos/${file}-${width}.webp" srcset="${sources}" sizes="${sizes}" width="${width}" height="${height}" alt="${escape(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'}>`;
}

function brand(prefix) {
  return `<a class="brand" href="${prefix}#accueil">
    <img class="brand-mark" src="/najoua-monogram-small.png" srcset="/najoua-monogram-small.png 1x, /najoua-monogram.png 2x" alt="">
    <span class="sr-only">${escape(site.firstName)} ${escape(site.lastName)} — ${escape(site.role)}</span>
  </a>`;
}

function header(prefix) {
  return `<a class="skip" href="#main">Aller au contenu</a>
  <header class="header" id="accueil">
    <div class="header-inner">
      ${brand(prefix)}
      <button class="menu-toggle" type="button" aria-controls="navigation" aria-expanded="false">Menu</button>
      <nav id="navigation" class="navigation" aria-label="Navigation principale">
        ${navigation.map(([id, title]) => `<a href="${prefix}#${id}">${title}</a>`).join('')}
        <a class="mobile-contact" href="${prefix}#reservation">Contact</a>
      </nav>
      <a class="button header-book" href="${prefix}#reservation">Contact</a>
    </div>
  </header>`;
}

function footer(prefix) {
  return `<footer class="footer">
    <div class="footer-main wrap">
      ${brand(prefix)}
      <nav aria-label="Navigation de pied de page">
        ${navigation.slice(0, 3).map(([id, title]) => `<a href="${prefix}#${id}">${title}</a>`).join('')}
        <a href="${prefix}#reservation">Contact</a>
        <a href="/galerie/">Galerie privée</a>
      </nav>
      ${site.instagram ? `<a href="${escape(site.instagram)}" target="_blank" rel="noopener noreferrer">Voir sur Instagram</a>` : ''}
    </div>
    <div class="footer-bottom wrap">
      <span>© ${new Date().getUTCFullYear()} ${escape(site.name)}</span>
      <a href="/mentions-legales.html">Mentions légales et confidentialité</a>
    </div>
  </footer>`;
}

function hero() {
  return `<section class="hero wrap" aria-labelledby="hero-title">
    <div class="hero-copy">
      <h1 id="hero-title">${escape(site.name)} <em>— ${escape(site.role)}</em></h1>
      <p class="hero-description">${escape(site.hero.description)}</p>
      <div class="hero-actions">
        <a class="text-link" href="#portfolio">Découvrir les reportages</a>
        <a class="button button-solid" href="#reservation">Parler de mon événement</a>
      </div>
    </div>
    <figure class="hero-figure">
      ${image(site.hero.image, '(max-width: 700px) 90vw, (max-width: 1300px) 49vw, 640px', true, 'hero')}
      <figcaption>${escape(photos[site.hero.image].caption)}</figcaption>
    </figure>
  </section>`;
}

function services() {
  return `<section class="services section" id="seances" aria-labelledby="services-title">
    <div class="services-inner wrap">
      <div>
        <p class="kicker">Prestations</p>
        <h2 id="services-title">${escape(site.services.title)}</h2>
      </div>
      <div class="services-copy">
        <p>${escape(site.services.description)}</p>
        <p class="service-price">${escape(site.services.price)}</p>
        <a class="button button-solid" href="#reservation">Parler de mon événement</a>
      </div>
    </div>
  </section>`;
}

function galleryPhoto(key, group, sizes, captionClass = '') {
  const { file, width, caption } = photos[key];
  return `<figure class="gallery-item">
    <a class="gallery-link" href="/photos/${file}-${width}.webp" data-gallery="${escape(group)}" aria-label="Agrandir la photo · ${escape(caption)}">
      ${image(key, sizes, false, group === 'signature' ? 'signature' : 'portfolio')}
      <span class="gallery-icon" aria-hidden="true">+</span>
    </a>
    <figcaption${captionClass ? ` class="${captionClass}"` : ''}>${escape(caption)}</figcaption>
  </figure>`;
}

function composition() {
  const widths = [
    '(max-width: 700px) 94vw, (max-width: 1400px) 46vw, 620px',
    '(max-width: 700px) 47vw, (max-width: 1400px) 24vw, 290px',
    '(max-width: 700px) 42vw, (max-width: 1400px) 18vw, 205px',
    '(max-width: 700px) 94vw, (max-width: 1400px) 42vw, 515px',
  ];
  return `<section class="signature section" aria-labelledby="signature-title">
    <div class="wrap">
      <div class="signature-heading">
        <h2 id="signature-title">Sélection <em>de photographies</em></h2>
        <a class="text-link" href="#portfolio">Voir les reportages</a>
      </div>
      <div class="signature-grid">
        ${signature.map((key, index) => galleryPhoto(key, 'signature', widths[index], 'sr-only')).join('')}
      </div>
    </div>
  </section>`;
}

function gallery() {
  const reportageSizes = '(max-width: 700px) 46vw, (max-width: 1400px) 42vw, 510px';
  const selectionSizes = '(max-width: 700px) 46vw, (max-width: 1400px) 23vw, 300px';
  return `<section class="portfolio section wrap" id="portfolio" aria-labelledby="portfolio-title">
    <h2 id="portfolio-title">Reportage à découvrir</h2>
    ${reportages.map(({ id, title, images }) => `<section class="reportage" aria-labelledby="reportage-${escape(id)}">
      <h3 id="reportage-${escape(id)}">${escape(title)}</h3>
      <div class="reportage-photos">
        ${images.map((key) => galleryPhoto(key, `reportage-${id}`, reportageSizes)).join('')}
      </div>
    </section>`).join('')}
    ${selection.length ? `<section class="reportage" aria-labelledby="selection-title">
      <h3 id="selection-title">Sélection de photographies</h3>
      <div class="selection-photos">
        ${selection.map((key) => galleryPhoto(key, 'selection', selectionSizes)).join('')}
      </div>
    </section>` : ''}
    <dialog class="lightbox" aria-labelledby="lightbox-caption">
      <div class="lightbox-controls">
        <button type="button" data-previous aria-label="Photo précédente">‹</button>
        <button type="button" data-next aria-label="Photo suivante">›</button>
        <button type="button" data-close aria-label="Fermer la visionneuse">×</button>
      </div>
      <figure>
        <img alt="">
        <figcaption id="lightbox-caption" aria-live="polite"></figcaption>
      </figure>
    </dialog>
  </section>`;
}

function about() {
  return `<section class="about section" id="a-propos" aria-labelledby="about-title">
    <div class="about-inner wrap">
      <figure>${image(site.about.image, '(max-width: 700px) 90vw, 40vw', false, 'about')}</figure>
      <div class="about-copy">
        <p class="kicker">À propos</p>
        <h2 id="about-title">Derrière l’objectif,<br><span>${escape(site.name)}</span></h2>
        <p>${escape(site.about.intro)}</p>
        ${site.instagram ? `<a class="text-link" href="${escape(site.instagram)}" target="_blank" rel="noopener noreferrer">Voir sur Instagram</a>` : ''}
      </div>
    </div>
  </section>`;
}

function experience() {
  return `<section class="experience section wrap" id="faq" aria-labelledby="faq-title">
    <div class="section-intro">
      <p class="kicker">L’expérience</p>
      <h2 id="faq-title">Préparer <em>votre événement</em></h2>
    </div>
    <div class="faq-list">
      ${faq.map(([question, answer]) => `<details>
        <summary>${escape(question)}<span aria-hidden="true"></span></summary>
        <p>${escape(answer)}</p>
      </details>`).join('')}
    </div>
  </section>`;
}

function booking() {
  const hasContact = site.email || site.whatsapp;
  return `<section class="booking section" id="reservation" aria-labelledby="booking-title">
    <div class="booking-inner wrap">
      <div>
        <p class="kicker">Contact</p>
        <h2 id="booking-title">Parlons de<br><em>votre événement</em></h2>
        <p>${escape(site.contactIntro)}</p>
        <div class="direct-links">
          ${site.serviceArea || site.city ? `<p>${escape([site.city, site.serviceArea].filter(Boolean).join(' · '))}</p>` : ''}
          ${site.phone ? `<a class="text-link" href="tel:${escape(site.phone.replace(/[^+\d]/g, ''))}">${escape(site.phone)}</a>` : ''}
          ${site.hours ? `<p>${escape(site.hours)}</p>` : ''}
          ${site.email ? `<a class="text-link" href="mailto:${escape(site.email)}">${escape(site.email)}</a>` : ''}
          ${site.whatsapp ? `<a class="text-link" href="https://wa.me/${escape(site.whatsapp)}">Contacter Najoua sur WhatsApp</a>` : ''}
        </div>
      </div>
      <form id="booking-form" aria-describedby="booking-note" hidden>
        <div class="form-grid">
          <label class="form-wide">Quel événement préparez-vous ? *
            <input name="eventType" required maxlength="160">
          </label>
          <label for="date">Date souhaitée (facultative)
            <input id="date" name="date" type="date">
          </label>
          <label for="venue">Ville ou lieu
            <input id="venue" name="venue" maxlength="160" placeholder="Ville envisagée ou nom du lieu">
          </label>
          <label>Prénom *<input name="name" autocomplete="given-name" required maxlength="100"></label>
          <label>E-mail ou téléphone *<input name="reply" required maxlength="150"></label>
          <label class="form-wide" for="message">Quelques mots sur votre projet
            <textarea id="message" name="message" rows="4" maxlength="1200" placeholder="Le déroulement prévu et les moments à photographier…"></textarea>
          </label>
          <div class="honeypot" aria-hidden="true">
            <label for="website">Site web</label><input id="website" name="website" tabindex="-1" autocomplete="off">
          </div>
        </div>
        <p class="form-note" id="booking-note">${hasContact
          ? 'Les champs marqués d’un astérisque sont obligatoires. Vérifiez le message dans votre application avant de l’envoyer.'
          : 'L’envoi en ligne sera disponible dès que les coordonnées de Najoua seront renseignées. Vous pouvez préparer et copier votre demande en attendant.'}</p>
        <div class="form-actions">
          ${site.whatsapp ? '<button class="button button-solid" name="channel" value="whatsapp">Continuer sur WhatsApp</button>' : ''}
          ${site.email ? '<button class="button button-solid" name="channel" value="email">Ouvrir l’e-mail</button>' : ''}
          ${hasContact ? '' : '<button class="button button-solid" name="channel" value="copy">Copier ma demande</button>'}
        </div>
        <p class="form-status" role="status"></p>
        <label class="copy-fallback" hidden for="draft">Votre demande à copier
          <textarea id="draft" rows="6" readonly></textarea>
        </label>
      </form>
      <noscript><p>Activez JavaScript pour préparer votre demande.</p></noscript>
    </div>
  </section>`;
}

function legalPage() {
  return `<main id="main" class="legal section wrap">
    <p class="kicker">${escape(site.name)}</p>
    <h1>Mentions légales<br><em>et confidentialité.</em></h1>
    <h2>Édition du site</h2>
    <p>${escape(site.legal.publisher || `Site vitrine de ${site.name}. Les coordonnées de l’éditeur restent à renseigner.`)}</p>
    <h2>Hébergement</h2>
    <p>${escape(site.legal.hosting || 'Les informations sur l’hébergeur seront ajoutées avant la publication.')}</p>
    <h2>Données de contact</h2>
    <p>${escape(site.legal.privacyPolicy || 'Le formulaire prépare votre message dans votre navigateur. Le site ne conserve aucune demande sur un serveur. Si vous ouvrez un service de messagerie, vous choisissez d’y envoyer votre message.')}</p>
    <h2>Galeries privées</h2>
    <p>${escape(site.legal.galleryPrivacy || 'Les fichiers sont accessibles avec le code remis par le studio et jusqu’à la date indiquée dans la galerie. Les modalités de conservation et de traitement seront complétées avant l’ouverture du service.')}</p>
    <h2>Photographies</h2>
    <p>Les photographies présentées sont protégées. Toute réutilisation requiert l’autorisation des titulaires des droits.</p>
    <a class="text-link" href="/">Retour à l’accueil</a>
  </main>`;
}

function metadata(legal, origin) {
  const title = legal ? `Mentions légales et confidentialité | ${site.name}` : `${site.name} — ${site.role}${site.city ? ` à ${site.city}` : ''}`;
  const description = legal ? `Informations sur l’édition du site de ${site.name}, les photographies et le formulaire de réservation.` : site.hero.description;
  const photo = photos[site.hero.image];
  const photoPath = site.hero.shareImage;
  const pageUrl = origin ? new URL(legal ? '/mentions-legales.html' : '/', origin).href : '';
  const structured = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.name,
    jobTitle: site.role,
    knowsAbout: site.specialty,
    ...(origin && { url: origin }),
    ...(site.city && { workLocation: { '@type': 'Place', name: site.city } }),
  };
  return `<title>${escape(title)}</title>
  <meta name="description" content="${escape(description)}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:site_name" content="${escape(site.name)}">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}">
  <meta name="twitter:card" content="${pageUrl ? 'summary_large_image' : 'summary'}">
  <meta name="twitter:title" content="${escape(title)}">
  <meta name="twitter:description" content="${escape(description)}">
  ${pageUrl ? `<link rel="canonical" href="${escape(pageUrl)}">
  <meta property="og:url" content="${escape(pageUrl)}">
  <meta property="og:image" content="${escape(new URL(photoPath, origin).href)}">
  <meta property="og:image:alt" content="${escape(photo.alt)}">
  <meta name="twitter:image" content="${escape(new URL(photoPath, origin).href)}">
  <meta name="twitter:image:alt" content="${escape(photo.alt)}">` : ''}
  ${legal ? '' : `<script type="application/ld+json">${JSON.stringify(structured).replaceAll('<', '\\u003c')}</script>`}`;
}

export function renderPage(html, legal, origin = site.url) {
  const prefix = legal ? '/' : '';
  const main = legal ? legalPage() : `<main id="main">${hero()}${composition()}${about()}${gallery()}${services()}${experience()}${booking()}</main>`;
  return html.replace('<!-- metadata -->', () => metadata(legal, origin))
    .replace('<!-- content -->', () => `${header(prefix)}${main}${footer(prefix)}`);
}
