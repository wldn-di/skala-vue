<script setup>
import { computed } from 'vue'

// 과제 3과 최종 화면에서 재사용하는 날씨 카드
const props = defineProps({
  cityItem: {
    type: Object,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String,
    default: 'compact',
    validator: (value) => ['compact', 'large'].includes(value),
  },
  unit: {
    type: String,
    default: 'celsius',
    validator: (value) => ['celsius', 'fahrenheit'].includes(value),
  },
  unitSymbol: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['select-card', 'click-detail'])

const convertTemp = (temp) => (props.unit === 'fahrenheit' ? Math.round((temp * 9) / 5 + 32) : temp)
const displayTemp = computed(() => convertTemp(props.cityItem.temp))
const displayUnitSymbol = computed(() => props.unitSymbol || (props.unit === 'fahrenheit' ? '℉' : '℃'))
</script>

<template>
  <article
    class="weather-mini-card"
    :class="{
      'is-selected': selected,
      'is-large': size === 'large',
      'is-hot': cityItem.temp >= 25,
      'is-cool': cityItem.temp < 25,
    }"
    role="button"
    tabindex="0"
    :aria-label="`${cityItem.name} 날씨 선택`"
    @click="emit('select-card', cityItem)"
    @keydown.enter="emit('select-card', cityItem)"
    @keydown.space.prevent="emit('select-card', cityItem)"
  >
    <template v-if="size === 'large'">
      <header class="large-card-heading">
        <div>
          <small>REGION WEATHER · {{ cityItem.dataSource === 'live' ? 'LIVE' : 'MOCK' }}</small>
          <strong>{{ cityItem.fullName || cityItem.name }}</strong>
        </div>
        <span class="large-weather-icon" aria-hidden="true">{{ cityItem.emoji || '🌤️' }}</span>
      </header>

      <div class="large-weather-main">
        <b>{{ displayTemp }}<sup>{{ displayUnitSymbol }}</sup></b>
        <div>
          <strong>{{ cityItem.status }}</strong>
          <small v-if="cityItem.dataSource === 'live'">관측 범위 {{ convertTemp(cityItem.low) }}{{ displayUnitSymbol }} ~ {{ convertTemp(cityItem.high) }}{{ displayUnitSymbol }}</small>
          <small v-else>최고 {{ convertTemp(cityItem.high) }}{{ displayUnitSymbol }} · 최저 {{ convertTemp(cityItem.low) }}{{ displayUnitSymbol }}</small>
        </div>
      </div>

      <footer class="large-card-footer">
        <span v-if="cityItem.temp >= 25" class="temperature-label hot"> 🔥 더움 (25도 이상) </span>
        <span v-else class="temperature-label cool">❄️ 선선함 (25도 미만)</span>

        <button class="detail-button" type="button" :aria-label="`${cityItem.name} 날씨 상세보기`" @click.stop="emit('click-detail', cityItem)">상세보기 <i aria-hidden="true">→</i></button>
      </footer>
    </template>

    <template v-else>
      <div class="mini-heading">
        <strong>{{ cityItem.name }}</strong>
        <span>{{ cityItem.emoji || '🌤️' }}</span>
      </div>
      <div class="mini-weather">
        <b>{{ displayTemp }}{{ displayUnitSymbol }}</b>
        <small>{{ cityItem.status }}</small>
      </div>

      <span v-if="cityItem.temp >= 25" class="temperature-label hot"> 🔥 더움 (25도 이상) </span>
      <span v-else class="temperature-label cool">❄️ 선선함 (25도 미만)</span>

      <button class="detail-button" type="button" :aria-label="`${cityItem.name} 날씨 상세보기`" @click.stop="emit('click-detail', cityItem)">상세보기</button>
    </template>
  </article>
</template>

<style scoped>
.weather-mini-card {
  position: relative;
  min-width: 0;
  padding: 9px 9px 8px;
  background: #fff;
  border: 1px solid #e4dac6;
  border-radius: 13px;
  cursor: pointer;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease,
    transform 150ms ease;
}

