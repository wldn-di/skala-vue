<script setup>
import AxiosJson from '../components/practices/library/AxiosJson.vue'
import AxiosWeather from '../components/practices/library/AxiosWeather.vue'
import StoreCounter from '../components/practices/library/StoreCounter.vue'
</script>

<template>
  <main class="practice-six-page">
    <header>
      <p>SKALA VUE · PRACTICE 6</p>
      <h1>Pinia와 Axios Code Challenge</h1>
    </header>

    <StoreCounter />
    <AxiosWeather />
    <AxiosJson />
  </main>
</template>

<style>
@import '@/assets/practice.css';

.practice-six-page {
  width: min(920px, calc(100% - 32px));
  margin: 0 auto;
  padding: 48px 0 90px;
}

.practice-six-page > header p {
  margin: 0;
  color: #a86412;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.practice-six-page > header h1 {
  margin: 8px 0 24px;
}
</style>
