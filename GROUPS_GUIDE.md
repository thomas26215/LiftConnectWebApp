# 🏋️ Gestion des Groupes - Guide d'utilisation

## Architecture

### Fichiers créés

1. **`src/firebase/groups.js`** - Core Firebase utilities et modèle `SportGroup`
   - Fonctions CRUD pour groupes
   - Listeners realtime
   - Gestion des transactions Firestore

2. **`src/composables/useGroups.js`** - Composable Vue pour state management
   - Réactivité Vue 3
   - Loading states
   - Error handling

## Exemples d'utilisation

### 1. Charger mes groupes

```vue
<script setup>
import { useGroups } from '@/composables/useGroups'
import { onMounted, onBeforeUnmount } from 'vue'

const { myGroups, isLoadingMyGroups, loadMyGroups, cleanup } = useGroups()

onMounted(async () => {
  await loadMyGroups(10) // Limite à 10 groupes
})

onBeforeUnmount(() => {
  cleanup() // Nettoyer les listeners
})
</script>

<template>
  <div v-if="isLoadingMyGroups">Chargement...</div>
  <div v-for="group in myGroups" :key="group.id">
    <h3>{{ group.name }} ({{ group.sport }})</h3>
    <p>{{ group.membersCount }} membres • {{ group.location }}</p>
  </div>
</template>
```

### 2. Découvrir des groupes (avec membership)

```vue
<script setup>
import { useGroups } from '@/composables/useGroups'
import { onMounted, onBeforeUnmount } from 'vue'

const { 
  discoverableGroups, 
  isLoadingDiscoverable,
  loadDiscoverableGroupsWithMembership,
  join,
  isJoiningGroup,
  cleanup 
} = useGroups()

onMounted(async () => {
  await loadDiscoverableGroupsWithMembership({
    limit: 20,
    searchQuery: '',
    onlyPublic: true
  })
})

const handleJoin = async (groupId) => {
  const success = await join(groupId)
  if (success) {
    console.log('✅ Groupe rejoint!')
  }
}

onBeforeUnmount(() => cleanup())
</script>

<template>
  <div v-if="isLoadingDiscoverable">Chargement...</div>
  
  <div v-for="group in discoverableGroups" :key="group.id">
    <h3>{{ group.name }}</h3>
    <p v-if="group.isMember" class="badge">Membre</p>
    <button 
      v-else
      @click="handleJoin(group.id)"
      :disabled="isJoiningGroup"
    >
      Rejoindre
    </button>
  </div>
</template>
```

### 3. Écouter groupes en realtime

```vue
<script setup>
import { useGroups } from '@/composables/useGroups'
import { onMounted, onBeforeUnmount } from 'vue'

const { discoverableGroups, watchDiscoverableGroups, cleanup } = useGroups()

onMounted(() => {
  watchDiscoverableGroups(20) // 20 groupes, mis à jour en temps réel
})

onBeforeUnmount(() => cleanup())
</script>

<template>
  <div v-for="group in discoverableGroups" :key="group.id">
    {{ group.name }} - {{ group.membersCount }} membres
  </div>
</template>
```

### 4. Afficher un groupe spécifique

```vue
<script setup>
import { useGroups } from '@/composables/useGroups'
import { onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({ groupId: String })
const { 
  currentGroup, 
  isCurrentMember,
  loadGroupWithMembership,
  join,
  leave,
  cleanup 
} = useGroups()

onMounted(async () => {
  await loadGroupWithMembership(props.groupId)
})

onBeforeUnmount(() => cleanup())
</script>

<template>
  <div v-if="currentGroup">
    <h2>{{ currentGroup.name }}</h2>
    <p>{{ currentGroup.description }}</p>
    <p>{{ currentGroup.membersCount }} membres</p>
    
    <button 
      v-if="isCurrentMember"
      @click="leave(currentGroup.id)"
    >
      Quitter
    </button>
    <button 
      v-else
      @click="join(currentGroup.id)"
    >
      Rejoindre
    </button>
  </div>
</template>
```

### 5. Créer un groupe

