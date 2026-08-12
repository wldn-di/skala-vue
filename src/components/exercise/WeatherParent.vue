<script setup>
import { computed, ref, watch, watchEffect } from 'vue'

import BaseDashboardCard from './BaseDashboardCard.vue'
import SearchBar from './SearchBar.vue'
import WeatherCard from './WeatherCard.vue'
import WeatherStatusBar from './WeatherStatusBar.vue'

// 과제 3: 모든 반응형 데이터와 비즈니스 로직은 부모가 소유합니다.
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

watch(selectedCityInfo, (message) => console.log(`[과제 3 watch] ${message}`))
watchEffect(() => console.log(`[과제 3 watchEffect] 현재 검색어: ${searchQuery.value || '전체'}`))

const selectWeather = (city) => {
  selectedCityInfo.value = `${city.name}이 선택되었습니다.`
}

const showDetail = (city) => {
  window.alert(`${city.name}의 현재 날씨는 [${city.status}] 상태입니다.`)
}
</script>

<template>
  <main class="practice-page">
    <header>
      <p>SKALA VUE · PRACTICE 3</p>
      <h1>컴포넌트로 분리한 날씨 대시보드</h1>
    </header>

    <BaseDashboardCard>
      <SearchBar :current-query="searchQuery" @update-query="searchQuery = $event" />
    </BaseDashboardCard>

    <BaseDashboardCard>
      <h2>🏙️ 지역별 날씨 현황</h2>
      <div class="weather-grid">
        <WeatherCard v-for="item in filteredWeatherList" :key="item.id" :city-item="item" @select-card="selectWeather" @click-detail="showDetail" />
      </div>
      <p v-if="filteredWeatherList.length === 0" class="empty">검색 결과와 일치하는 도시가 없습니다.</p>
    </BaseDashboardCard>

    <WeatherStatusBar :message="selectedCityInfo" />
  </main>
</template>

<style scoped>
.practice-page {
  width: min(800px, calc(100% - 32px));
  margin: 0 auto;
  padding: 54px 0;
  color: #40513b;
}

header > p {
  margin: 0;
  color: #a86412;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.12em;
}

h1 {
  margin: 8px 0 22px;
}

h2 {
  margin-top: 0;
  font-size: 1rem;
}

.weather-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.empty {
  padding: 20px;
  color: #e74c3c;
  text-align: center;
}

@media (max-width: 680px) {
  .weather-grid {
    grid-template-columns: 1fr;
  }
}
</style>
