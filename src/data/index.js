// ── Workouts ──────────────────────────────────────────────────
export const workouts = [
  { id: 1,  name: 'Entraînement Prévu',           type: 'push',  duration: 60, exercises: 1, date: '11 février 2026', public: false, likes: 0 },
  { id: 2,  name: 'Push Day — Pectoraux & Triceps',type: 'push',  duration: 63, exercises: 3, date: '10 février 2026', public: true,  likes: 0 },
  { id: 3,  name: 'Entraînement',                  type: 'legs',  duration: 60, exercises: 0, date: '10 février 2026', public: true,  likes: 0 },
  { id: 4,  name: 'Leg Day Intensif',              type: 'legs',  duration: 75, exercises: 3, date: '6 février 2026',  public: true,  likes: 0 },
  { id: 5,  name: 'Pull Day — Dos & Biceps',       type: 'pull',  duration: 60, exercises: 4, date: '6 février 2026',  public: true,  likes: 0 },
  { id: 6,  name: 'Upper Body',                    type: 'upper', duration: 35, exercises: 3, date: '4 février 2026',  public: true,  likes: 0 },
  { id: 7,  name: 'Full Body Circuit',             type: 'full',  duration: 45, exercises: 3, date: '2 février 2026',  public: true,  likes: 0 },
  { id: 8,  name: 'Push Léger',                    type: 'push',  duration: 50, exercises: 2, date: '31 janvier 2026', public: false, likes: 0 },
  { id: 9,  name: 'Jambes Express',                type: 'legs',  duration: 40, exercises: 2, date: '29 janvier 2026', public: true,  likes: 0 },
  { id: 10, name: 'Dos Complet',                   type: 'pull',  duration: 70, exercises: 3, date: '27 janvier 2026', public: true,  likes: 0 },
  { id: 11, name: 'Séance Épaules',               type: 'upper', duration: 43, exercises: 2, date: '15 janvier 2026', public: true,  likes: 0 },
]

export const typeLabels = {
  push:  'Push',
  pull:  'Pull',
  legs:  'Jambes',
  full:  'Full Body',
  upper: 'Haut du corps',
}

// ── Exercises ─────────────────────────────────────────────────
export const exercises = [
  { id: 1,  name: 'Développé couché',    muscle: 'Pectoraux · Triceps',      type: 'push',  icon: '🏋️', uses: 12 },
  { id: 2,  name: 'Curl biceps',         muscle: 'Biceps',                   type: 'pull',  icon: '💪', uses: 8  },
  { id: 3,  name: 'Squat',              muscle: 'Quadriceps · Fessiers',    type: 'legs',  icon: '🦵', uses: 9  },
  { id: 4,  name: 'Tractions',          muscle: 'Dos · Biceps',             type: 'pull',  icon: '🔝', uses: 6  },
  { id: 5,  name: 'Développé militaire',muscle: 'Épaules · Triceps',        type: 'push',  icon: '⬆️', uses: 7  },
  { id: 6,  name: 'Soulevé de terre',   muscle: 'Dos · Ischio · Fessiers',  type: 'pull',  icon: '🏃', uses: 5  },
  { id: 7,  name: 'Dips',              muscle: 'Triceps · Pectoraux',       type: 'push',  icon: '🤸', uses: 4  },
  { id: 8,  name: 'Rowing barre',       muscle: 'Dos · Biceps',             type: 'pull',  icon: '🧗', uses: 5  },
  { id: 9,  name: 'Presse à cuisses',   muscle: 'Quadriceps · Fessiers',    type: 'legs',  icon: '🦶', uses: 3  },
]

export const muscleGroups = ['Tous', 'Pectoraux', 'Dos', 'Épaules', 'Biceps', 'Triceps', 'Jambes', 'Abdos', 'Cardio']

