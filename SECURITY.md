# Security notes

## Secrets

- Store the OpenWeather key only as `WEATHER_API_KEY` in a local `.env` file or a Vercel server environment variable.
- Never use a `VITE_` prefix for this key. Vite variables with that prefix are intended for client-side code.
- Do not log the key, the upstream request URL, or raw provider error responses.
- Mark `WEATHER_API_KEY` as Sensitive in Vercel and rotate it immediately if it is ever committed, pasted into an issue, or exposed in a browser bundle.

## Weather endpoint

- The browser calls only the same-origin `/api/weather` endpoint.
- The proxy accepts `GET` without query parameters and uses a fixed allowlist of 17 regions.
- Responses contain only the weather fields needed by the UI.
- Server and CDN caching reduce OpenWeather quota usage; stale public weather data may be used briefly when the provider is unavailable.
- Configure a Vercel Firewall rate-limit rule for `/api/weather` before public traffic grows. Start conservatively, observe legitimate traffic, and then tune the rule.

## Deployment checklist

1. Add `WEATHER_API_KEY` separately to Development, Preview, and Production as needed.
2. Mark the variable as Sensitive and redeploy after every change or rotation.
3. Confirm the production response has the security headers declared in `vercel.json`.
4. Enable Vercel Bot Protection or a WAF rate-limit rule if automated traffic reaches the API route.
5. Run a secret scan before pushing and revoke any key previously committed to Git history.
