# Najoua Bouziane — Photographie

Site vitrine en français. Vite génère le HTML des pages à partir de la configuration. Le navigateur charge un script léger pour le menu, la visionneuse et la réservation.

## Lancer et vérifier

Utiliser Node.js 22.12 ou une version ultérieure compatible avec Vite.

```sh
npm ci
npm run dev
npm run build
npm run preview
```

La commande de développement affiche l’URL locale. La prévisualisation utilise le dernier dossier `dist/` généré.

## Modifier le contenu

- **Textes et liens** — Modifier `src/content.js` pour changer le nom, la ville, la présentation, la FAQ ou le lien Instagram.
- **Séances** — Modifier `sessions`. Chaque fiche et le formulaire partagent le même identifiant. La propriété `price` est le libellé affiché sur la fiche.
- **Photos** — Ajouter les variantes WebP dans `public/photos/` avec le même préfixe et les suffixes `-420`, `-760` et `-<largeur originale>`. Mettre à jour `photos` avec le préfixe, les dimensions de la variante la plus grande, un texte alternatif et une légende. Utiliser une source d’au moins 760 pixels de large. La liste `portfolio` détermine l’ordre de la galerie. Modifier `site.hero.image`, `site.about.image` ou la propriété `image` d’une séance pour changer la photo correspondante. Les quatre originaux restent dans leur emplacement d’origine.
- **Réservation** — Renseigner `email` et/ou `whatsapp` après confirmation. Pour WhatsApp, saisir le numéro international en chiffres, sans signe `+` ni espaces. Le formulaire valide les champs et prépare le message dans l’application choisie. L’envoi final est effectué par le visiteur. Tant que les deux champs sont vides, le visiteur peut copier son brouillon.
- **Publication et référencement** — Mettre l’origine HTTPS du site dans `url`, par exemple `https://exemple.fr`. La ville est facultative et ne doit être ajoutée qu’après confirmation. Compléter `legal.publisher`, `legal.hosting` et `legal.privacyPolicy` avec les informations applicables.

## Déployer

Après avoir renseigné les informations dans [CONTENT_TODO.md](CONTENT_TODO.md), lancer `npm ci` puis `npm run build`. Publier le contenu de `dist/` à la racine du domaine chez un hébergeur statique. Le site fonctionne sans serveur applicatif. Une fois le domaine configuré, le build inclut les URL canoniques, l’image Open Graph et le sitemap.

Vérifier sur l’URL publique l’ouverture de la messagerie choisie, la page de mentions légales et l’aperçu du partage.