// ── Stats ─────────────────────────────────────────────────────
export const statsKpis = [
  { value: '11',    label: 'Séances totales',        delta: '↑ +3 vs période préc.' },
  { value: '10h',   label: "Temps d'entraînement",   delta: '↑ +1h30 vs période préc.' },
  { value: '57 min',label: 'Durée moyenne',          delta: '→ Stable' },
  { value: '26',    label: 'Exercices réalisés',     delta: '↑ +8 vs période préc.' },
]

export const weeklyBars = [
  { label: 'S1', height: 30 }, { label: 'S2', height: 60 }, { label: 'S3', height: 45 },
  { label: 'S4', height: 80, highlight: true }, { label: 'S5', height: 55 }, { label: 'S6', height: 70 },
  { label: 'S7', height: 40 }, { label: 'S8', height: 90, highlight: true }, { label: 'S9', height: 65 },
  { label: 'S10', height: 50 }, { label: 'S11', height: 85, highlight: true }, { label: 'S12', height: 35 },
]

export const typeDistribution = [
  { label: 'Push',     pct: 40, color: '#f97316' },
  { label: 'Pull',     pct: 25, color: '#60a5fa' },
  { label: 'Jambes',   pct: 21, color: '#a78bfa' },
  { label: 'Full Body',pct: 14, color: '#34d399' },
]

export const prs = [
  { exercise: 'Développé couché', value: '100 kg', date: '6 fév. 2026' },
  { exercise: 'Squat',           value: '140 kg', date: '10 fév. 2026' },
  { exercise: 'Soulevé de terre',value: '160 kg', date: '3 fév. 2026' },
  { exercise: 'Dév. militaire',  value: '80 kg',  date: '11 fév. 2026' },
]

// ── Feed ──────────────────────────────────────────────────────
export const feedPosts = [
  {
    id: 1,
    initials: 'MK',
    author: 'Marie Keller',
    time: 'Il y a 23 min',
    pr: '🏆 Nouveau PR — Développé couché',
    body: '110 kg aujourd\'hui, jamais fait ça de ma vie 🔥 La progression est réelle, 3 mois de boulot qui payent enfin !',
    workout: { icon: '🏋️', name: 'Push Day — Pectoraux', meta: '⏱ 68 min · 4 exercices' },
    likes: 24,
    comments: 8,
    liked: true,
    avatarStyle: '',
  },
  {
    id: 2,
    initials: 'JB',
    author: 'Jordan Blanc',
    time: 'Il y a 1h',
    pr: null,
    body: 'Leg day intensif terminé, les jambes en feu mais l\'état d\'esprit au top 💪 Qui est partant pour une session groupe ce weekend ?',
    workout: { icon: '🦵', name: 'Leg Day Intensif', meta: '⏱ 75 min · 5 exercices' },
    likes: 11,
    comments: 5,
    liked: false,
    avatarStyle: 'background:linear-gradient(135deg,rgba(59,101,34,0.9),rgba(31,68,9,0.9))',
  },
  {
    id: 3,
    initials: 'SR',
    author: 'Sofia Ramos',
    time: 'Il y a 3h',
    pr: null,
    body: '30 jours de streak ! 🔥🔥🔥 Un mois sans rater une seule séance. Merci à tous les membres du groupe "Paris Lifters" pour la motivation quotidienne !',
    workout: null,
    likes: 47,
    comments: 19,
    liked: true,
    avatarStyle: 'background:linear-gradient(135deg,rgba(101,34,59,0.9),rgba(68,9,31,0.9))',
  },
  {
    id: 4,
    initials: 'AL',
    author: 'Alex Laurent',
    time: 'Il y a 5h',
    pr: null,
    body: 'Pull day rapide avant le boulot. 45 min, efficace. Je recommande vraiment les tractions lestées si vous stagnez sur le dos 🙌',
    workout: { icon: '💪', name: 'Pull Express', meta: '⏱ 45 min · 3 exercices' },
    likes: 6,
    comments: 2,
    liked: false,
    avatarStyle: '',
  },
]

