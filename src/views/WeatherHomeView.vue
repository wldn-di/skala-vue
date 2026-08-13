<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

import BaseDashboardCard from '../components/exercise/BaseDashboardCard.vue'
import SearchBar from '../components/exercise/SearchBar.vue'
import WeatherCard from '../components/exercise/WeatherCard.vue'
import WeatherMenuRecommend from '../components/exercise/WeatherMenuRecommend.vue'
import WeatherRegionMap from '../components/exercise/WeatherRegionMap.vue'
import WeatherRestaurantPanel from '../components/exercise/WeatherRestaurantPanel.vue'
import GameScorePage from '../components/exercise/game/GameScorePage.vue'
import GameScoreRegister from '../components/exercise/game/GameScoreRegister.vue'
import WeatherGamePage from '../components/exercise/game/WeatherGamePage.vue'
import { weatherList as weatherMockList } from '../components/exercise/weatherMockData'

const props = defineProps({
  unit: {
    type: String,
    default: 'celsius',
    validator: (value) => ['celsius', 'fahrenheit'].includes(value),
  },
  unitSymbol: {
    type: String,
    default: '℃',
  },
})

const router = useRouter()
const displayTemp = (temp) => (props.unit === 'fahrenheit' ? Math.round((temp * 9) / 5 + 32) : temp)

// 과제 1 핵심: 임의의 날씨 데이터 배열을 ref로 관리합니다.
const weatherList = ref(weatherMockList)
const searchQuery = ref('')
const selectedRegionId = ref('')
const selectedDistrict = ref('')
const selectedCityInfo = ref('지도를 누르거나 날씨 카드를 선택해 보세요.')
const activeView = ref('weather')
const activePanel = ref('weather')
const pendingGameResult = ref(null)
// 과제 2 본인만의 반응형 상태: 실시간 API 동기화 상태와 마지막 갱신 시각입니다.
const weatherApiStatus = ref('idle')
const weatherApiMessage = ref('실시간 날씨를 불러올 준비 중입니다.')
const weatherUpdatedAt = ref(null)
let weatherRequestController = null

// 과제 2 핵심: 상태바 문구가 바뀔 때마다 변경 내용을 감시합니다.
watch(selectedCityInfo, (newInfo) => {
  console.log(`[watch] 상태바 문구 변경: ${newInfo}`)
})

// 과제 2 핵심: 한글 도시 검색어가 바뀔 때마다 자동으로 다시 실행됩니다.
watchEffect(() => {
  console.log(`[watchEffect] 현재 도시 검색어: ${searchQuery.value}`)
})

// 본인만의 추가 Watcher: 맛집 등록 대상 구·군의 변화를 추적합니다.
watch(selectedDistrict, (newDistrict) => {
  console.log(`[추가 watch] 선택된 구·군: ${newDistrict || '없음'}`)
})

// 과제 2 본인만의 Watcher: 실시간 날씨 API 상태 변화를 감시합니다.
watch(weatherApiStatus, (newStatus, oldStatus) => {
  console.log(`[추가 watch] 날씨 API 상태: ${oldStatus} → ${newStatus}`)
})

const RESTAURANT_STORAGE_KEY = 'weather-bite-restaurants-v1'
const GAME_SCORE_STORAGE_KEY = 'weather-bite-snake-scores-v1'

const loadRestaurants = () => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(RESTAURANT_STORAGE_KEY) ?? '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    window.localStorage.removeItem(RESTAURANT_STORAGE_KEY)
    return []
  }
}

const restaurants = ref(loadRestaurants())

const loadGameScores = () => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(GAME_SCORE_STORAGE_KEY) ?? '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    window.localStorage.removeItem(GAME_SCORE_STORAGE_KEY)
    return []
  }
}

const gameScores = ref(loadGameScores())

const selectedWeather = computed(() => weatherList.value.find((weather) => weather.id === selectedRegionId.value) ?? null)

const recommendWeather = computed(() => selectedWeather.value ?? weatherList.value[0])
const bestGameScore = computed(() => Math.max(0, ...gameScores.value.map((item) => item.score)))
// 과제 2 본인만의 Computed: API 연동에 성공한 지역 수를 자동 집계합니다.
const liveWeatherCount = computed(() => weatherList.value.filter((item) => item.dataSource === 'live').length)
const isWeatherLoading = computed(() => weatherApiStatus.value === 'loading')
const weatherApiStatusLabel = computed(() => {
  if (weatherApiStatus.value === 'loading') return '실시간 날씨 불러오는 중'
  if (weatherApiStatus.value === 'success') return `LIVE · ${liveWeatherCount.value}/17 지역`
  if (weatherApiStatus.value === 'partial') return `일부 LIVE · ${liveWeatherCount.value}/17 지역`
  if (weatherApiStatus.value === 'error') return 'Mock 데이터로 표시 중'
  return '날씨 API 연결 대기'
})
const isDrilled = computed(() => Boolean(selectedWeather.value))
const mapFile = computed(() => (selectedWeather.value ? `${selectedWeather.value.mapName}_시군구_경계.svg` : '전국_시도_경계.svg'))
const mapRegions = computed(() => (isDrilled.value ? [] : weatherList.value))
const mapActiveName = computed(() => (isDrilled.value ? selectedDistrict.value : (selectedWeather.value?.mapName ?? '')))

