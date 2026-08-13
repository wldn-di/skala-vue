import process from 'node:process'

import { fetchKakaoPlacePreview } from '../server/kakaoRestaurantService.js'

const sendJson = (response, status, body) => {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.end(JSON.stringify(body))
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    sendJson(response, 405, { error: 'METHOD_NOT_ALLOWED' })
    return
  }

  const requestUrl = new URL(request.url ?? '/api/place-preview', 'https://local.invalid')
  const x = requestUrl.searchParams.get('x') ?? ''
  const y = requestUrl.searchParams.get('y') ?? ''
  const hasUnexpectedQuery = [...requestUrl.searchParams.keys()].some((key) => key !== 'x' && key !== 'y')
  if (!x || !y || hasUnexpectedQuery) {
    sendJson(response, 400, { error: 'QUERY_INVALID' })
    return
  }

  try {
    const preview = await fetchKakaoPlacePreview({ x, y, apiKey: process.env.KAKAO_REST_API_KEY })
    response.statusCode = 200
    response.setHeader('Content-Type', preview.contentType)
    response.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800')
    response.setHeader('X-Content-Type-Options', 'nosniff')
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
    response.end(preview.body)
  } catch (error) {
    if (error.code === 'KAKAO_QUERY_INVALID') {
      sendJson(response, 400, { error: 'KAKAO_QUERY_INVALID' })
      return
    }
    const isMapServiceDisabled = error.code === 'KAKAO_MAP_SERVICE_DISABLED'
    const isMissingKey = error.code === 'KAKAO_API_KEY_MISSING'
    const isUnauthorized = error.code === 'KAKAO_API_UNAUTHORIZED'
    sendJson(response, isMapServiceDisabled || isMissingKey || isUnauthorized ? 503 : 502, {
      error: isMapServiceDisabled ? 'KAKAO_MAP_SERVICE_DISABLED' : isMissingKey ? 'KAKAO_API_NOT_CONFIGURED' : isUnauthorized ? 'KAKAO_API_UNAUTHORIZED' : 'KAKAO_PLACE_PREVIEW_UNAVAILABLE',
    })
  }
}
