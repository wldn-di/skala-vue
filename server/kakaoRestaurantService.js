import { Buffer } from 'node:buffer'

import { WEATHER_REGIONS } from './weatherService.js'

const KAKAO_LOCAL_ENDPOINT = 'https://dapi.kakao.com/v2/local/search/keyword.json'
const KAKAO_STATIC_MAP_ENDPOINT = 'https://dapi.kakao.com/v2/maps/staticmap'
const REQUEST_TIMEOUT_MS = 7_000
const SERVER_CACHE_MS = 10 * 60 * 1_000
const DISTRICT_PATTERN = /^[0-9A-Za-z가-힣·\s-]{1,30}$/u

const restaurantCache = new Map()

export const isValidDistrictName = (district) => DISTRICT_PATTERN.test(district)

export const isValidKoreaCoordinate = (x, y) => {
  const longitude = Number(x)
  const latitude = Number(y)
  return Number.isFinite(longitude) && Number.isFinite(latitude) && longitude >= 124 && longitude <= 132 && latitude >= 32 && latitude <= 39
}

const getKakaoErrorCode = (response, errorPayload) => {
  const isMapServiceDisabled = response.status === 403 && String(errorPayload.message ?? '').includes('disabled OPEN_MAP_AND_LOCAL service')
  if (isMapServiceDisabled) return 'KAKAO_MAP_SERVICE_DISABLED'
  if (response.status === 401 || response.status === 403) return 'KAKAO_API_UNAUTHORIZED'
  return 'KAKAO_UPSTREAM_FAILED'
}

const getSafePlaceUrl = (value) => {
  try {
    const placeUrl = new URL(String(value))
    if (placeUrl.hostname !== 'place.map.kakao.com') return ''
    placeUrl.protocol = 'https:'
    return placeUrl.href
  } catch {
    return ''
  }
}

export const searchKakaoRestaurants = async ({ regionId, district, apiKey }) => {
  if (!apiKey) {
    const error = new Error('Kakao REST API key is not configured')
    error.code = 'KAKAO_API_KEY_MISSING'
    throw error
  }

  const region = WEATHER_REGIONS.find((item) => item.id === regionId)
  if (!region || !isValidDistrictName(district)) {
    const error = new Error('Restaurant search parameters are invalid')
    error.code = 'KAKAO_QUERY_INVALID'
    throw error
  }

  const cacheKey = `${regionId}:${district}`
  const cached = restaurantCache.get(cacheKey)
  if (cached && Date.now() < cached.expiresAt) return { ...cached.payload, cached: true }

  const requestUrl = new URL(KAKAO_LOCAL_ENDPOINT)
  requestUrl.searchParams.set('query', `${region.name} ${district} 맛집`)
  requestUrl.searchParams.set('category_group_code', 'FD6')
  requestUrl.searchParams.set('size', '2')
  requestUrl.searchParams.set('sort', 'accuracy')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(requestUrl, {
      headers: {
        Accept: 'application/json',
        Authorization: `KakaoAK ${apiKey}`,
      },
      signal: controller.signal,
    })
    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}))
      const error = new Error(`Kakao Local request failed: ${response.status}`)
      error.code = getKakaoErrorCode(response, errorPayload)
      throw error
    }

    const upstreamPayload = await response.json()
    if (!Array.isArray(upstreamPayload.documents)) throw new Error('Kakao Local response shape is invalid')

    const payload = {
      regionId,
      district,
      restaurants: upstreamPayload.documents.map((place) => ({
        id: String(place.id),
        name: String(place.place_name ?? '').slice(0, 80),
        category: String(place.category_name ?? '').slice(0, 120),
        address: String(place.road_address_name || place.address_name || '').slice(0, 160),
        phone: String(place.phone ?? '').slice(0, 30),
        placeUrl: getSafePlaceUrl(place.place_url),
        longitude: String(place.x ?? ''),
        latitude: String(place.y ?? ''),
        previewUrl: `/api/place-preview?x=${encodeURIComponent(place.x ?? '')}&y=${encodeURIComponent(place.y ?? '')}`,
      })),
      fetchedAt: new Date().toISOString(),
      cached: false,
    }
    restaurantCache.set(cacheKey, { payload, expiresAt: Date.now() + SERVER_CACHE_MS })
    return payload
  } finally {
    clearTimeout(timeoutId)
  }
}

export const fetchKakaoPlacePreview = async ({ x, y, apiKey }) => {
  if (!apiKey) {
    const error = new Error('Kakao REST API key is not configured')
    error.code = 'KAKAO_API_KEY_MISSING'
    throw error
  }
  if (!isValidKoreaCoordinate(x, y)) {
    const error = new Error('Static map coordinates are invalid')
    error.code = 'KAKAO_QUERY_INVALID'
    throw error
  }

  const longitude = Number(x).toFixed(6)
  const latitude = Number(y).toFixed(6)
  const location = `${longitude},${latitude}`
  const requestUrl = new URL(KAKAO_STATIC_MAP_ENDPOINT)
  requestUrl.searchParams.set('center', location)
  requestUrl.searchParams.set('markers', `location:${location}|option:false`)
  requestUrl.searchParams.set('size', '480x180')
  requestUrl.searchParams.set('format', 'png')
  requestUrl.searchParams.set('scale', '1')
  requestUrl.searchParams.set('lv', '4')
  requestUrl.searchParams.set('logo_pos', 'BOTTOM_RIGHT')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(requestUrl, {
      headers: {
        Accept: 'image/png',
        Authorization: `KakaoAK ${apiKey}`,
      },
      signal: controller.signal,
    })
    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}))
      const error = new Error(`Kakao static map request failed: ${response.status}`)
      error.code = getKakaoErrorCode(response, errorPayload)
      throw error
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.startsWith('image/')) throw new Error('Kakao static map response is invalid')
    return {
      body: Buffer.from(await response.arrayBuffer()),
      contentType,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}
