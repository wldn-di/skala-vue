<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <RouterView />

  <nav class="app-navigation" aria-label="과제 4 기본 페이지">
    <RouterLink to="/">홈</RouterLink>
    <RouterLink to="/about">소개</RouterLink>
  </nav>
</template>

<style scoped>
.app-navigation {
  position: fixed;
  z-index: 40;
  bottom: 18px;
  left: 18px;
  display: flex;
  gap: 4px;
  padding: 5px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid #dfe5ec;
  border-radius: 11px;
  box-shadow: 0 8px 24px rgba(87, 65, 26, 0.12);
}

.app-navigation a {
  padding: 7px 10px;
  color: #6b7684;
  font-size: 0.68rem;
  font-weight: 800;
  text-decoration: none;
  border-radius: 7px;
}

.app-navigation a.router-link-exact-active {
  color: #80510d;
  background: #fff1c9;
}
</style>
