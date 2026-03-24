<template>
  <div class="view-wrapper">
    <PageHeader title="Feed" subtitle="Communauté · Fil d'actualité" />

    <ScrollArea>
      <div class="feed-layout">
        <!-- Posts -->
        <div class="feed-list">
          <div
            v-for="(post, i) in feedStore.posts"
            :key="post.id"
            class="feed-card animate-in"
            :class="`delay-${i + 1}`"
          >
            <div class="feed-header">
              <div class="feed-avatar" :style="post.avatarStyle">{{ post.initials }}</div>
              <div>
                <div class="feed-author">{{ post.author }}</div>
                <div class="feed-time">{{ post.time }}</div>
              </div>
            </div>

            <div v-if="post.pr" class="feed-pr">{{ post.pr }}</div>
            <div class="feed-body">{{ post.body }}</div>

            <div v-if="post.workout" class="feed-workout-ref">
              <div class="fwr-icon">{{ post.workout.icon }}</div>
              <div>
                <div class="fwr-name">{{ post.workout.name }}</div>
                <div class="fwr-meta">{{ post.workout.meta }}</div>
              </div>
            </div>

            <div class="feed-actions">
              <span class="feed-action" :class="{ liked: post.liked }" @click="feedStore.toggleLike(post.id)">
                {{ post.liked ? '❤️' : '🤍' }} {{ post.likes }}
              </span>
              <span class="feed-action">💬 {{ post.comments }} commentaires</span>
              <span class="feed-action">↗ Partager</span>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="feed-sidebar">
          <div class="suggest-card animate-in delay-2">
            <div class="sidebar-title">Suggestions</div>
            <div class="suggest-list">
              <div v-for="s in suggestions" :key="s.name" class="suggest-item">
                <div class="feed-avatar sm" :style="s.style">{{ s.initials }}</div>
                <div class="suggest-info">
                  <div class="suggest-name">{{ s.name }}</div>
                  <div class="suggest-sport">{{ s.sport }}</div>
                </div>
                <button class="btn-follow">Suivre</button>
              </div>
            </div>
          </div>

          <div class="suggest-card animate-in delay-3">
            <div class="sidebar-title">Trending 🔥</div>
            <div class="trending-list">
              <div v-for="t in trending" :key="t" class="trending-item">
                <span class="t-tag">{{ t.split('—')[0].trim() }}</span>
                <span class="t-count">{{ t.split('—')[1].trim() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup>
import PageHeader  from '@/components/layout/PageHeader.vue'
import ScrollArea  from '@/components/layout/ScrollArea.vue'
import { useFeedStore } from '@/stores/feed'
import { suggestions, trending } from '@/data'

const feedStore = useFeedStore()
</script>

<style scoped>
.view-wrapper { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }

.feed-layout { display: grid; grid-template-columns: 1fr 280px; gap: 20px; align-items: start; }

.feed-list { display: flex; flex-direction: column; gap: 12px; }

.feed-card {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--r);
  padding: 18px; backdrop-filter: blur(12px); transition: border-color var(--transition);
}
.feed-card:hover { border-color: rgba(255,255,255,0.1); }

.feed-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.feed-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: linear-gradient(135deg, rgba(34,59,101,0.9), rgba(9,31,68,0.9));
  border: 1.5px solid var(--border-mid);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.6rem; font-weight: 700; color: var(--secondary); flex-shrink: 0;
}
.feed-avatar.sm { width: 32px; height: 32px; font-size: 0.55rem; }
.feed-author { font-size: 0.82rem; font-weight: 600; color: var(--text-1); }
.feed-time { font-size: 0.68rem; color: var(--text-3); }

.feed-pr {
  display: inline-flex; align-items: center; gap: 5px;
  background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.2);
  border-radius: 8px; padding: 4px 10px;
  font-size: 0.7rem; font-weight: 600; color: #fbbf24; margin-bottom: 10px;
}
.feed-body { font-size: 0.82rem; color: var(--text-2); line-height: 1.6; margin-bottom: 12px; }

.feed-workout-ref {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; background: rgba(186,242,216,0.04);
  border: 1px solid var(--border); border-radius: 10px; margin-bottom: 12px;
  cursor: pointer; transition: background var(--transition), border-color var(--transition);
}
.feed-workout-ref:hover { background: rgba(186,242,216,0.08); border-color: var(--border-mid); }
.fwr-icon { font-size: 1rem; }
.fwr-name { font-size: 0.78rem; font-weight: 600; color: var(--text-1); }
.fwr-meta { font-size: 0.65rem; color: var(--text-3); }

.feed-actions { display: flex; gap: 16px; }
.feed-action {
  display: flex; align-items: center; gap: 5px;
  font-size: 0.73rem; color: var(--text-3); cursor: pointer;
  transition: color var(--transition); padding: 4px 0;
}
.feed-action:hover { color: var(--secondary-dim); }
.feed-action.liked { color: #f87171; }

/* Sidebar */
.feed-sidebar { display: flex; flex-direction: column; gap: 14px; }
.suggest-card {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--r);
  padding: 16px; backdrop-filter: blur(12px);
}
.sidebar-title { font-size: 0.8rem; font-weight: 600; color: var(--text-1); margin-bottom: 12px; }
.suggest-list { display: flex; flex-direction: column; gap: 10px; }
.suggest-item { display: flex; align-items: center; gap: 10px; }
.suggest-info { flex: 1; min-width: 0; }
.suggest-name { font-size: 0.78rem; font-weight: 600; color: var(--text-1); }
.suggest-sport { font-size: 0.65rem; color: var(--text-3); }
.btn-follow {
  font-size: 0.68rem; font-weight: 600; color: var(--secondary);
  background: rgba(186,242,216,0.08); border: 1px solid var(--border-mid);
  border-radius: 6px; padding: 4px 10px; cursor: pointer; white-space: nowrap;
  transition: all var(--transition);
}
.btn-follow:hover { background: rgba(186,242,216,0.15); border-color: var(--border-act); }

.trending-list { display: flex; flex-direction: column; gap: 8px; }
.trending-item { display: flex; justify-content: space-between; align-items: center; }
.t-tag { font-size: 0.75rem; color: var(--text-2); }
.t-count { font-size: 0.65rem; color: var(--text-3); }
</style>
