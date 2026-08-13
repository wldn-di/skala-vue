<script setup>
import axios from 'axios'
import { ElMessage } from 'element-plus'
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
const recommendedRestaurants = ref([])
const recommendationStatus = ref('idle')
const recommendationMessage = ref('')
let messageTimer
let recommendationRequestController = null

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
  ElMessage.success(savedMessage.value)
  window.clearTimeout(messageTimer)
  messageTimer = window.setTimeout(() => {
    savedMessage.value = ''
  }, 2200)
}

const loadRecommendedRestaurants = async () => {
  recommendationRequestController?.abort()
  recommendedRestaurants.value = []
  recommendationMessage.value = ''

  if (!props.region.id || !props.districtName) {
    recommendationStatus.value = 'idle'
    return
  }

  recommendationRequestController = new AbortController()
  recommendationStatus.value = 'loading'

  try {
    const response = await axios.get('/api/restaurants', {
      params: {
        regionId: props.region.id,
        district: props.districtName,
      },
      signal: recommendationRequestController.signal,
    })
    if (!Array.isArray(response.data.restaurants)) throw new Error('Restaurant response is invalid')
    recommendedRestaurants.value = response.data.restaurants
    recommendationStatus.value = 'success'
  } catch (error) {
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED') return
    const errorCode = error.response?.data?.error
    recommendationStatus.value = 'error'
    recommendationMessage.value =
      errorCode === 'KAKAO_API_NOT_CONFIGURED'
        ? 'Kakao REST API 키를 등록하면 이 지역의 추천 맛집을 확인할 수 있습니다.'
        : errorCode === 'KAKAO_MAP_SERVICE_DISABLED'
          ? 'Kakao Developers에서 이 앱의 카카오맵 API 사용 설정을 ON으로 활성화해 주세요.'
          : 'Kakao 추천 맛집을 불러오지 못했습니다. 직접 등록 기능은 계속 사용할 수 있습니다.'
  }
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
    loadRecommendedRestaurants()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  window.clearTimeout(messageTimer)
  recommendationRequestController?.abort()
})
</script>

<template>
  <div class="restaurant-panel">
    <div class="local-foods">
      <span>이 지역 대표 음식</span>
      <div>
        <b v-for="food in region.popularFoods" :key="food">{{ food }}</b>
      </div>
    </div>

    <section class="recommended-restaurants" :aria-busy="recommendationStatus === 'loading'" aria-labelledby="recommended-restaurants-title">
      <div class="recommended-heading">
        <div>
          <small>KAKAO LOCAL REST API</small>
          <strong id="recommended-restaurants-title">{{ districtName }} 추천 맛집 상위 2곳</strong>
        </div>
        <el-tag size="small" type="warning" effect="plain">외부 API</el-tag>
      </div>

      <el-skeleton v-if="recommendationStatus === 'loading'" :rows="2" animated />
      <el-alert v-else-if="recommendationStatus === 'error'" :title="recommendationMessage" type="warning" :closable="false" show-icon />
      <div v-else-if="recommendedRestaurants.length" class="recommended-list">
        <a v-for="restaurant in recommendedRestaurants" :key="restaurant.id" :href="restaurant.placeUrl" target="_blank" rel="noopener noreferrer">
          <img :src="restaurant.previewUrl" :alt="`${restaurant.name} 위치 지도 미리보기`" width="480" height="180" loading="lazy" />
          <div>
            <strong>{{ restaurant.name }}</strong>
            <span>{{ restaurant.address || restaurant.category }}</span>
            <small>{{ restaurant.phone || '카카오맵에서 상세보기' }} · 상세보기 ↗</small>
          </div>
        </a>
      </div>
      <p v-else-if="recommendationStatus === 'success'" class="recommended-empty">검색된 추천 맛집이 없습니다.</p>
    </section>

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
      <article v-for="restaurant in restaurants" :key="restaurant.id" class="restaurant-item">
        <span aria-hidden="true">🍽️</span>
        <div>
          <strong>{{ restaurant.name }}</strong>
          <small>{{ restaurant.signatureMenu }}</small>
          <p v-if="restaurant.note">“{{ restaurant.note }}”</p>
        </div>
        <button type="button" :aria-label="`${restaurant.name} 삭제`" @click="deleteRestaurant(restaurant)">×</button>
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

.recommended-restaurants {
  margin-top: 10px;
  padding: 12px 14px;
  background: #fffdf8;
  border: 1px solid #eadfc8;
  border-radius: 14px;
}

.recommended-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.recommended-heading > div {
  display: flex;
  flex-direction: column;
}

.recommended-heading small {
  color: #a86412;
  font-size: 0.52rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.recommended-heading strong {
  margin-top: 2px;
  color: #364034;
  font-size: 0.72rem;
}

.recommended-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.recommended-list a {
  overflow: hidden;
  min-width: 0;
  color: inherit;
  text-decoration: none;
  background: #fff;
  border: 1px solid #eee4d1;
  border-radius: 9px;
}

.recommended-list img {
  display: block;
  width: 100%;
  height: 72px;
  object-fit: cover;
  background: #f3eddf;
}

.recommended-list a > div {
  min-width: 0;
  padding: 8px 9px;
}

.recommended-list a:hover,
.recommended-list a:focus-visible {
  border-color: #d8ad3d;
  outline: none;
}

.recommended-list strong,
.recommended-list span,
.recommended-list small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recommended-list strong {
  color: #364034;
  font-size: 0.66rem;
}

.recommended-list span,
.recommended-list small,
.recommended-empty {
  margin-top: 2px;
  color: #8f9187;
  font-size: 0.55rem;
}

.recommended-empty {
  margin-bottom: 0;
}

.recommended-restaurants :deep(.el-alert) {
  padding: 7px 9px;
}

.recommended-restaurants :deep(.el-alert__title) {
  font-size: 0.6rem;
  line-height: 1.4;
}

.restaurant-form {
  margin-top: 10px;
  padding: 13px 14px;
  background: #f3eddf;
  border: 1px solid #e2d6bd;
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
  color: #a86412;
  font-size: 0.55rem;
  font-weight: 900;
  letter-spacing: 0.09em;
}

.form-title strong {
  margin-top: 2px;
  color: #364034;
  font-size: 0.82rem;
}

.form-title > span {
  padding: 5px 8px;
  color: #40513b;
  font-size: 0.65rem;
  font-weight: 800;
  background: #fff1c9;
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
  color: #70766a;
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
  color: #364034;
  font-size: 0.7rem;
  background: #fff;
  border: 1px solid #dfd0ae;
  border-radius: 9px;
  outline: none;
}

input:focus {
  border-color: #d8ad3d;
  box-shadow: 0 0 0 3px rgba(168, 100, 18, 0.08);
}

.form-actions {
  gap: 8px;
  margin-top: 9px;
}

.form-actions p {
  overflow: hidden;
  margin: 0;
  color: #8f9187;
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
  background: #a86412;
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
  border: 1px solid #e7ddc8;
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
  color: #364034;
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
  color: #8f9187;
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
  background: #faf6ed;
  border-style: dashed;
}
</style>
