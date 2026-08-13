<script setup>
import axios from 'axios'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getCityImageUrl } from '../components/exercise/cityImages'
import { weatherList } from '../components/exercise/weatherMockData'
import { useConfigStore } from '../stores/configStore'

const route = useRoute()
const router = useRouter()
const configStore = useConfigStore()
const forecast = ref([])
const forecastStatus = ref('idle')
const forecastMessage = ref('')
let forecastRequestController = null

const cityData = computed(() => weatherList.find((item) => item.id === route.params.cityId) ?? null)
const cityImageStyle = computed(() => {
  const imageUrl = getCityImageUrl(cityData.value?.id)
  return imageUrl ? { '--city-image': `url("${imageUrl}")` } : {}
})
const convertTemp = (temp) => (configStore.unit === 'fahrenheit' ? Math.round((temp * 9) / 5 + 32) : temp)
const displayTemp = computed(() => {
  if (!cityData.value) return null
  return convertTemp(cityData.value.temp)
})

const loadForecast = async () => {
  forecastRequestController?.abort()
  forecast.value = []
  forecastMessage.value = ''

  if (!cityData.value) {
    forecastStatus.value = 'idle'
    return
  }

  forecastRequestController = new AbortController()
  forecastStatus.value = 'loading'

  try {
    const response = await axios.get('/api/forecast', {
      params: { regionId: cityData.value.id },
      signal: forecastRequestController.signal,
    })
    if (!Array.isArray(response.data.forecast)) throw new Error('Forecast response is invalid')
    forecast.value = response.data.forecast
    forecastStatus.value = 'success'
  } catch (error) {
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED') return
    const errorCode = error.response?.data?.error
    forecastStatus.value = 'error'
    forecastMessage.value =
      errorCode === 'WEATHER_API_NOT_CONFIGURED' ? 'OpenWeather API 키가 설정되지 않아 예보를 표시할 수 없습니다.' : '예보를 불러오지 못했습니다. 현재 날씨 정보는 계속 확인할 수 있습니다.'
  }
}

const formatForecastDate = (date) =>
  new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(`${date}T00:00:00`))

watch(() => route.params.cityId, loadForecast, { immediate: true })
onBeforeUnmount(() => forecastRequestController?.abort())
</script>

<template>
  <main class="detail-page">
    <section v-if="cityData" class="detail-card">
      <div class="detail-hero" :style="cityImageStyle">
        <div class="detail-hero-content">
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
            <div>
              <dt>최고 / 최저</dt>
              <dd>{{ convertTemp(cityData.high) }}{{ configStore.unitSymbol }} / {{ convertTemp(cityData.low) }}{{ configStore.unitSymbol }}</dd>
            </div>
            <div>
              <dt>습도</dt>
              <dd>{{ cityData.humidity }}%</dd>
            </div>
            <div>
              <dt>강수 확률</dt>
              <dd>{{ cityData.rainChance }}%</dd>
            </div>
            <div>
              <dt>풍속</dt>
              <dd>{{ cityData.wind }}m/s</dd>
            </div>
          </dl>
        </div>
      </div>

      <section class="forecast-section" aria-labelledby="forecast-title" :aria-busy="forecastStatus === 'loading'">
        <div class="forecast-heading">
          <div>
            <small>OPENWEATHER FORECAST API</small>
            <h2 id="forecast-title">5일 날씨 예보</h2>
          </div>
          <el-tag type="success" effect="plain">Axios</el-tag>
        </div>

        <el-skeleton v-if="forecastStatus === 'loading'" :rows="2" animated />
        <el-alert v-else-if="forecastStatus === 'error'" :title="forecastMessage" type="warning" :closable="false" show-icon />
        <div v-else-if="forecast.length" class="forecast-grid">
          <article v-for="day in forecast" :key="day.date">
            <strong>{{ formatForecastDate(day.date) }}</strong>
            <span aria-hidden="true">{{ day.emoji }}</span>
            <b>{{ convertTemp(day.max) }}{{ configStore.unitSymbol }} / {{ convertTemp(day.min) }}{{ configStore.unitSymbol }}</b>
            <small>{{ day.status }} · 강수 {{ day.rainChance }}%</small>
          </article>
        </div>
      </section>
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
  overflow: hidden;
  background: #fffaf0;
  border: 1px solid #e6d8b9;
  border-radius: 24px;
  box-shadow: 0 14px 40px rgba(87, 65, 26, 0.11);
}

.detail-hero {
  position: relative;
  overflow: hidden;
  padding: 30px;
}

.detail-hero::before,
.detail-hero::after {
  position: absolute;
  inset: 0;
  content: '';
}

.detail-hero::before {
  background-image: var(--city-image);
  background-position: center;
  background-size: cover;
  filter: blur(1.5px);
  transform: scale(1.025);
}

.detail-hero::after {
  background: linear-gradient(135deg, rgba(255, 250, 240, 0.56), rgba(255, 255, 255, 0.38));
}

.detail-hero-content {
  position: relative;
  z-index: 1;
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
  background: rgba(255, 250, 240, 0.72);
  border-radius: 12px;
  backdrop-filter: blur(4px);
}

dt {
  color: #8f9187;
  font-size: 0.7rem;
}

dd {
  margin: 5px 0 0;
  font-weight: 800;
}

.forecast-section {
  padding: 20px 30px 30px;
  border-top: 1px solid #e6d8b9;
}

.forecast-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.forecast-heading small {
  color: #a86412;
  font-size: 0.6rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.forecast-heading h2 {
  margin: 3px 0 0;
  font-size: 1rem;
}

.forecast-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.forecast-grid article {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 5px;
  padding: 11px 6px;
  text-align: center;
  background: #fff;
  border: 1px solid #eadfc8;
  border-radius: 12px;
}

.forecast-grid article > strong,
.forecast-grid article > b {
  font-size: 0.68rem;
}

.forecast-grid article > span {
  font-size: 1.4rem;
}

.forecast-grid article > small {
  color: #70766a;
  font-size: 0.58rem;
}

.empty {
  padding: 30px;
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
  .detail-hero {
    padding: 24px 20px;
  }

  dl {
    grid-template-columns: 1fr;
  }

  .forecast-section {
    padding: 20px;
  }

  .forecast-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
