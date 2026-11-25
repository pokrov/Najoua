# Najoua Bouziane · Photographie

Vitrine Vite, administration sur `/admin/` et galeries clients sur `/galerie/`. Netlify sert le site et exécute l’API. Supabase fournit les comptes du studio, les tables PostgreSQL et le stockage privé. Le portfolio public utilise les photos fournies au projet.

## Lancer et vérifier

Utiliser Node.js 22.13 ou une version ultérieure compatible avec Vite.

```sh
npm ci
npm run dev
npm run build
npm run preview
npm test
```

Sans configuration Supabase, la vitrine fonctionne et l’espace galeries affiche une indisponibilité explicite. Pour un environnement local complet, démarrer Docker, puis lancer `npx supabase start`. La migration dans `supabase/migrations/` est appliquée au démarrage de la base locale. Les données locales persistent entre les redémarrages. `npx supabase db reset` efface la base locale et rejoue les migrations.

Copier `.env.example` vers `.env`, puis reporter l’URL locale, la clé anonyme ou publiable et la clé de rôle de service locale indiquées par `npx supabase status`. Générer un secret de session propre à cet environnement avec `openssl rand -hex 32`. Redémarrer Vite après modification. L’interface locale utilise les mêmes contrôles serveur que la fonction Netlify. Avec Docker et `.env` configurés, lancer `DELIVERY_INTEGRATION=1 npm test` pour tester Auth, PostgreSQL et Storage avec des fichiers fictifs sur Supabase local.

## Configurer Supabase et Netlify

1. Créer un projet Supabase dédié au studio et choisir sa région de stockage, par exemple une région européenne si elle correspond aux besoins de Najoua. Désactiver les inscriptions publiques dans Auth. Appliquer la migration au projet avec `npx supabase login`, `npx supabase link --project-ref <référence>` et `npx supabase db push`. La migration crée le bucket privé `delivery-private` avec les types autorisés et la politique d’insertion.
2. Dans Authentication → Users, créer manuellement l’utilisateur technique `najoua2026@studio.invalid` (identifiant public de connexion au studio : `Najoua2026`), cocher la confirmation automatique et lui attribuer un mot de passe fort. Récupérer son UUID et exécuter dans le SQL Editor la requête suivante en remplaçant le marqueur. Pour une révocation, supprimer cette ligne et désactiver le compte Supabase.

   ```sql
   insert into public.delivery_admins (user_id) values ('<UUID du compte>');
   ```

3. Dans la configuration Netlify du dépôt GitHub, conserver `main` comme branche de production. `netlify.toml` fixe la commande `npm run build`, le dossier `dist` et les fonctions. Ajouter les variables ci-dessous au contexte **Production** avec accès au runtime **Functions**. Si les aperçus doivent tester les galeries, leur associer un projet Supabase distinct et des secrets distincts. Ne pas versionner `.env` ni préfixer de secret par `VITE_`.
4. Compléter la configuration éditoriale, puis prévoir un essai de bout en bout avec des fichiers fictifs sur le domaine réellement retenu. Vérifier notamment les téléchargements directs et le comportement du navigateur sur mobile.

| Variable | Valeur |
| --- | --- |
| `SUPABASE_URL` | Origine du projet Supabase, sans sous-chemin |
| `SUPABASE_ANON_KEY` | Clé publique `anon` ou `publishable` de ce projet |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé secrète `service_role` ou clé secrète serveur du même projet |
| `DELIVERY_SESSION_SECRET` | Secret aléatoire d’au moins 32 caractères pour signer les sessions clients et protéger les identifiants des compteurs de tentatives |
| `DELIVERY_MAX_FILE_MB` | Plafond par fichier en Mio, 50 par défaut. Aligner le plafond global Supabase et celui du bucket sur la valeur retenue |
| `DELIVERY_RETENTION_DAYS` | Délai proposé avant expiration, 30 jours par défaut |
| `DELIVERY_STORAGE_QUOTA_MB` | Quota indicatif en Mio, facultatif. Le fournisseur applique ses propres quotas |