const filteredWeatherList = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase('ko-KR')
  if (!query) return weatherList.value

  return weatherList.value.filter((weather) => `${weather.name} ${weather.fullName}`.toLocaleLowerCase('ko-KR').includes(query))
})

const selectedRestaurants = computed(() => restaurants.value.filter((restaurant) => restaurant.regionId === selectedRegionId.value && restaurant.districtName === selectedDistrict.value))

const restaurantCounts = computed(() =>
  restaurants.value.reduce((counts, restaurant) => {
    counts[restaurant.regionId] = (counts[restaurant.regionId] ?? 0) + 1
    return counts
  }, {}),
)

const districtRestaurantCounts = computed(() =>
  restaurants.value.reduce((counts, restaurant) => {
    if (restaurant.regionId === selectedRegionId.value && restaurant.districtName) {
      counts[restaurant.districtName] = (counts[restaurant.districtName] ?? 0) + 1
    }
    return counts
  }, {}),
)

const mapRestaurantCounts = computed(() => (isDrilled.value ? districtRestaurantCounts.value : restaurantCounts.value))

const saveRestaurants = () => {
  window.localStorage.setItem(RESTAURANT_STORAGE_KEY, JSON.stringify(restaurants.value))
}

const makeRestaurantId = () => {
  if (typeof window.crypto?.randomUUID === 'function') return window.crypto.randomUUID()
  return `restaurant_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

const makeGameScoreId = () => {
  if (typeof window.crypto?.randomUUID === 'function') return window.crypto.randomUUID()
  return `game_score_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

const selectWeather = (weather) => {
  selectedRegionId.value = weather.id
  selectedDistrict.value = ''
  activePanel.value = 'weather'
  selectedCityInfo.value = `${weather.name}이 선택되었습니다.`
}

const selectFromMap = (area) => {
  if (!isDrilled.value) {
    selectWeather(area)
    return
  }

  selectedDistrict.value = area.mapName
  activePanel.value = 'restaurants'
  selectedCityInfo.value = `${selectedWeather.value.name} ${area.name}이 선택되었습니다.`
}

const returnToNational = () => {
  selectedRegionId.value = ''
  selectedDistrict.value = ''
  activePanel.value = 'weather'
  selectedCityInfo.value = '전국 지도로 돌아왔습니다. 지역을 선택해 보세요.'
}

const showDetail = (weather) => {
  router.push(`/weather/${weather.id}`)
}

const syncLiveWeather = async () => {
  if (isWeatherLoading.value) return

  weatherRequestController?.abort()
  weatherRequestController = new AbortController()
  weatherApiStatus.value = 'loading'
  weatherApiMessage.value = '전국 17개 시·도의 현재 날씨를 안전하게 불러오고 있습니다.'

  try {
    const response = await fetch('/api/weather', {
      headers: { Accept: 'application/json' },
      signal: weatherRequestController.signal,
    })
    const payload = await response.json()
    if (!response.ok) {
      const requestError = new Error('Weather proxy request failed')
      requestError.code = payload.error
      throw requestError
    }
    if (!Array.isArray(payload.data)) throw new Error('Weather response is invalid')

    const weatherByRegion = new Map(payload.data.map((item) => [item.id, item]))
    weatherList.value = weatherList.value.map((weather) => {
      const liveWeather = weatherByRegion.get(weather.id)
      if (!liveWeather || !Number.isFinite(liveWeather.temp)) return weather

      return {
        ...weather,
        ...liveWeather,
        dataSource: 'live',
      }
    })

    weatherUpdatedAt.value = payload.fetchedAt ?? new Date().toISOString()
    const failedCount = Array.isArray(payload.failedRegionIds) ? payload.failedRegionIds.length : 0
    weatherApiStatus.value = failedCount ? 'partial' : 'success'
    weatherApiMessage.value = failedCount ? `${failedCount}개 지역은 기존 데이터로 유지하고 나머지 지역은 실시간 날씨로 갱신했습니다.` : '전국 17개 시·도의 실시간 날씨를 갱신했습니다.'
  } catch (error) {
    if (error.name === 'AbortError') return
    weatherApiStatus.value = 'error'
    weatherApiMessage.value =
      error.code === 'WEATHER_API_UNAUTHORIZED' ? 'OpenWeather 키가 아직 활성화되지 않았습니다. 활성화 후 새로고침해 주세요.' : '실시간 날씨를 불러오지 못해 안전하게 Mock 데이터를 유지합니다.'
  }
}

const formatWeatherUpdateTime = (date) => {
  if (!date) return '갱신 전'
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

const handleGameFinished = (result) => {
  pendingGameResult.value = {
    ...result,
    playedRegionId: recommendWeather.value.id,
    playedRegion: recommendWeather.value.fullName,
    region: recommendWeather.value.fullName,
    weatherEmoji: recommendWeather.value.emoji,
    weatherStatus: recommendWeather.value.status,
  }
}

const registerGameScore = ({ homeRegionId, nickname }) => {
  if (!pendingGameResult.value) return

  const homeRegion = weatherList.value.find((item) => item.id === homeRegionId)
  if (!homeRegion) return

  gameScores.value.unshift({
    id: makeGameScoreId(),
    ...pendingGameResult.value,
    homeRegionId: homeRegion.id,
    homeRegion: homeRegion.fullName,
    nickname,
    registeredAt: new Date().toISOString(),
  })
  window.localStorage.setItem(GAME_SCORE_STORAGE_KEY, JSON.stringify(gameScores.value))
  pendingGameResult.value = null
  activeView.value = 'myScore'
}

const addRestaurant = ({ name, signatureMenu, note }) => {
  if (!selectedWeather.value || !selectedDistrict.value) return

  restaurants.value.unshift({
    id: makeRestaurantId(),
    regionId: selectedRegionId.value,
    districtName: selectedDistrict.value,
    name,
    signatureMenu,
    note,
    createdAt: new Date().toISOString(),
  })
  saveRestaurants()
}

const removeRestaurant = (restaurantId) => {
  restaurants.value = restaurants.value.filter((restaurant) => restaurant.id !== restaurantId)
  saveRestaurants()
}

onMounted(syncLiveWeather)
onBeforeUnmount(() => weatherRequestController?.abort())
</script>

<template>
  <div class="weather-bite-app">
    <header class="site-header">
      <button class="site-brand" type="button" @click="activeView = 'weather'">
        <img src="/favicon.ico" alt="" aria-hidden="true" />
        <div>
          <strong>날씨한입</strong>
          <small>WEATHER × FOOD</small>
        </div>
      </button>

      <nav aria-label="주요 메뉴">
        <button type="button" :class="{ active: activeView === 'weather' }" @click="activeView = 'weather'">날씨지도</button>
        <button type="button" :class="{ active: activeView === 'nationwide' }" @click="activeView = 'nationwide'">전국날씨</button>
        <button type="button" :class="{ active: activeView === 'menu' }" @click="activeView = 'menu'">
          저메추
          <span>100</span>
        </button>
        <button type="button" :class="{ active: activeView === 'game' }" @click="activeView = 'game'">게임</button>
        <button type="button" :class="{ active: activeView === 'myScore' }" @click="activeView = 'myScore'">내점수</button>
        <button type="button" :class="{ active: activeView === 'scoreRegister' }" @click="activeView = 'scoreRegister'">
          점수등록
          <span v-if="pendingGameResult">1</span>
        </button>
      </nav>

      <div class="header-weather">
        <span>{{ selectedWeather ? selectedWeather.emoji : '🗺️' }}</span>
        <div>
          <small>{{ selectedWeather ? selectedWeather.name : '지역 선택' }}</small>
          <strong v-if="selectedWeather"> {{ displayTemp(selectedWeather.temp) }}{{ unitSymbol }} {{ selectedWeather.status }} </strong>
          <strong v-else>전국 지도</strong>
        </div>
      </div>
    </header>

    <main v-if="activeView === 'weather'" class="weather-dashboard">
      <section class="dashboard-top" aria-label="지역별 날씨와 맛집 지도">
        <article class="dashboard-card map-card">
          <header class="card-heading map-heading">
            <div>
              <p v-if="isDrilled" class="map-breadcrumb">
                <button type="button" @click="returnToNational">전국</button>
                <span>›</span>
                {{ selectedWeather.fullName }}
              </p>
              <p v-else>WEATHER MAP</p>
              <h1 v-if="isDrilled">{{ selectedWeather.name }} 구·군별 맛집지도</h1>
              <h1 v-else>지도에서 오늘의 날씨를 만나보세요</h1>
            </div>
            <span v-if="isDrilled" class="mock-badge restaurant-total"> 📍 등록 맛집 {{ restaurantCounts[selectedRegionId] ?? 0 }}곳 </span>
            <div v-else class="weather-sync-actions">
              <span class="mock-badge" :class="`api-${weatherApiStatus}`" :title="weatherApiMessage"> <i></i>{{ weatherApiStatusLabel }} </span>
              <button type="button" :disabled="isWeatherLoading" @click="syncLiveWeather">
                {{ isWeatherLoading ? '동기화 중' : '↻ 새로고침' }}
              </button>
            </div>
          </header>

          <div class="map-stage">
            <WeatherRegionMap :file="mapFile" :active-name="mapActiveName" :regions="mapRegions" :restaurant-counts="mapRestaurantCounts" :drilled="isDrilled" @select="selectFromMap" />
            <button v-if="isDrilled" class="map-back-button" type="button" @click="returnToNational">← 전국 지도로</button>
          </div>

          <footer class="map-footer">
            <span v-if="isDrilled"> <b>TIP</b> 구·군을 선택하면 해당 동네 맛집을 등록할 수 있어요. </span>
            <span v-else> <b>TIP</b> 숫자는 시·도별 등록 맛집 합계예요. 지역을 눌러 자세히 보세요. </span>
            <a href="https://github.com/statgarten/maps" target="_blank" rel="noreferrer"> 지도: SGIS 기반 statgarten/maps </a>
          </footer>
        </article>

        <aside class="dashboard-card detail-panel" aria-live="polite">
          <div v-if="!selectedWeather" class="empty-detail-panel">
            <span aria-hidden="true">🗺️</span>
            <small>REGION SELECT</small>
            <strong>아직 선택된 지역이 없어요</strong>
            <p>전국 지도에서 궁금한 시·도를 선택하면<br />날씨와 구·군별 맛집지도를 보여드려요.</p>
            <div><b>1</b> 시·도 선택 <i>→</i> <b>2</b> 구·군 선택 <i>→</i> <b>3</b> 맛집 등록</div>
          </div>

          <template v-else>
            <header class="detail-heading">
              <div>
                <p>선택 지역</p>
                <h2>{{ selectedWeather.fullName }}</h2>
              </div>
              <span class="detail-weather-icon" aria-hidden="true">{{ selectedWeather.emoji }}</span>
            </header>

            <div class="panel-tabs" role="tablist" aria-label="지역 정보 선택">
              <button type="button" role="tab" :aria-selected="activePanel === 'weather'" :class="{ active: activePanel === 'weather' }" @click="activePanel = 'weather'">오늘 날씨</button>
              <button type="button" role="tab" :aria-selected="activePanel === 'restaurants'" :class="{ active: activePanel === 'restaurants' }" @click="activePanel = 'restaurants'">
                맛집지도
                <span>{{ restaurantCounts[selectedRegionId] ?? 0 }}</span>
              </button>
            </div>

            <div v-if="activePanel === 'weather'" class="weather-detail">
              <div class="temperature-hero">
                <div class="temperature-content">
                  <small>
                    현재 기온 ·
                    {{ selectedWeather.dataSource === 'live' ? `OpenWeather 관측 ${formatWeatherUpdateTime(selectedWeather.observedAt)}` : '과제용 Mock' }}
                  </small>
                  <div class="temperature-line">
                    <strong>{{ displayTemp(selectedWeather.temp) }}<sup>{{ unitSymbol }}</sup></strong>
                    <p>{{ selectedWeather.status }}</p>
                  </div>
                  <span v-if="selectedWeather.temp >= 25" class="large-label hot"> 🔥 더움 (25도 이상) </span>
                  <span v-else class="large-label cool">❄️ 선선함 (25도 미만)</span>
                </div>
                <span class="weather-hero-icon" aria-hidden="true">{{ selectedWeather.emoji }}</span>
              </div>

              <div class="weather-advice">
                <span aria-hidden="true">💡</span>
                <p>
                  <small>TODAY'S TIP</small>
                  <strong> {{ selectedWeather.name }}은 현재 {{ selectedWeather.description || selectedWeather.status }} 상태예요. 오늘 기온에 어울리는 메뉴도 함께 골라보세요. </strong>
                </p>
              </div>

              <dl class="weather-metrics">
                <div>
                  <dt>{{ selectedWeather.dataSource === 'live' ? '관측 최고 / 최저' : '최고 / 최저' }}</dt>
                  <dd>{{ displayTemp(selectedWeather.high) }}{{ unitSymbol }} / {{ displayTemp(selectedWeather.low) }}{{ unitSymbol }}</dd>
                </div>
                <div>
                  <dt>습도</dt>
                  <dd>{{ selectedWeather.humidity }}%</dd>
                </div>
                <div>
                  <dt>{{ selectedWeather.dataSource === 'live' ? '1시간 강수량' : '강수확률' }}</dt>
                  <dd>{{ selectedWeather.dataSource === 'live' ? `${selectedWeather.rainLastHour}mm` : `${selectedWeather.rainChance}%` }}</dd>
                </div>
                <div>
                  <dt>바람</dt>
                  <dd>{{ selectedWeather.wind }}m/s</dd>
                </div>
              </dl>

              <div class="popular-foods">
                <div>
                  <p>LOCAL PICKS</p>
                  <strong>{{ selectedWeather.name }} 대표 음식</strong>
                </div>
                <span v-for="food in selectedWeather.popularFoods" :key="food">{{ food }}</span>
              </div>

              <button class="menu-recommend-link" type="button" @click="activeView = 'menu'">
                <span aria-hidden="true">🎲</span>
                <div>
                  <small>오늘 뭐 먹지?</small>
                  <strong>이 날씨에 맞는 메뉴 랜덤 추천</strong>
                </div>
                <b aria-hidden="true">→</b>
              </button>
            </div>

            <template v-else>
              <WeatherRestaurantPanel
                v-if="selectedDistrict"
                :region="selectedWeather"
                :district-name="selectedDistrict"
                :restaurants="selectedRestaurants"
                @add-restaurant="addRestaurant"
                @remove-restaurant="removeRestaurant"
              />
              <div v-else class="district-empty">
                <span aria-hidden="true">📍</span>
                <small>DISTRICT SELECT</small>
                <strong>{{ selectedWeather.name }}의 구·군을 선택해 주세요</strong>
                <p>왼쪽 세부 지도에서 맛집을 등록할 동네를 먼저 눌러주세요.</p>
              </div>
            </template>
          </template>
        </aside>
      </section>
    </main>

    <section v-else-if="activeView === 'nationwide'" class="nationwide-page">
      <BaseDashboardCard variant="nationwide" class="weather-list-card nationwide-card" aria-labelledby="weather-list-title">
        <header class="weather-list-heading">
          <div class="list-title">
            <span aria-hidden="true">🌦️</span>
            <div>
              <p>NATIONWIDE</p>
              <h2 id="weather-list-title">전국 날씨 한눈에 보기</h2>
              <div class="api-state" :class="`api-${weatherApiStatus}`" role="status" :title="weatherApiMessage">
                <i></i>
                {{ weatherApiStatusLabel }} · {{ formatWeatherUpdateTime(weatherUpdatedAt) }}
              </div>
            </div>
          </div>

          <SearchBar
            class="search-area"
            variant="dashboard"
            :current-query="searchQuery"
            :loading="isWeatherLoading"
            show-refresh
            @update-query="searchQuery = $event"
            @refresh="syncLiveWeather"
          />
        </header>

        <div class="selection-status" role="status">{{ selectedCityInfo }}</div>

        <div v-if="filteredWeatherList.length" class="weather-card-grid">
          <!-- 과제 1 핵심: v-for와 :key="item.id"로 날씨 카드를 반복 렌더링합니다. -->
          <WeatherCard
            v-for="item in filteredWeatherList"
            :key="item.id"
            :city-item="item"
            :selected="item.id === selectedRegionId"
            :unit="unit"
            :unit-symbol="unitSymbol"
            size="large"
            @select-card="selectWeather"
            @click-detail="showDetail"
          />
        </div>
        <div v-else class="no-search-result" role="status">‘{{ searchQuery }}’와 일치하는 도시가 없어요.</div>
      </BaseDashboardCard>
    </section>

    <WeatherMenuRecommend v-else-if="activeView === 'menu'" :weather="recommendWeather" />

    <WeatherGamePage
      v-else-if="activeView === 'game'"
      :weather="recommendWeather"
      :best-score="bestGameScore"
      :last-result="pendingGameResult"
      @finish="handleGameFinished"
      @go-register="activeView = 'scoreRegister'"
    />

    <GameScorePage v-else-if="activeView === 'myScore'" :scores="gameScores" @play="activeView = 'game'" />

    <GameScoreRegister v-else :result="pendingGameResult" :regions="weatherList" @play="activeView = 'game'" @register="registerGameScore" />
  </div>
</template>

<style scoped>
.weather-bite-app {
  --sun: #f4bd3e;
  --sun-deep: #a86412;
  --olive: #40513b;
  --olive-deep: #2d382b;
  --cream: #fffaf0;
  --sand: #f2e6c7;
  --coral: #d96b43;
  min-height: 100svh;
  color: #293126;
  background:
    radial-gradient(circle at 8% 15%, rgba(244, 189, 62, 0.13), transparent 25rem),
    radial-gradient(circle at 92% 78%, rgba(64, 81, 59, 0.09), transparent 24rem);
}

.site-header {
  position: relative;
  z-index: 20;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  width: min(1500px, calc(100% - 36px));
  height: 54px;
  margin: 12px auto 0;
  padding: 6px 8px 6px 12px;
  background: rgba(255, 252, 244, 0.9);
  border: 1px solid rgba(226, 214, 187, 0.94);
  border-radius: 16px;
  backdrop-filter: blur(18px);
  box-shadow: 0 9px 28px rgba(87, 65, 26, 0.09);
}

.site-brand {
  display: flex;
  align-items: center;
  justify-self: start;
  gap: 8px;
  padding: 0;
  text-align: left;
  background: transparent;
  border: 0;
}

.site-brand > img {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  object-fit: cover;
}

.site-brand > div,
.header-weather > div {
  display: flex;
  flex-direction: column;
}

.site-brand strong {
  color: var(--olive-deep);
  font-size: 0.78rem;
}

.site-brand small {
  color: #8f9187;
  font-size: 0.45rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.site-header nav {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  max-width: 100%;
  overflow-x: auto;
  background: #f3eddf;
  border-radius: 11px;
  scrollbar-width: none;
}

.site-header nav::-webkit-scrollbar {
  display: none;
}

.site-header nav button {
  flex: none;
  min-height: 32px;
  padding: 0 13px;
  color: #70766a;
  font-size: 0.67rem;
  font-weight: 800;
  background: transparent;
  border: 0;
  border-radius: 8px;
}

.site-header nav button.active {
  color: var(--olive-deep);
  background: #fff9e9;
  box-shadow: 0 3px 8px rgba(88, 67, 27, 0.1);
}

.site-header nav span {
  display: inline-grid;
  place-items: center;
  min-width: 18px;
  height: 17px;
  margin-left: 3px;
  color: #fff;
  font-size: 0.49rem;
  background: var(--coral);
  border-radius: 999px;
}

.header-weather {
  display: flex;
  align-items: center;
  justify-self: end;
  gap: 7px;
  padding: 5px 9px;
  background: #f5edcf;
  border-radius: 10px;
}

.header-weather > span {
  font-size: 1rem;
}

.header-weather small {
  color: #8f9187;
  font-size: 0.48rem;
}

.header-weather strong {
  color: var(--olive-deep);
  font-size: 0.6rem;
}

.weather-dashboard {
  width: min(1500px, calc(100% - 36px));
  height: calc(100svh - 66px);
  margin: 0 auto;
  padding: 12px 0 14px;
}

.dashboard-top {
  display: grid;
  grid-template-columns: minmax(0, 1.34fr) minmax(360px, 0.76fr);
  gap: 12px;
  height: 100%;
  min-height: 0;
}

.dashboard-card {
  background: rgba(255, 252, 244, 0.96);
  border: 1px solid rgba(226, 214, 187, 0.92);
  box-shadow: 0 12px 38px rgba(87, 65, 26, 0.09);
}

.nationwide-page {
  width: min(1500px, calc(100% - 36px));
  height: calc(100svh - 66px);
  margin: 0 auto;
  padding: 12px 0 14px;
}

.nationwide-card .weather-list-heading {
  height: 66px;
}

.nationwide-card .list-title > span {
  width: 44px;
  height: 44px;
  font-size: 1.25rem;
  border-radius: 13px;
}

.nationwide-card .list-title p {
  font-size: 0.62rem;
}

.nationwide-card .list-title h2 {
  margin-top: 3px;
  font-size: 1.25rem;
  letter-spacing: -0.04em;
}

.nationwide-card .selection-status {
  height: 34px;
  margin-bottom: 10px;
  padding: 0 13px;
  font-size: 0.67rem;
  border-radius: 10px;
}

.dashboard-card {
  min-height: 0;
  border-radius: 22px;
}

.map-card {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  padding: 18px 20px 10px;
}

.card-heading,
.detail-heading,
.weather-list-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-heading p,
.detail-heading p,
.list-title p,
.popular-foods p {
  margin: 0;
  color: var(--sun-deep);
  font-size: 0.57rem;
  font-weight: 900;
  letter-spacing: 0.1em;
}

.card-heading h1 {
  margin: 4px 0 0;
  color: var(--olive-deep);
  font-size: clamp(1.05rem, 1.45vw, 1.36rem);
  letter-spacing: -0.045em;
}

.map-breadcrumb {
  display: flex;
  align-items: center;
  gap: 5px;
  letter-spacing: 0;
}

.map-breadcrumb button {
  padding: 0;
  color: #8f9187;
  font-size: inherit;
  font-weight: 800;
  background: transparent;
  border: 0;
}

.map-breadcrumb button:hover {
  color: var(--sun-deep);
}

.mock-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 9px;
  color: #70766a;
  font-size: 0.6rem;
  font-weight: 800;
  background: #f3eddf;
  border-radius: 999px;
}

.mock-badge i {
  width: 6px;
  height: 6px;
  background: #20c997;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(32, 201, 151, 0.12);
}

.mock-badge.restaurant-total {
  color: #b6571c;
  background: #fff3eb;
}

.weather-sync-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.weather-sync-actions > button,
.weather-refresh-button {
  min-height: 30px;
  padding: 0 9px;
  color: #5c6253;
  font-size: 0.58rem;
  font-weight: 800;
  background: #fff;
  border: 1px solid #dfe7ef;
  border-radius: 9px;
}

.weather-sync-actions > button:hover,
.weather-refresh-button:hover {
  color: var(--olive);
  border-color: #c8b677;
}

.weather-sync-actions > button:disabled,
.weather-refresh-button:disabled {
  color: #a1a9b3;
  background: #f7f8fa;
}

.mock-badge.api-error i,
.mock-badge.api-partial i,
.api-state.api-error i,
.api-state.api-partial i {
  background: #ff8a3d;
  box-shadow: 0 0 0 4px rgba(255, 138, 61, 0.12);
}

.mock-badge.api-loading i,
.api-state.api-loading i {
  background: var(--sun-deep);
  box-shadow: 0 0 0 4px rgba(168, 100, 18, 0.14);
  animation: api-pulse 900ms ease-in-out infinite alternate;
}

.api-state {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 2px;
  color: #657486;
  font-size: 0.52rem;
  font-weight: 750;
}

.api-state i {
  width: 6px;
  height: 6px;
  background: #20c997;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(32, 201, 151, 0.12);
}

.weather-refresh-button {
  width: 34px;
  min-width: 34px;
  height: 34px;
  padding: 0;
  font-size: 0.85rem;
}

@keyframes api-pulse {
  to {
    opacity: 0.35;
    transform: scale(0.78);
  }
}

.map-stage {
  position: relative;
  min-height: 0;
  margin-top: 7px;
  background:
    radial-gradient(circle at 50% 44%, rgba(244, 189, 62, 0.2), transparent 45%),
    radial-gradient(circle at 14% 82%, rgba(98, 119, 79, 0.1), transparent 27%),
    linear-gradient(145deg, #fffaf0, #f3eddb);
  border: 1px solid #e6d8b9;
  border-radius: 18px;
  overflow: hidden;
}

.map-stage::before {
  position: absolute;
  top: -54px;
  right: -42px;
  width: 180px;
  height: 180px;
  background: rgba(244, 189, 62, 0.16);
  border: 1px solid rgba(201, 132, 24, 0.15);
  border-radius: 50%;
  content: '';
  pointer-events: none;
}

.map-stage::after {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(64, 81, 59, 0.12) 1px, transparent 1px);
  background-size: 18px 18px;
  content: '';
  opacity: 0.32;
  pointer-events: none;
}

.map-back-button {
  position: absolute;
  bottom: 12px;
  left: 12px;
  z-index: 8;
  min-height: 34px;
  padding: 0 11px;
  color: #5c6253;
  font-size: 0.62rem;
  font-weight: 800;
  background: rgba(255, 251, 239, 0.96);
  border: 1px solid #dfd0ae;
  border-radius: 10px;
  box-shadow: 0 6px 18px rgba(87, 65, 26, 0.14);
}

.map-back-button:hover {
  color: var(--sun-deep);
}

.map-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 2px 0;
  color: #8f9187;
  font-size: 0.55rem;
}

.map-footer b {
  margin-right: 4px;
  color: var(--sun-deep);
}

.map-footer a {
  color: #8f9187;
  text-decoration: none;
}

.detail-panel {
  display: flex;
  flex-direction: column;
  padding: 18px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 252, 244, 0.98), rgba(249, 244, 229, 0.98));
}

