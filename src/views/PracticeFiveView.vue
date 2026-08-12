<script setup>
import { storeToRefs } from 'pinia'

import UnitToggler from '../components/exercise/UnitToggler.vue'
import { useConfigStore } from '../stores/configStore'
import WeatherHomeView from './WeatherHomeView.vue'

const configStore = useConfigStore()
const { unit, unitSymbol } = storeToRefs(configStore)
</script>

<template>
  <div class="practice-five-view">
    <WeatherHomeView :unit="unit" :unit-symbol="unitSymbol" />
    <UnitToggler class="unit-control" />
  </div>
</template>

<style scoped>
.unit-control {
  position: fixed;
  z-index: 50;
  right: 18px;
  bottom: 18px;
}
</style>
