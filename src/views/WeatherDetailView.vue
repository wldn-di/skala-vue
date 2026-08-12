<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { weatherList } from '../components/exercise/weatherMockData'
import { useConfigStore } from '../stores/configStore'

const route = useRoute()
const router = useRouter()
const configStore = useConfigStore()

const cityData = computed(() => weatherList.find((item) => item.id === route.params.cityId) ?? null)
const convertTemp = (temp) => (configStore.unit === 'fahrenheit' ? Math.round((temp * 9) / 5 + 32) : temp)
const displayTemp = computed(() => {
  if (!cityData.value) return null
  return convertTemp(cityData.value.temp)
})
</script>

<template>
  <main class="detail-page">
    <section v-if="cityData" class="detail-card">
      <header>
        <span aria-hidden="true">{{ cityData.emoji }}</span>
        <div>
          <p>REGION WEATHER DETAIL</p>
          <h1>{{ cityData.fullName }}</h1>
        </div>
      </header>

      <div class="temperature">
        <strong>{{ displayTemp }}{{ configStore.unitSymbol }}</strong>
        <span>{{ cityData.status }}</span>
      </div>

      <dl>
        <div><dt>최고 / 최저</dt><dd>{{ convertTemp(cityData.high) }}{{ configStore.unitSymbol }} / {{ convertTemp(cityData.low) }}{{ configStore.unitSymbol }}</dd></div>
        <div><dt>습도</dt><dd>{{ cityData.humidity }}%</dd></div>
        <div><dt>강수 확률</dt><dd>{{ cityData.rainChance }}%</dd></div>
        <div><dt>풍속</dt><dd>{{ cityData.wind }}m/s</dd></div>
      </dl>
    </section>

    <section v-else class="detail-card empty">
      <span aria-hidden="true">🌤️</span>
      <h1>도시 정보를 찾을 수 없습니다.</h1>
      <p>전국날씨 목록에서 존재하는 지역을 선택해 주세요.</p>
    </section>

    <button class="back-button" type="button" @click="router.back()">← 이전 화면으로 돌아가기</button>
  </main>
</template>

<style scoped>
.detail-page {
  width: min(720px, calc(100% - 32px));
  margin: 0 auto;
  padding: 70px 0;
  color: #40513b;
}

.detail-card {
  padding: 30px;
  background: #fffaf0;
  border: 1px solid #e6d8b9;
  border-radius: 24px;
  box-shadow: 0 14px 40px rgba(87, 65, 26, 0.11);
}

header {
  display: flex;
  align-items: center;
  gap: 14px;
}

header > span {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  font-size: 2rem;
  background: #fff0bd;
  border: 1px solid #e5ca74;
  border-radius: 18px;
}

header p {
  margin: 0;
  color: #a86412;
  font-size: 0.65rem;
  font-weight: 900;
  letter-spacing: 0.1em;
}

h1 {
  margin: 5px 0 0;
}

.temperature {
  display: flex;
  align-items: baseline;
  gap: 14px;
  padding: 34px 0;
}

.temperature strong {
  font-size: 3.5rem;
  font-weight: 450;
}

.temperature span {
  color: #70766a;
}

dl {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin: 0;
}

dl div {
  padding: 14px;
  background: #f3eddf;
  border-radius: 12px;
}

dt {
  color: #8f9187;
  font-size: 0.7rem;
}

dd {
  margin: 5px 0 0;
  font-weight: 800;
}

.empty {
  text-align: center;
}

.empty > span {
  font-size: 3rem;
}

.empty p {
  color: #70766a;
}

.back-button {
  padding: 10px 14px;
  margin-top: 16px;
  color: #fff;
  font-weight: 800;
  background: #40513b;
  border: 0;
  border-radius: 10px;
}

@media (max-width: 560px) {
  dl {
    grid-template-columns: 1fr;
  }
}
</style>
