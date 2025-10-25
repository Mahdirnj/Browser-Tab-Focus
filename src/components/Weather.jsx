import { useEffect, useMemo, useState } from 'react'

const CITY_KEY = 'focus_dashboard_city'
const WEATHER_CACHE_KEY = 'focus_dashboard_weatherCache'
const CACHE_TTL = 30 * 60 * 1000

function readStoredCity() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(CITY_KEY) ?? ''
}

function readCachedWeather(city) {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(WEATHER_CACHE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed?.data) return null
    const isFresh = Date.now() - parsed.timestamp < CACHE_TTL
    const sameCity =
      parsed.data.city &&
      parsed.data.city.toLowerCase() === city?.toLowerCase()

    if (isFresh && sameCity) {
      return parsed.data
    }
  } catch (error) {
    console.warn('Unable to parse cached weather', error)
  }
  return null
}

const PANEL_CLASSES =
  'w-full rounded-[28px] border border-white/15 bg-white/[0.13] px-6 py-7 shadow-[0_45px_80px_-45px_rgba(11,20,45,0.85)] backdrop-blur-2xl transition duration-500 hover:border-white/25'

export function Weather() {
  const apiKey = useMemo(
    () => import.meta.env.VITE_OPENWEATHER_API_KEY?.trim() ?? '',
    [],
  )
  const initialCity = useMemo(() => readStoredCity(), [])

  const [city, setCity] = useState(initialCity)
  const [isEditing, setIsEditing] = useState(() => !initialCity)
  const [inputValue, setInputValue] = useState(initialCity)
  const [weather, setWeather] = useState(() => readCachedWeather(initialCity))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!city) {
      window.localStorage.removeItem(CITY_KEY)
      return
    }
    window.localStorage.setItem(CITY_KEY, city)
  }, [city])

  useEffect(() => {
    setInputValue(city)
  }, [city])

  useEffect(() => {
    if (!city || !apiKey) return

    const cached = readCachedWeather(city)
    if (cached) {
      setWeather(cached)
      return
    }

    fetchWeather(city)
  }, [city, apiKey])

  const fetchWeather = async (targetCity) => {
    const nextCity = targetCity ?? city
    if (!nextCity || !apiKey) return
    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(nextCity)}&units=metric&appid=${apiKey}`,
      )

      if (!response.ok) {
        throw new Error('Unable to fetch weather for that city.')
      }

      const payload = await response.json()
      const result = {
        city: payload.name,
        temp: Math.round(payload.main?.temp ?? 0),
        description: payload.weather?.[0]?.description ?? '',
      }

      setWeather(result)
      window.localStorage.setItem(
        WEATHER_CACHE_KEY,
        JSON.stringify({
          timestamp: Date.now(),
          data: result,
        }),
      )
    } catch (err) {
      console.error(err)
      setError(
        err instanceof Error ? err.message : 'Something went wrong fetching the weather.',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCitySubmit = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    if (trimmed.toLowerCase() !== city?.toLowerCase()) {
      window.localStorage.removeItem(WEATHER_CACHE_KEY)
    }
    setCity(trimmed)
    setInputValue(trimmed)
    setIsEditing(false)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleCitySubmit()
    }
    if (event.key === 'Escape') {
      setInputValue(city)
      setIsEditing(false)
    }
  }

  const handleRefresh = () => {
    window.localStorage.removeItem(WEATHER_CACHE_KEY)
    fetchWeather(city)
  }

  const formattedDescription = weather?.description
    ? weather.description
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : ''

  return (
    <section className={PANEL_CLASSES}>
      <div className="flex items-center justify-between">
        <h2 className="text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-white/70">
          Weather
        </h2>
        {!isEditing && city && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className="rounded-full border border-white/20 bg-white/[0.08] px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-white/65 transition hover:border-white/35 hover:text-white"
              disabled={loading}
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-full border border-white/20 bg-white/[0.08] px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-white/65 transition hover:border-white/35 hover:text-white"
            >
              City
            </button>
          </div>
        )}
      </div>

      {!apiKey ? (
        <p className="mt-5 rounded-2xl border border-white/20 bg-white/[0.08] px-5 py-4 text-sm text-white/70">
          Missing OpenWeather API key. Update your `.env` file to enable weather data.
        </p>
      ) : isEditing ? (
        <div className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="weather-city"
              className="text-[0.65rem] uppercase tracking-[0.4em] text-white/50"
            >
              Choose City
            </label>
            <input
              id="weather-city"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. San Francisco"
              className="mt-3 w-full rounded-2xl border border-white/20 bg-white/[0.08] px-4 py-3 text-sm text-white/90 placeholder:text-white/45 focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-300/60"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCitySubmit}
              className="rounded-full bg-sky-400/90 px-4 py-2 text-sm font-medium text-white shadow-[0_15px_35px_-20px_rgba(56,189,248,0.9)] transition hover:bg-sky-300"
            >
              Save
            </button>
            {city && (
              <button
                type="button"
                onClick={() => {
                  setInputValue(city)
                  setIsEditing(false)
                }}
                className="rounded-full border border-white/20 bg-white/[0.08] px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white/35 hover:text-white"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : !city ? (
        <div className="mt-5 rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-6 text-sm text-white/70">
          <p>Set your city to get personalised weather updates.</p>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="mt-4 rounded-full bg-sky-400/90 px-4 py-2 text-sm font-medium text-white shadow-[0_15px_35px_-20px_rgba(56,189,248,0.9)] transition hover:bg-sky-300"
          >
            Choose City
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-4 text-white">
          {loading ? (
            <p className="text-sm text-white/70">Fetching latest weather...</p>
          ) : weather ? (
            <>
              <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/[0.08] px-6 py-6">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sky-400/30 blur-3xl" />
                <p className="text-5xl font-semibold tracking-tight text-white">
                  {weather.temp}
                  <span className="ml-1 text-lg font-light text-white/70">
                    {'\u00B0'}C
                  </span>
                </p>
                <p className="mt-2 text-sm uppercase tracking-[0.35em] text-white/60">
                  {formattedDescription}
                </p>
                <p className="mt-6 text-sm font-medium uppercase tracking-[0.3em] text-white/45">
                  {weather.city}
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-white/70">
              No weather data yet. Refresh to fetch the latest details.
            </p>
          )}
          {error && (
            <p className="rounded-2xl border border-rose-400/40 bg-rose-500/20 px-4 py-3 text-sm text-rose-100">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  )
}

export default Weather
