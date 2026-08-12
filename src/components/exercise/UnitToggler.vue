<script setup>
import { useConfigStore } from '@/stores/configStore'

const configStore = useConfigStore()
</script>

<template>
  <div class="unit-toggler" aria-label="날씨 온도 단위 설정">
    <span>날씨 단위 <strong>{{ configStore.unitSymbol }}</strong></span>
    <button class="toggle-button" type="button" @click="configStore.toggleUnit">
      {{ configStore.unit === 'celsius' ? '화씨로 보기' : '섭씨로 보기' }}
    </button>
  </div>
</template>

<style scoped>
.unit-toggler {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 8px 9px 8px 12px;
  color: #4e5968;
  font-size: 0.72rem;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #dfe5ec;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(29, 59, 93, 0.14);
}

.unit-toggler strong {
  color: #3182f6;
}

.toggle-button {
  padding: 7px 9px;
  color: #fff;
  font-size: 0.68rem;
  font-weight: 800;
  background: #3182f6;
  border: 0;
  border-radius: 8px;
}
</style>
