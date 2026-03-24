<template>
  <div class="search-box" :class="{ focused }">
    <span class="search-icon">🔍</span>
    <input
      :value="modelValue"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value)"
      @focus="focused = true"
      @blur="focused = false"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
defineProps({
  modelValue:  { type: String, default: '' },
  placeholder: { type: String, default: 'Rechercher...' },
})
defineEmits(['update:modelValue'])
const focused = ref(false)
</script>

<style scoped>
.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  padding: 9px 14px;
  transition: border-color var(--transition), box-shadow var(--transition);
}
.search-box.focused {
  border-color: var(--border-mid);
  box-shadow: 0 0 0 3px rgba(186,242,216,0.06);
}
.search-icon { font-size: 0.8rem; color: var(--text-3); }
input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--text-1);
  font-size: 0.82rem;
}
input::placeholder { color: var(--text-3); }
</style>
