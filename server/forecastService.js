import { WEATHER_REGIONS } from './weatherService.js'

const OPEN_WEATHER_FORECAST_ENDPOINT = 'https://api.openweathermap.org/data/2.5/forecast'
const REQUEST_TIMEOUT_MS = 7_000
const SERVER_CACHE_MS = 10 * 60 * 1_000

const forecastCache = new Map()

const getWeatherPresentation = (conditionId) => {
  if (conditionId >= 200 && conditionId < 600) return { status: '비', emoji: '🌧️' }
  if (conditionId >= 600 && conditionId < 700) return { status: '눈', emoji: '🌨️' }
  if (conditionId >= 700 && conditionId < 800) return { status: '안개', emoji: '🌫️' }
  if (conditionId === 800) return { status: '맑음', emoji: '☀️' }
  if (conditionId > 800) return { status: '구름', emoji: conditionId <= 802 ? '⛅' : '☁️' }
  return { status: '날씨 정보', emoji: '🌤️' }
}

const getLocalDateKey = (unixSeconds, timezoneOffset) => {
  const localDate = new Date((Number(unixSeconds) + Number(timezoneOffset || 0)) * 1_000)
  return localDate.toISOString().slice(0, 10)
}

const normalizeForecast = (payload) => {
  const timezoneOffset = Number(payload.city?.timezone ?? 0)
  const dailyGroups = new Map()

  for (const item of payload.list ?? []) {
    if (!item?.main || !Array.isArray(item.weather)) continue
    const date = getLocalDateKey(item.dt, timezoneOffset)
    const group = dailyGroups.get(date) ?? []
    group.push(item)
    dailyGroups.set(date, group)
  }

  return [...dailyGroups.entries()].slice(0, 5).map(([date, entries]) => {
    const representative = entries.reduce((closest, entry) => {
      const localHour = new Date((Number(entry.dt) + timezoneOffset) * 1_000).getUTCHours()
      const closestHour = new Date((Number(closest.dt) + timezoneOffset) * 1_000).getUTCHours()
      return Math.abs(localHour - 12) < Math.abs(closestHour - 12) ? entry : closest
    })
    const condition = representative.weather[0] ?? {}

    return {
      date,
      min: Math.round(Math.min(...entries.map((entry) => Number(entry.main.temp_min)))),
      max: Math.round(Math.max(...entries.map((entry) => Number(entry.main.temp_max)))),
      humidity: Math.round(entries.reduce((sum, entry) => sum + Number(entry.main.humidity), 0) / entries.length),
      rainChance: Math.round(Math.max(...entries.map((entry) => Number(entry.pop ?? 0))) * 100),
      description: String(condition.description ?? '').slice(0, 40),
      ...getWeatherPresentation(Number(condition.id)),
    }
  })
}

export const fetchRegionForecast = async (regionId, apiKey) => {
  if (!apiKey) {
    const error = new Error('Weather API key is not configured')
    error.code = 'WEATHER_API_KEY_MISSING'
    throw error
  }

  const region = WEATHER_REGIONS.find((item) => item.id === regionId)
  if (!region) {
    const error = new Error('Unknown weather region')
    error.code = 'WEATHER_REGION_INVALID'
    throw error
  }

  const cached = forecastCache.get(regionId)
  if (cached && Date.now() < cached.expiresAt) return { ...cached.payload, cached: true }

  const requestUrl = new URL(OPEN_WEATHER_FORECAST_ENDPOINT)
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
      const error = new Error(`OpenWeather forecast request failed: ${response.status}`)
      error.code = response.status === 401 ? 'WEATHER_API_UNAUTHORIZED' : 'WEATHER_UPSTREAM_FAILED'
      throw error
    }

    const upstreamPayload = await response.json()
    const forecast = normalizeForecast(upstreamPayload)
    if (!forecast.length) throw new Error('OpenWeather forecast response shape is invalid')

    const payload = {
      regionId: region.id,
      regionName: region.name,
      forecast,
      fetchedAt: new Date().toISOString(),
      cached: false,
    }
    forecastCache.set(regionId, { payload, expiresAt: Date.now() + SERVER_CACHE_MS })
    return payload
  } finally {
    clearTimeout(timeoutId)
  }
}
