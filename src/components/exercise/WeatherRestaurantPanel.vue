<script setup>
import { onBeforeUnmount, reactive, ref, watch } from 'vue'

const props = defineProps({
  region: {
    type: Object,
    required: true,
  },
  restaurants: {
    type: Array,
    default: () => [],
  },
  districtName: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['add-restaurant', 'remove-restaurant'])

const form = reactive({ name: '', signatureMenu: '', note: '' })
const formError = ref('')
const savedMessage = ref('')
let messageTimer

const resetForm = () => {
  form.name = ''
  form.signatureMenu = ''
  form.note = ''
  formError.value = ''
}

const submitRestaurant = () => {
  const name = form.name.trim()
  const signatureMenu = form.signatureMenu.trim()
  const note = form.note.trim()

  if (!name || !signatureMenu) {
    formError.value = '식당 이름과 대표 메뉴를 입력해 주세요.'
    return
  }
  if (name.length > 20 || signatureMenu.length > 20 || note.length > 40) {
    formError.value = '입력 가능한 글자 수를 확인해 주세요.'
    return
  }

  emit('add-restaurant', { name, signatureMenu, note })
  resetForm()
  savedMessage.value = `${props.region.name} ${props.districtName} 맛집으로 등록했습니다.`
  window.clearTimeout(messageTimer)
  messageTimer = window.setTimeout(() => {
    savedMessage.value = ''
  }, 2200)
}

const deleteRestaurant = (restaurant) => {
  if (window.confirm(`${restaurant.name}을(를) 목록에서 삭제할까요?`)) {
    emit('remove-restaurant', restaurant.id)
  }
}

watch(
  () => `${props.region.id}-${props.districtName}`,
  () => {
    resetForm()
    savedMessage.value = ''
  },
)

onBeforeUnmount(() => window.clearTimeout(messageTimer))
</script>

<template>
  <div class="restaurant-panel">
    <div class="local-foods">
      <span>이 지역 대표 음식</span>
      <div>
        <b v-for="food in region.popularFoods" :key="food">{{ food }}</b>
      </div>
    </div>

    <form class="restaurant-form" @submit.prevent="submitRestaurant">
      <div class="form-title">
        <div>
          <small>MY FOOD MAP</small>
          <strong>{{ region.name }} {{ districtName }} 맛집 등록</strong>
        </div>
        <span>{{ restaurants.length }}곳</span>
      </div>

      <div class="form-row">
        <label>
          <span>식당 이름</span>
          <input v-model.trim="form.name" maxlength="20" placeholder="예: 우리동네 식당" />
        </label>
        <label>
          <span>대표 메뉴</span>
          <input v-model.trim="form.signatureMenu" maxlength="20" placeholder="예: 김치찌개" />
        </label>
      </div>
      <label>
        <span>한줄평 <em>선택</em></span>
        <input v-model.trim="form.note" maxlength="40" placeholder="이 맛집을 추천하는 이유" />
      </label>

      <div class="form-actions">
        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
        <p v-else-if="savedMessage" class="saved-message">{{ savedMessage }}</p>
        <p v-else>이 브라우저에만 저장돼요.</p>
        <button type="submit">＋ 맛집 등록</button>
      </div>
    </form>

    <div class="restaurant-list" aria-live="polite">
      <article
        v-for="restaurant in restaurants"
        :key="restaurant.id"
        class="restaurant-item"
      >
        <span aria-hidden="true">🍽️</span>
        <div>
          <strong>{{ restaurant.name }}</strong>
          <small>{{ restaurant.signatureMenu }}</small>
          <p v-if="restaurant.note">“{{ restaurant.note }}”</p>
        </div>
        <button
          type="button"
          :aria-label="`${restaurant.name} 삭제`"
          @click="deleteRestaurant(restaurant)"
        >
          ×
        </button>
      </article>

      <div v-if="restaurants.length === 0" class="restaurant-empty">
        <span aria-hidden="true">📍</span>
        <div>
          <strong>아직 등록된 맛집이 없어요</strong>
          <p>{{ region.name }} {{ districtName }}의 첫 맛집을 알려주세요.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.restaurant-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.local-foods {
  padding: 12px 14px;
  background: #fff7f0;
  border: 1px solid #ffe2cd;
  border-radius: 14px;
}

.local-foods > span {
  color: #a54b12;
  font-size: 0.66rem;
  font-weight: 800;
}

.local-foods > div {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.local-foods b {
  padding: 5px 8px;
  color: #8a3f10;
  font-size: 0.66rem;
  background: #fff;
  border: 1px solid #ffd8bc;
  border-radius: 999px;
}

.restaurant-form {
  margin-top: 10px;
  padding: 13px 14px;
  background: #f8fafc;
  border: 1px solid #e7edf3;
  border-radius: 15px;
}

.form-title,
.form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-title > div {
  display: flex;
  flex-direction: column;
}

.form-title small {
  color: #3182f6;
  font-size: 0.55rem;
  font-weight: 900;
  letter-spacing: 0.09em;
}

.form-title strong {
  margin-top: 2px;
  color: #333d4b;
  font-size: 0.82rem;
}

.form-title > span {
  padding: 5px 8px;
  color: #1b64da;
  font-size: 0.65rem;
  font-weight: 800;
  background: #e8f3ff;
  border-radius: 999px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 9px;
}

label {
  display: block;
  margin-top: 7px;
}

label > span {
  display: block;
  margin: 0 0 4px 2px;
  color: #6b7684;
  font-size: 0.59rem;
  font-weight: 700;
}

label em {
  color: #aab2bd;
  font-style: normal;
  font-weight: 500;
}

input {
  width: 100%;
  height: 34px;
  padding: 0 10px;
  color: #333d4b;
  font-size: 0.7rem;
  background: #fff;
  border: 1px solid #dfe5ec;
  border-radius: 9px;
  outline: none;
}

input:focus {
  border-color: #75aaf2;
  box-shadow: 0 0 0 3px rgba(49, 130, 246, 0.08);
}

.form-actions {
  gap: 8px;
  margin-top: 9px;
}

.form-actions p {
  overflow: hidden;
  margin: 0;
  color: #8b95a1;
  font-size: 0.58rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.form-actions .form-error {
  color: #e5484d;
}

.form-actions .saved-message {
  color: #159570;
}

.form-actions button {
  flex: none;
  min-height: 34px;
  padding: 0 12px;
  color: #fff;
  font-size: 0.66rem;
  font-weight: 800;
  background: #3182f6;
  border: 0;
  border-radius: 9px;
}

.restaurant-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 7px;
  min-height: 76px;
  margin-top: 10px;
  overflow-y: auto;
}

.restaurant-item,
.restaurant-empty {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 10px 11px;
  background: #fff;
  border: 1px solid #e8edf2;
  border-radius: 12px;
}

.restaurant-item > span,
.restaurant-empty > span {
  display: grid;
  flex: none;
  place-items: center;
  width: 30px;
  height: 30px;
  background: #fff5ed;
  border-radius: 9px;
}

.restaurant-item > div,
.restaurant-empty > div {
  min-width: 0;
}

.restaurant-item strong,
.restaurant-empty strong {
  display: block;
  color: #333d4b;
  font-size: 0.7rem;
}

.restaurant-item small {
  display: block;
  margin-top: 2px;
  color: #e76f21;
  font-size: 0.59rem;
  font-weight: 700;
}

.restaurant-item p,
.restaurant-empty p {
  margin: 3px 0 0;
  color: #8b95a1;
  font-size: 0.58rem;
}

.restaurant-item > button {
  margin-left: auto;
  padding: 1px 5px;
  color: #aab2bd;
  background: transparent;
  border: 0;
}

.restaurant-empty {
  align-items: center;
  margin: auto 0;
  background: #fafbfc;
  border-style: dashed;
}
</style>
