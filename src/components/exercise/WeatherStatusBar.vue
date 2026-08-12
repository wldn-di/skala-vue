<script setup>
defineProps({
  message: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div class="status-bar" role="status">{{ message }}</div>
</template>

<style scoped>
.status-bar {
  padding: 10px;
  color: #2e7d32;
  font-weight: 700;
  text-align: center;
  background: #e8f5e9;
  border-radius: 6px;
}
</style>
