<script setup>
import { computed, ref } from 'vue'

import WeatherMenuRecommend from './WeatherMenuRecommend.vue'
import WeatherMockCard from './WeatherMockCard.vue'
import WeatherRegionMap from './WeatherRegionMap.vue'
import WeatherRestaurantPanel from './WeatherRestaurantPanel.vue'
import { weatherList as weatherMockList } from './weatherMockData'

// 과제 1 핵심: 임의의 날씨 데이터 배열을 ref로 관리합니다.
const weatherList = ref(weatherMockList)
const searchQuery = ref('')
const selectedRegionId = ref('')
const selectedDistrict = ref('')
const selectedCityInfo = ref('지도를 누르거나 날씨 카드를 선택해 보세요.')
const activeView = ref('weather')
const activePanel = ref('weather')

const RESTAURANT_STORAGE_KEY = 'weather-bite-restaurants-v1'

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

const selectedWeather = computed(
  () => weatherList.value.find((weather) => weather.id === selectedRegionId.value) ?? null,
)

const recommendWeather = computed(() => selectedWeather.value ?? weatherList.value[0])
const isDrilled = computed(() => Boolean(selectedWeather.value))
const mapFile = computed(() =>
  selectedWeather.value
    ? `${selectedWeather.value.mapName}_시군구_경계.svg`
    : '전국_시도_경계.svg',
)
const mapRegions = computed(() => (isDrilled.value ? [] : weatherList.value))
const mapActiveName = computed(() =>
  isDrilled.value ? selectedDistrict.value : selectedWeather.value?.mapName ?? '',
)

const filteredWeatherList = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase('ko-KR')
  if (!query) return weatherList.value

  return weatherList.value.filter((weather) =>
    `${weather.name} ${weather.fullName}`.toLocaleLowerCase('ko-KR').includes(query),
  )
})

const selectedRestaurants = computed(() =>
  restaurants.value.filter(
    (restaurant) =>
      restaurant.regionId === selectedRegionId.value &&
      restaurant.districtName === selectedDistrict.value,
  ),
)

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

const mapRestaurantCounts = computed(() =>
  isDrilled.value ? districtRestaurantCounts.value : restaurantCounts.value,
)

const saveRestaurants = () => {
  window.localStorage.setItem(RESTAURANT_STORAGE_KEY, JSON.stringify(restaurants.value))
}

