import { faq, photos, portfolio, sessions, site } from './content.js';

const navigation = [
  ['seances', 'Séances'], ['portfolio', 'Portfolio'], ['a-propos', 'À propos'], ['faq', 'FAQ'],
];

const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

function image(key, sizes, eager = false) {
  const { file, width, height, alt } = photos[key];
  const sources = [420, 760, width].map((size) => `/photos/${file}-${size}.webp ${size}w`).join(', ');
  return `<img src="/photos/${file}-${width}.webp" srcset="${sources}" sizes="${sizes}" width="${width}" height="${height}" alt="${escape(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'}>`;
}

function brand(prefix) {
  return `<a class="brand" href="${prefix}#accueil">
    <span>${escape(site.firstName)} <i>${escape(site.lastName)}</i></span>
    <small>${escape(site.role)}</small>
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
      </nav>
      <a class="button header-book" href="${prefix}#reservation">Réserver</a>
    </div>
  </header>`;
}

function footer(prefix) {
  return `<footer class="footer">
    <div class="footer-main wrap">
      ${brand(prefix)}
      <nav aria-label="Navigation de pied de page">
        ${navigation.slice(0, 3).map(([id, title]) => `<a href="${prefix}#${id}">${title}</a>`).join('')}
        <a href="${prefix}#reservation">Réservation</a>
      </nav>
      ${site.instagram ? `<a href="${escape(site.instagram)}" target="_blank" rel="noopener noreferrer">Instagram</a>` : ''}
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
      <p class="kicker">${escape(site.hero.kicker)}${site.city ? ` · ${escape(site.city)}` : ''}</p>
      <h1 id="hero-title">${escape(site.hero.title[0])}<br><em>${escape(site.hero.title[1])}</em></h1>
      <p class="hero-description">${escape(site.hero.description)}</p>
      <div class="hero-actions">
        <a class="button button-solid" href="#reservation">Réserver une séance</a>
        <a class="text-link" href="#portfolio">Voir le portfolio</a>
      </div>
    </div>
    <figure class="hero-figure">
      ${image(site.hero.image, '(max-width: 700px) 90vw, (max-width: 1300px) 49vw, 640px', true)}
      <figcaption>${escape(photos[site.hero.image].caption)}</figcaption>
    </figure>
  </section>`;
}

function services() {
  return `<section class="sessions section" id="seances" aria-labelledby="sessions-title">
    <div class="wrap">
      <div class="section-intro">
        <p class="kicker">Séances photo</p>
        <h2 id="sessions-title">À chacun <em>son décor.</em></h2>
        <p>${escape(site.sessionsIntro)}</p>
      </div>
      <div class="session-grid">
        ${sessions.map(({ id, title, image: key, description, price }) => `<article class="session-card">
          ${image(key, '(max-width: 700px) 90vw, (max-width: 1300px) 45vw, 590px')}
          <div class="session-copy">
            <h3>${escape(title)}</h3>
            <p>${escape(description)}</p>
            <div class="session-actions">
              <span>${escape(price)}</span>
              <a href="#reservation" class="text-link" data-session="${escape(id)}">Choisir cette séance<span class="sr-only"> · ${escape(title)}</span></a>
            </div>
          </div>
        </article>`).join('')}
      </div>
    </div>
  </section>`;
}

function gallery() {
  return `<section class="portfolio section wrap" id="portfolio" aria-labelledby="portfolio-title">
    <div class="section-intro">
      <p class="kicker">Portfolio</p>
      <h2 id="portfolio-title">Quelques <em>histoires.</em></h2>
      <p>${escape(site.portfolioIntro)}</p>
    </div>
    <div class="gallery">
      ${portfolio.map((key, index) => {
        const photo = photos[key];
        return `<figure class="gallery-item">
          <a class="gallery-link" href="/photos/${photo.file}-${photo.width}.webp" data-gallery="${index}" aria-label="Agrandir la photo · ${escape(photo.caption)}">
            ${image(key, '(max-width: 700px) 90vw, (max-width: 1300px) 30vw, 400px')}
            <span class="gallery-icon" aria-hidden="true">+</span>
          </a>
          <figcaption>${escape(photo.caption)}</figcaption>
        </figure>`;
      }).join('')}
    </div>
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
      <figure>${image(site.about.image, '(max-width: 700px) 90vw, 40vw')}</figure>
      <div class="about-copy">
        <p class="kicker">À propos</p>
        <h2 id="about-title">Derrière l’objectif,<br><em>${escape(site.firstName)}.</em></h2>
        <p>${escape(site.about.intro)}</p>
        <p>${escape(site.about.approach)}</p>
        ${site.instagram ? `<a class="text-link" href="${escape(site.instagram)}" target="_blank" rel="noopener noreferrer">Voir la publication Instagram</a>` : ''}
      </div>
    </div>
  </section>`;
}

