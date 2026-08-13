<script setup>
import { computed, onMounted, ref } from 'vue'

import { foodCategories, foodList } from './foodMockData'

const props = defineProps({
  weather: {
    type: Object,
    required: true,
  },
})

const mode = ref('weather')
const selectedCategory = ref('전체')
const resultFood = ref(null)
const displayedFood = ref(null)
const isSpinning = ref(false)
const drawHistory = ref([])

const DRAW_HISTORY_STORAGE_KEY = 'weather-bite-menu-draw-history'

const categoryEmoji = {
  한식: '🍚',
  분식: '🍢',
  일식: '🍣',
  중식: '🥟',
  양식: '🍝',
  아시안: '🍜',
  야식: '🍗',
}

const weatherTag = computed(() => {
  if (['비', '소나기'].includes(props.weather.status)) return 'rainy'
  if (props.weather.temp >= 25) return 'hot'
  if (props.weather.temp < 10 || props.weather.status === '눈') return 'cold'
  return 'mild'
})

const tagLabel = computed(
  () =>
    ({
      rainy: '비 오는 날',
      hot: '더운 날',
      cold: '추운 날',
      mild: '선선한 날',
    })[weatherTag.value],
)

const categoryFoods = computed(() => (selectedCategory.value === '전체' ? foodList : foodList.filter((food) => food.category === selectedCategory.value)))

const candidateFoods = computed(() => {
  if (mode.value === 'random') return categoryFoods.value
  return categoryFoods.value.filter((food) => food.weatherTags.includes(weatherTag.value))
})

const recommendationReason = computed(() => {
  if (!resultFood.value) return ''
  if (mode.value === 'random') return '고민은 잠시 내려놓고 완전 랜덤으로 골랐어요.'

  const reasons = {
    rainy: '비 오는 날의 분위기와 잘 어울리는 메뉴예요.',
    hot: `${props.weather.temp}° 더위를 달래기 좋은 메뉴예요.`,
    cold: '쌀쌀한 날 속을 든든하게 채워 줄 메뉴예요.',
    mild: '선선한 오늘 부담 없이 즐기기 좋은 메뉴예요.',
  }
  return reasons[weatherTag.value]
})

const pickRandom = (foods) => foods[Math.floor(Math.random() * foods.length)]

const saveDrawHistory = () => {
  try {
    window.localStorage.setItem(DRAW_HISTORY_STORAGE_KEY, JSON.stringify(drawHistory.value))
  } catch {
    // 저장 공간을 사용할 수 없어도 메뉴 뽑기는 계속 동작한다.
  }
}

const loadDrawHistory = () => {
  try {
    const storedHistory = JSON.parse(window.localStorage.getItem(DRAW_HISTORY_STORAGE_KEY) ?? '[]')
    if (!Array.isArray(storedHistory)) return

    drawHistory.value = storedHistory
      .filter((item) => item && typeof item.name === 'string' && typeof item.category === 'string' && typeof item.drawnAt === 'string' && !Number.isNaN(Date.parse(item.drawnAt)))
      .map((item, index) => ({
        ...item,
        id: typeof item.id === 'string' ? item.id : `${item.drawnAt}-${item.foodId ?? index}`,
      }))
  } catch {
    drawHistory.value = []
  }
}

const formatDrawTime = (drawnAt) =>
  new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(drawnAt))

const drawMenu = async () => {
  if (isSpinning.value || candidateFoods.value.length === 0) return

  const drawPool = [...candidateFoods.value]
  const drawMode = mode.value
  const drawWeatherLabel = tagLabel.value
  isSpinning.value = true

  await new Promise((resolve) => window.setTimeout(resolve, 910))

  const finalPool = drawPool.filter((food) => food.id !== resultFood.value?.id)
  resultFood.value = pickRandom(finalPool.length ? finalPool : drawPool)
  displayedFood.value = resultFood.value
  isSpinning.value = false

  const drawnAt = new Date().toISOString()
  drawHistory.value.unshift({
    id: `${drawnAt}-${resultFood.value.id}`,
    foodId: resultFood.value.id,
    name: resultFood.value.name,
    category: resultFood.value.category,
    mode: drawMode,
    weatherLabel: drawWeatherLabel,
    drawnAt,
  })
  saveDrawHistory()
}

