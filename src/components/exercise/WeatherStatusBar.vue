<script setup>
defineProps({
  message: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <el-alert class="status-bar" :title="message" type="success" :closable="false" show-icon />
</template>

<style scoped>
.status-bar {
  font-weight: 700;
  text-align: center;
  border-radius: 6px;
}

.status-bar :deep(.el-alert__content) {
  width: 100%;
}
</style>
