import process from 'node:process'

import { fetchAllRegionWeather } from '../server/weatherService.js'

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

  const requestUrl = new URL(request.url ?? '/api/weather', 'https://local.invalid')
  if (requestUrl.search) {
    response.setHeader('Cache-Control', 'no-store')
    sendJson(response, 400, { error: 'QUERY_NOT_ALLOWED' })
    return
  }

  try {
    const payload = await fetchAllRegionWeather(process.env.WEATHER_API_KEY)
    response.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800')
    sendJson(response, 200, payload)
  } catch (error) {
    response.setHeader('Cache-Control', 'no-store')
    const isMissingKey = error.code === 'WEATHER_API_KEY_MISSING'
    const isUnauthorized = error.code === 'WEATHER_API_UNAUTHORIZED'
    sendJson(response, isMissingKey || isUnauthorized ? 503 : 502, {
      error: isMissingKey ? 'WEATHER_API_NOT_CONFIGURED' : isUnauthorized ? 'WEATHER_API_UNAUTHORIZED' : 'WEATHER_API_UNAVAILABLE',
    })
  }
}
