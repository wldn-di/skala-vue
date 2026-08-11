<script setup>
// 과제 1 전용 SVG 지도 컴포넌트
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  file: {
    type: String,
    default: '전국_시도_경계.svg',
  },
  activeName: {
    type: String,
    default: '',
  },
  regions: {
    type: Array,
    required: true,
  },
  restaurantCounts: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['select'])

const mapRoot = ref(null)
const svgMarkup = ref('')
const errorMessage = ref('')
const tooltip = ref(null)
const markerPositions = ref([])
let resizeObserver

const getPath = (event) => event.target.closest?.('path[id]')
const getRegion = (mapName) =>
  props.regions.find((region) => region.mapName === mapName) ?? {
    id: mapName,
    mapName,
    name: mapName,
    fullName: mapName,
  }

const updateActivePath = () => {
  const paths = mapRoot.value?.querySelectorAll('path[id]') ?? []
  paths.forEach((path) => path.classList.toggle('is-active', path.id === props.activeName))
}

const updateMarkerPositions = () => {
  if (!mapRoot.value) return

  const rootRect = mapRoot.value.getBoundingClientRect()
  markerPositions.value = [...mapRoot.value.querySelectorAll('path[id]')]
    .map((path) => {
      const region = getRegion(path.id)
      const count = props.restaurantCounts[region.id] ?? 0
      if (count === 0) return null

      const pathRect = path.getBoundingClientRect()
      return {
        id: region.id,
        name: region.name,
        count,
        x: pathRect.left - rootRect.left + pathRect.width / 2,
        y: pathRect.top - rootRect.top + pathRect.height / 2,
      }
    })
    .filter(Boolean)
}

const configureMap = async () => {
  await nextTick()
  const svg = mapRoot.value?.querySelector('svg')
  if (!svg) return

  svg.removeAttribute('width')
  svg.removeAttribute('height')
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
  svg.setAttribute('aria-label', '대한민국 17개 시도 선택 지도')

  mapRoot.value.querySelectorAll('path[id]').forEach((path) => {
    path.setAttribute('tabindex', '0')
    path.setAttribute('role', 'button')
    path.setAttribute('aria-label', `${getRegion(path.id).fullName} 선택`)
  })

  updateActivePath()
  updateMarkerPositions()
}

const loadMap = async () => {
  errorMessage.value = ''
  svgMarkup.value = ''
  tooltip.value = null
  markerPositions.value = []
  try {
    const response = await fetch(`/maps/${encodeURIComponent(props.file)}`)
    if (!response.ok) throw new Error('지도를 불러오지 못했어요.')

    const source = await response.text()
    const document = new DOMParser().parseFromString(source, 'image/svg+xml')
    const parserError = document.querySelector('parsererror')
    if (parserError) throw new Error('지도 파일을 해석하지 못했어요.')

    svgMarkup.value = document.documentElement.outerHTML
    await configureMap()
  } catch (error) {
    errorMessage.value = error.message
  }
}

const showTooltip = (path) => {
  const region = getRegion(path.id)
  if (!mapRoot.value) return

  const rootRect = mapRoot.value.getBoundingClientRect()
  const pathRect = path.getBoundingClientRect()
  tooltip.value = {
    region,
    count: props.restaurantCounts[region.id] ?? 0,
    x: Math.min(
      Math.max(pathRect.left - rootRect.left + pathRect.width / 2, 100),
      rootRect.width - 100,
    ),
    y: Math.max(pathRect.top - rootRect.top + pathRect.height / 2 - 14, 42),
  }
}

const handlePointerOver = (event) => {
  const path = getPath(event)
  if (path) showTooltip(path)
}

const handlePointerOut = (event) => {
  const path = getPath(event)
  const relatedPath = event.relatedTarget?.closest?.('path[id]')
  if (path && path !== relatedPath) tooltip.value = null
}

const selectPath = (path) => {
  const region = getRegion(path.id)
  emit('select', region)
}

const handleClick = (event) => {
  const path = getPath(event)
  if (path) selectPath(path)
}