onMounted(loadDrawHistory)
</script>

<template>
  <section class="menu-recommend-page">
    <div class="menu-intro">
      <p>DINNER PICKER · 100 MENUS</p>
      <h1>오늘 저녁, 날씨한입이 골라드릴게요</h1>
      <span> {{ weather.emoji }} {{ weather.name }} {{ weather.temp }}° · {{ weather.status }} </span>
    </div>

    <div class="menu-layout">
      <article class="roulette-card">
        <div class="food-picker-stage" :class="{ spinning: isSpinning }">
          <img class="food-picker-image" src="/food.png" alt="오늘은 뭐 먹지? 저녁 메뉴 뽑기 안내" />

          <div v-if="isSpinning || displayedFood" class="draw-result-card" aria-live="polite">
            <template v-if="isSpinning">
              <small>MENU PICKING</small>
              <div>
                <span aria-hidden="true">🎲</span>
                <h2>메뉴 고르는 중…</h2>
              </div>
              <p>선택한 조건에서 맛있는 메뉴를 찾고 있어요.</p>
            </template>
            <template v-else>
              <small>{{ displayedFood.category }} · {{ mode === 'weather' ? tagLabel : '완전 랜덤' }}</small>
              <div>
                <span aria-hidden="true">{{ categoryEmoji[displayedFood.category] }}</span>
                <h2>{{ displayedFood.name }}</h2>
              </div>
              <p>{{ recommendationReason }}</p>
            </template>
          </div>
        </div>

        <button class="draw-button" type="button" :disabled="isSpinning" @click="drawMenu">
          <span aria-hidden="true">🎲</span>
          {{ isSpinning ? '메뉴 고르는 중…' : '저녁메뉴뽑기' }}
        </button>
      </article>

      <aside class="picker-controls">
        <div class="control-section">
          <div class="control-title">
            <div>
              <small>STEP 1</small>
              <strong>추천 방식</strong>
            </div>
            <span>{{ candidateFoods.length }}개 후보</span>
          </div>
          <div class="mode-buttons">
            <button type="button" :disabled="isSpinning" :class="{ active: mode === 'weather' }" @click="mode = 'weather'">
              <span aria-hidden="true">{{ weather.emoji }}</span>
              <b>날씨 맞춤</b>
              <small>{{ tagLabel }} 메뉴만</small>
            </button>
            <button type="button" :disabled="isSpinning" :class="{ active: mode === 'random' }" @click="mode = 'random'">
              <span aria-hidden="true">🎰</span>
              <b>완전 랜덤</b>
              <small>고민 없이 아무거나</small>
            </button>
          </div>
        </div>

        <div class="control-section category-section">
          <div class="control-title">
            <div>
              <small>STEP 2</small>
              <strong>음식 종류</strong>
            </div>
          </div>
          <div class="category-buttons">
            <button v-for="category in foodCategories" :key="category" type="button" :disabled="isSpinning" :class="{ active: selectedCategory === category }" @click="selectedCategory = category">
              {{ category === '전체' ? '✨' : categoryEmoji[category] }} {{ category }}
            </button>
          </div>
        </div>

        <div class="draw-history" aria-live="polite">
          <div class="history-heading">
            <div>
              <small>MY PICKS</small>
              <strong>내가 뽑은 메뉴</strong>
            </div>
            <span>{{ drawHistory.length }}개</span>
          </div>

          <p v-if="drawHistory.length === 0" class="empty-history">저녁 메뉴를 뽑으면 이곳에 최신순으로 저장돼요.</p>
          <ol v-else>
            <li v-for="item in drawHistory" :key="item.id">
              <span aria-hidden="true">{{ categoryEmoji[item.category] ?? '🍽️' }}</span>
              <div>
                <strong>{{ item.name }}</strong>
                <small>{{ item.category }} · {{ item.mode === 'weather' ? item.weatherLabel : '완전 랜덤' }}</small>
              </div>
              <time :datetime="item.drawnAt">{{ formatDrawTime(item.drawnAt) }}</time>
            </li>
          </ol>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.menu-recommend-page {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 18px;
  width: min(1240px, calc(100% - 36px));
  height: calc(100svh - 66px);
  margin: 0 auto;
  padding: 28px 0 24px;
}

