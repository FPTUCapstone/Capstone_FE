# Public Weather Forecast (`/weather`) — FE Implementation & BE API Contract

This module implements the public Central Vietnam Weather Forecast page (`app/weather/page.tsx`) using TripMate's Coastal Heritage design system.

Built-in deterministic mock fixtures (`data/mockWeatherFixtures.ts`) are intentionally kept active by default so team members can review the exact data contract and switch to the live `Capstone_BE` Tomorrow.io endpoint without UI changes.

## Switching from Mock Data to Live BE API

1. Expose the backend endpoint in `Capstone_BE`:
   `GET /api/v1/weather/forecast?locationId={id}&lat={latitude}&lon={longitude}`
2. Set `NEXT_PUBLIC_WEATHER_API_ENABLED=true` in `.env.local` (or deployment environment).
3. `services/weatherForecastApi.ts` will automatically switch from `buildMockWeatherForecast(...)` to `GET {API_BASE}/weather/forecast?...` and validate the JSON response via `parseWeatherForecastResponse`.

## Expected Backend JSON Response (`WeatherForecastResponseDto`)

Field names and units mirror `Capstone_BE`'s existing Tomorrow.io integration (`HourlyForecast`, `TomorrowDayForecastProvider`, `WeatherTipsSummaryDto`, `WeatherAlertPolicy`):

```json
{
  "location": {
    "id": "danang",
    "name": "Đà Nẵng",
    "region": "Thành phố Đà Nẵng",
    "subtitle": "Trung tâm ven biển & Bãi biển Mỹ Khê",
    "latitude": 16.0544,
    "longitude": 108.2022,
    "elevationM": 12,
    "timeZoneId": "Asia/Ho_Chi_Minh"
  },
  "timeZoneId": "Asia/Ho_Chi_Minh",
  "fetchedAtUtc": "2026-11-25T09:00:00Z",
  "current": {
    "observedAtUtc": "2026-11-25T09:00:00Z",
    "temperatureC": 29.4,
    "apparentTemperatureC": 31.8,
    "rainProbabilityPercent": 35,
    "rainMmPerHour": 0.4,
    "uvIndex": 3,
    "windSpeedMps": 5.6,
    "thunderstorm": false,
    "weatherCode": 4000,
    "humidityPercent": 76,
    "visibilityKm": 14.5,
    "cloudCoverPercent": 68
  },
  "hourly": [
    {
      "startUtc": "2026-11-25T09:00:00Z",
      "temperatureC": 29.4,
      "apparentTemperatureC": 31.8,
      "rainProbabilityPercent": 35,
      "rainMmPerHour": 0.4,
      "uvIndex": 3,
      "windSpeedMps": 5.6,
      "thunderstorm": false,
      "weatherCode": 4000,
      "humidityPercent": 76,
      "cloudCoverPercent": 68,
      "visibilityKm": 14.5
    }
  ],
  "daily": [
    {
      "date": "2026-11-25",
      "minTempC": 23,
      "maxTempC": 31,
      "maxApparentTempC": 33,
      "maxRainProbabilityPercent": 35,
      "maxRainMmPerHour": 0.4,
      "totalRainMm": 1.2,
      "maxUvIndex": 8,
      "maxWindSpeedMps": 6.2,
      "thunderstorm": false,
      "weatherCode": 1101,
      "humidityAvgPercent": 74,
      "sunriseTime": "05:56",
      "sunsetTime": "17:18"
    }
  ]
}
```

## Notes for Backend Integration

- **Units**: Tomorrow.io `units=metric` (`°C`, `mm/h`, `m/s` for wind speed, `%` for probabilities/humidity/cloud cover, `km` for visibility).
- **Rain thresholds** (`utils/weatherFormat.ts`): aligned with `Capstone_BE` `WeatherAlertPolicy.cs` (`0.2` light, `2.5` moderate, `10` heavy, `50` extreme mm/h, `weatherCode === 8000` thunderstorm).
- **Supported location slugs** (`data/mockWeatherFixtures.ts`): `danang`, `hoian`, `hue`, `bana-hills`, `son-tra`.
- **Hourly window**: Up to 48 entries (`timesteps=1h`) so both `Hôm nay` and `Ngày mai` sync with the interactive hourly chart.
- **Daily window**: 5 daily entries (`timesteps=1d`) matching Tomorrow.io Free tier.
