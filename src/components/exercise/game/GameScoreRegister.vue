<script setup>
import { ref } from 'vue'

defineProps({
  regions: {
    type: Array,
    default: () => [],
  },
  result: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['play', 'register'])
const nickname = ref('')
const homeRegionId = ref('')
const errorMessage = ref('')

const updateNickname = (event) => {
  nickname.value = event.target.value
  errorMessage.value = ''
}

const updateHomeRegion = (event) => {
  homeRegionId.value = event.target.value
  errorMessage.value = ''
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
</script>

<template>
  <main class="register-page">
    <section class="register-card">
      <div v-if="result" class="register-layout">
        <section class="result-preview">
          <small>READY TO SAVE</small>
          <span aria-hidden="true">🏆</span>
          <h1>{{ result.score }}점</h1>
          <p>{{ result.region }} · {{ result.weatherStatus }}</p>

          <dl>
            <div>
              <dt>모은 날씨 음식</dt>
              <dd>{{ result.foodsEaten }}개</dd>
            </div>
            <div>
              <dt>플레이 지역</dt>
              <dd>{{ result.region }}</dd>
            </div>
          </dl>
        </section>

        <form class="register-form" @submit.prevent="submitScore">
          <div>
            <small>SCORE REGISTER</small>
            <h2>점수 등록</h2>
            <p>닉네임과 함께 이번 플레이 기록을 내 점수에 저장합니다.</p>
          </div>

          <label for="score-nickname">닉네임</label>
          <input id="score-nickname" type="text" :value="nickname" maxlength="12" autocomplete="nickname" placeholder="최대 12자까지 입력" @input="updateNickname" />
          <span class="character-count">{{ nickname.length }} / 12</span>

          <label for="score-region">본인 지역</label>
          <select id="score-region" :value="homeRegionId" @change="updateHomeRegion">
            <option value="" disabled>전국 17개 시·도 중 선택</option>
            <option v-for="region in regions" :key="region.id" :value="region.id">
              {{ region.fullName }}
            </option>
          </select>
          <p v-if="errorMessage" class="form-error" role="alert">{{ errorMessage }}</p>

          <button type="submit">내 점수로 등록하기</button>
          <small class="storage-notice"> 점수는 서버가 아닌 현재 브라우저의 localStorage에 저장됩니다. </small>
        </form>
      </div>

      <div v-else class="empty-result">
        <span aria-hidden="true">🐍</span>
        <small>NO GAME RESULT</small>
        <h1>등록할 점수가 아직 없어요</h1>
        <p>게임을 한 번 플레이하면 종료 점수를 여기에 등록할 수 있어요.</p>
        <button type="button" @click="$emit('play')">게임하러 가기 →</button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.register-page {
  display: grid;
  place-items: center;
  width: min(1050px, calc(100% - 36px));
  height: calc(100svh - 66px);
  margin: 0 auto;
  padding: 12px 0 14px;
}

.register-card {
  width: 100%;
  overflow: hidden;
  background: rgba(255, 252, 244, 0.96);
  border: 1px solid rgba(226, 214, 187, 0.92);
  border-radius: 24px;
  box-shadow: 0 15px 45px rgba(87, 65, 26, 0.12);
}

.register-layout {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  min-height: 470px;
}

.result-preview,
.register-form,
.empty-result {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.result-preview {
  padding: 35px;
  text-align: center;
  background: radial-gradient(circle at 50% 30%, rgba(255, 246, 194, 0.17), transparent 9rem), linear-gradient(145deg, #4d5d45, #293326);
}

.result-preview > small,
.register-form > div small,
.empty-result > small {
  color: #f2cf67;
  font-size: 0.57rem;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.result-preview > span {
  margin-top: 20px;
  font-size: 3.3rem;
}

.result-preview h1 {
  margin: 5px 0 0;
  color: #fff;
  font-size: 3rem;
  font-weight: 900;
  letter-spacing: -0.06em;
}

.result-preview > p {
  margin: 0;
  color: #d9dfc7;
  font-size: 0.68rem;
}

.result-preview dl {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin: 27px 0 0;
}

.result-preview dl > div {
  padding: 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 13px;
}

.result-preview dt {
  color: #c8d0b7;
  font-size: 0.53rem;
}

.result-preview dd {
  margin: 3px 0 0;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 850;
}

.register-form {
  align-items: stretch;
  padding: 45px 55px;
}

.register-form h2 {
  margin: 4px 0 3px;
  color: #354133;
  font-size: 1.35rem;
  font-weight: 900;
}

.register-form > div > p {
  margin: 0 0 26px;
  color: #8f9187;
  font-size: 0.66rem;
}

.register-form > label {
  margin-top: 13px;
  margin-bottom: 7px;
  color: #5c6253;
  font-size: 0.66rem;
  font-weight: 800;
}

.register-form > input,
.register-form > select {
  width: 100%;
  height: 48px;
  padding: 0 13px;
  color: #354133;
  background: #fffaf0;
  border: 1px solid #dfd0ae;
  border-radius: 12px;
  outline: none;
}

.register-form > select {
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, #8f9187 50%), linear-gradient(135deg, #8f9187 50%, transparent 50%);
  background-position:
    calc(100% - 17px) 21px,
    calc(100% - 12px) 21px;
  background-repeat: no-repeat;
  background-size:
    5px 5px,
    5px 5px;
}

.register-form > input:focus,
.register-form > select:focus {
  border-color: #a86412;
  box-shadow: 0 0 0 3px rgba(168, 100, 18, 0.11);
}

.character-count {
  align-self: flex-end;
  margin-top: 4px;
  color: #a1a9b3;
  font-size: 0.54rem;
}

.form-error {
  margin: 5px 0 0;
  color: #e5484d;
  font-size: 0.59rem;
}

.register-form > button,
.empty-result button {
  min-height: 45px;
  margin-top: 17px;
  color: #fff;
  font-size: 0.69rem;
  font-weight: 850;
  background: #a86412;
  border: 0;
  border-radius: 12px;
}

.storage-notice {
  margin-top: 8px;
  color: #a1a9b3;
  font-size: 0.52rem;
  text-align: center;
}

.empty-result {
  min-height: 470px;
  padding: 35px;
  text-align: center;
}

.empty-result > span {
  display: grid;
  place-items: center;
  width: 75px;
  height: 75px;
  margin-bottom: 13px;
  font-size: 2.2rem;
  background: #fff0bd;
  border-radius: 23px;
}

.empty-result h1 {
  margin: 5px 0 0;
  color: #354133;
  font-size: 1.15rem;
  font-weight: 900;
}

.empty-result p {
  margin: 6px 0 0;
  color: #8f9187;
  font-size: 0.65rem;
}

.empty-result button {
  padding: 0 15px;
}

@media (max-width: 680px) {
  .register-page {
    width: calc(100% - 20px);
    height: auto;
  }

  .register-layout {
    grid-template-columns: 1fr;
  }

  .result-preview {
    padding: 25px;
  }

  .register-form {
    padding: 30px 24px;
  }
}
</style>
