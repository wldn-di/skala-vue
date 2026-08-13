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
      <el-input
        :id="variant === 'dashboard' ? 'city-search' : undefined"
        :model-value="currentQuery"
        clearable
        placeholder="한글 도시명 검색"
        :aria-label="variant === 'dashboard' ? undefined : '도시 검색'"
        @update:model-value="$emit('update-query', $event)"
      />
    </div>

    <p>
      검색 중인 도시: <strong>{{ currentQuery || '전체' }}</strong>
    </p>
    <el-button v-if="showRefresh" class="refresh-button" circle :loading="loading" aria-label="전국 실시간 날씨 새로고침" @click="$emit('refresh')">↻</el-button>
  </div>
</template>

<style scoped>
.search-bar h3 {
  margin-top: 0;
}

.search-bar.is-simple :deep(.el-input) {
  width: 90%;
  font-size: 14px;
}

.search-bar.is-dashboard {
  display: flex;
  align-items: center;
  gap: 8px;
}

.is-dashboard > label {
  color: #70766a;
  font-size: 0.68rem;
  font-weight: 800;
}

.is-dashboard .search-input {
  display: flex;
  align-items: center;
  width: 250px;
  height: 40px;
  padding: 0 9px;
  background: #fffaf0;
  border: 1px solid #e8dcc1;
  border-radius: 10px;
}

.is-dashboard .search-input span {
  color: #8f9187;
  font-size: 1rem;
}

.is-dashboard .search-input :deep(.el-input) {
  flex: 1;
  min-width: 0;
  height: 100%;
}

.is-dashboard .search-input :deep(.el-input__wrapper) {
  padding: 0 6px;
  color: #364034;
  font-size: 0.75rem;
  background: transparent;
  box-shadow: none;
}

.is-dashboard > p {
  min-width: 125px;
  margin: 0;
  color: #8f9187;
  font-size: 0.68rem;
}

.is-dashboard strong {
  color: #a86412;
}

.refresh-button {
  width: 32px;
  height: 32px;
  color: #40513b;
  background: #edf1e6;
  border: 0 !important;
  border-radius: 9px;
}

.refresh-button:disabled {
  color: #8f9187;
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
