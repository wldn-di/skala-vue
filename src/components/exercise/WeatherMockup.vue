<script setup>
// 과제 1: Vue 기본 문법으로 만드는 독립적인 날씨 Mockup
const weatherList = [
  { id: 'city_01', name: '서울', temp: 28, status: '맑음', emoji: '☀️' },
  { id: 'city_02', name: '수원', temp: 24, status: '비', emoji: '🌧️' },
  { id: 'city_03', name: '부산', temp: 26, status: '구름', emoji: '☁️' },
]
</script>

<template>
  <main class="practice-page">
    <header>
      <p>SKALA VUE · PRACTICE 1</p>
      <h1>오늘의 도시 날씨</h1>
      <span>Mock 데이터로 만든 첫 번째 날씨 화면입니다.</span>
    </header>

    <section class="weather-grid" aria-label="도시별 날씨">
      <article v-for="item in weatherList" :key="item.id" class="weather-card">
        <span class="weather-icon" aria-hidden="true">{{ item.emoji }}</span>
        <h2>{{ item.name }}</h2>
        <strong>{{ item.temp }}℃</strong>
        <p>{{ item.status }}</p>
        <span v-if="item.temp >= 25" class="temperature hot">🔥 더움 (25도 이상)</span>
        <span v-else class="temperature cool">❄️ 선선함 (25도 미만)</span>
      </article>
    </section>
  </main>
</template>

<style scoped>
.practice-page {
  width: min(900px, calc(100% - 32px));
  margin: 0 auto;
  padding: 64px 0;
  color: #40513b;
}

header {
  margin-bottom: 24px;
}

header p {
  margin: 0;
  color: #a86412;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.12em;
}

h1 {
  margin: 8px 0;
}

header span {
  color: #70766a;
}

.weather-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.weather-card {
  position: relative;
  padding: 24px;
  background: #fff;
  border: 1px solid #e3e9ef;
  border-radius: 20px;
  box-shadow: 0 12px 30px rgba(87, 65, 26, 0.09);
}

.weather-icon {
  position: absolute;
  top: 22px;
  right: 22px;
  font-size: 2rem;
}

h2 {
  margin: 0 0 24px;
  font-size: 1rem;
}

.weather-card > strong {
  font-size: 2.5rem;
  font-weight: 500;
}

.weather-card p {
  margin: 5px 0 20px;
  color: #70766a;
}

.temperature {
  display: inline-block;
  padding: 6px 9px;
  font-size: 0.72rem;
  font-weight: 800;
  background: #f2ede0;
  border-radius: 999px;
}

.hot {
  color: #e4572e;
}

.cool {
  color: #596b47;
}

@media (max-width: 680px) {
  .weather-grid {
    grid-template-columns: 1fr;
  }
}
</style>
