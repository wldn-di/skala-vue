<script setup>
import axios from 'axios'
import { ref } from 'vue'

const weatherData = ref(null)
const isLoading = ref(false)

const handleFetchWeather = async () => {
  isLoading.value = true

  try {
    // API 키가 포함된 OpenWeather 주소를 브라우저에서 직접 호출하지 않습니다.
    const response = await axios.get('/api/weather')
    const gwangjuWeather = response.data.data.find((item) => item.id === 'gwangju')
    if (!gwangjuWeather) throw new Error('Gwangju weather is unavailable')

    weatherData.value = {
      ...gwangjuWeather,
      name: '광주광역시',
    }
  } catch {
    window.alert('날씨 데이터를 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="practice-section">
    <h2>⚡ Axios 통신 검증</h2>
    <button :disabled="isLoading" @click="handleFetchWeather">
      {{ isLoading ? '데이터 로딩 중...' : '실시간 날씨 데이터 당겨오기' }}
    </button>
    <div v-if="weatherData" class="result-card">
      <p>
        📍 위치: <strong>{{ weatherData.name }}</strong>
      </p>
      <p>
        🌡️ 현재 기온: <strong>{{ weatherData.temp }}°C</strong>
      </p>
      <p>
        ☁️ 날씨 상태: <strong>{{ weatherData.description }}</strong>
      </p>
      <p>
        💧 습도: <strong>{{ weatherData.humidity }}%</strong>
      </p>
    </div>
    <p v-else>아직 가져온 데이터가 없습니다. 버튼을 눌러 통신을 가동하세요.</p>
  </div>
</template>

<style scoped>
.result-card {
  padding: 15px;
  line-height: 1.8;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.result-card strong {
  color: #0284c7;
}
</style>
