<script setup>
import { computed, ref, watch, watchEffect } from 'vue'

// 과제 2: 과제 1의 Mock 데이터를 Composition API 반응형 상태로 확장
const weatherList = ref([
  { id: 'city_01', name: '서울', temp: 28, status: '맑음', emoji: '☀️' },
  { id: 'city_02', name: '수원', temp: 24, status: '비', emoji: '🌧️' },
  { id: 'city_03', name: '부산', temp: 26, status: '구름', emoji: '☁️' },
])
const searchQuery = ref('')
const selectedCityInfo = ref('카드를 클릭하거나 검색해 보세요.')

const filteredWeatherList = computed(() => {
  const query = searchQuery.value.trim()
  if (!query) return weatherList.value
  return weatherList.value.filter((item) => item.name.includes(query))
})

watch(selectedCityInfo, (message) => {
  console.log(`[과제 2 watch] ${message}`)
})

watchEffect(() => {
  console.log(`[과제 2 watchEffect] 현재 검색어: ${searchQuery.value || '전체'}`)
})
</script>

<template>
  <main class="practice-page">
    <header>
      <p>SKALA VUE · PRACTICE 2</p>
      <h1>Composition API 날씨 검색</h1>
    </header>

    <section class="search-box">
      <label for="composition-search">도시 검색</label>
      <input id="composition-search" :value="searchQuery" placeholder="서울, 수원, 부산" @input="searchQuery = $event.target.value" />
      <span>검색 중인 도시: <strong>{{ searchQuery || '전체' }}</strong></span>
    </section>

    <section class="weather-grid" aria-label="검색된 도시별 날씨">
      <article v-for="item in filteredWeatherList" :key="item.id" class="weather-card" @click="selectedCityInfo = `${item.name}이 선택되었습니다.`">
        <span aria-hidden="true">{{ item.emoji }}</span>
        <h2>{{ item.name }} · {{ item.status }}</h2>
        <strong>{{ item.temp }}℃</strong>
        <p v-if="item.temp >= 25" class="hot">🔥 더움 (25도 이상)</p>
        <p v-else class="cool">❄️ 선선함 (25도 미만)</p>
      </article>
      <p v-if="filteredWeatherList.length === 0" class="empty">검색 결과와 일치하는 도시가 없습니다.</p>
    </section>

    <div class="status-bar" role="status">{{ selectedCityInfo }}</div>
  </main>
</template>

<style scoped>
.practice-page {
  width: min(900px, calc(100% - 32px));
  margin: 0 auto;
  padding: 54px 0;
  color: #26364a;
}

header p {
  margin: 0;
  color: #3182f6;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.12em;
}

h1 {
  margin: 8px 0 22px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  margin-bottom: 16px;
  background: #fff;
  border: 1px solid #e3e9ef;
  border-radius: 14px;
}

.search-box label {
  font-weight: 800;
}

.search-box input {
  flex: 1;
  min-width: 0;
  padding: 10px;
  border: 1px solid #dfe5ec;
  border-radius: 8px;
}

.search-box span {
  color: #6b7684;
  font-size: 0.8rem;
}

.weather-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.weather-card {
  padding: 20px;
  background: #fff;
  border: 1px solid #e3e9ef;
  border-radius: 16px;
  cursor: pointer;
}

.weather-card h2 {
  font-size: 1rem;
}

.weather-card > strong {
  font-size: 2rem;
}

.hot,
.cool {
  font-size: 0.75rem;
  font-weight: 800;
}

.hot {
  color: #e4572e;
}

.cool {
  color: #2774e8;
}

.empty {
  grid-column: 1 / -1;
  padding: 32px;
  text-align: center;
  background: #fff;
  border-radius: 16px;
}

.status-bar {
  padding: 11px;
  margin-top: 16px;
  color: #16715c;
  font-weight: 750;
  text-align: center;
  background: #ecfbf5;
  border-radius: 10px;
}

@media (max-width: 680px) {
  .search-box {
    align-items: stretch;
    flex-direction: column;
  }

  .weather-grid {
    grid-template-columns: 1fr;
  }
}
</style>
