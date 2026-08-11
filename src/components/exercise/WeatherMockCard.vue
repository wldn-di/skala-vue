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
    :class="{ 'is-selected': selected, 'is-large': size === 'large' }"
    role="button"
    tabindex="0"
    :aria-label="`${weather.name} 날씨 선택`"
    @click="emit('select', weather)"
    @keydown.enter="emit('select', weather)"
    @keydown.space.prevent="emit('select', weather)"
  >
    <div class="mini-heading">
      <strong>{{ weather.name }}</strong>
      <span>{{ weather.emoji }}</span>
    </div>
    <div class="mini-weather">
      <b>{{ weather.temp }}°</b>
      <small>{{ weather.status }}</small>
    </div>

    <span v-if="weather.temp >= 25" class="temperature-label hot">
      🔥 더움 (25도 이상)
    </span>
    <span v-else class="temperature-label cool">❄️ 선선함 (25도 미만)</span>

    <button
      class="detail-button"
      type="button"
      :aria-label="`${weather.name} 날씨 상세보기`"
      @click.stop="emit('detail', weather)"
    >
      상세보기
    </button>
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
  transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease;
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
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 0;
  padding: 17px 18px 15px;
  border-radius: 18px;
}

.is-large .mini-heading strong {
  font-size: 1rem;
}

.is-large .mini-heading span {
  font-size: 1.4rem;
}

.is-large .mini-weather {
  align-self: center;
  gap: 10px;
  margin-top: 6px;
}

.is-large .mini-weather b {
  font-size: clamp(1.8rem, 3.2vh, 2.5rem);
  font-weight: 500;
  letter-spacing: -0.06em;
}

.is-large .mini-weather small {
  font-size: 0.72rem;
  font-weight: 700;
}

.is-large .temperature-label {
  width: fit-content;
  margin-top: 8px;
  padding: 6px 9px;
  font-size: 0.64rem;
  background: #f6f8fa;
  border-radius: 999px;
}

.is-large .detail-button {
  right: 14px;
  bottom: 14px;
  padding: 6px 9px;
  font-size: 0.62rem;
  border-radius: 8px;
}
</style>