function experience() {
  return `<section class="experience section wrap" id="faq" aria-labelledby="faq-title">
    <div class="section-intro">
      <p class="kicker">L’expérience</p>
      <h2 id="faq-title">Avant <em>la séance.</em></h2>
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
        <p class="kicker">Réservation</p>
        <h2 id="booking-title">Parlons de<br><em>votre séance.</em></h2>
        <p>${escape(site.contactIntro)}</p>
        <div class="direct-links">
          ${site.city ? `<p>${escape(site.city)}</p>` : ''}
          ${site.email ? `<a class="text-link" href="mailto:${escape(site.email)}">${escape(site.email)}</a>` : ''}
          ${site.whatsapp ? `<a class="text-link" href="https://wa.me/${escape(site.whatsapp)}">Contacter Najoua sur WhatsApp</a>` : ''}
        </div>
      </div>
      <form id="booking-form" aria-describedby="booking-note" hidden>
        <div class="form-grid">
          <label for="name">Votre nom <span aria-hidden="true">*</span>
            <input id="name" name="name" autocomplete="name" required maxlength="100">
          </label>
          <label for="reply">E-mail ou téléphone <span aria-hidden="true">*</span>
            <input id="reply" name="reply" required maxlength="150">
          </label>
          <label for="session">Type de séance <span aria-hidden="true">*</span>
            <select id="session" name="session" required>
              <option value="">Choisir une séance</option>
              ${sessions.map(({ id, title }) => `<option value="${escape(id)}">${escape(title)}</option>`).join('')}
            </select>
          </label>
          <label for="date">Date souhaitée
            <input id="date" name="date" type="date">
          </label>
          <label class="form-wide" for="message">Votre message
            <textarea id="message" name="message" rows="4" maxlength="1200" placeholder="Une occasion, un thème, une idée de décor…"></textarea>
          </label>
          <div class="honeypot" aria-hidden="true">
            <label for="website">Site web</label><input id="website" name="website" tabindex="-1" autocomplete="off">
          </div>
        </div>
        <p class="form-note" id="booking-note">${hasContact
          ? 'Les champs marqués d’un astérisque sont obligatoires. Vérifiez le message dans votre application avant de l’envoyer.'
          : 'L’envoi en ligne sera disponible dès que les coordonnées de Najoua seront renseignées. Vous pouvez préparer et copier votre demande en attendant.'}</p>
        <div class="form-actions">
          ${site.whatsapp ? '<button class="button button-solid" name="channel" value="whatsapp">Ouvrir WhatsApp</button>' : ''}
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
    <h2>Données de réservation</h2>
    <p>${escape(site.legal.privacyPolicy || 'Le formulaire prépare votre message dans votre navigateur. Le site ne conserve aucune demande sur un serveur. Si vous ouvrez un service de messagerie, vous choisissez d’y envoyer votre message.')}</p>
    <h2>Photographies</h2>
    <p>Les photographies présentées sont protégées. Toute réutilisation requiert l’autorisation des titulaires des droits.</p>
    <a class="text-link" href="/">Retour à l’accueil</a>
  </main>`;
}

function metadata(legal) {
  const title = legal ? `Mentions légales et confidentialité | ${site.name}` : `${site.name} | ${site.specialty}${site.city ? ` à ${site.city}` : ''}`;
  const description = legal ? `Informations sur l’édition du site de ${site.name}, les photographies et le formulaire de réservation.` : site.hero.description;
  const photo = photos[site.hero.image];
  const photoPath = `/photos/${photo.file}-${photo.width}.webp`;
  const pageUrl = site.url ? new URL(legal ? '/mentions-legales.html' : '/', site.url).href : '';
  const structured = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.name,
    jobTitle: site.role,
    knowsAbout: site.specialty,
    ...(site.url && { url: site.url }),
    ...(site.city && { workLocation: { '@type': 'Place', name: site.city } }),
  };
  return `<title>${escape(title)}</title>
  <meta name="description" content="${escape(description)}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:site_name" content="${escape(site.name)}">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}">
  ${pageUrl ? `<link rel="canonical" href="${escape(pageUrl)}">
  <meta property="og:url" content="${escape(pageUrl)}">
  <meta property="og:image" content="${escape(new URL(photoPath, site.url).href)}">
  <meta property="og:image:alt" content="${escape(photo.alt)}">` : ''}
  ${legal ? '' : `<script type="application/ld+json">${JSON.stringify(structured).replaceAll('<', '\\u003c')}</script>`}`;
}

export function renderPage(html, legal) {
  const prefix = legal ? '/' : '';
  const main = legal ? legalPage() : `<main id="main">${hero()}${services()}${gallery()}${about()}${experience()}${booking()}</main>`;
  return html.replace('<!-- metadata -->', () => metadata(legal))
    .replace('<!-- content -->', () => `${header(prefix)}${main}${footer(prefix)}`);
}