```vue
<script setup>
import { useGroups } from '@/composables/useGroups'
import { ref } from 'vue'

const { createNewGroup, isCreatingGroup, error } = useGroups()

const form = ref({
  name: '',
  sport: '',
  location: '',
  description: '',
  isPrivate: false,
  iconKey: 'groups',
  membersCount: 1,
})

const handleCreate = async () => {
  const groupId = await createNewGroup(form.value)
  if (groupId) {
    console.log('✅ Groupe créé:', groupId)
    // Rediriger vers le groupe
  }
}
</script>

<template>
  <form @submit.prevent="handleCreate">
    <input v-model="form.name" placeholder="Nom du groupe" />
    <input v-model="form.sport" placeholder="Sport (ex: CrossFit)" />
    <input v-model="form.location" placeholder="Localisation" />
    <textarea v-model="form.description" placeholder="Description"></textarea>
    
    <label>
      <input v-model="form.isPrivate" type="checkbox" />
      Groupe privé
    </label>
    
    <button :disabled="isCreatingGroup">
      {{ isCreatingGroup ? 'Création...' : 'Créer' }}
    </button>
    
    <p v-if="error" class="error">{{ error }}</p>
  </form>
</template>
```

## Modèle de données

```typescript
SportGroup {
  id: string              // Firestore doc ID
  name: string            // Nom du groupe
  sport: string           // Sport (CrossFit, Running, etc)
  isPrivate: boolean      // Groupe privé?
  membersCount: number    // Nombre de membres
  location: string        // Localisation
  description: string     // Description
  iconKey: string         // Clé d'icône UI
  isMember?: boolean      // Suis-je membre? (optionnel)
  ownerUid?: string       // UID du créateur
}
```

## Structure Firestore

```
firestore/
├─ groups/
│  ├─ {groupId}/
│  │  ├─ name: string
│  │  ├─ sport: string
│  │  ├─ isPrivate: boolean
│  │  ├─ membersCount: number
│  │  ├─ location: string
│  │  ├─ description: string
│  │  ├─ iconKey: string
│  │  ├─ ownerUid: string (uid du créateur)
│  │  └─ createdAt: timestamp
│
└─ users/
   └─ {uid}/
      └─ groups/
         └─ {groupId}/
            ├─ joinedAt: timestamp
            └─ role: 'owner' | 'member'
```

## Règles Firestore (à configurer)

```javascript
// Groupes: publiques en lecture, writable par créateur
match /groups/{groupId} {
  allow read;
  allow create: if request.auth != null;
  allow update, delete: if request.auth.uid == resource.data.ownerUid;
}

// Membership: writable par utilisateur
match /users/{uid}/groups/{groupId} {
  allow read: if request.auth.uid == uid;
  allow write: if request.auth.uid == uid;
}
```

## Intégration avec GroupesView

```vue
<script setup>
import { useGroups } from '@/composables/useGroups'
import { onMounted, onBeforeUnmount, computed } from 'vue'

const {
  myGroups,
  discoverableGroups,
  isLoadingMyGroups,
  isLoadingDiscoverable,
  hasMyGroups,
  loadMyGroups,
  loadDiscoverableGroupsWithMembership,
  cleanupCleanup,
} = useGroups()

onMounted(async () => {
  await Promise.all([
    loadMyGroups(10),
    loadDiscoverableGroupsWithMembership({ limit: 20 }),
  ])
})

onBeforeUnmount(() => cleanup())

const activeTab = ref('my-groups') // 'my-groups' ou 'discover'
</script>

<template>
  <div class="groups-container">
    <!-- Mes groupes -->
    <div v-show="activeTab === 'my-groups'">
      <div v-if="isLoadingMyGroups">Chargement...</div>
      <div v-else-if="!hasMyGroups">Aucun groupe rejoint.</div>
      <div v-else>
        <GroupCard 
          v-for="group in myGroups"
          :key="group.id"
          :group="group"
        />
      </div>
    </div>

    <!-- Découvrir -->
    <div v-show="activeTab === 'discover'">
      <div v-if="isLoadingDiscoverable">Chargement...</div>
      <div v-else>
        <GroupCard 
          v-for="group in discoverableGroups"
          :key="group.id"
          :group="group"
        />
      </div>
    </div>
  </div>
</template>
```
