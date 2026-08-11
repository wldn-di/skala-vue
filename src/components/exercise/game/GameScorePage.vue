<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  scores: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['play'])

const activeTab = ref('history')
const bestScore = computed(() => Math.max(0, ...props.scores.map((item) => item.score)))
const totalFoods = computed(() => props.scores.reduce((total, item) => total + item.foodsEaten, 0))
const recentRegion = computed(() => props.scores[0]?.homeRegion ?? '아직 없음')

const regionalStats = computed(() => {
  const statsByRegion = new Map()

  props.scores.forEach((item) => {
    const regionId = item.homeRegionId ?? 'unknown'
    const current = statsByRegion.get(regionId) ?? {
      id: regionId,
      name: item.homeRegion ?? '미지정',
      totalScore: 0,
      bestScore: 0,
      playCount: 0,
      players: new Set(),
    }

    current.totalScore += item.score
    current.bestScore = Math.max(current.bestScore, item.score)
    current.playCount += 1
    current.players.add(item.nickname)
    statsByRegion.set(regionId, current)
  })

  return [...statsByRegion.values()].map((item) => ({
    ...item,
    playerCount: item.players.size,
  }))
})

const totalScoreRanking = computed(() => [...regionalStats.value].sort((a, b) => b.totalScore - a.totalScore || b.bestScore - a.bestScore || a.name.localeCompare(b.name, 'ko-KR')).slice(0, 10))

const bestScoreRanking = computed(() => [...regionalStats.value].sort((a, b) => b.bestScore - a.bestScore || b.totalScore - a.totalScore || a.name.localeCompare(b.name, 'ko-KR')).slice(0, 10))

const activeRanking = computed(() => (activeTab.value === 'total' ? totalScoreRanking.value : bestScoreRanking.value))

const formatDate = (date) =>
  new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
</script>

<template>
  <main class="score-page">
    <section class="score-card">
      <header class="score-heading">
        <div>
          <p>MY GAME RECORD</p>
          <h1>내 점수와 지역 랭킹</h1>
          <span>이 브라우저에 등록한 푸드 스네이크 기록을 지역별로 집계해요.</span>
        </div>
        <button type="button" @click="$emit('play')">게임하러 가기 →</button>
      </header>

      <dl class="score-summary">
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
        <div>
          <dt>최근 지역</dt>
          <dd class="region">{{ recentRegion }}</dd>
        </div>
      </dl>

      <section class="history-panel">
        <header>
          <div>
            <small>SCORE HISTORY</small>
            <h2>
              {{ activeTab === 'history' ? '최근 등록 기록' : activeTab === 'total' ? '지역 합산 점수 TOP 10' : '지역별 최고점 TOP 10' }}
            </h2>
          </div>
          <div class="ranking-tabs" role="tablist" aria-label="점수 보기 방식">
            <button type="button" :class="{ active: activeTab === 'history' }" @click="activeTab = 'history'">내 기록</button>
            <button type="button" :class="{ active: activeTab === 'total' }" @click="activeTab = 'total'">지역 합산</button>
            <button type="button" :class="{ active: activeTab === 'best' }" @click="activeTab = 'best'">지역 최고점</button>
          </div>
        </header>

        <div v-if="activeTab === 'history' && scores.length" class="score-list">
          <article v-for="(item, index) in scores" :key="item.id" class="score-row">
            <strong class="rank">{{ index + 1 }}</strong>
            <div class="player">
              <span aria-hidden="true">{{ item.weatherEmoji }}</span>
              <div>
                <strong>{{ item.nickname }}</strong>
                <small>{{ item.homeRegion }} 소속 · {{ item.playedRegion }} 플레이</small>
              </div>
            </div>
            <span class="food-count">음식 {{ item.foodsEaten }}개</span>
            <time :datetime="item.playedAt">{{ formatDate(item.playedAt) }}</time>
            <b>{{ item.score }}점</b>
          </article>
        </div>

        <div v-else-if="activeTab !== 'history' && activeRanking.length" class="ranking-list">
          <article v-for="(item, index) in activeRanking" :key="item.id" class="ranking-row">
            <strong class="ranking-number" :class="{ medal: index < 3 }">{{ index + 1 }}</strong>
            <div>
              <strong>{{ item.name }}</strong>
              <small>참여 {{ item.playerCount }}명 · {{ item.playCount }}회 플레이</small>
            </div>
            <span>지역 최고 {{ item.bestScore }}점</span>
            <b>{{ activeTab === 'total' ? item.totalScore : item.bestScore }}점</b>
          </article>
        </div>

        <div v-else class="empty-score">
          <span aria-hidden="true">🎮</span>
          <strong>{{ activeTab === 'history' ? '아직 등록한 점수가 없어요' : '아직 지역 랭킹이 없어요' }}</strong>
          <p>게임을 플레이한 뒤 점수등록 메뉴에서 지역과 함께 첫 기록을 남겨보세요.</p>
          <button type="button" @click="$emit('play')">첫 게임 시작하기</button>
        </div>
      </section>
    </section>
  </main>
</template>

<style scoped>
.score-page {
  width: min(1200px, calc(100% - 36px));
  height: calc(100svh - 66px);
  margin: 0 auto;
  padding: 12px 0 14px;
}

.score-card {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 14px;
  height: 100%;
  padding: 22px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(220, 228, 237, 0.9);
  border-radius: 22px;
  box-shadow: 0 12px 38px rgba(29, 59, 93, 0.08);
}