.empty-detail-panel,
.district-empty {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  min-height: 0;
  text-align: center;
  background: linear-gradient(145deg, #fffaf0, #f1f1df);
  border: 1px dashed #d9ca9f;
  border-radius: 18px;
}

.empty-detail-panel > span,
.district-empty > span {
  display: grid;
  place-items: center;
  width: 70px;
  height: 70px;
  margin-bottom: 13px;
  font-size: 2rem;
  background: #fff0bd;
  border-radius: 22px;
}

.empty-detail-panel > small,
.district-empty > small {
  color: var(--sun-deep);
  font-size: 0.55rem;
  font-weight: 900;
  letter-spacing: 0.1em;
}

.empty-detail-panel > strong,
.district-empty > strong {
  margin-top: 5px;
  color: var(--olive-deep);
  font-size: 1rem;
}

.empty-detail-panel > p,
.district-empty > p {
  margin: 8px 0 0;
  color: #8f9187;
  font-size: 0.67rem;
  line-height: 1.65;
}

.empty-detail-panel > div {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 22px;
  padding: 9px 12px;
  color: #70766a;
  font-size: 0.59rem;
  font-weight: 700;
  background: #fff;
  border: 1px solid #e3eaf2;
  border-radius: 12px;
}

.empty-detail-panel > div b {
  display: grid;
  place-items: center;
  width: 17px;
  height: 17px;
  color: #fff;
  font-size: 0.52rem;
  background: var(--olive);
  border-radius: 50%;
}

.empty-detail-panel > div i {
  color: #b0b8c1;
  font-style: normal;
}

.district-empty > span {
  background: #fff2e8;
}

.detail-heading p {
  margin: 0 0 3px;
}

.detail-heading h2 {
  margin: 0;
  color: var(--olive-deep);
  font-size: 1.25rem;
  letter-spacing: -0.045em;
}

.detail-weather-icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  font-size: 1.55rem;
  background: linear-gradient(145deg, #fff4c9, #f4d876);
  border: 1px solid #e5ca74;
  box-shadow: 0 7px 16px rgba(139, 96, 19, 0.12);
  border-radius: 15px;
}

.panel-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
  margin: 13px 0 11px;
  padding: 4px;
  background: #f3eddf;
  border-radius: 12px;
}

