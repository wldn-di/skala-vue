<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  scores: {
    type: Array,
    default: () => [],
  },
})

const activeTab = ref('history')

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
const panelTitle = computed(
  () =>
    ({
      history: '최근 등록 기록',
      total: '지역 합산 점수 TOP 10',
      best: '지역별 최고점 TOP 10',
    })[activeTab.value],
)

const formatDate = (date) =>
  new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
</script>

<template>
  <section class="score-board" aria-labelledby="score-board-title">
    <header>
      <div>
        <small>MY GAME RECORD</small>
        <h2 id="score-board-title">{{ panelTitle }}</h2>
        <p>현재 브라우저에 등록한 기록을 지역별로 집계합니다.</p>
      </div>
      <div class="ranking-tabs" role="tablist" aria-label="점수 보기 방식">
        <button type="button" :class="{ active: activeTab === 'history' }" @click="activeTab = 'history'">최근 등록 기록</button>
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
      <p>위 게임을 플레이한 뒤 점수를 등록하면 이곳에서 바로 확인할 수 있어요.</p>
    </div>
  </section>
</template>

<style scoped>
.score-board {
  min-height: 430px;
  padding: 20px;
  overflow: hidden;
  background: #f6f1e5;
  border: 1px solid #e2d6bd;
  border-radius: 20px;
}

.score-board > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.score-board header small {
  color: #a86412;
  font-size: 0.57rem;
  font-weight: 900;
  letter-spacing: 0.1em;
}

.score-board h2 {
  margin: 3px 0 0;
  color: #354133;
  font-size: 1rem;
  font-weight: 850;
}

.score-board header p {
  margin: 3px 0 0;
  color: #8f9187;
  font-size: 0.6rem;
}

.ranking-tabs {
  display: flex;
  gap: 3px;
  padding: 3px;
  background: #e8e4d6;
  border-radius: 10px;
}

.ranking-tabs button {
  min-height: 31px;
  padding: 0 11px;
  color: #7c8794;
  font-size: 0.58rem;
  font-weight: 800;
  background: transparent;
  border: 0;
  border-radius: 8px;
}

.ranking-tabs button.active {
  color: #40513b;
  background: #fff;
  box-shadow: 0 2px 7px rgba(72, 83, 58, 0.08);
}

.score-list,
.ranking-list {
  display: grid;
  gap: 7px;
  max-height: 340px;
  margin-top: 16px;
  overflow-y: auto;
}

.score-row {
  display: grid;
  grid-template-columns: 34px minmax(180px, 1fr) auto 110px 72px;
  align-items: center;
  gap: 12px;
  min-height: 57px;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #e7ddc8;
  border-radius: 13px;
}

.rank,
.ranking-number {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  color: #a86412;
  font-size: 0.65rem;
  font-weight: 900;
  background: #fff0bd;
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

.player > div,
.ranking-row > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.player strong,
.score-row > b,
.ranking-row > div strong {
  color: #354133;
  font-size: 0.69rem;
  font-weight: 850;
}

.player small,
.score-row time,
.food-count,
.ranking-row small,
.ranking-row > span {
  color: #8f9187;
  font-size: 0.56rem;
}

.score-row > b,
.ranking-row > b {
  color: #40513b;
  text-align: right;
}

.ranking-row {
  display: grid;
  grid-template-columns: 36px minmax(160px, 1fr) 110px 80px;
  align-items: center;
  gap: 12px;
  min-height: 57px;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #e7ddc8;
  border-radius: 13px;
}

.ranking-number {
  color: #70766a;
  background: #f1ede2;
}

.ranking-number.medal {
  color: #ad5e16;
  background: #fff0d9;
}

.ranking-row > b {
  font-size: 0.74rem;
  font-weight: 900;
}

.empty-score {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 310px;
  flex-direction: column;
  text-align: center;
}

.empty-score > span {
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  font-size: 1.7rem;
  background: #fff0bd;
  border-radius: 19px;
}

.empty-score strong {
  margin-top: 11px;
  color: #354133;
  font-size: 0.86rem;
}

.empty-score p {
  margin: 4px 0 0;
  color: #8f9187;
  font-size: 0.61rem;
}

@media (max-width: 700px) {
  .score-board {
    min-height: 390px;
    padding: 15px;
  }

  .score-board > header {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .ranking-tabs {
    width: 100%;
  }

  .ranking-tabs button {
    flex: 1;
  }

  .score-row {
    grid-template-columns: 30px minmax(0, 1fr) 58px;
  }

  .ranking-row {
    grid-template-columns: 30px minmax(0, 1fr) 65px;
  }

  .food-count,
  .score-row time,
  .ranking-row > span {
    display: none;
  }
}
</style>
