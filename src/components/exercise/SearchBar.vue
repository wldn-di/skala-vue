<script setup>
defineProps({
  currentQuery: {
    type: String,
    default: '',
  },
  variant: {
    type: String,
    default: 'simple',
    validator: (value) => ['simple', 'dashboard'].includes(value),
  },
  loading: {
    type: Boolean,
    default: false,
  },
  showRefresh: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update-query', 'refresh'])
</script>

<template>
  <div class="search-bar" :class="`is-${variant}`">
    <h3 v-if="variant === 'simple'">🔍 도시 검색</h3>
    <label v-else for="city-search">도시 검색</label>

    <div class="search-input">
      <span v-if="variant === 'dashboard'" aria-hidden="true">⌕</span>
      <input
        :id="variant === 'dashboard' ? 'city-search' : undefined"
        :type="variant === 'dashboard' ? 'search' : 'text'"
        :value="currentQuery"
        placeholder="한글 도시명 검색"
        @input="$emit('update-query', $event.target.value)"
      />
    </div>

    <p>
      검색 중인 도시: <strong>{{ currentQuery || '전체' }}</strong>
    </p>
    <button v-if="showRefresh" class="refresh-button" type="button" :disabled="loading" aria-label="전국 실시간 날씨 새로고침" @click="$emit('refresh')">↻</button>
  </div>
</template>

<style scoped>
.search-bar h3 {
  margin-top: 0;
}

.search-bar.is-simple input {
  width: 90%;
  padding: 8px;
  font-size: 14px;
}

.search-bar.is-dashboard {
  display: flex;
  align-items: center;
  gap: 8px;
}

.is-dashboard > label {
  color: #6b7684;
  font-size: 0.68rem;
  font-weight: 800;
}

.is-dashboard .search-input {
  display: flex;
  align-items: center;
  width: 250px;
  height: 40px;
  padding: 0 9px;
  background: #f7f9fb;
  border: 1px solid #dfe5ec;
  border-radius: 10px;
}

.is-dashboard .search-input span {
  color: #8b95a1;
  font-size: 1rem;
}

.is-dashboard .search-input input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0 6px;
  color: #333d4b;
  font-size: 0.75rem;
  background: transparent;
  border: 0;
  outline: none;
}

.is-dashboard > p {
  min-width: 125px;
  margin: 0;
  color: #8b95a1;
  font-size: 0.68rem;
}

.is-dashboard strong {
  color: #3182f6;
}

.refresh-button {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  color: #3182f6;
  background: #eef6ff;
  border: 0;
  border-radius: 9px;
}

.refresh-button:disabled {
  color: #8b95a1;
}

@media (max-width: 680px) {
  .search-bar.is-dashboard {
    flex-wrap: wrap;
    width: 100%;
  }

  .is-dashboard .search-input {
    flex: 1;
  }
}
</style>
