# Public Weather Forecast (`/weather`) — FE Implementation & BE API Contract

This module implements the public nationwide Vietnam Weather Forecast page (`app/weather/page.tsx`) using TripMate's Coastal Heritage design system.

## Live Backend API Contract

- Endpoint (anonymous, public):
  `GET {API_BASE}/weather/forecast?lat={number}&lon={number}`
- Coordinates must fall inside the Vietnam bounding box (`lat` 6–24, `lon` 102–118). Out-of-bounds coordinates are rejected client-side before sending a request and return `400` on the backend.
- Backend rounds coordinates to 2 decimal places (~1.1 km) and caches responses for 30 minutes.
- Rate limit: `429` (> 30 req/min/IP); upstream/quota outage: `503`. Both render `WeatherErrorState` with a retry action (no mock fallback).

## Expected Backend JSON Response (`WeatherForecastResponseDto`)

```json
{
  "source": "api",
  "provider": "Tomorrow.io",
  "location": {
    "latitude": 16.05,
    "longitude": 108.2,
    "timeZoneId": "Asia/Ho_Chi_Minh"
  },
  "timeZoneId": "Asia/Ho_Chi_Minh",
  "fetchedAtUtc": "2026-11-26T06:05:51.57Z",
  "current": {
    "observedAtUtc": "2026-11-26T06:00:00Z",
    "temperatureC": 25.07,
    "apparentTemperatureC": 25.1,
    "rainProbabilityPercent": 35,
    "rainMmPerHour": 0.07,
    "uvIndex": 1,
    "windSpeedMps": 2.9,
    "thunderstorm": false,
    "weatherCode": 1001,
    "humidityPercent": 77,
    "visibilityKm": 16,
    "cloudCoverPercent": 100
  },
  "hourly": [],
  "daily": []
}
```

## Notes

- **Display names**: Backend returns coordinates and time zone only; FE supplies location display names from quick-suggestion chips (`data/suggestedLocations.ts`), Mapbox Search Box (`src/features/scheduling/services/placeSearchApi.ts`), shareable URL parameters (`?lat=&lon=&name=`), or browser geolocation.
- **Mapbox search**: Enabled when `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` (public `pk.*` token) is set; hidden cleanly otherwise while keeping quick-suggestion chips usable. Suggestions show name and address only and never trigger per-suggestion weather API calls.
- **Sparse points**: Backend drops incomplete hourly/daily points rather than filling fake defaults, so `hourly` may contain fewer than 24 items and `daily` may contain fewer than 5 items.
- **Upcoming Traveler trips**: When a signed-in `Traveler` visits `/weather`, FE additionally queries `GET {API_BASE}/traveler/upcoming-trip-weather` with `Authorization: Bearer <accessToken>` to show open UC-66 tour warning banners and up to 3 confirmed upcoming trip weather cards above the public forecast. Guests, other roles, empty lists, or any non-2xx/network failure render nothing and never block the public forecast.
