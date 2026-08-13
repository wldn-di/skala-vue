import './assets/main.css'
import 'element-plus/theme-chalk/el-alert.css'
import 'element-plus/theme-chalk/el-button.css'
import 'element-plus/theme-chalk/el-input.css'
import 'element-plus/theme-chalk/el-message.css'
import 'element-plus/theme-chalk/el-skeleton.css'
import 'element-plus/theme-chalk/el-skeleton-item.css'
import 'element-plus/theme-chalk/el-tag.css'

import { ElAlert, ElButton, ElInput, ElSkeleton, ElSkeletonItem, ElTag } from 'element-plus'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router'

const app = createApp(App)

for (const component of [ElAlert, ElButton, ElInput, ElSkeleton, ElSkeletonItem, ElTag]) {
  app.component(component.name, component)
}

app.use(router).use(createPinia()).mount('#app')
