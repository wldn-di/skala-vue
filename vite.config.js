import { fileURLToPath, URL } from 'node:url'
import process from 'node:process'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

import { fetchAllRegionWeather } from './server/weatherService.js'

const weatherApiPlugin = (apiKey) => {
  const attachWeatherApi = (middlewares) => {
    middlewares.use('/api/weather', async (request, response) => {
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.setHeader('X-Content-Type-Options', 'nosniff')

      if (request.method !== 'GET') {
        response.statusCode = 405
        response.setHeader('Allow', 'GET')
        response.end(JSON.stringify({ error: 'METHOD_NOT_ALLOWED' }))
        return
      }

      try {
        const payload = await fetchAllRegionWeather(apiKey)
        response.statusCode = 200
        response.setHeader('Cache-Control', 'private, max-age=600')
        response.end(JSON.stringify(payload))
      } catch (error) {
        const isMissingKey = error.code === 'WEATHER_API_KEY_MISSING'
        const isUnauthorized = error.code === 'WEATHER_API_UNAUTHORIZED'
        response.statusCode = isMissingKey || isUnauthorized ? 503 : 502
        response.setHeader('Cache-Control', 'no-store')
        response.end(
          JSON.stringify({
            error: isMissingKey ? 'WEATHER_API_NOT_CONFIGURED' : isUnauthorized ? 'WEATHER_API_UNAUTHORIZED' : 'WEATHER_API_UNAVAILABLE',
          }),
        )
      }
    })
  }

  return {
    name: 'weather-api-proxy',
    configureServer(server) {
      attachWeatherApi(server.middlewares)
    },
    configurePreviewServer(server) {
      attachWeatherApi(server.middlewares)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 빈 prefix로 서버 전용 WEATHER_API_KEY를 읽되 클라이언트 코드에는 전달하지 않습니다.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue(), vueDevTools(), weatherApiPlugin(env.WEATHER_API_KEY)],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    // 🟢 [커스텀 추가 1] 로컬 개발 서버(Dev Server) 속성 제어
    server: {
      port: 3000, // 개발 서버의 네트워크 포트를 3000번으로 고정 명세
      open: true, // 프로세스 기동(npm run dev) 시 기본 웹 브라우저를 자동 실행
    },
    // 🟢 [커스텀 추가 2] 컴파일 완료된 산출물(Production Build) 사양 제어
    build: {
      outDir: 'dist', // 최종 정적 리소스(HTML, JS, CSS)가 저장될 출력 디렉토리명 지정
    },
  }
})
