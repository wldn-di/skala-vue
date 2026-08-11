const OPEN_WEATHER_ENDPOINT = 'https://api.openweathermap.org/data/2.5/weather'
const REQUEST_TIMEOUT_MS = 7_000
const SERVER_CACHE_MS = 10 * 60 * 1_000

// 임의 좌표 프록시로 악용되지 않도록 서버에서 허용한 17개 시·도만 조회합니다.
export const WEATHER_REGIONS = [
  { id: 'seoul', lat: 37.5665, lon: 126.978 },
  { id: 'busan', lat: 35.1796, lon: 129.0756 },
  { id: 'daegu', lat: 35.8714, lon: 128.6014 },
  { id: 'incheon', lat: 37.4563, lon: 126.7052 },
  { id: 'gwangju', lat: 35.1595, lon: 126.8526 },
  { id: 'daejeon', lat: 36.3504, lon: 127.3845 },
  { id: 'ulsan', lat: 35.5384, lon: 129.3114 },
  { id: 'sejong', lat: 36.48, lon: 127.289 },
  { id: 'gyeonggi', lat: 37.2636, lon: 127.0286 },
  { id: 'gangwon', lat: 37.8813, lon: 127.7298 },
  { id: 'chungbuk', lat: 36.6424, lon: 127.489 },
  { id: 'chungnam', lat: 36.6013, lon: 126.6608 },
  { id: 'jeonbuk', lat: 35.8242, lon: 127.148 },
  { id: 'jeonnam', lat: 34.9904, lon: 126.4817 },
  { id: 'gyeongbuk', lat: 36.5684, lon: 128.7294 },
  { id: 'gyeongnam', lat: 35.228, lon: 128.6811 },
  { id: 'jeju', lat: 33.4996, lon: 126.5312 },
]

let cachedWeatherPayload = null
let cacheExpiresAt = 0

const getWeatherPresentation = (conditionId) => {
  if (conditionId >= 200 && conditionId < 600) return { status: '비', emoji: '🌧️' }
  if (conditionId >= 600 && conditionId < 700) return { status: '눈', emoji: '🌨️' }
  if (conditionId >= 700 && conditionId < 800) return { status: '안개', emoji: '🌫️' }
  if (conditionId === 800) return { status: '맑음', emoji: '☀️' }
  if (conditionId > 800) return { status: '구름', emoji: conditionId <= 802 ? '⛅' : '☁️' }
  return { status: '날씨 정보', emoji: '🌤️' }
}

const toSafeWeatherData = (regionId, payload) => {
  const condition = payload.weather?.[0] ?? {}
  const presentation = getWeatherPresentation(Number(condition.id))

  return {
    id: regionId,
    temp: Math.round(Number(payload.main.temp)),
    feelsLike: Math.round(Number(payload.main.feels_like)),
    high: Math.round(Number(payload.main.temp_max)),
    low: Math.round(Number(payload.main.temp_min)),
    humidity: Math.round(Number(payload.main.humidity)),
    wind: Number(Number(payload.wind?.speed ?? 0).toFixed(1)),
    clouds: Math.round(Number(payload.clouds?.all ?? 0)),
    rainLastHour: Number(Number(payload.rain?.['1h'] ?? payload.snow?.['1h'] ?? 0).toFixed(1)),
    observedAt: new Date(Number(payload.dt) * 1_000).toISOString(),
    description: String(condition.description ?? presentation.status).slice(0, 40),
    ...presentation,
  }
}

const fetchRegionWeather = async (region, apiKey) => {
  const requestUrl = new URL(OPEN_WEATHER_ENDPOINT)
  requestUrl.searchParams.set('lat', String(region.lat))
  requestUrl.searchParams.set('lon', String(region.lon))
  requestUrl.searchParams.set('units', 'metric')
  requestUrl.searchParams.set('lang', 'kr')
  requestUrl.searchParams.set('appid', apiKey)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(requestUrl, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    if (!response.ok) {
      const error = new Error(`OpenWeather request failed: ${response.status}`)
      error.code = response.status === 401 ? 'WEATHER_API_UNAUTHORIZED' : 'WEATHER_UPSTREAM_FAILED'
      throw error
    }

    const payload = await response.json()
    if (!payload?.main || !Array.isArray(payload.weather)) {
      throw new Error('OpenWeather response shape is invalid')
    }
    return toSafeWeatherData(region.id, payload)
  } finally {
    clearTimeout(timeoutId)
  }
}

export const fetchAllRegionWeather = async (apiKey, { forceRefresh = false } = {}) => {
  if (!apiKey) {
    const error = new Error('Weather API key is not configured')
    error.code = 'WEATHER_API_KEY_MISSING'
    throw error
  }

  const now = Date.now()
  if (!forceRefresh && cachedWeatherPayload && now < cacheExpiresAt) {
    return { ...cachedWeatherPayload, cached: true }
  }

  const results = await Promise.allSettled(WEATHER_REGIONS.map((region) => fetchRegionWeather(region, apiKey)))
  const data = results.filter((result) => result.status === 'fulfilled').map((result) => result.value)
  const failedRegionIds = results.flatMap((result, index) => (result.status === 'rejected' ? [WEATHER_REGIONS[index].id] : []))

  if (data.length === 0) {
    const error = new Error('All OpenWeather requests failed')
    error.code = results.some((result) => result.status === 'rejected' && result.reason?.code === 'WEATHER_API_UNAUTHORIZED') ? 'WEATHER_API_UNAUTHORIZED' : 'WEATHER_UPSTREAM_FAILED'
    throw error
  }

  cachedWeatherPayload = {
    data,
    failedRegionIds,
    fetchedAt: new Date().toISOString(),
  }
  cacheExpiresAt = now + SERVER_CACHE_MS

  return { ...cachedWeatherPayload, cached: false }
}
