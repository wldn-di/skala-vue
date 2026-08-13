<script setup>
import { computed } from 'vue'

import { getCityImageUrl } from './cityImages'

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
const cityImageUrl = computed(() => getCityImageUrl(props.cityItem.id))
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
      <img v-if="cityImageUrl" class="city-photo" :src="cityImageUrl" alt="" aria-hidden="true" loading="lazy" width="550" height="316" />
      <div class="city-photo-label" aria-hidden="true">
        <strong>{{ cityItem.fullName || cityItem.name }}</strong>
      </div>

      <div class="large-card-content">
        <header class="large-card-heading">
          <div>
            <small>REGION WEATHER · {{ cityItem.dataSource === 'live' ? 'LIVE' : 'MOCK' }}</small>
            <strong>{{ cityItem.fullName || cityItem.name }}</strong>
          </div>
          <span class="large-weather-icon" aria-hidden="true">{{ cityItem.emoji || '🌤️' }}</span>
        </header>

        <div class="large-weather-main">
          <b
            >{{ displayTemp }}<sup>{{ displayUnitSymbol }}</sup></b
          >
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
      </div>
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
  background: #354133;
  border: 0;
  border-radius: 18px;
}

.weather-mini-card.is-large:hover,
.weather-mini-card.is-large:focus-visible,
.weather-mini-card.is-large:focus-within,
.weather-mini-card.is-large.is-selected {
  border: 0;
  outline: none;
  transform: none;
  box-shadow: none;
}

.weather-mini-card.is-large::before {
  position: absolute;
  z-index: 2;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  content: '';
  opacity: 0;
  top: -45px;
  right: -35px;
  transition: opacity 220ms ease;
  pointer-events: none;
}

.weather-mini-card.is-large::after {
  position: absolute;
  z-index: 1;
  inset: 0;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.68) 20%, rgba(255, 251, 240, 0.62) 100%);
  content: '';
  opacity: 0;
  transition: opacity 220ms ease;
  pointer-events: none;
}

.weather-mini-card.is-large.is-hot::before {
  background: radial-gradient(circle, #ffe0bc, rgba(255, 224, 188, 0));
}

.weather-mini-card.is-large.is-cool::before {
  background: radial-gradient(circle, #e4ecd4, rgba(228, 236, 212, 0));
}

.city-photo {
  position: absolute;
  z-index: 0;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(1.04) contrast(1.02);
  transform: scale(1.01);
  transition:
    filter 260ms ease,
    transform 320ms ease;
}

.city-photo-label {
  position: absolute;
  z-index: 3;
  top: 11px;
  left: 12px;
  padding: 7px 9px;
  color: #fff;
  background: rgba(28, 34, 28, 0.68);
  border-radius: 8px;
  backdrop-filter: blur(3px);
  transition:
    opacity 180ms ease,
    transform 220ms ease;
}

.city-photo-label strong {
  display: block;
  font-size: 0.72rem;
  white-space: nowrap;
}

.large-card-content {
  position: absolute;
  z-index: 3;
  inset: 14px 15px 13px;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-height: 0;
  opacity: 0;
  transform: translateY(7px);
  transition:
    opacity 200ms ease,
    transform 240ms ease;
}

.weather-mini-card.is-large:hover .city-photo,
.weather-mini-card.is-large:focus-visible .city-photo,
.weather-mini-card.is-large:focus-within .city-photo,
.weather-mini-card.is-large.is-selected .city-photo {
  filter: blur(2px) brightness(0.82) saturate(0.88);
  transform: scale(1.06);
}

.weather-mini-card.is-large:hover::after,
.weather-mini-card.is-large:focus-visible::after,
.weather-mini-card.is-large:focus-within::after,
.weather-mini-card.is-large.is-selected::after {
  opacity: 0.66;
}

.weather-mini-card.is-large:hover::before,
.weather-mini-card.is-large:focus-visible::before,
.weather-mini-card.is-large:focus-within::before,
.weather-mini-card.is-large.is-selected::before {
  opacity: 0.55;
}

.weather-mini-card.is-large:hover .city-photo-label,
.weather-mini-card.is-large:focus-visible .city-photo-label,
.weather-mini-card.is-large:focus-within .city-photo-label,
.weather-mini-card.is-large.is-selected .city-photo-label {
  opacity: 0;
  transform: translateY(5px);
  pointer-events: none;
}

.weather-mini-card.is-large:hover .large-card-content,
.weather-mini-card.is-large:focus-visible .large-card-content,
.weather-mini-card.is-large:focus-within .large-card-content,
.weather-mini-card.is-large.is-selected .large-card-content {
  opacity: 1;
  transform: translateY(0);
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
  color: #191f28;
  font-size: 0.52rem;
}

.large-card-footer {
  align-self: end;
  min-height: 25px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.68);
  border-radius: 7px;
  backdrop-filter: blur(4px);
}

.large-card-footer .temperature-label {
  width: fit-content;
  margin: 0;
  padding: 0;
  font-size: 0.55rem;
  background: transparent;
}

.large-card-footer .detail-button {
  position: static;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  color: #596052;
  font-size: 0.55rem;
  background: transparent;
  border: 0;
  border-radius: 0;
}

.large-card-footer .detail-button:hover,
.large-card-footer .detail-button:focus-visible {
  color: #80510d;
  background: transparent;
  outline: none;
}

.large-card-footer .detail-button i {
  color: #a86412;
  font-style: normal;
}

@media (hover: none) {
  .weather-mini-card.is-large .city-photo {
    filter: blur(1.5px) brightness(0.82) saturate(0.88);
    transform: scale(1.05);
  }

  .weather-mini-card.is-large::after {
    opacity: 0.66;
  }

  .weather-mini-card.is-large::before {
    opacity: 0.55;
  }

  .weather-mini-card.is-large .city-photo-label {
    display: none;
  }

  .weather-mini-card.is-large .large-card-content {
    opacity: 1;
    transform: none;
  }
}
</style>
