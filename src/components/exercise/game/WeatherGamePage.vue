<script setup>
import WeatherSnakeGame from './WeatherSnakeGame.vue'

defineProps({
  bestScore: {
    type: Number,
    default: 0,
  },
  lastResult: {
    type: Object,
    default: null,
  },
  weather: {
    type: Object,
    required: true,
  },
})

defineEmits(['finish', 'go-register'])
</script>

<template>
  <main class="game-page">
    <section class="game-card">
      <header class="game-heading">
        <div>
          <p>WEATHER FOOD GAME</p>
          <h1>날씨 푸드 스네이크</h1>
          <span>{{ weather.name }}의 {{ weather.status }} 날씨에 맞는 음식을 모아보세요.</span>
        </div>
        <div class="weather-chip">
          <span aria-hidden="true">{{ weather.emoji }}</span>
          <div>
            <small>{{ weather.name }} 현재 날씨</small>
            <strong>{{ weather.temp }}° · {{ weather.status }}</strong>
          </div>
        </div>
      </header>

      <div class="game-layout">
        <WeatherSnakeGame :weather="weather" :high-score="bestScore" @finish="$emit('finish', $event)" />

        <aside class="mission-panel">
          <section class="mission-card primary">
            <small>TODAY'S MISSION</small>
            <span aria-hidden="true">{{ weather.status.includes('비') ? '🥞' : weather.temp >= 25 ? '🍜' : '🍲' }}</span>
            <h2>
              {{ weather.status.includes('비') ? '바삭한 전' : weather.temp >= 25 ? '시원한 냉면' : '따뜻한 국밥' }}
              모으기
            </h2>
            <p>음식 하나당 10점! 벽이나 내 몸에 부딪히지 않도록 조심하세요.</p>
          </section>

          <section class="mission-card guide">
            <small>HOW TO PLAY</small>
            <ol>
              <li><b>1</b><span>게임 시작 버튼을 누르세요.</span></li>
              <li><b>2</b><span>키보드 방향키로 이동하세요.</span></li>
              <li><b>3</b><span>종료 후 점수를 등록하세요.</span></li>
            </ol>
          </section>

          <section v-if="lastResult" class="result-card" aria-live="polite">
            <div>
              <small>등록 대기 점수</small>
              <strong>{{ lastResult.score }}점</strong>
            </div>
            <button type="button" @click="$emit('go-register')">점수 등록하기 →</button>
          </section>
        </aside>
      </div>

      <footer class="game-source">
        <span>Vue 및 날씨한입 서비스에 맞게 수정한 오픈소스 게임입니다.</span>
        <a href="https://github.com/he-is-talha/html-css-javascript-games/tree/main/24-Snake-Game" target="_blank" rel="noreferrer"> Original Snake Game by Talha Bin Yousaf · MIT License </a>
      </footer>
    </section>
  </main>
</template>

<style scoped>
.game-page {
  width: min(1500px, calc(100% - 36px));
  height: calc(100svh - 66px);
  margin: 0 auto;
  padding: 12px 0 14px;
}

.game-card {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  height: 100%;
  min-height: 0;
  padding: 20px 22px 12px;
  background: rgba(255, 252, 244, 0.96);
  border: 1px solid rgba(226, 214, 187, 0.92);
  border-radius: 22px;
  box-shadow: 0 12px 38px rgba(87, 65, 26, 0.1);
}

.game-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 14px;
}

.game-heading p,
.mission-card small,
.result-card small {
  margin: 0;
  color: #a86412;
  font-size: 0.57rem;
  font-weight: 900;
  letter-spacing: 0.1em;
}

.game-heading h1 {
  margin: 3px 0 2px;
  color: #2d382b;
  font-size: 1.35rem;
  font-weight: 900;
  letter-spacing: -0.045em;
}

.game-heading > div > span {
  color: #8f9187;
  font-size: 0.66rem;
}

.weather-chip {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 180px;
  padding: 9px 12px;
  background: #fff0bd;
  border: 1px solid #e5ca74;
  border-radius: 13px;
}

.weather-chip > span {
  font-size: 1.35rem;
}

.weather-chip > div {
  display: flex;
  flex-direction: column;
}

.weather-chip small {
  color: #8f9187;
  font-size: 0.49rem;
}

.weather-chip strong {
  color: #354133;
  font-size: 0.67rem;
  font-weight: 850;
}

.game-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(260px, 0.55fr);
  justify-items: center;
  gap: 18px;
  min-height: 0;
  padding: 0 7%;
}

.mission-panel {
  display: flex;
  width: 100%;
  min-height: 0;
  flex-direction: column;
  gap: 10px;
}

.mission-card,
.result-card {
  padding: 17px;
  border-radius: 18px;
}

.mission-card.primary {
  flex: 1;
  min-height: 190px;
  background: linear-gradient(145deg, #fff8f2, #fff1e5);
  border: 1px solid #ffe1ca;
}

.mission-card.primary small {
  color: #ef7627;
}

.mission-card.primary > span {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  margin-top: 18px;
  font-size: 2.2rem;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(224, 111, 37, 0.1);
}

.mission-card h2 {
  margin: 13px 0 5px;
  color: #733a1b;
  font-size: 1rem;
  font-weight: 900;
}

.mission-card p {
  margin: 0;
  color: #9a6b4d;
  font-size: 0.64rem;
  line-height: 1.65;
}

.mission-card.guide {
  background: #f0f3e8;
  border: 1px solid #dbe3ce;
}

.mission-card ol {
  display: grid;
  gap: 9px;
  margin: 13px 0 0;
  padding: 0;
  list-style: none;
}

.mission-card li {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #596346;
  font-size: 0.62rem;
}

.mission-card li b {
  display: grid;
  flex: none;
  place-items: center;
  width: 22px;
  height: 22px;
  color: #a86412;
  font-size: 0.56rem;
  font-weight: 900;
  background: #fff0bd;
  border-radius: 8px;
}

.result-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: #ecfbf5;
  border: 1px solid #c9f1e2;
}

.result-card > div {
  display: flex;
  flex-direction: column;
}

.result-card small {
  color: #168267;
  letter-spacing: 0;
}

.result-card strong {
  color: #11654f;
  font-size: 1rem;
  font-weight: 900;
}

.result-card button {
  min-height: 34px;
  padding: 0 10px;
  color: #fff;
  font-size: 0.59rem;
  font-weight: 850;
  background: #20a780;
  border: 0;
  border-radius: 10px;
}

.game-source {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 9px;
  color: #9aa4b0;
  font-size: 0.52rem;
}

.game-source a {
  color: #70766a;
  text-decoration: none;
}

.game-source a:hover {
  color: #40513b;
  text-decoration: underline;
}

@media (max-width: 900px) {
  .game-page {
    width: min(920px, calc(100% - 28px));
    height: auto;
  }

  .game-card {
    height: auto;
  }

  .game-layout {
    grid-template-columns: 1fr;
    padding: 0;
  }

  .mission-panel {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }

  .result-card {
    grid-column: 1 / -1;
  }
}

@media (max-width: 600px) {
  .game-page {
    width: calc(100% - 20px);
  }

  .game-card {
    padding: 14px 12px 10px;
  }

  .game-heading {
    align-items: flex-start;
  }

  .game-heading > div > span,
  .weather-chip {
    display: none;
  }

  .mission-panel {
    grid-template-columns: 1fr;
  }

  .game-source {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