export const suggestions = [
  { initials: 'TC', name: 'Thomas C.',  sport: 'Powerlifting · Paris',     style: '' },
  { initials: 'NP', name: 'Nina P.',    sport: 'CrossFit · Lyon',          style: 'background:linear-gradient(135deg,rgba(101,34,59,0.9),rgba(68,9,31,0.9))' },
  { initials: 'RD', name: 'Romain D.', sport: 'Haltérophilie · Bordeaux', style: 'background:linear-gradient(135deg,rgba(34,101,59,0.9),rgba(9,68,31,0.9))' },
]

export const trending = ['#PushDay — 342 posts', '#LegDay — 218 posts', '#NouveauPR — 194 posts', '#30JoursStreak — 87 posts', '#ParisLifters — 63 posts']

// ── Groups ────────────────────────────────────────────────────
export const groups = [
  {
    id: 1,
    name: 'Paris Lifters',
    sport: 'Musculation',
    icon: '🏋️',
    desc: 'Le groupe des passionnés de musculation à Paris. Séances communes chaque samedi matin au Viaduc. Tous niveaux bienvenus !',
    members: 128,
    memberInitials: ['MK', 'JB', 'SR', '+'],
    color: '#f97316',
    bg: 'rgba(249,115,22,0.1)',
    border: 'rgba(249,115,22,0.2)',
  },
  {
    id: 2,
    name: 'CrossFit Crew IDF',
    sport: 'CrossFit',
    icon: '⚡',
    desc: 'Les aficionados du CrossFit en Île-de-France. WOD du jour, challenges, et suivi de performance en communauté.',
    members: 74,
    memberInitials: ['AL', 'TC', '+'],
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.1)',
    border: 'rgba(96,165,250,0.2)',
  },
  {
    id: 3,
    name: 'Powerlifting FR',
    sport: 'Powerlifting',
    icon: '🎯',
    desc: 'Communauté nationale dédiée au powerlifting. Partage de PRs, programmations et conseils techniques.',
    members: 312,
    memberInitials: ['RD', 'NP', '+'],
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.1)',
    border: 'rgba(167,139,250,0.2)',
  },
]

// ── Dashboard ─────────────────────────────────────────────────
export const dashboardStats = [
  { value: '11',  label: 'Total entraînements', sub: 'ce mois',          icon: '📈', color: '#baf2d8' },
  { value: '0',   label: 'Cette semaine',        sub: '0 minutes',        icon: '🗓', color: '#60a5fa' },
  { value: '10h', label: 'Temps total',          sub: '325 minutes',      icon: '⏱', color: '#f97316' },
  { value: '26',  label: 'Exercices',            sub: 'réalisés',         icon: '🏋️', color: '#a78bfa' },
  { value: '4',   label: 'Série',                sub: 'jours consécutifs',icon: '🔥', color: '#fbbf24' },
]

export const weekDays = [
  { name: 'Lun', date: '9 mars',  hasWorkout: true,  today: false },
  { name: 'Mar', date: '10 mars', hasWorkout: true,  today: false },
  { name: 'Mer', date: '11 mars', hasWorkout: false, today: false },
  { name: 'Jeu', date: '12 mars', hasWorkout: false, today: false },
  { name: 'Ven', date: '13 mars', hasWorkout: true,  today: false },
  { name: 'Sam', date: '14 mars', hasWorkout: true,  today: false },
  { name: 'Dim', date: '15 mars', hasWorkout: false, today: true  },
]

export const quickActions = [
  { icon: '+',  title: 'Nouvel entraînement', sub: 'Créer une session',      primary: true },
  { icon: '🏋️', title: 'Exercices',           sub: 'Gérer la bibliothèque',  primary: false },
  { icon: '📊', title: 'Statistiques',        sub: 'Voir ma progression',    primary: false },
  { icon: '💬', title: 'Feed social',         sub: 'Voir la communauté',     primary: false },
]

export const miniStats = [
  { label: 'Durée moyenne',    value: '57 min' },
  { label: 'Ce mois-ci',       value: '0 séances' },
  { label: 'Type favori',      value: 'Push', highlight: true },
  { label: 'Meilleure semaine',value: '4 séances' },
]