const makeRestaurantId = () => {
  if (typeof window.crypto?.randomUUID === 'function') return window.crypto.randomUUID()
  return `restaurant_${Date.now()}_${Math.random().toString(16).slice(2)}`
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

// 과제 1 핵심: 상세보기 버튼에서 호출되는 alert 함수입니다.
const showDetail = (weather) => {
  window.alert(
    `${weather.name}의 현재 날씨는 [${weather.status}] 상태이며, 기온은 ${weather.temp}°C입니다.`,
  )
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
  restaurants.value = restaurants.value.filter(
    (restaurant) => restaurant.id !== restaurantId,
  )
  saveRestaurants()
}
</script>

<template>
  <div class="weather-bite-app">
    <header class="site-header">
      <button class="site-brand" type="button" @click="activeView = 'weather'">
        <span aria-hidden="true">🌤️</span>
        <div>
          <strong>날씨한입</strong>
          <small>WEATHER × FOOD</small>
        </div>
      </button>

      <nav aria-label="주요 메뉴">
        <button
          type="button"
          :class="{ active: activeView === 'weather' }"
          @click="activeView = 'weather'"
        >
          날씨지도
        </button>
        <button
          type="button"
          :class="{ active: activeView === 'nationwide' }"
          @click="activeView = 'nationwide'"
        >
          전국날씨
        </button>
        <button
          type="button"
          :class="{ active: activeView === 'menu' }"
          @click="activeView = 'menu'"
        >
          저메추
          <span>100</span>
        </button>
      </nav>

      <div class="header-weather">
        <span>{{ selectedWeather ? selectedWeather.emoji : '🗺️' }}</span>
        <div>
          <small>{{ selectedWeather ? selectedWeather.name : '지역 선택' }}</small>
          <strong v-if="selectedWeather">
            {{ selectedWeather.temp }}° {{ selectedWeather.status }}
          </strong>
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
            <span v-if="isDrilled" class="mock-badge restaurant-total">
              📍 등록 맛집 {{ restaurantCounts[selectedRegionId] ?? 0 }}곳
            </span>
            <span v-else class="mock-badge"><i></i> 과제용 MOCK · 12:00</span>
          </header>

          <div class="map-stage">
            <WeatherRegionMap
              :file="mapFile"
              :active-name="mapActiveName"
              :regions="mapRegions"
              :restaurant-counts="mapRestaurantCounts"
              :drilled="isDrilled"
              @select="selectFromMap"
            />
            <button
              v-if="isDrilled"
              class="map-back-button"
              type="button"
              @click="returnToNational"
            >
              ← 전국 지도로
            </button>
          </div>

          <footer class="map-footer">
            <span v-if="isDrilled">
              <b>TIP</b> 구·군을 선택하면 해당 동네 맛집을 등록할 수 있어요.
            </span>
            <span v-else>
              <b>TIP</b> 숫자는 시·도별 등록 맛집 합계예요. 지역을 눌러 자세히 보세요.
            </span>
            <a href="https://github.com/statgarten/maps" target="_blank" rel="noreferrer">
              지도: SGIS 기반 statgarten/maps
            </a>
          </footer>
        </article>

        <aside class="dashboard-card detail-panel" aria-live="polite">
          <div v-if="!selectedWeather" class="empty-detail-panel">
            <span aria-hidden="true">🗺️</span>
            <small>REGION SELECT</small>
            <strong>아직 선택된 지역이 없어요</strong>
            <p>
              전국 지도에서 궁금한 시·도를 선택하면<br />날씨와 구·군별 맛집지도를 보여드려요.
            </p>
            <div>
              <b>1</b> 시·도 선택 <i>→</i> <b>2</b> 구·군 선택 <i>→</i> <b>3</b> 맛집 등록
            </div>
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
            <button
              type="button"
              role="tab"
              :aria-selected="activePanel === 'weather'"
              :class="{ active: activePanel === 'weather' }"
              @click="activePanel = 'weather'"
            >
              오늘 날씨
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="activePanel === 'restaurants'"
              :class="{ active: activePanel === 'restaurants' }"
              @click="activePanel = 'restaurants'"
            >
              맛집지도
              <span>{{ restaurantCounts[selectedRegionId] ?? 0 }}</span>
            </button>
          </div>

          <div v-if="activePanel === 'weather'" class="weather-detail">
            <div class="temperature-hero">
              <div class="temperature-content">
                <small>현재 기온 · 과제용 Mock 12:00</small>
                <div class="temperature-line">
                  <strong>{{ selectedWeather.temp }}<sup>°C</sup></strong>
                  <p>{{ selectedWeather.status }}</p>
                </div>
                <span v-if="selectedWeather.temp >= 25" class="large-label hot">
                  🔥 더움 (25도 이상)
                </span>
                <span v-else class="large-label cool">❄️ 선선함 (25도 미만)</span>
              </div>
              <span class="weather-hero-icon" aria-hidden="true">{{ selectedWeather.emoji }}</span>
            </div>

            <div class="weather-advice">
              <span aria-hidden="true">💡</span>
              <p>
                <small>TODAY'S TIP</small>
                <strong>
                  {{ selectedWeather.name }}은 현재 {{ selectedWeather.status }} 상태예요.
                  오늘 기온에 어울리는 메뉴도 함께 골라보세요.
                </strong>
              </p>
            </div>

            <dl class="weather-metrics">
              <div>
                <dt>최고 / 최저</dt>
                <dd>{{ selectedWeather.high }}° / {{ selectedWeather.low }}°</dd>
              </div>
              <div>
                <dt>습도</dt>
                <dd>{{ selectedWeather.humidity }}%</dd>
              </div>
              <div>
                <dt>강수확률</dt>
                <dd>{{ selectedWeather.rainChance }}%</dd>
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
      <section
        class="weather-list-card nationwide-card"
        aria-labelledby="weather-list-title"
      >
        <header class="weather-list-heading">
          <div class="list-title">
            <span aria-hidden="true">🌦️</span>
            <div>
              <p>NATIONWIDE</p>
              <h2 id="weather-list-title">전국 날씨 한눈에 보기</h2>
            </div>
          </div>

          <div class="search-area">
            <label for="city-search">도시 검색</label>
            <div class="search-input">
              <span aria-hidden="true">⌕</span>
              <!-- 과제 1 핵심: v-model 대신 :value와 @input으로 한글 입력을 처리합니다. -->
              <input
                id="city-search"
                type="search"
                :value="searchQuery"
                placeholder="한글 도시명 검색"
                @input="searchQuery = $event.target.value"
              />
            </div>
            <p>
              검색 중인 도시: <strong>{{ searchQuery || '전체' }}</strong>
            </p>
          </div>
        </header>

        <div class="selection-status" role="status">{{ selectedCityInfo }}</div>

        <div v-if="filteredWeatherList.length" class="weather-card-grid">
          <!-- 과제 1 핵심: v-for와 :key="item.id"로 날씨 카드를 반복 렌더링합니다. -->
          <WeatherMockCard
            v-for="item in filteredWeatherList"
            :key="item.id"
            :weather="item"
            :selected="item.id === selectedRegionId"
            size="large"
            @select="selectWeather"
            @detail="showDetail"
          />
        </div>
        <div v-else class="no-search-result" role="status">
          ‘{{ searchQuery }}’와 일치하는 도시가 없어요.
        </div>
      </section>
    </section>

    <WeatherMenuRecommend v-else :weather="recommendWeather" />
  </div>
</template>

<style scoped>
.weather-bite-app {
  min-height: 100svh;
  color: #191f28;
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
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(221, 228, 236, 0.92);
  border-radius: 16px;
  backdrop-filter: blur(18px);
  box-shadow: 0 9px 28px rgba(24, 52, 82, 0.08);
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

.site-brand > span {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  font-size: 1.15rem;
  background: #3182f6;
  border-radius: 10px;
}

.site-brand > div,
.header-weather > div {
  display: flex;
  flex-direction: column;
}

.site-brand strong {
  color: #202b3a;
  font-size: 0.78rem;
}

.site-brand small {
  color: #8b95a1;
  font-size: 0.45rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.site-header nav {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  background: #f2f4f6;
  border-radius: 11px;
}

.site-header nav button {
  min-height: 32px;
  padding: 0 13px;
  color: #6b7684;
  font-size: 0.67rem;
  font-weight: 800;
  background: transparent;
  border: 0;
  border-radius: 8px;
}

.site-header nav button.active {
  color: #1b64da;
  background: #fff;
  box-shadow: 0 3px 8px rgba(27, 65, 105, 0.08);
}

.site-header nav span {
  display: inline-grid;
  place-items: center;
  min-width: 18px;
  height: 17px;
  margin-left: 3px;
  color: #fff;
  font-size: 0.49rem;
  background: #ff8a3d;
  border-radius: 999px;
}

.header-weather {
  display: flex;
  align-items: center;
  justify-self: end;
  gap: 7px;
  padding: 5px 9px;
  background: #f4f8fd;
  border-radius: 10px;
}

.header-weather > span {
  font-size: 1rem;
}

.header-weather small {
  color: #8b95a1;
  font-size: 0.48rem;
}

.header-weather strong {
  color: #344054;
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

.dashboard-card,
.weather-list-card {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(220, 228, 237, 0.9);
  box-shadow: 0 12px 38px rgba(29, 59, 93, 0.08);
}

.nationwide-page {
  width: min(1500px, calc(100% - 36px));
  height: calc(100svh - 66px);
  margin: 0 auto;
  padding: 12px 0 14px;
}

.nationwide-card {
  height: 100%;
  padding: 22px 24px 24px;
  border-radius: 22px;
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

.nationwide-card .search-input {
  width: 250px;
  height: 40px;
}

.nationwide-card .search-input input {
  flex: 1;
  font-size: 0.75rem;
}

.nationwide-card .search-area > label,
.nationwide-card .search-area > p {
  font-size: 0.68rem;
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
  color: #3182f6;
  font-size: 0.57rem;
  font-weight: 900;
  letter-spacing: 0.1em;
}

.card-heading h1 {
  margin: 4px 0 0;
  color: #202b3a;
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
  color: #8b95a1;
  font-size: inherit;
  font-weight: 800;
  background: transparent;
  border: 0;
}

.map-breadcrumb button:hover {
  color: #1b64da;
}

.mock-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 9px;
  color: #6b7684;
  font-size: 0.6rem;
  font-weight: 800;
  background: #f2f4f6;
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

.map-stage {
  position: relative;
  min-height: 0;
  margin-top: 7px;
  background: radial-gradient(circle at 50% 46%, rgba(49, 130, 246, 0.09), transparent 48%),
    linear-gradient(145deg, #fbfdff, #f7faff);
  border: 1px solid #e8eef5;
  border-radius: 18px;
  overflow: hidden;
}

.map-back-button {
  position: absolute;
  bottom: 12px;
  left: 12px;
  z-index: 8;
  min-height: 34px;
  padding: 0 11px;
  color: #53657a;
  font-size: 0.62rem;
  font-weight: 800;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid #dfe7ef;
  border-radius: 10px;
  box-shadow: 0 6px 18px rgba(24, 52, 82, 0.12);
}

.map-back-button:hover {
  color: #1b64da;
}

.map-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 2px 0;
  color: #8b95a1;
  font-size: 0.55rem;
}

.map-footer b {
  margin-right: 4px;
  color: #3182f6;
}

.map-footer a {
  color: #8b95a1;
  text-decoration: none;
}

.detail-panel {
  display: flex;
  flex-direction: column;
  padding: 18px;
  overflow: hidden;
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
  background: linear-gradient(145deg, #fbfdff, #f3f8ff);
  border: 1px dashed #cfddec;
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
  background: #e8f3ff;
  border-radius: 22px;
}

.empty-detail-panel > small,
.district-empty > small {
  color: #3182f6;
  font-size: 0.55rem;
  font-weight: 900;
  letter-spacing: 0.1em;
}

.empty-detail-panel > strong,
.district-empty > strong {
  margin-top: 5px;
  color: #253448;
  font-size: 1rem;
}

.empty-detail-panel > p,
.district-empty > p {
  margin: 8px 0 0;
  color: #8b95a1;
  font-size: 0.67rem;
  line-height: 1.65;
}

.empty-detail-panel > div {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 22px;
  padding: 9px 12px;
  color: #6b7684;
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
  background: #3182f6;
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
  color: #253448;
  font-size: 1.25rem;
  letter-spacing: -0.045em;
}

.detail-weather-icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  font-size: 1.55rem;
  background: #f1f7ff;
  border-radius: 15px;
}

.panel-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
  margin: 13px 0 11px;
  padding: 4px;
  background: #f2f4f6;
  border-radius: 12px;
}

.panel-tabs button {
  min-height: 34px;
  color: #8b95a1;
  font-size: 0.7rem;
  font-weight: 750;
  background: transparent;
  border: 0;
  border-radius: 9px;
}

.panel-tabs button.active {
  color: #1b64da;
  background: #fff;
  box-shadow: 0 3px 9px rgba(27, 65, 105, 0.08);
}

.panel-tabs span {
  display: inline-grid;
  place-items: center;
  min-width: 17px;
  height: 17px;
  margin-left: 3px;
  color: #fff;
  font-size: 0.52rem;
  background: #ff8a3d;
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
    radial-gradient(circle at 88% 23%, rgba(255, 255, 255, 0.9), transparent 8rem),
    linear-gradient(135deg, #edf6ff, #dfeeff);
  border: 1px solid #dcecff;
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
  color: #4e79ac;
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
  color: #172b46;
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
  color: #425b78;
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
  box-shadow: 0 14px 34px rgba(35, 79, 128, 0.12);
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
  color: #1b64da;
  background: #e3f0ff;
}

.weather-advice {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 62px;
  margin-top: 10px;
  padding: 11px 14px;
  background: #f8fafc;
  border: 1px solid #e9edf2;
  border-radius: 15px;
}

.weather-advice > span {
  display: grid;
  flex: none;
  place-items: center;
  width: 38px;
  height: 38px;
  background: #fff3e9;
  border-radius: 12px;
}

.weather-advice p {
  display: flex;
  min-width: 0;
  flex-direction: column;
  margin: 0;
}

.weather-advice small {
  color: #ff7a2d;
  font-size: 0.49rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.weather-advice strong {
  margin-top: 3px;
  color: #536274;
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
  background: #f8fafc;
  border: 1px solid #e9edf2;
  border-radius: 15px;
}

.weather-metrics > div::before {
  position: absolute;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  font-size: 0.95rem;
  background: #eaf3ff;
  border-radius: 10px;
  content: '🌡️';
  top: 19px;
  left: 11px;
}

.weather-metrics > div:nth-child(2)::before {
  content: '💧';
}

.weather-metrics > div:nth-child(3)::before {
  content: '☔';
}

.weather-metrics > div:nth-child(4)::before {
  content: '🍃';
}

.weather-metrics dt {
  color: #8b95a1;
  font-size: 0.57rem;
}

.weather-metrics dd {
  overflow: hidden;
  margin: 4px 0 0;
  color: #344054;
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
  background: #fff8f3;
  border: 1px solid #ffe6d4;
  border-radius: 16px;
}

.popular-foods > div {
  flex: 1;
  min-width: 86px;
}

.popular-foods p {
  color: #ef7627;
  font-size: 0.49rem;
}

.popular-foods strong {
  display: block;
  margin-top: 2px;
  color: #7b3c16;
  font-size: 0.72rem;
}

.popular-foods > span {
  padding: 7px 9px;
  color: #9a4b1b;
  font-size: 0.61rem;
  font-weight: 700;
  background: #fff;
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
  background: #26364a;
  border: 0;
  border-radius: 16px;
  transition: transform 150ms ease, background 150ms ease;
}

.menu-recommend-link:hover {
  background: #1e2d40;
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
  color: #9fb4cc;
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

.weather-list-card {
  min-height: 0;
  padding: 11px 13px 12px;
  border-radius: 19px;
  overflow: hidden;
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
  background: #eef6ff;
  border-radius: 10px;
}

.list-title h2 {
  margin: 1px 0 0;
  color: #333d4b;
  font-size: 0.82rem;
}

.search-area {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-area > label {
  color: #6b7684;
  font-size: 0.61rem;
  font-weight: 800;
}

.search-input {
  display: flex;
  align-items: center;
  width: 190px;
  height: 32px;
  padding: 0 9px;
  background: #f7f9fb;
  border: 1px solid #dfe5ec;
  border-radius: 10px;
}

.search-input span {
  color: #8b95a1;
  font-size: 1rem;
}

.search-input input {
  min-width: 0;
  height: 100%;
  padding: 0 6px;
  color: #333d4b;
  font-size: 0.66rem;
  background: transparent;
  border: 0;
  outline: none;
}

.search-area > p {
  min-width: 125px;
  margin: 0;
  color: #8b95a1;
  font-size: 0.58rem;
}

.search-area strong {
  color: #3182f6;
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
  color: #8b95a1;
  font-size: 0.75rem;
  background: #f8fafc;
  border-radius: 12px;
}

@media (min-width: 1200px) and (max-height: 780px) {
  .weather-advice,
  .popular-foods {
    display: none;
  }

  .nationwide-card {
    padding-top: 14px;
    padding-bottom: 16px;
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

  .nationwide-card {
    height: auto;
    min-height: calc(100svh - 92px);
    overflow: visible;
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
    grid-template-columns: 1fr auto;
    width: calc(100% - 20px);
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

  .nationwide-card {
    padding: 14px;
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

  .search-area {
    flex-wrap: wrap;
    width: 100%;
  }

  .search-input {
    flex: 1;
  }

  .weather-card-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 145px;
  }
}
</style>
