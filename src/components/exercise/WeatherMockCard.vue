<script setup>
// v-for로 반복되는 과제 1 날씨 카드
defineProps({
  weather: {
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
})

const emit = defineEmits(['select', 'detail'])
</script>

<template>
  <article
    class="weather-mini-card"
    :class="{
      'is-selected': selected,
      'is-large': size === 'large',
      'is-hot': weather.temp >= 25,
      'is-cool': weather.temp < 25,
    }"
    role="button"
    tabindex="0"
    :aria-label="`${weather.name} 날씨 선택`"
    @click="emit('select', weather)"
    @keydown.enter="emit('select', weather)"
    @keydown.space.prevent="emit('select', weather)"
  >
    <template v-if="size === 'large'">
      <header class="large-card-heading">
        <div>
          <small>REGION WEATHER · {{ weather.dataSource === 'live' ? 'LIVE' : 'MOCK' }}</small>
          <strong>{{ weather.fullName }}</strong>
        </div>
        <span class="large-weather-icon" aria-hidden="true">{{ weather.emoji }}</span>
      </header>

      <div class="large-weather-main">
        <b>{{ weather.temp }}<sup>°</sup></b>
        <div>
          <strong>{{ weather.status }}</strong>
          <small v-if="weather.dataSource === 'live'">관측 범위 {{ weather.low }}° ~ {{ weather.high }}°</small>
          <small v-else>최고 {{ weather.high }}° · 최저 {{ weather.low }}°</small>
        </div>
      </div>

      <footer class="large-card-footer">
        <span v-if="weather.temp >= 25" class="temperature-label hot"> 🔥 더움 (25도 이상) </span>
        <span v-else class="temperature-label cool">❄️ 선선함 (25도 미만)</span>

        <button class="detail-button" type="button" :aria-label="`${weather.name} 날씨 상세보기`" @click.stop="emit('detail', weather)">상세보기 <i aria-hidden="true">→</i></button>
      </footer>
    </template>

    <template v-else>
      <div class="mini-heading">
        <strong>{{ weather.name }}</strong>
        <span>{{ weather.emoji }}</span>
      </div>
      <div class="mini-weather">
        <b>{{ weather.temp }}°</b>
        <small>{{ weather.status }}</small>
      </div>

      <span v-if="weather.temp >= 25" class="temperature-label hot"> 🔥 더움 (25도 이상) </span>
      <span v-else class="temperature-label cool">❄️ 선선함 (25도 미만)</span>

      <button class="detail-button" type="button" :aria-label="`${weather.name} 날씨 상세보기`" @click.stop="emit('detail', weather)">상세보기</button>
    </template>
  </article>
</template>

<style scoped>
.weather-mini-card {
  position: relative;
  min-width: 0;
  padding: 9px 9px 8px;
  background: #fff;
  border: 1px solid #e6ebf1;
  border-radius: 13px;
  cursor: pointer;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease,
    transform 150ms ease;
}

.weather-mini-card:hover,
.weather-mini-card:focus-visible {
  border-color: #91bdf8;
  outline: none;
  transform: translateY(-1px);
  box-shadow: 0 7px 16px rgba(49, 130, 246, 0.1);
}

.weather-mini-card.is-selected {
  background: #f4f9ff;
  border-color: #3182f6;
  box-shadow: inset 0 0 0 1px #3182f6;
}

.mini-heading,
.mini-weather {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mini-heading strong {
  overflow: hidden;
  color: #333d4b;
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
  color: #8b95a1;
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
  color: #2774e8;
}

.detail-button {
  position: absolute;
  right: 7px;
  bottom: 7px;
  padding: 3px 5px;
  color: #6b7684;
  font-size: 0.53rem;
  font-weight: 700;
  background: #f2f4f6;
  border: 0;
  border-radius: 6px;
}

.detail-button:hover,
.detail-button:focus-visible {
  color: #1b64da;
  background: #e8f3ff;
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
  background: linear-gradient(145deg, #fff 20%, #f7fbff 100%);
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
  background: radial-gradient(circle, #ffe4d2, rgba(255, 228, 210, 0));
}

.weather-mini-card.is-large.is-cool::before {
  background: radial-gradient(circle, #dcecff, rgba(220, 236, 255, 0));
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
  color: #3182f6;
  font-size: 0.48rem;
  font-weight: 900;
  letter-spacing: 0.09em;
}

.large-card-heading strong {
  overflow: hidden;
  margin-top: 2px;
  color: #344054;
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
  box-shadow: 0 6px 15px rgba(29, 59, 93, 0.08);
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
  color: #8b95a1;
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
  color: #4e5968;
  font-size: 0.55rem;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e3e9ef;
  border-radius: 8px;
}

.large-card-footer .detail-button i {
  color: #3182f6;
  font-style: normal;
}
</style>
