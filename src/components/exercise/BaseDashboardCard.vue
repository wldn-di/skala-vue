<script setup>
defineProps({
  variant: {
    type: String,
    default: 'simple',
    validator: (value) => ['simple', 'nationwide'].includes(value),
  },
})
</script>

<template>
  <section class="base-dashboard-card" :class="`is-${variant}`">
    <slot />
  </section>
</template>

<style scoped>
.base-dashboard-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
}

.is-simple {
  padding: 15px;
  margin-bottom: 15px;
}

.is-nationwide {
  height: 100%;
  min-height: 0;
  padding: 22px 24px 24px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.94);
  border-color: rgba(220, 228, 237, 0.9);
  border-radius: 22px;
  box-shadow: 0 12px 38px rgba(29, 59, 93, 0.08);
}

@media (min-width: 1200px) and (max-height: 780px) {
  .is-nationwide {
    padding-top: 14px;
    padding-bottom: 16px;
  }
}

@media (max-width: 1199px) {
  .is-nationwide {
    height: auto;
    min-height: calc(100svh - 92px);
    overflow: visible;
  }
}

@media (max-width: 680px) {
  .is-nationwide {
    padding: 14px;
  }
}
</style>
