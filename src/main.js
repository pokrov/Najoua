import '@fontsource/baskervville/400.css';
import '@fontsource/instrument-sans/400.css';
import '@fontsource/instrument-sans/500.css';
import '@fontsource/instrument-sans/600.css';
import './style.css';
import { site } from './content.js';

const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.navigation');
const mobile = window.matchMedia('(max-width: 880px)');

function setMenu(open) {
  menu.setAttribute('aria-expanded', String(open));
  navigation.dataset.open = String(open);
}

menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') === 'false'));
navigation.addEventListener('click', (event) => {
  if (event.target.closest('a') && mobile.matches) {
    const target = document.getElementById(event.target.hash.slice(1));
    setMenu(false);
    if (target) {
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
    }
  }
});
menu.closest('header').addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menu.focus();
  }
});
mobile.addEventListener('change', () => setMenu(false));
document.documentElement.classList.add('enhanced');

const lightbox = document.querySelector('.lightbox');
if (lightbox) {
  const triggers = [...document.querySelectorAll('[data-gallery]')];
  const previous = lightbox.querySelector('[data-previous]');
  const next = lightbox.querySelector('[data-next]');
  let links = [];
  const photo = lightbox.querySelector('img');
  const caption = lightbox.querySelector('figcaption');
  const close = lightbox.querySelector('[data-close]');
  let index;
  let opener;

  function showPhoto(nextIndex) {
    index = (nextIndex + links.length) % links.length;
    const link = links[index];
    photo.alt = link.querySelector('img').alt;
    photo.src = link.href;
    caption.textContent = `${link.closest('figure').querySelector('figcaption').textContent} · ${index + 1} / ${links.length}`;
  }

  for (const link of triggers) {
    link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      event.preventDefault();
      opener = link;
      links = triggers.filter((item) => item.dataset.gallery === link.dataset.gallery);
      previous.hidden = next.hidden = links.length < 2;
      showPhoto(links.indexOf(link));
      lightbox.showModal();
      close.focus();
    });
  }

  close.addEventListener('click', () => lightbox.close());
  previous.addEventListener('click', () => showPhoto(index - 1));
  next.addEventListener('click', () => showPhoto(index + 1));
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showPhoto(index + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  lightbox.addEventListener('close', () => opener?.focus());
}

const form = document.getElementById('booking-form');
if (form) {
  const { name, reply, email, eventType, date, venue, website, draft } = form.elements;
  const status = form.querySelector('.form-status');
  const today = new Date();
  date.min = [today.getFullYear(), today.getMonth() + 1, today.getDate()]
    .map((part) => String(part).padStart(2, '0')).join('-');
  form.hidden = false;

  function validate() {
    name.setCustomValidity(name.value.trim() || !name.value ? '' : 'Indiquez votre nom.');
    const contact = reply.value.trim();
    const isPhone = /^\+?[\d\s().-]+$/.test(contact) && contact.replace(/\D/g, '').length >= 7
      && contact.replace(/\D/g, '').length <= 15;
    reply.setCustomValidity(!reply.value || isPhone ? '' : 'Indiquez un numéro de téléphone ou WhatsApp valide.');
  }

  form.addEventListener('input', () => {
    validate();
    status.textContent = '';
    draft.closest('label').hidden = true;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (website.value.trim()) return;
    validate();
    if (!form.reportValidity()) return;

    const subject = `Demande de reportage · ${eventType.selectedOptions[0].textContent}`;
    const preferredDate = date.value ? new Intl.DateTimeFormat('fr', { dateStyle: 'long', timeZone: 'UTC' })
      .format(new Date(date.value)) : '';
    const message = form.elements.message.value.trim();
    const body = [
      `Bonjour ${site.firstName},`, '', subject, `Nom : ${name.value.trim()}`,
      `Téléphone : ${reply.value.trim()}`,
      ...(email.value.trim() ? [`E-mail : ${email.value.trim()}`] : []),
      ...(preferredDate ? [`Date de l’événement : ${preferredDate}`] : []),
      ...(venue.value.trim() ? [`Ville ou lieu : ${venue.value.trim()}`] : []),
      ...(message ? ['', message] : []),
    ].join('\n');

    const channel = event.submitter?.value;
    if (channel === 'whatsapp') {
      status.textContent = 'Message préparé. Envoyez-le depuis WhatsApp.';
      location.href = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(body)}`;
    } else if (channel === 'email') {
      status.textContent = 'Message préparé. Envoyez-le depuis votre messagerie.';
      location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } else {
      draft.value = body;
      draft.closest('label').hidden = false;
      try {
        await navigator.clipboard.writeText(body);
        status.textContent = 'Votre demande a été copiée.';
      } catch {
        status.textContent = 'Sélectionnez le texte ci-dessous pour le copier.';
        draft.focus();
        draft.select();
      }
    }
  });
}
