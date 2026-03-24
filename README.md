# LiftConnect — Web App

Interface web Vue 3 de LiftConnect.

## Stack

- **Vue 3** (Composition API + `<script setup>`)
- **Vue Router 4** — navigation entre vues
- **Pinia** — gestion d'état (workouts, feed)
- **Vite 5** — bundler

## Lancer le projet

```bash
npm install
npm run dev
```

Puis ouvre [http://localhost:5173](http://localhost:5173)

## Architecture

```
src/
├── assets/
│   └── main.css          # Design tokens + styles globaux
├── components/
│   ├── layout/
│   │   ├── AppLayout.vue     # Wrapper sidebar + main
│   │   ├── AppSidebar.vue    # Navigation latérale
│   │   ├── PageHeader.vue    # En-tête de page (titre + actions)
│   │   └── ScrollArea.vue    # Zone scrollable
│   └── ui/
│       ├── WorkoutCard.vue       # Card entraînement (liste)
│       ├── WorkoutCardGrid.vue   # Card entraînement (grille)
│       ├── SectionHeader.vue     # Titre de section
│       ├── SearchBar.vue         # Barre de recherche
│       └── icons/                # Icônes SVG
├── data/
│   └── index.js          # Données mock (workouts, exercices, feed, groupes)
├── router/
│   └── index.js          # Routes Vue Router
├── stores/
│   ├── workouts.js       # Store Pinia — entraînements + filtres
│   └── feed.js           # Store Pinia — posts + likes
├── views/
│   ├── DashboardView.vue
│   ├── EntrainementsView.vue
│   ├── ExercicesView.vue
│   ├── StatistiquesView.vue
│   ├── FeedView.vue
│   └── GroupesView.vue
├── App.vue
└── main.js
```

## Design system

Toutes les variables CSS sont dans `src/assets/main.css` :

| Variable | Valeur |
|---|---|
| `--secondary` | `#baf2d8` (vert menthe) |
| `--bg` | `#060e1a` |
| `--surface` | `rgba(13,28,58,0.7)` |
| `--font` | `Geist` |
