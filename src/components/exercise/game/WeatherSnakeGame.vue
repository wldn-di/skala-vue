<!--
  Adapted from Talha Bin Yousaf's Snake Game:
  https://github.com/he-is-talha/html-css-javascript-games/tree/main/24-Snake-Game
  Copyright (c) 2024 Talha Bin Yousaf, MIT License.
  See THIRD_PARTY_LICENSES.md for the complete license text.
-->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  highScore: {
    type: Number,
    default: 0,
  },
  weather: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['finish'])

const BOARD_SIZE = 30
const SCORE_PER_FOOD = 10
const GAME_SPEED = 105
const directionKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']

const snakeBody = ref([{ x: 5, y: 5 }])
const food = ref({ x: 18, y: 15 })
const direction = ref({ x: 0, y: 0 })
const nextDirection = ref({ x: 0, y: 0 })
const score = ref(0)
const gameStatus = ref('ready')
const foodsEaten = ref(0)
let gameTimer = null

const missionFood = computed(() => {
  if (props.weather.status.includes('비')) return { emoji: '🥞', name: '바삭한 전' }
  if (props.weather.temp >= 25) return { emoji: '🍜', name: '시원한 냉면' }
  return { emoji: '🍲', name: '따뜻한 국밥' }
})

const currentHighScore = computed(() => Math.max(props.highScore, score.value))
const isRunning = computed(() => gameStatus.value === 'running')

const cellStyle = (cell) => ({
  gridColumn: cell.x,
  gridRow: cell.y,
})

const clearGameTimer = () => {
  if (gameTimer === null) return
  window.clearInterval(gameTimer)
  gameTimer = null
}

const isSnakeCell = (x, y) => snakeBody.value.some((segment) => segment.x === x && segment.y === y)

const updateFoodPosition = () => {
  let nextFood
  do {
    nextFood = {
      x: Math.floor(Math.random() * BOARD_SIZE) + 1,
      y: Math.floor(Math.random() * BOARD_SIZE) + 1,
    }
  } while (isSnakeCell(nextFood.x, nextFood.y))

  food.value = nextFood
}

const finishGame = () => {
  if (gameStatus.value !== 'running') return
  clearGameTimer()
  gameStatus.value = 'finished'
  emit('finish', {
    score: score.value,
    foodsEaten: foodsEaten.value,
    playedAt: new Date().toISOString(),
  })
}

const runGameFrame = () => {
  direction.value = nextDirection.value
  const head = snakeBody.value[0]
  const nextHead = {
    x: head.x + direction.value.x,
    y: head.y + direction.value.y,
  }

  const hitWall = nextHead.x <= 0 || nextHead.x > BOARD_SIZE || nextHead.y <= 0 || nextHead.y > BOARD_SIZE
  const hitBody = isSnakeCell(nextHead.x, nextHead.y)

  if (hitWall || hitBody) {
    finishGame()
    return
  }

  const nextBody = [nextHead, ...snakeBody.value]
  const ateFood = nextHead.x === food.value.x && nextHead.y === food.value.y

  if (ateFood) {
    score.value += SCORE_PER_FOOD
    foodsEaten.value += 1
    snakeBody.value = nextBody
    updateFoodPosition()
    return
  }

  nextBody.pop()
  snakeBody.value = nextBody
}

const startGame = () => {
  clearGameTimer()
  snakeBody.value = [
    { x: 5, y: 5 },
    { x: 4, y: 5 },
    { x: 3, y: 5 },
  ]
  direction.value = { x: 1, y: 0 }
  nextDirection.value = { x: 1, y: 0 }
  score.value = 0
  foodsEaten.value = 0
  gameStatus.value = 'running'
  updateFoodPosition()
  gameTimer = window.setInterval(runGameFrame, GAME_SPEED)
}

const changeDirection = (key) => {
  if (!isRunning.value) return

  const directions = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
  }
  const requested = directions[key]
  if (!requested) return

  const isReverse = requested.x === -direction.value.x && requested.y === -direction.value.y
  if (!isReverse) nextDirection.value = requested
}

const handleKeydown = (event) => {
  if (!directionKeys.includes(event.key)) return
  event.preventDefault()
  changeDirection(event.key)
}

const handleVisibilityChange = () => {
  if (document.hidden && isRunning.value) finishGame()
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  updateFoodPosition()
})