.menu-intro {
  text-align: center;
}

.menu-intro > p {
  margin: 0;
  color: #ff7a2d;
  font-size: 0.66rem;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.menu-intro h1 {
  margin: 7px 0 8px;
  color: #2d382b;
  font-size: clamp(1.6rem, 3vw, 2.25rem);
  letter-spacing: -0.06em;
}

.menu-intro > span {
  display: inline-flex;
  padding: 7px 11px;
  color: #596052;
  font-size: 0.68rem;
  font-weight: 700;
  background: #fff;
  border: 1px solid #e5dac4;
  border-radius: 999px;
}

.menu-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(390px, 0.95fr);
  gap: 16px;
  min-height: 0;
}

.roulette-card,
.picker-controls {
  min-height: 0;
  background: rgba(255, 252, 244, 0.96);
  border: 1px solid #e6d8b9;
  border-radius: 24px;
  box-shadow: 0 16px 42px rgba(87, 65, 26, 0.1);
}

.roulette-card {
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  padding: 20px;
  background: #fff;
}

.food-picker-stage {
  position: relative;
  display: grid;
  flex: 1;
  place-items: center;
  width: min(100%, 550px);
  min-height: 0;
  overflow: hidden;
  border-radius: 24px;
}

.food-picker-image {
  display: block;
  width: auto;
  max-width: 100%;
  height: auto;
  max-height: 100%;
  object-fit: contain;
  border-radius: 24px;
  transition:
    filter 180ms ease,
    transform 220ms ease;
}

.food-picker-stage.spinning .food-picker-image {
  filter: blur(4px) brightness(0.78);
  transform: scale(1.02);
}

.draw-result-card {
  position: absolute;
  top: 55%;
  left: 50%;
  width: min(360px, calc(100% - 44px));
  min-height: 106px;
  padding: 14px 18px;
  box-sizing: border-box;
  text-align: center;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 185, 127, 0.8);
  border-radius: 18px;
  box-shadow: 0 14px 36px rgba(102, 55, 20, 0.2);
  transform: translate(-50%, -50%);
  backdrop-filter: blur(7px);
}

.draw-result-card > small {
  color: #e9681d;
  font-size: 0.6rem;
  font-weight: 900;
  letter-spacing: 0.07em;
}

.draw-result-card > div {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 4px 0;
}

.draw-result-card span {
  font-size: 1.6rem;
}

.draw-result-card h2 {
  margin: 0;
  color: #2d382b;
  font-size: clamp(1.45rem, 3.4vh, 2.25rem);
  letter-spacing: -0.06em;
}

.draw-result-card p {
  margin: 0;
  color: #70766a;
  font-size: 0.65rem;
}

.draw-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: min(310px, 100%);
  min-height: 50px;
  margin-top: 12px;
  color: #fff;
  font-size: 0.82rem;
  font-weight: 850;
  background: linear-gradient(135deg, #ff8a3d, #f36b1f);
  border: 0;
  border-radius: 15px;
  box-shadow: 0 12px 24px rgba(230, 101, 29, 0.25);
}

.draw-button:disabled {
  opacity: 0.7;
}

