import { fileURLToPath, URL } from 'node:url'
import process from 'node:process'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

import { fetchRegionForecast } from './server/forecastService.js'
import { fetchKakaoPlacePreview, searchKakaoRestaurants } from './server/kakaoRestaurantService.js'
import { fetchAllRegionWeather } from './server/weatherService.js'

const apiPlugin = ({ weatherApiKey, kakaoRestApiKey }) => {
  const attachWeatherApi = (middlewares) => {
    middlewares.use('/api/weather', async (request, response) => {
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.setHeader('X-Content-Type-Options', 'nosniff')
      response.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
      response.setHeader('Referrer-Policy', 'no-referrer')

      if (request.method !== 'GET') {
        response.statusCode = 405
        response.setHeader('Allow', 'GET')
        response.end(JSON.stringify({ error: 'METHOD_NOT_ALLOWED' }))
        return
      }

      const requestUrl = new URL(request.url ?? '/', 'https://local.invalid')
      if (requestUrl.search) {
        response.statusCode = 400
        response.setHeader('Cache-Control', 'no-store')
        response.end(JSON.stringify({ error: 'QUERY_NOT_ALLOWED' }))
        return
      }

      try {
        const payload = await fetchAllRegionWeather(weatherApiKey)
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

    middlewares.use('/api/forecast', async (request, response) => {
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.setHeader('X-Content-Type-Options', 'nosniff')
      response.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
      response.setHeader('Referrer-Policy', 'no-referrer')

      if (request.method !== 'GET') {
        response.statusCode = 405
        response.setHeader('Allow', 'GET')
        response.end(JSON.stringify({ error: 'METHOD_NOT_ALLOWED' }))
        return
      }

      const requestUrl = new URL(request.url ?? '/', 'https://local.invalid')
      const regionId = requestUrl.searchParams.get('regionId') ?? ''
      const hasUnexpectedQuery = [...requestUrl.searchParams.keys()].some((key) => key !== 'regionId')
      if (!regionId || hasUnexpectedQuery) {
        response.statusCode = 400
        response.setHeader('Cache-Control', 'no-store')
        response.end(JSON.stringify({ error: 'QUERY_INVALID' }))
        return
      }

      try {
        const payload = await fetchRegionForecast(regionId, weatherApiKey)
        response.statusCode = 200
        response.setHeader('Cache-Control', 'private, max-age=600')
        response.end(JSON.stringify(payload))
      } catch (error) {
        const isInvalidRegion = error.code === 'WEATHER_REGION_INVALID'
        const isMissingKey = error.code === 'WEATHER_API_KEY_MISSING'
        const isUnauthorized = error.code === 'WEATHER_API_UNAUTHORIZED'
        response.statusCode = isInvalidRegion ? 400 : isMissingKey || isUnauthorized ? 503 : 502
        response.setHeader('Cache-Control', 'no-store')
        response.end(
          JSON.stringify({
            error: isInvalidRegion ? 'WEATHER_REGION_INVALID' : isMissingKey ? 'WEATHER_API_NOT_CONFIGURED' : isUnauthorized ? 'WEATHER_API_UNAUTHORIZED' : 'WEATHER_FORECAST_UNAVAILABLE',
          }),
        )
      }
    })

    middlewares.use('/api/restaurants', async (request, response) => {
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.setHeader('X-Content-Type-Options', 'nosniff')
      response.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
      response.setHeader('Referrer-Policy', 'no-referrer')

      if (request.method !== 'GET') {
        response.statusCode = 405
        response.setHeader('Allow', 'GET')
        response.end(JSON.stringify({ error: 'METHOD_NOT_ALLOWED' }))
        return
      }

      const requestUrl = new URL(request.url ?? '/', 'https://local.invalid')
      const regionId = requestUrl.searchParams.get('regionId') ?? ''
      const district = requestUrl.searchParams.get('district')?.trim() ?? ''
      const hasUnexpectedQuery = [...requestUrl.searchParams.keys()].some((key) => key !== 'regionId' && key !== 'district')
      if (!regionId || !district || hasUnexpectedQuery) {
        response.statusCode = 400
        response.setHeader('Cache-Control', 'no-store')
        response.end(JSON.stringify({ error: 'QUERY_INVALID' }))
        return
      }

      try {
        const payload = await searchKakaoRestaurants({ regionId, district, apiKey: kakaoRestApiKey })
        response.statusCode = 200
        response.setHeader('Cache-Control', 'private, max-age=600')
        response.end(JSON.stringify(payload))
      } catch (error) {
        const isInvalidQuery = error.code === 'KAKAO_QUERY_INVALID'
        const isMapServiceDisabled = error.code === 'KAKAO_MAP_SERVICE_DISABLED'
        const isMissingKey = error.code === 'KAKAO_API_KEY_MISSING'
        const isUnauthorized = error.code === 'KAKAO_API_UNAUTHORIZED'
        response.statusCode = isInvalidQuery ? 400 : isMapServiceDisabled || isMissingKey || isUnauthorized ? 503 : 502
        response.setHeader('Cache-Control', 'no-store')
        response.end(
          JSON.stringify({
            error: isInvalidQuery
              ? 'KAKAO_QUERY_INVALID'
              : isMapServiceDisabled
                ? 'KAKAO_MAP_SERVICE_DISABLED'
                : isMissingKey
                  ? 'KAKAO_API_NOT_CONFIGURED'
                  : isUnauthorized
                    ? 'KAKAO_API_UNAUTHORIZED'
                    : 'KAKAO_RESTAURANTS_UNAVAILABLE',
          }),
        )
      }
    })

    middlewares.use('/api/place-preview', async (request, response) => {
      response.setHeader('X-Content-Type-Options', 'nosniff')
      response.setHeader('Cross-Origin-Resource-Policy', 'same-origin')

      if (request.method !== 'GET') {
        response.statusCode = 405
        response.setHeader('Allow', 'GET')
        response.setHeader('Content-Type', 'application/json; charset=utf-8')
        response.end(JSON.stringify({ error: 'METHOD_NOT_ALLOWED' }))
        return
      }

      const requestUrl = new URL(request.url ?? '/', 'https://local.invalid')
      const x = requestUrl.searchParams.get('x') ?? ''
      const y = requestUrl.searchParams.get('y') ?? ''
      const hasUnexpectedQuery = [...requestUrl.searchParams.keys()].some((key) => key !== 'x' && key !== 'y')
      if (!x || !y || hasUnexpectedQuery) {
        response.statusCode = 400
        response.setHeader('Content-Type', 'application/json; charset=utf-8')
        response.setHeader('Cache-Control', 'no-store')
        response.end(JSON.stringify({ error: 'QUERY_INVALID' }))
        return
      }

      try {
        const preview = await fetchKakaoPlacePreview({ x, y, apiKey: kakaoRestApiKey })
        response.statusCode = 200
        response.setHeader('Content-Type', preview.contentType)
        response.setHeader('Cache-Control', 'private, max-age=86400')
        response.end(preview.body)
      } catch (error) {
        const isInvalidQuery = error.code === 'KAKAO_QUERY_INVALID'
        const isMapServiceDisabled = error.code === 'KAKAO_MAP_SERVICE_DISABLED'
        const isMissingKey = error.code === 'KAKAO_API_KEY_MISSING'
        const isUnauthorized = error.code === 'KAKAO_API_UNAUTHORIZED'
        response.statusCode = isInvalidQuery ? 400 : isMapServiceDisabled || isMissingKey || isUnauthorized ? 503 : 502
        response.setHeader('Content-Type', 'application/json; charset=utf-8')
        response.setHeader('Cache-Control', 'no-store')
        response.end(
          JSON.stringify({
            error: isInvalidQuery
              ? 'KAKAO_QUERY_INVALID'
              : isMapServiceDisabled
                ? 'KAKAO_MAP_SERVICE_DISABLED'
                : isMissingKey
                  ? 'KAKAO_API_NOT_CONFIGURED'
                  : isUnauthorized
                    ? 'KAKAO_API_UNAUTHORIZED'
                    : 'KAKAO_PLACE_PREVIEW_UNAVAILABLE',
          }),
        )
      }
    })
  }

  return {
    name: 'external-api-proxy',
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
    plugins: [vue(), vueDevTools(), apiPlugin({ weatherApiKey: env.WEATHER_API_KEY, kakaoRestApiKey: env.KAKAO_REST_API_KEY })],
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