const handleKeydown = (event) => {
  const path = getPath(event)
  if (path && ['Enter', ' '].includes(event.key)) {
    event.preventDefault()
    selectPath(path)
  }
}

watch(() => props.activeName, updateActivePath)
watch(() => props.restaurantCounts, updateMarkerPositions, { deep: true })
watch(() => props.file, loadMap)

onMounted(() => {
  loadMap()
  resizeObserver = new ResizeObserver(updateMarkerPositions)
  if (mapRoot.value) resizeObserver.observe(mapRoot.value)
})

onBeforeUnmount(() => resizeObserver?.disconnect())
</script>

<template>
  <div
    ref="mapRoot"
    class="region-map"
    @pointerover="handlePointerOver"
    @pointerout="handlePointerOut"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <div class="map-content" v-html="svgMarkup"></div>

    <span
      v-for="marker in markerPositions"
      :key="marker.id"
      class="restaurant-marker"
      :style="{ left: `${marker.x}px`, top: `${marker.y}px` }"
      :aria-label="`${marker.name} 등록 맛집 ${marker.count}곳`"
    >
      {{ marker.count }}
    </span>

    <Transition name="tooltip">
      <div
        v-if="tooltip"
        class="map-tooltip"
        :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
      >
        <strong>
          {{ tooltip.region.name }}
          <template v-if="tooltip.region.temp !== undefined">{{ tooltip.region.temp }}°</template>
        </strong>
        <span v-if="tooltip.region.temp !== undefined">
          {{ tooltip.region.emoji }} {{ tooltip.region.status }}
        </span>
        <small>등록 맛집 {{ tooltip.count }}곳</small>
      </div>
    </Transition>

    <p v-if="errorMessage" class="map-error" role="alert">{{ errorMessage }}</p>
  </div>
</template>

<style scoped>
.region-map {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.map-content {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  padding: 22px 48px 18px;
}

.map-content :deep(svg) {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.map-content :deep(path[id]) {
  cursor: pointer;
  fill: #dce8f5;
  stroke: #fff;
  stroke-width: 1.8px;
  transform-box: fill-box;
  transform-origin: center;
  transition: fill 160ms ease, filter 160ms ease, transform 160ms ease;
}

.map-content :deep(path[id]:hover),
.map-content :deep(path[id]:focus-visible) {
  fill: #85b7fb;
  filter: drop-shadow(0 7px 10px rgba(49, 130, 246, 0.22));
  outline: none;
  transform: scale(1.025);
}

.map-content :deep(path[id].is-active) {
  fill: #3182f6;
  filter: drop-shadow(0 9px 13px rgba(49, 130, 246, 0.3));
}

.restaurant-marker {
  position: absolute;
  z-index: 3;
  display: grid;
  place-items: center;
  width: 21px;
  height: 21px;
  color: #fff;
  font-size: 0.64rem;
  font-weight: 900;
  background: #ff8a3d;
  border: 2px solid #fff;
  border-radius: 999px;
  pointer-events: none;
  transform: translate(-50%, -50%);
  box-shadow: 0 5px 12px rgba(220, 95, 19, 0.3);
}

.map-tooltip {
  position: absolute;
  z-index: 5;
  display: grid;
  grid-template-columns: auto auto;
  gap: 3px 9px;
  min-width: 170px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.97);
  border: 1px solid rgba(49, 130, 246, 0.16);
  border-radius: 13px;
  pointer-events: none;
  transform: translate(-50%, -100%);
  box-shadow: 0 12px 30px rgba(0, 27, 55, 0.16);
}

.map-tooltip strong {
  color: #253448;
  font-size: 0.78rem;
}

.map-tooltip span {
  color: #4e5968;
  font-size: 0.72rem;
}

.map-tooltip small {
  grid-column: 1 / -1;
  color: #8b95a1;
  font-size: 0.64rem;
}

.map-error {
  position: absolute;
  inset: 50% auto auto 50%;
  color: #e5484d;
  font-size: 0.82rem;
  transform: translate(-50%, -50%);
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 120ms ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}

@media (max-width: 720px) {
  .map-content {
    padding: 12px 10px;
  }
}
</style>