.picker-controls {
  display: flex;
  flex-direction: column;
  gap: 13px;
  padding: 20px;
  overflow: hidden;
}

.control-section {
  padding: 15px;
  background: #f3eddf;
  border: 1px solid #e2d6bd;
  border-radius: 17px;
}

.control-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.control-title > div {
  display: flex;
  flex-direction: column;
}

.control-title small {
  color: #a86412;
  font-size: 0.52rem;
  font-weight: 900;
  letter-spacing: 0.09em;
}

.control-title strong {
  margin-top: 2px;
  color: #364034;
  font-size: 0.82rem;
}

.control-title > span {
  padding: 5px 8px;
  color: #40513b;
  font-size: 0.58rem;
  font-weight: 800;
  background: #fff1c9;
  border-radius: 999px;
}

.mode-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 11px;
}

.mode-buttons button {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1px 8px;
  padding: 11px;
  text-align: left;
  background: #fff;
  border: 1px solid #e3d8c2;
  border-radius: 12px;
}

.mode-buttons button.active {
  background: #fff0bd;
  border-color: #d8ad3d;
  box-shadow: inset 0 0 0 1px #d8ad3d;
}

.mode-buttons button:disabled,
.category-buttons button:disabled {
  cursor: default;
}

.mode-buttons button > span {
  grid-row: 1 / 3;
  align-self: center;
  font-size: 1.25rem;
}

.mode-buttons b {
  color: #354133;
  font-size: 0.7rem;
}

.mode-buttons small {
  color: #8f9187;
  font-size: 0.56rem;
}

.category-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 7px;
  margin-top: 11px;
}

.category-buttons button {
  min-height: 36px;
  color: #70766a;
  font-size: 0.62rem;
  font-weight: 750;
  background: #fff;
  border: 1px solid #e3d8c2;
  border-radius: 10px;
}

.category-buttons button.active {
  color: #fff;
  background: #a86412;
  border-color: #a86412;
}

.draw-history {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 13px;
  background: linear-gradient(145deg, #fff9f4, #fff);
  border: 1px solid #f0d9c8;
  border-radius: 16px;
  overflow: hidden;
}

.history-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px 9px;
}

.history-heading > div {
  display: flex;
  flex-direction: column;
}

.history-heading small {
  color: #e9681d;
  font-size: 0.5rem;
  font-weight: 900;
  letter-spacing: 0.09em;
}

.history-heading strong {
  margin-top: 2px;
  color: #364034;
  font-size: 0.76rem;
}

.history-heading > span {
  padding: 5px 8px;
  color: #9b633f;
  font-size: 0.55rem;
  font-weight: 800;
  background: #fff1e6;
  border-radius: 999px;
}

.empty-history {
  display: grid;
  flex: 1;
  place-items: center;
  margin: 0;
  color: #9a8d80;
  font-size: 0.62rem;
  text-align: center;
}

.draw-history ol {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  padding: 0 2px 0 0;
  margin: 0;
  list-style: none;
  overflow-y: auto;
}

.draw-history li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
  padding: 8px 9px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #f3e2d5;
  border-radius: 11px;
}

.draw-history li > span {
  font-size: 1.05rem;
}

.draw-history li > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.draw-history li strong {
  overflow: hidden;
  color: #3a4336;
  font-size: 0.66rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.draw-history li small,
.draw-history time {
  color: #91877c;
  font-size: 0.51rem;
}

.draw-history time {
  white-space: nowrap;
}

@media (max-width: 900px) {
  .menu-recommend-page {
    height: auto;
    min-height: calc(100svh - 66px);
  }

  .menu-layout {
    grid-template-columns: 1fr;
  }

  .roulette-card,
  .picker-controls {
    min-height: 600px;
  }
}

@media (max-width: 540px) {
  .menu-recommend-page {
    width: calc(100% - 20px);
    padding-top: 20px;
  }

  .picker-controls {
    padding: 13px;
  }

  .category-buttons {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
