<script setup>
import { computed, nextTick, ref, watch } from 'vue'

import WeatherSnakeGame from './WeatherSnakeGame.vue'

const props = defineProps({
  bestScore: {
    type: Number,
    default: 0,
  },
  lastResult: {
    type: Object,
    default: null,
  },
  regions: {
    type: Array,
    default: () => [],
  },
  scores: {
    type: Array,
    default: () => [],
  },
  weather: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['finish', 'register'])

const showRegisterForm = ref(false)
const nickname = ref('')
const homeRegionId = ref('')
const errorMessage = ref('')
const registerSection = ref(null)

const totalFoods = computed(() => props.scores.reduce((total, item) => total + item.foodsEaten, 0))

const openRegisterForm = async () => {
  if (!props.lastResult) return
  showRegisterForm.value = true
  errorMessage.value = ''
  await nextTick()
  registerSection.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

const submitScore = () => {
  const trimmedNickname = nickname.value.trim()
  if (!trimmedNickname) {
    errorMessage.value = '점수표에 표시할 닉네임을 입력해 주세요.'
    return
  }
  if (!homeRegionId.value) {
    errorMessage.value = '랭킹에 반영할 본인 지역을 선택해 주세요.'
    return
  }

  emit('register', {
    homeRegionId: homeRegionId.value,
    nickname: trimmedNickname.slice(0, 12),
  })
}

watch(
  () => props.lastResult,
  (result) => {
    if (result) return
    showRegisterForm.value = false
    nickname.value = ''
    homeRegionId.value = ''
    errorMessage.value = ''
  },
)
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

        <aside class="game-side-panel">
          <section class="how-to-card">
            <div>
              <small>HOW TO PLAY</small>
              <strong>맛있는 걸 먹고 길게 성장하세요!</strong>
            </div>
            <ol>
              <li><b>1</b><span>게임 시작 버튼을 누르세요.</span></li>
              <li><b>2</b><span>방향키로 날씨 음식을 모으세요.</span></li>
              <li><b>3</b><span>벽이나 내 몸에 닿으면 종료돼요.</span></li>
            </ol>
          </section>

          <section class="my-record-card">
            <div class="record-heading">
              <small>MY RECORD</small>
              <strong>내 푸드 스네이크 기록</strong>
            </div>
            <dl>
              <div>
                <dt>최고 점수</dt>
                <dd>{{ bestScore }}<small>점</small></dd>
              </div>
              <div>
                <dt>플레이 기록</dt>
                <dd>{{ scores.length }}<small>회</small></dd>
              </div>
              <div>
                <dt>모은 음식</dt>
                <dd>{{ totalFoods }}<small>개</small></dd>
              </div>
            </dl>

            <div v-if="lastResult" class="pending-result" aria-live="polite">
              <span aria-hidden="true">🏆</span>
              <div>
                <small>방금 플레이한 점수</small>
                <strong>{{ lastResult.score }}점 · 음식 {{ lastResult.foodsEaten }}개</strong>
              </div>
            </div>
            <p v-else>게임을 끝내고 점수를 등록하면 내 기록에 반영됩니다.</p>
          </section>

          <button class="register-open-button" type="button" :disabled="!lastResult" @click="openRegisterForm">
            {{ lastResult ? '점수 등록하기' : '게임 후 점수 등록하기' }} <span aria-hidden="true">›</span>
          </button>
        </aside>
      </div>

      <section v-if="showRegisterForm && lastResult" ref="registerSection" class="inline-register" aria-labelledby="inline-register-title">
        <div class="result-preview">
          <small>READY TO SAVE</small>
          <span aria-hidden="true">🏆</span>
          <strong>{{ lastResult.score }}점</strong>
          <p>{{ lastResult.region }} · {{ lastResult.weatherStatus }} · 음식 {{ lastResult.foodsEaten }}개</p>
        </div>

        <form @submit.prevent="submitScore">
          <header>
            <div>
              <small>SCORE REGISTER</small>
              <h2 id="inline-register-title">이번 기록 등록</h2>
            </div>
            <button type="button" aria-label="점수 등록 닫기" @click="showRegisterForm = false">×</button>
          </header>

          <div class="form-fields">
            <label>
              <span>닉네임</span>
              <input v-model="nickname" type="text" maxlength="12" autocomplete="nickname" placeholder="최대 12자까지 입력" @input="errorMessage = ''" />
            </label>
            <label>
              <span>본인 지역</span>
              <select v-model="homeRegionId" @change="errorMessage = ''">
                <option value="" disabled>전국 17개 시·도 중 선택</option>
                <option v-for="region in regions" :key="region.id" :value="region.id">{{ region.fullName }}</option>
              </select>
            </label>
            <button type="submit">내 기록으로 등록하기</button>
          </div>
          <p v-if="errorMessage" class="form-error" role="alert">{{ errorMessage }}</p>
          <small class="storage-notice">기록은 현재 브라우저의 localStorage에 저장됩니다.</small>
        </form>
      </section>

      <footer class="game-source">
        <span>Vue 및 날씨한입 서비스에 맞게 수정한 오픈소스 게임입니다.</span>
        <a href="https://github.com/he-is-talha/html-css-javascript-games/tree/main/24-Snake-Game" target="_blank" rel="noreferrer"> Original Snake Game by Talha Bin Yousaf · MIT License </a>
      </footer>
    </section>
  </main>
</template>

<style scoped>
.game-page {
  width: min(1400px, calc(100% - 36px));
  margin: 0 auto;
  padding: 12px 0 20px;
}

.game-card {
  display: grid;
  gap: 16px;
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
}

.game-heading p,
.how-to-card small,
.record-heading small,
.inline-register small {
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
}

.game-layout {
  display: grid;
  grid-template-columns: minmax(440px, 1.35fr) minmax(300px, 0.65fr);
  align-items: stretch;
  justify-items: center;
  gap: 18px;
  min-height: 580px;
  padding: 0 4%;
}

.game-side-panel {
  display: flex;
  width: 100%;
  min-height: 0;
  flex-direction: column;
  gap: 12px;
}

.how-to-card,
.my-record-card {
  padding: 18px;
  border-radius: 18px;
}

.how-to-card {
  color: #fff;
  background: linear-gradient(145deg, #4d5d45, #293326);
  border: 1px solid #52614b;
}

.how-to-card small {
  color: #f2cf67;
}

.how-to-card > div {
  display: flex;
  flex-direction: column;
}

.how-to-card > div strong {
  margin-top: 4px;
  font-size: 0.84rem;
}

.how-to-card ol {
  display: grid;
  gap: 8px;
  padding: 0;
  margin: 14px 0 0;
  list-style: none;
}

.how-to-card li {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #d9dfc7;
  font-size: 0.62rem;
}

.how-to-card li b {
  display: grid;
  flex: none;
  place-items: center;
  width: 23px;
  height: 23px;
  color: #3e4a38;
  font-size: 0.56rem;
  background: #f2cf67;
  border-radius: 8px;
}

.my-record-card {
  display: flex;
  flex: 1;
  flex-direction: column;
  background: #fff8df;
  border: 1px solid #ebddb3;
}

.record-heading {
  display: flex;
  flex-direction: column;
}

.record-heading strong {
  margin-top: 3px;
  color: #354133;
  font-size: 0.85rem;
}

.my-record-card dl {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 7px;
  margin: 14px 0 0;
}

.my-record-card dl > div {
  padding: 12px 8px;
  text-align: center;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #eee0b8;
  border-radius: 12px;
}

.my-record-card dt {
  color: #8f9187;
  font-size: 0.54rem;
}

.my-record-card dd {
  margin: 5px 0 0;
  color: #354133;
  font-size: 1.2rem;
  font-weight: 900;
}

.my-record-card dd small {
  margin-left: 2px;
  color: #70766a;
  font-size: 0.52rem;
  letter-spacing: 0;
}

.pending-result {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 11px;
  margin-top: auto;
  background: #fff;
  border: 1px solid #eedcb0;
  border-radius: 12px;
}

.pending-result > span {
  font-size: 1.2rem;
}

.pending-result > div {
  display: flex;
  flex-direction: column;
}

.pending-result small {
  color: #a86412;
  font-size: 0.51rem;
}

.pending-result strong {
  color: #40513b;
  font-size: 0.69rem;
}

.my-record-card > p {
  margin: auto 0 0;
  color: #8f9187;
  font-size: 0.58rem;
  text-align: center;
}

.register-open-button {
  min-height: 48px;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 850;
  background: #a86412;
  border: 0;
  border-radius: 13px;
  box-shadow: 0 9px 20px rgba(168, 100, 18, 0.2);
}

.register-open-button span {
  margin-left: 4px;
  font-size: 1rem;
}

.register-open-button:disabled {
  color: #8c8f87;
  background: #dedbcf;
  box-shadow: none;
}

.inline-register {
  display: grid;
  grid-template-columns: minmax(240px, 0.68fr) minmax(460px, 1.32fr);
  overflow: hidden;
  border: 1px solid #d9ca9f;
  border-radius: 20px;
}

.result-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  flex-direction: column;
  padding: 25px;
  text-align: center;
  background: linear-gradient(145deg, #4d5d45, #293326);
}

.result-preview > small {
  color: #f2cf67;
}

.result-preview > span {
  margin-top: 12px;
  font-size: 2.2rem;
}

.result-preview > strong {
  color: #fff;
  font-size: 2.3rem;
}

.result-preview > p {
  margin: 3px 0 0;
  color: #d9dfc7;
  font-size: 0.62rem;
}

.inline-register form {
  padding: 24px 28px;
  background: #fffaf0;
}

.inline-register form > header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.inline-register h2 {
  margin: 3px 0 0;
  color: #354133;
  font-size: 1rem;
}

.inline-register form > header button {
  width: 30px;
  height: 30px;
  color: #70766a;
  font-size: 1rem;
  background: #f0eadc;
  border: 0;
  border-radius: 9px;
}

.form-fields {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  align-items: end;
  gap: 10px;
  margin-top: 17px;
}

.form-fields label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #5c6253;
  font-size: 0.61rem;
  font-weight: 800;
}

.form-fields input,
.form-fields select {
  width: 100%;
  height: 43px;
  box-sizing: border-box;
  padding: 0 12px;
  color: #354133;
  background: #fff;
  border: 1px solid #dfd0ae;
  border-radius: 11px;
  outline: none;
}

.form-fields input:focus,
.form-fields select:focus {
  border-color: #a86412;
  box-shadow: 0 0 0 3px rgba(168, 100, 18, 0.11);
}

.form-fields > button {
  min-height: 43px;
  padding: 0 14px;
  color: #fff;
  font-size: 0.63rem;
  font-weight: 850;
  background: #a86412;
  border: 0;
  border-radius: 11px;
}

.form-error {
  margin: 7px 0 0;
  color: #e5484d;
  font-size: 0.58rem;
}

.storage-notice {
  display: block;
  margin-top: 8px;
  color: #9aa4b0;
  font-size: 0.51rem;
  letter-spacing: 0;
}

.game-source {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
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
  }

  .game-layout {
    grid-template-columns: 1fr;
    padding: 0;
  }

  .game-side-panel {
    min-height: 470px;
  }

  .inline-register {
    grid-template-columns: 1fr;
  }

  .form-fields {
    grid-template-columns: 1fr 1fr;
  }

  .form-fields > button {
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

  .game-layout {
    grid-template-columns: minmax(0, 1fr);
    min-height: 0;
  }

  .my-record-card dl,
  .form-fields {
    grid-template-columns: 1fr;
  }

  .inline-register form {
    padding: 20px;
  }

  .game-source {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