onBeforeUnmount(() => {
  clearGameTimer()
  window.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <section class="snake-game" aria-label="날씨한입 스네이크 게임">
    <header class="game-details">
      <span
        >현재 점수 <strong>{{ score }}</strong></span
      >
      <span
        >최고 점수 <strong>{{ currentHighScore }}</strong></span
      >
    </header>

    <div class="board-frame">
      <div class="play-board">
        <span class="food" :style="cellStyle(food)" :title="missionFood.name" aria-hidden="true">
          {{ missionFood.emoji }}
        </span>
        <span
          v-for="(segment, index) in snakeBody"
          :key="`${segment.x}-${segment.y}-${index}`"
          class="snake-segment"
          :class="{ head: index === 0 }"
          :style="cellStyle(segment)"
          aria-hidden="true"
        ></span>

        <div v-if="gameStatus !== 'running'" class="game-overlay">
          <span aria-hidden="true">{{ gameStatus === 'finished' ? '🏁' : '🎮' }}</span>
          <strong>{{ gameStatus === 'finished' ? '게임 종료!' : '푸드 스네이크' }}</strong>
          <p v-if="gameStatus === 'finished'">{{ missionFood.name }} {{ foodsEaten }}개 · {{ score }}점</p>
          <p v-else>방향키로 뱀을 움직여 날씨 음식을 모아보세요.</p>
          <button type="button" @click="startGame">
            {{ gameStatus === 'finished' ? '다시 도전' : '게임 시작' }}
          </button>
        </div>
      </div>
    </div>

    <div class="controls" aria-label="게임 방향 조작">
      <button type="button" aria-label="왼쪽" @click="changeDirection('ArrowLeft')">←</button>
      <button type="button" aria-label="위쪽" @click="changeDirection('ArrowUp')">↑</button>
      <button type="button" aria-label="아래쪽" @click="changeDirection('ArrowDown')">↓</button>
      <button type="button" aria-label="오른쪽" @click="changeDirection('ArrowRight')">→</button>
    </div>
  </section>
</template>

<style scoped>
.snake-game {
  display: flex;
  flex-direction: column;
  width: min(100%, 620px);
  min-height: 0;
  overflow: hidden;
  background: #26364a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(27, 45, 68, 0.2);
}

.game-details {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 54px;
  padding: 0 22px;
  color: #aebed2;
  font-size: 0.72rem;
  font-weight: 700;
}

.game-details strong {
  margin-left: 5px;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 900;
}

.board-frame {
  padding: 0 14px 14px;
}

.play-board {
  position: relative;
  display: grid;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px), #172437;
  background-size: calc(100% / 30) calc(100% / 30);
  grid-template: repeat(30, 1fr) / repeat(30, 1fr);
  border-radius: 16px;
}

.food,
.snake-segment {
  position: relative;
  z-index: 2;
  min-width: 0;
  min-height: 0;
}

.food {
  display: grid;
  place-items: center;
  font-size: clamp(0.62rem, 1.45vw, 1rem);
  filter: drop-shadow(0 2px 4px rgba(255, 152, 82, 0.35));
  transform: scale(1.7);
}

.snake-segment {
  margin: 1px;
  background: #58d6a9;
  border-radius: 28%;
  box-shadow: 0 0 8px rgba(88, 214, 169, 0.25);
}

.snake-segment.head {
  z-index: 3;
  background: #ff9b58;
  border-radius: 40%;
  box-shadow: 0 0 10px rgba(255, 155, 88, 0.5);
}

.game-overlay {
  position: absolute;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 22px;
  text-align: center;
  background: rgba(16, 29, 45, 0.78);
  backdrop-filter: blur(8px);
  inset: 0;
}

.game-overlay > span {
  font-size: 2.5rem;
}

.game-overlay strong {
  margin-top: 8px;
  color: #fff;
  font-size: 1.25rem;
  font-weight: 900;
}

.game-overlay p {
  margin: 7px 0 18px;
  color: #b9c8da;
  font-size: 0.72rem;
}

.game-overlay button {
  min-height: 40px;
  padding: 0 20px;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 850;
  background: #3182f6;
  border: 0;
  border-radius: 12px;
}

.controls {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  min-height: 50px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.controls button {
  color: #b8c6dc;
  font-size: 1.05rem;
  font-weight: 800;
  background: transparent;
  border: 0;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.controls button:last-child {
  border-right: 0;
}

.controls button:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}

@media (min-width: 900px) {
  .snake-game {
    width: min(100%, calc(100svh - 270px), 620px);
  }

  .controls {
    display: none;
  }
}
</style>
