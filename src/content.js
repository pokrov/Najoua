export const site = {
  name: 'Najoua Bouziane',
  firstName: 'Najoua',
  lastName: 'Bouziane',
  role: 'Photographe événementielle',
  specialty: 'Photographie événementielle',
  city: '',
  serviceArea: '',
  phone: '',
  hours: '',
  url: '',
  instagram: 'https://www.instagram.com/p/DVpHLxpiJmm/',
  email: '',
  whatsapp: '',
  legal: {
    publisher: '',
    hosting: '',
    privacyPolicy: '',
    galleryPrivacy: '',
  },
  hero: {
    image: 'safariFamille',
    shareImage: '/photos/anniversaire-safari-famille-760.webp',
    description: 'Des images qui racontent votre événement, des grands moments aux détails que vous n’avez pas vus.',
  },
  services: {
    title: 'Reportage photographique',
    description: 'Parlons de votre événement, du lieu et des moments que vous souhaitez garder en images. Najoua vous proposera un reportage adapté à votre projet.',
    price: 'Tarif sur demande',
  },
  about: {
    image: 'najoua',
    intro: 'Pendant votre événement, je photographie aussi ce qui se passe autour du moment principal : un regard, un geste, une réaction dans la salle.',
  },
  contactIntro: 'Indiquez la date, le lieu et les moments que vous aimeriez retrouver en images.',
};

export const photos = {
  safari: {
    file: 'portrait-enfant-safari', width: 914, height: 1186,
    alt: 'Petite fille en robe vert sauge et couronne de fleurs dans un décor de safari',
    caption: 'Un safari tout en douceur',
  },
  birthday: {
    file: 'anniversaire-chateau', width: 843, height: 1165,
    alt: 'Enfant en robe bleue devant un gâteau et un château aux tons lilas',
    caption: 'Un anniversaire de conte',
  },
  blue: {
    file: 'portrait-bebe-bleu', width: 1290, height: 828,
    alt: 'Bébé en nœud papillon et lunettes de soleil entouré de ballons bleus',
    caption: 'Un petit personnage en bleu',
  },
  najoua: {
    file: 'najoua-bouziane-studio', width: 906, height: 1202,
    alt: 'Najoua Bouziane en voile taupe dans un studio photo, derrière une pancarte manuscrite',
    caption: 'Najoua au studio',
  },
  turquoise: {
    file: 'portrait-decor-turquoise', width: 1440, height: 1920,
    alt: 'Une femme et une enfant en noir dans un décor turquoise', caption: 'Duo en bleu turquoise',
  },
  safariFamille: {
    file: 'anniversaire-safari-famille', width: 1440, height: 1920,
    alt: 'Une femme et deux enfants autour d’un gâteau dans un décor safari', caption: 'Autour du gâteau safari',
  },
  accessoiresRoses: {
    file: 'portrait-accessoires-roses', width: 1440, height: 1920,
    alt: 'Une femme en veste noire tient une coupe remplie de brosses roses', caption: 'Portrait aux accessoires roses',
  },
  terracotta: {
    file: 'portrait-terracotta', width: 1440, height: 1920,
    alt: 'Une femme en tulle terracotta pose les mains sur son ventre', caption: 'Portrait en terracotta',
  },
  gateauNoir: {
    file: 'portrait-gateau-noir', width: 1170, height: 1170,
    alt: 'Une femme en robe noire regarde le gâteau qu’elle tient à la main', caption: 'Portrait au gâteau',
  },
  anniversaireRose: {
    file: 'anniversaire-rose', width: 1440, height: 1920,
    alt: 'Une femme et une enfant en rose près d’un gâteau d’anniversaire', caption: 'Un premier anniversaire en rose',
  },
  fleurs: {
    file: 'portrait-bebe-fleuri', width: 1440, height: 961,
    alt: 'Un nouveau-né endormi au milieu de fleurs et de papillons', caption: 'Un portrait parmi les fleurs',
  },
  noirEtOr: {
    file: 'anniversaire-noir-et-or', width: 1440, height: 1920,
    alt: 'Une femme en robe noire tient des ballons noirs et dorés à côté d’un gâteau d’anniversaire',
    caption: 'Un anniversaire en noir et or',
  },
};

export const signature = ['turquoise', 'terracotta', 'noirEtOr', 'fleurs'];

export const reportages = [
  { id: 'safari', title: 'Un anniversaire safari', images: ['safariFamille', 'safari'] },
];

export const selection = [
  'anniversaireRose', 'birthday', 'blue',
  'gateauNoir', 'accessoiresRoses',
];

export const presentation = {
  hero: { safariFamille: ['full', '50% 75%'] },
  about: { najoua: ['print', '50% 50%'] },
  signature: { turquoise: ['print', '50% 93%'], terracotta: ['full', '50% 55%'], noirEtOr: ['print', '50% 100%'], fleurs: ['line', '50% 48%'] },
  portfolio: { safariFamille: ['full', '50% 80%'], safari: ['full', '50% 90%'], anniversaireRose: ['line', '50% 55%'], birthday: ['full', '50% 68%'], blue: ['line', '65% 50%'], gateauNoir: ['print', '50% 50%'], accessoiresRoses: ['line', '50% 42%'] },
};

export const faq = [
  ['Comment présenter mon projet ?', 'Indiquez le type d’événement, la date si elle est fixée, la ville ou le lieu et les moments que vous souhaitez photographier.'],
  ['Comment demander un devis ?', 'Précisez le déroulement prévu et les moments à couvrir. La disponibilité, le tarif et les modalités sont à convenir avec Najoua.'],
  ['Et si je n’ai pas encore choisi le lieu ?', 'Vous pouvez indiquer la ville envisagée ou préciser que le lieu reste à confirmer dans votre message.'],
  ['Comment accéder à ma galerie ?', 'Ouvrez le lien transmis par Najoua et saisissez le code reçu pour consulter et télécharger les fichiers de votre événement.'],
];