.weather-mini-card:hover,
.weather-mini-card:focus-visible {
  border-color: #dfb64b;
  outline: none;
  transform: translateY(-1px);
  box-shadow: 0 7px 16px rgba(146, 98, 23, 0.13);
}

.weather-mini-card.is-selected {
  background: #fff9e8;
  border-color: #d99a1b;
  box-shadow: inset 0 0 0 1px #d99a1b;
}

.mini-heading,
.mini-weather {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mini-heading strong {
  overflow: hidden;
  color: #364034;
  font-size: 0.75rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mini-heading span {
  font-size: 0.8rem;
}

.mini-weather {
  justify-content: flex-start;
  gap: 5px;
  margin-top: 4px;
}

.mini-weather b {
  color: #191f28;
  font-size: 1rem;
  line-height: 1;
}

.mini-weather small {
  color: #8f9187;
  font-size: 0.62rem;
}

.temperature-label {
  display: block;
  overflow: hidden;
  margin-top: 5px;
  font-size: 0.54rem;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.temperature-label.hot {
  color: #e4572e;
}

.temperature-label.cool {
  color: #596b47;
}

.detail-button {
  position: absolute;
  right: 7px;
  bottom: 7px;
  padding: 3px 5px;
  color: #70766a;
  font-size: 0.53rem;
  font-weight: 700;
  background: #f2ede0;
  border: 0;
  border-radius: 6px;
}

.detail-button:hover,
.detail-button:focus-visible {
  color: #80510d;
  background: #fff1c9;
  outline: none;
}

.weather-mini-card.is-large {
  isolation: isolate;
  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-height: 0;
  padding: 14px 15px 13px;
  overflow: hidden;
  background: linear-gradient(145deg, #fff 20%, #fffbf0 100%);
  border-radius: 18px;
}

.weather-mini-card.is-large::before {
  position: absolute;
  z-index: -1;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  content: '';
  opacity: 0.55;
  top: -45px;
  right: -35px;
}

.weather-mini-card.is-large.is-hot::before {
  background: radial-gradient(circle, #ffe0bc, rgba(255, 224, 188, 0));
}

.weather-mini-card.is-large.is-cool::before {
  background: radial-gradient(circle, #e4ecd4, rgba(228, 236, 212, 0));
}

.large-card-heading,
.large-weather-main,
.large-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.large-card-heading > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.large-card-heading small {
  color: #a86412;
  font-size: 0.48rem;
  font-weight: 900;
  letter-spacing: 0.09em;
}

.large-card-heading strong {
  overflow: hidden;
  margin-top: 2px;
  color: #354133;
  font-size: 0.78rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.large-weather-icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 34px;
  height: 34px;
  font-size: 1.25rem;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(222, 230, 238, 0.85);
  border-radius: 11px;
  box-shadow: 0 6px 15px rgba(87, 65, 26, 0.09);
}

.large-weather-main {
  align-self: center;
  justify-content: flex-start;
  gap: 10px;
  margin: 5px 0;
}

.large-weather-main > b {
  color: #1f2f43;
  font-size: clamp(1.9rem, 3.5vh, 2.6rem);
  font-weight: 450;
  line-height: 0.9;
  letter-spacing: -0.08em;
}

.large-weather-main sup {
  margin-left: 2px;
  font-size: 0.48em;
  letter-spacing: 0;
}

.large-weather-main > div {
  display: flex;
  flex-direction: column;
}

.large-weather-main strong {
  color: #425466;
  font-size: 0.68rem;
}

.large-weather-main small {
  margin-top: 3px;
  color: #8f9187;
  font-size: 0.52rem;
}

.large-card-footer {
  min-height: 25px;
}

.large-card-footer .temperature-label {
  width: fit-content;
  margin: 0;
  padding: 5px 7px;
  font-size: 0.55rem;
  background: rgba(246, 248, 250, 0.9);
  border-radius: 999px;
}

.large-card-footer .detail-button {
  position: static;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 7px;
  color: #596052;
  font-size: 0.55rem;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e3e9ef;
  border-radius: 8px;
}

.large-card-footer .detail-button i {
  color: #a86412;
  font-style: normal;
}
</style>