.score-heading,
.history-panel > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.score-heading p,
.history-panel header small {
  margin: 0;
  color: #3182f6;
  font-size: 0.57rem;
  font-weight: 900;
  letter-spacing: 0.1em;
}

.score-heading h1 {
  margin: 3px 0 1px;
  color: #202b3a;
  font-size: 1.35rem;
  font-weight: 900;
}

.score-heading > div > span {
  color: #8b95a1;
  font-size: 0.66rem;
}

.score-heading button,
.empty-score button {
  min-height: 38px;
  padding: 0 14px;
  color: #fff;
  font-size: 0.66rem;
  font-weight: 850;
  background: #3182f6;
  border: 0;
  border-radius: 11px;
}

.score-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin: 0;
}

.score-summary > div {
  padding: 16px 18px;
  background: #f7f9fc;
  border: 1px solid #e8edf3;
  border-radius: 17px;
}

.score-summary dt {
  color: #8b95a1;
  font-size: 0.61rem;
  font-weight: 700;
}

.score-summary dd {
  margin: 5px 0 0;
  color: #253448;
  font-size: 1.45rem;
  font-weight: 900;
}

.score-summary dd small {
  margin-left: 3px;
  color: #6b7684;
  font-size: 0.6rem;
  font-weight: 700;
}

.score-summary dd.region {
  overflow: hidden;
  font-size: 1rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-panel {
  min-height: 0;
  padding: 18px;
  overflow: hidden;
  background: #fbfcfe;
  border: 1px solid #e8edf3;
  border-radius: 18px;
}

.history-panel h2 {
  margin: 2px 0 0;
  color: #344054;
  font-size: 0.92rem;
  font-weight: 850;
}

.ranking-tabs {
  display: flex;
  gap: 3px;
  padding: 3px;
  background: #eef1f5;
  border-radius: 10px;
}

.ranking-tabs button {
  min-height: 29px;
  padding: 0 9px;
  color: #7c8794;
  font-size: 0.56rem;
  font-weight: 800;
  background: transparent;
  border: 0;
  border-radius: 8px;
}

.ranking-tabs button.active {
  color: #1b64da;
  background: #fff;
  box-shadow: 0 2px 7px rgba(27, 65, 105, 0.08);
}

.score-list {
  display: grid;
  gap: 7px;
  max-height: calc(100% - 49px);
  margin-top: 14px;
  overflow-y: auto;
}

.ranking-list {
  display: grid;
  gap: 7px;
  max-height: calc(100% - 49px);
  margin-top: 14px;
  overflow-y: auto;
}

.ranking-row {
  display: grid;
  grid-template-columns: 36px minmax(160px, 1fr) 110px 80px;
  align-items: center;
  gap: 12px;
  min-height: 57px;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #e9edf2;
  border-radius: 13px;
}

.ranking-number {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  color: #6b7684;
  font-size: 0.67rem;
  font-weight: 900;
  background: #f1f3f6;
  border-radius: 9px;
}

.ranking-number.medal {
  color: #ad5e16;
  background: #fff0d9;
}

.ranking-row > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.ranking-row > div strong {
  color: #344054;
  font-size: 0.7rem;
  font-weight: 850;
}

.ranking-row small,
.ranking-row > span {
  color: #8b95a1;
  font-size: 0.56rem;
}

.ranking-row > b {
  color: #1b64da;
  font-size: 0.74rem;
  font-weight: 900;
  text-align: right;
}

.score-row {
  display: grid;
  grid-template-columns: 34px minmax(180px, 1fr) auto 110px 72px;
  align-items: center;
  gap: 12px;
  min-height: 57px;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #e9edf2;
  border-radius: 13px;
}

.rank {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  color: #3182f6;
  font-size: 0.65rem;
  font-weight: 900;
  background: #eaf3ff;
  border-radius: 9px;
}

.player {
  display: flex;
  align-items: center;
  gap: 9px;
}

.player > span {
  font-size: 1.2rem;
}

.player > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.player strong,
.score-row > b {
  color: #344054;
  font-size: 0.69rem;
  font-weight: 850;
}

.player small,
.score-row time,
.food-count {
  color: #8b95a1;
  font-size: 0.56rem;
}

.score-row > b {
  color: #1b64da;
  text-align: right;
}

.empty-score {
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100% - 45px);
  min-height: 240px;
  flex-direction: column;
  text-align: center;
}

.empty-score > span {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  font-size: 1.8rem;
  background: #eaf3ff;
  border-radius: 20px;
}

.empty-score strong {
  margin-top: 12px;
  color: #344054;
  font-size: 0.9rem;
  font-weight: 850;
}

.empty-score p {
  margin: 4px 0 14px;
  color: #8b95a1;
  font-size: 0.62rem;
}

@media (max-width: 700px) {
  .score-page {
    width: calc(100% - 20px);
    height: auto;
  }

  .score-card {
    padding: 15px;
  }

  .score-heading > div > span {
    display: none;
  }

  .score-summary {
    grid-template-columns: repeat(2, 1fr);
  }

  .score-row {
    grid-template-columns: 30px minmax(0, 1fr) 58px;
  }

  .history-panel > header {
    align-items: flex-start;
    flex-direction: column;
    gap: 9px;
  }

  .ranking-tabs {
    width: 100%;
  }

  .ranking-tabs button {
    flex: 1;
  }

  .ranking-row {
    grid-template-columns: 30px minmax(0, 1fr) 65px;
  }

  .ranking-row > span {
    display: none;
  }

  .food-count,
  .score-row time {
    display: none;
  }
}
</style>