.panel-tabs button {
  min-height: 34px;
  color: #8f9187;
  font-size: 0.7rem;
  font-weight: 750;
  background: transparent;
  border: 0;
  border-radius: 9px;
}

.panel-tabs button.active {
  color: #fffdf6;
  background: var(--olive);
  box-shadow: 0 4px 10px rgba(45, 56, 43, 0.18);
}

.panel-tabs span {
  display: inline-grid;
  place-items: center;
  min-width: 17px;
  height: 17px;
  margin-left: 3px;
  color: #fff;
  font-size: 0.52rem;
  background: var(--coral);
  border-radius: 999px;
}

.weather-detail {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.temperature-hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 164px;
  padding: 22px 24px;
  overflow: hidden;
  background:
    radial-gradient(circle at 88% 23%, rgba(255, 255, 255, 0.88), transparent 8rem),
    linear-gradient(135deg, #fff0b6, #eacb68);
  border: 1px solid #e3c975;
  border-radius: 21px;
}

.temperature-hero::after {
  position: absolute;
  width: 165px;
  height: 165px;
  background: rgba(255, 255, 255, 0.28);
  border-radius: 50%;
  content: '';
  top: -69px;
  right: -40px;
}

.temperature-content {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
}

.temperature-content > small {
  color: #8a651e;
  font-size: 0.57rem;
  font-weight: 800;
}

.temperature-line {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin: 9px 0 12px;
}

.temperature-hero strong {
  color: var(--olive-deep);
  font-size: clamp(3.8rem, 7.8vh, 5.2rem);
  font-weight: 350;
  line-height: 0.85;
  letter-spacing: -0.08em;
}

.temperature-hero sup {
  margin-left: 3px;
  font-size: 0.35em;
  letter-spacing: 0;
}

.temperature-hero p {
  margin: 0 0 5px;
  color: #596346;
  font-size: 1rem;
  font-weight: 800;
}

.weather-hero-icon {
  position: relative;
  z-index: 1;
  display: grid;
  flex: none;
  place-items: center;
  width: 106px;
  height: 106px;
  font-size: 4.5rem;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 32px;
  backdrop-filter: blur(9px);
  box-shadow: 0 14px 34px rgba(117, 86, 23, 0.14);
}

.large-label {
  padding: 7px 10px;
  font-size: 0.62rem;
  font-weight: 800;
  border-radius: 999px;
}

.large-label.hot {
  color: #c54d16;
  background: #fff0e8;
}

.large-label.cool {
  color: var(--olive);
  background: #e8eedb;
}

.weather-advice {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 62px;
  margin-top: 10px;
  padding: 11px 14px;
  background: #f0f3e8;
  border: 1px solid #dbe3ce;
  border-radius: 15px;
}

.weather-advice > span {
  display: grid;
  flex: none;
  place-items: center;
  width: 38px;
  height: 38px;
  background: #fff0bd;
  border-radius: 12px;
}

.weather-advice p {
  display: flex;
  min-width: 0;
  flex-direction: column;
  margin: 0;
}

.weather-advice small {
  color: #8a651e;
  font-size: 0.49rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.weather-advice strong {
  margin-top: 3px;
  color: #4e5a43;
  font-size: 0.65rem;
  line-height: 1.45;
}

.weather-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin: 10px 0 0;
}

.weather-metrics > div {
  position: relative;
  min-width: 0;
  min-height: 72px;
  padding: 14px 10px 12px 50px;
  text-align: left;
  background: #fff8df;
  border: 1px solid #ebddb3;
  border-radius: 15px;
}

.weather-metrics > div:nth-child(2) {
  background: #eef2e5;
  border-color: #d8e0cb;
}

.weather-metrics > div:nth-child(3) {
  background: #fff1e7;
  border-color: #f0d7c3;
}

.weather-metrics > div:nth-child(4) {
  background: #f3eddf;
  border-color: #e2d6bd;
}

.weather-metrics > div::before {
  position: absolute;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  font-size: 0.95rem;
  background: #f3d979;
  border-radius: 10px;
  content: '🌡️';
  top: 19px;
  left: 11px;
}

.weather-metrics > div:nth-child(2)::before {
  content: '💧';
  background: #dce6cc;
}

.weather-metrics > div:nth-child(3)::before {
  content: '☔';
  background: #f6d2bb;
}

.weather-metrics > div:nth-child(4)::before {
  content: '🍃';
  background: #d8dfca;
}

.weather-metrics dt {
  color: #8f9187;
  font-size: 0.57rem;
}

.weather-metrics dd {
  overflow: hidden;
  margin: 4px 0 0;
  color: var(--olive-deep);
  font-size: 0.8rem;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.popular-foods {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  min-height: 72px;
  padding: 12px 13px;
  background: #fff4df;
  border: 1px solid #ecd9ad;
  border-radius: 16px;
}

.popular-foods > div {
  flex: 1;
  min-width: 86px;
}

.popular-foods p {
  color: var(--sun-deep);
  font-size: 0.49rem;
}

.popular-foods strong {
  display: block;
  margin-top: 2px;
  color: var(--olive-deep);
  font-size: 0.72rem;
}

.popular-foods > span {
  padding: 7px 9px;
  color: #75520e;
  font-size: 0.61rem;
  font-weight: 700;
  background: #fffdf6;
  border-radius: 999px;
  white-space: nowrap;
}

.menu-recommend-link {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin-top: auto;
  min-height: 62px;
  padding: 12px 15px;
  color: inherit;
  text-align: left;
  background: var(--olive);
  border: 0;
  border-radius: 16px;
  transition:
    transform 150ms ease,
    background 150ms ease;
}

.menu-recommend-link:hover {
  background: var(--olive-deep);
  transform: translateY(-1px);
}

.menu-recommend-link > span {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 12px;
}

.menu-recommend-link > div {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.menu-recommend-link small {
  color: #d9dfc7;
  font-size: 0.59rem;
}

.menu-recommend-link strong,
.menu-recommend-link b {
  color: #fff;
}

.menu-recommend-link strong {
  margin-top: 2px;
  font-size: 0.76rem;
}

.weather-list-heading {
  height: 42px;
}

.list-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.list-title > span {
  display: grid;
  place-items: center;
  width: 33px;
  height: 33px;
  background: #fff0bd;
  border-radius: 10px;
}

.list-title h2 {
  margin: 1px 0 0;
  color: #364034;
  font-size: 0.82rem;
}

.selection-status {
  display: flex;
  align-items: center;
  height: 24px;
  margin-bottom: 6px;
  padding: 0 9px;
  color: #16715c;
  font-size: 0.58rem;
  font-weight: 750;
  background: #ecfbf5;
  border-radius: 8px;
}

.weather-card-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  grid-template-rows: repeat(4, minmax(0, 1fr));
  gap: 10px;
  height: calc(100% - 110px);
}

.no-search-result {
  display: grid;
  place-items: center;
  height: calc(100% - 110px);
  color: #8f9187;
  font-size: 0.75rem;
  background: #f7f2e7;
  border-radius: 12px;
}

@media (min-width: 1200px) and (max-height: 780px) {
  .weather-advice,
  .popular-foods {
    display: none;
  }

  .nationwide-card .weather-list-heading {
    height: 55px;
  }

  .nationwide-card .weather-card-grid,
  .nationwide-card .no-search-result {
    height: calc(100% - 99px);
  }
}

@media (max-width: 1199px) {
  .weather-dashboard {
    display: block;
    width: min(920px, calc(100% - 28px));
    height: auto;
    min-height: calc(100svh - 66px);
  }

  .dashboard-top {
    grid-template-columns: 1fr;
    height: auto;
  }

  .map-card {
    height: 560px;
  }

  .detail-panel {
    min-height: 560px;
  }

  .nationwide-page {
    width: min(920px, calc(100% - 28px));
    height: auto;
    min-height: calc(100svh - 66px);
  }

  .weather-card-grid {
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: none;
    grid-auto-rows: 150px;
    height: auto;
  }
}

@media (max-width: 680px) {
  .site-header {
    grid-template-columns: auto minmax(0, 1fr);
    width: calc(100% - 20px);
  }

  .site-header nav {
    justify-self: stretch;
    margin-left: 7px;
  }

  .site-header nav button {
    padding: 0 10px;
  }

  .site-brand small,
  .header-weather {
    display: none;
  }

  .weather-dashboard {
    width: min(100% - 20px, 920px);
    padding-top: 10px;
  }

  .nationwide-page {
    width: calc(100% - 20px);
  }

  .map-card {
    height: 470px;
    padding: 15px 13px 9px;
  }

  .map-heading {
    align-items: flex-start;
  }

  .mock-badge {
    padding: 6px;
    font-size: 0.5rem;
  }

  .map-footer span {
    display: none;
  }

  .detail-panel {
    min-height: 600px;
    padding: 15px;
  }

  .weather-list-heading {
    align-items: flex-start;
    height: auto;
  }

  .list-title {
    display: none;
  }

  .weather-card-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 145px;
  }
}
</style>