## Livrer une galerie

1. Ouvrir `/admin/`, se connecter et créer la fiche de la galerie. Choisir sa date d’expiration. Le code peut être saisi ou généré à la création.
2. Sélectionner les photos et vidéos. Chaque transfert affiche sa progression et passe une vérification après arrivée dans le bucket. Si une connexion a coupé la finalisation, sélectionner **Vérifier**. Retirer les fichiers restés incomplets avant de les renvoyer.
3. Utiliser **Voir comme le client**, puis copier le lien et le code. Transmettre le code de préférence par un canal distinct. Le studio peut générer un nouveau code si nécessaire.
4. Le client ouvre le lien et saisit son code. Il peut prévisualiser et télécharger chaque fichier. Un ZIP est proposé pour une galerie d’au plus 100 Mio, constitué dans son navigateur. Les galeries volumineuses restent téléchargeables fichier par fichier.

## Limites et conservation

- Formats JPG, PNG, WebP, MP4 et WebM. Pour la compatibilité vidéo, préférer MP4 H.264/AAC. La lecture dépend du codec et du navigateur. Les transferts se font directement vers Storage, un par un pendant chaque lot, sans reprise automatique. Les fichiers passent une vérification de taille, MIME, extension et signature de format, ce qui ne remplace pas une analyse antivirus.
- Jusqu’à 250 fichiers par galerie. L’usage affiché correspond à la taille totale des fichiers validés. Vérifier le quota et le trafic réel dans Supabase. Le niveau gratuit annonce 1 Go de stockage inclus et un plafond de 50 MB par fichier. Les paiements éventuels dépendent du forfait, du volume stocké et du trafic. Voir la [tarification Supabase](https://supabase.com/pricing) et la [facturation Netlify Functions](https://docs.netlify.com/build/functions/usage-and-billing/).
- À l’expiration ou à la désactivation, l’API bloque les nouveaux accès. Une URL signée déjà délivrée reste utilisable jusqu’à sa propre expiration, au maximum deux minutes. Le compteur d’accès utilise des empreintes d’adresses IP, par fenêtres de 15 minutes. Purger périodiquement ses anciennes lignes avec `delete from public.delivery_attempts where time_bucket < floor(extract(epoch from now() - interval '7 days') / 900);`.
- L’expiration ferme l’accès et ne supprime pas automatiquement la galerie. Le studio doit retirer les galeries arrivées au terme de la conservation depuis l’administration. Une suppression efface d’abord les objets du bucket, puis les données de la galerie. En cas d’interruption, reprendre l’action depuis la fiche.
- Conserver les originaux du studio dans une sauvegarde privée et décider du délai de conservation de cette copie avant ouverture du service. Les sauvegardes PostgreSQL de Supabase ne contiennent pas les fichiers du bucket. Une restauration complète exige une sauvegarde distincte du stockage et une procédure de restauration cohérente des deux. Les copies de sauvegarde suivent leur propre cycle d’effacement. [Sauvegardes Supabase](https://supabase.com/docs/guides/platform/backups)

## Modifier le site vitrine

Les textes, prestations, tarifs, coordonnées, zone, horaires, domaine et mentions éditoriales sont dans `src/content.js`. Les photos publiques utilisent trois tailles WebP et sont déclarées dans `photos`, avec un texte alternatif et une légende. Les listes `signature`, `reportages` et `selection` organisent le collage et le portfolio. Regrouper dans `reportages` les images dont la provenance commune est confirmée. Les huit nouveaux originaux sont conservés localement dans `photo-originals/`, exclu de Git. Renseigner `site.url` pour fixer le domaine canonique. À défaut, un build de production Netlify reprend le domaine fourni par Netlify pour les aperçus de partage et le sitemap. Le formulaire de contact prépare un message que le visiteur envoie dans sa messagerie une fois un e-mail ou WhatsApp renseigné. En attendant, le visiteur peut copier un brouillon. Les informations à obtenir figurent dans [CONTENT_TODO.md](CONTENT_TODO.md).
