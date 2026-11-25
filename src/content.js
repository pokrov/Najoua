export const site = {
  name: 'Najoua Bouziane',
  firstName: 'Najoua',
  lastName: 'Bouziane',
  role: 'Artiste photographe',
  specialty: 'Photographie d’enfants et d’anniversaires',
  city: '',
  url: '',
  instagram: 'https://www.instagram.com/p/DVpHLxpiJmm/',
  email: '',
  whatsapp: '',
  legal: {
    publisher: '',
    hosting: '',
    privacyPolicy: '',
  },
  hero: {
    image: 'safari',
    kicker: 'Photographie d’enfants',
    title: ['L’enfance,', 'en grand.'],
    description: 'Des portraits d’enfants et des anniversaires en images, dans des décors où l’imaginaire prend toute sa place.',
  },
  sessionsIntro: 'Un portrait pour saisir une expression, un anniversaire pour marquer une étape. À chaque séance, son univers.',
  portfolioIntro: 'D’un safari aux tons sauge à un château lilas, quelques scènes photographiées par Najoua.',
  about: {
    image: 'najoua',
    intro: 'Najoua Bouziane est artiste photographe. Dans ses portraits d’enfants, les décors racontent une histoire et laissent place aux gestes spontanés, aux regards et aux éclats de rire.',
    approach: 'Ballons, couleurs et accessoires composent des univers ludiques où chaque enfant a la place d’être lui-même.',
  },
  contactIntro: 'Parlez-moi de l’occasion, du décor qui vous plaît et de la période que vous avez en tête.',
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
};

export const portfolio = ['safari', 'birthday', 'blue'];

export const sessions = [
  {
    id: 'portraits', title: 'Portraits d’enfants', image: 'blue',
    description: 'Des portraits de bébés et d’enfants dans un décor thématique. Les accessoires donnent le ton et les expressions de votre enfant font le reste.',
    price: 'Tarif sur demande',
  },
  {
    id: 'anniversaires', title: 'Anniversaires', image: 'birthday',
    description: 'Une mise en scène autour du gâteau pour garder les bougies, les petits gestes et la joie de la fête en images.',
    price: 'Tarif sur demande',
  },
];

export const faq = [
  ['Comment demander une séance ?', 'Choisissez un type de séance et indiquez la période qui vous convient. La date et les modalités sont à convenir avec Najoua.'],
  ['Puis-je proposer un thème ?', 'Indiquez les couleurs, les personnages ou l’ambiance qui vous plaisent. Décrivez votre idée dans le message pour savoir si elle peut être réalisée.'],
  ['Que comprend une séance ?', 'Demandez le détail de la prestation et un devis en précisant le type de séance. Vous pourrez aussi vérifier la durée, les accessoires et le nombre de photos livrées.'],
  ['Que préparer pour le jour des photos ?', 'Précisez l’âge de votre enfant et renseignez-vous sur les tenues, les accessoires et, pour un anniversaire, le gâteau avant le rendez-vous.'],
];
