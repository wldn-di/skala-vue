import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'WeatherHome',
    component: () => import('../views/PracticeFiveView.vue'),
  },
  {
    path: '/practice1',
    name: 'PracticeOne',
    component: () => import('../components/exercise/WeatherMockup.vue'),
  },
  {
    path: '/practice2',
    name: 'PracticeTwo',
    component: () => import('../components/exercise/WeatherComposition.vue'),
  },
  {
    path: '/practice3',
    name: 'PracticeThree',
    component: () => import('../components/exercise/WeatherParent.vue'),
  },
  {
    path: '/practice4',
    name: 'PracticeFour',
    component: () => import('../views/WeatherHomeView.vue'),
  },
  {
    path: '/practice5',
    name: 'PracticeFive',
    component: () => import('../views/PracticeFiveView.vue'),
  },
  {
    path: '/about',
    name: 'WeatherAbout',
    component: () => import('../views/WeatherAboutView.vue'),
  },
  {
    path: '/weather/:cityId',
    name: 'WeatherDetail',
    component: () => import('../views/WeatherDetailView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFoundView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

export default router
