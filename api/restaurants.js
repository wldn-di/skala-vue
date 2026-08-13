import process from 'node:process'

import { searchKakaoRestaurants } from '../server/kakaoRestaurantService.js'

const sendJson = (response, status, body) => {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
  response.setHeader('Referrer-Policy', 'no-referrer')
  response.end(JSON.stringify(body))
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    sendJson(response, 405, { error: 'METHOD_NOT_ALLOWED' })
    return
  }

  const requestUrl = new URL(request.url ?? '/api/restaurants', 'https://local.invalid')
  const regionId = requestUrl.searchParams.get('regionId') ?? ''
  const district = requestUrl.searchParams.get('district')?.trim() ?? ''
  const hasUnexpectedQuery = [...requestUrl.searchParams.keys()].some((key) => key !== 'regionId' && key !== 'district')
  if (!regionId || !district || hasUnexpectedQuery) {
    response.setHeader('Cache-Control', 'no-store')
    sendJson(response, 400, { error: 'QUERY_INVALID' })
    return
  }

  try {
    const payload = await searchKakaoRestaurants({
      regionId,
      district,
      apiKey: process.env.KAKAO_REST_API_KEY,
    })
    response.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800')
    sendJson(response, 200, payload)
  } catch (error) {
    response.setHeader('Cache-Control', 'no-store')
    if (error.code === 'KAKAO_QUERY_INVALID') {
      sendJson(response, 400, { error: 'KAKAO_QUERY_INVALID' })
      return
    }
    const isMapServiceDisabled = error.code === 'KAKAO_MAP_SERVICE_DISABLED'
    const isMissingKey = error.code === 'KAKAO_API_KEY_MISSING'
    const isUnauthorized = error.code === 'KAKAO_API_UNAUTHORIZED'
    sendJson(response, isMapServiceDisabled || isMissingKey || isUnauthorized ? 503 : 502, {
      error: isMapServiceDisabled ? 'KAKAO_MAP_SERVICE_DISABLED' : isMissingKey ? 'KAKAO_API_NOT_CONFIGURED' : isUnauthorized ? 'KAKAO_API_UNAUTHORIZED' : 'KAKAO_RESTAURANTS_UNAVAILABLE',
    })
  }
}
