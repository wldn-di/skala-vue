<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'

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
let spinTimer

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

const categoryFoods = computed(() =>
  selectedCategory.value === '전체'
    ? foodList
    : foodList.filter((food) => food.category === selectedCategory.value),
)

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

const drawMenu = async () => {
  if (isSpinning.value || candidateFoods.value.length === 0) return

  isSpinning.value = true
  spinTimer = window.setInterval(() => {
    displayedFood.value = pickRandom(candidateFoods.value)
  }, 65)

  await new Promise((resolve) => window.setTimeout(resolve, 910))
  window.clearInterval(spinTimer)

  const finalPool = candidateFoods.value.filter((food) => food.id !== resultFood.value?.id)
  resultFood.value = pickRandom(finalPool.length ? finalPool : candidateFoods.value)
  displayedFood.value = resultFood.value
  isSpinning.value = false
}

onBeforeUnmount(() => window.clearInterval(spinTimer))
</script>

<template>
  <section class="menu-recommend-page">
    <div class="menu-intro">
      <p>DINNER PICKER · 100 MENUS</p>
      <h1>오늘 저녁, 날씨한입이 골라드릴게요</h1>
      <span>
        {{ weather.emoji }} {{ weather.name }} {{ weather.temp }}° · {{ weather.status }}
      </span>
    </div>

    <div class="menu-layout">
      <article class="roulette-card">
        <div class="roulette-orbit" :class="{ spinning: isSpinning }">
          <span class="orbit-food one">🍜</span>
          <span class="orbit-food two">🥘</span>
          <span class="orbit-food three">🍣</span>
          <div class="result-plate">
            <span v-if="displayedFood" aria-hidden="true">
              {{ categoryEmoji[displayedFood.category] }}
            </span>
            <b v-else aria-hidden="true">?</b>
          </div>
        </div>

        <div class="result-copy" aria-live="polite">
          <template v-if="displayedFood">
            <small>{{ displayedFood.category }} · {{ mode === 'weather' ? tagLabel : '완전 랜덤' }}</small>
            <h2>{{ displayedFood.name }}</h2>
            <p v-if="!isSpinning">{{ recommendationReason }}</p>
            <p v-else>100개 메뉴를 맛있게 섞는 중이에요…</p>
          </template>
          <template v-else>
            <small>READY TO PICK</small>
            <h2>오늘은 뭘 먹을까요?</h2>
            <p>취향을 고르고 아래 버튼을 눌러보세요.</p>
          </template>
        </div>

        <button class="draw-button" type="button" :disabled="isSpinning" @click="drawMenu">
          <span aria-hidden="true">🎲</span>
          {{ isSpinning ? '메뉴 고르는 중…' : resultFood ? '다시 뽑기' : '저녁 메뉴 뽑기' }}
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
            <button
              type="button"
              :class="{ active: mode === 'weather' }"
              @click="mode = 'weather'"
            >
              <span aria-hidden="true">{{ weather.emoji }}</span>
              <b>날씨 맞춤</b>
              <small>{{ tagLabel }} 메뉴만</small>
            </button>
            <button
              type="button"
              :class="{ active: mode === 'random' }"
              @click="mode = 'random'"
            >
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
            <button
              v-for="category in foodCategories"
              :key="category"
              type="button"
              :class="{ active: selectedCategory === category }"
              @click="selectedCategory = category"
            >
              {{ category === '전체' ? '✨' : categoryEmoji[category] }} {{ category }}
            </button>
          </div>
        </div>

        <div class="menu-cloud" aria-label="등록된 메뉴 미리보기">
          <span v-for="food in foodList.slice(0, 24)" :key="food.id">{{ food.name }}</span>
          <b>+ {{ foodList.length - 24 }}개</b>
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
  padding: 25px;
  background: radial-gradient(circle at 50% 35%, #fff5ed, transparent 15rem), #fff;
}

.roulette-orbit {
  position: relative;
  display: grid;
  place-items: center;
  width: clamp(200px, 29vh, 270px);
  height: clamp(200px, 29vh, 270px);
  border: 1px dashed #ffd2b5;
  border-radius: 50%;
}

.roulette-orbit::before,
.roulette-orbit::after {
  position: absolute;
  border: 1px solid #ffe5d4;
  border-radius: 50%;
  content: '';
  inset: 18px;
}

.roulette-orbit::after {
  border-color: #fff0e6;
  inset: 38px;
}

.roulette-orbit.spinning {
  animation: pulse 520ms ease-in-out infinite alternate;
}

.orbit-food {
  position: absolute;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  font-size: 1.3rem;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 22px rgba(191, 89, 25, 0.13);
}

.orbit-food.one {
  top: 14px;
  left: 22px;
}

.orbit-food.two {
  top: 44%;
  right: -8px;
}

.orbit-food.three {
  bottom: 2px;
  left: 24%;
}

.result-plate {
  z-index: 3;
  display: grid;
  place-items: center;
  width: 115px;
  height: 115px;
  background: linear-gradient(145deg, #fff, #fff7f1);
  border: 8px solid #fff;
  border-radius: 50%;
  box-shadow: 0 17px 40px rgba(196, 86, 18, 0.17), inset 0 0 0 1px #ffe8d8;
}

.result-plate span,
.result-plate b {
  font-size: 3.4rem;
}

.result-plate b {
  color: #ff9a5a;
}

.result-copy {
  min-height: 100px;
  margin-top: 16px;
  text-align: center;
}

.result-copy small {
  color: #ff7a2d;
  font-size: 0.63rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.result-copy h2 {
  margin: 4px 0;
  color: #2d382b;
  font-size: clamp(1.8rem, 4vh, 2.8rem);
  letter-spacing: -0.06em;
}

.result-copy p {
  margin: 0;
  color: #8f9187;
  font-size: 0.7rem;
}

.draw-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: min(310px, 100%);
  min-height: 50px;
  margin-top: 10px;
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

.menu-cloud {
  display: flex;
  flex: 1;
  align-content: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 0;
  padding: 13px;
  background: linear-gradient(145deg, #fff9f4, #fff);
  border: 1px dashed #ffd9bf;
  border-radius: 16px;
  overflow: hidden;
}

.menu-cloud span,
.menu-cloud b {
  padding: 5px 7px;
  color: #9b633f;
  font-size: 0.52rem;
  background: #fff;
  border: 1px solid #ffe4d3;
  border-radius: 999px;
}

.menu-cloud b {
  color: #e9681d;
}

@keyframes pulse {
  to {
    transform: scale(1.025) rotate(1deg);
  }
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
