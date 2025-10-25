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
  'flex h-48 w-48 flex-col overflow-hidden rounded-3xl border border-white/15 bg-white/[0.08] p-4 text-white shadow-[0_30px_60px_-40px_rgba(15,23,42,0.85)] backdrop-blur-md transition duration-300 hover:border-white/25'

const WEATHER_VARIANTS = {
  clear: {
    gradient: 'from-amber-200/25 via-sky-200/12 to-transparent',
    glow: 'bg-amber-200/20',
    glyph: 'sun',
    glyphClass: 'text-amber-100',
    tempColor: 'text-white',
    descriptionColor: 'text-white/80',
    degreeColor: 'text-white/70',
    particles: [
      {
        className:
          'absolute -left-4 top-6 h-16 w-16 rounded-full bg-amber-200/25 blur-3xl animate-pulse',
        style: { animationDuration: '8s' },
      },
      {
        className:
          'absolute right-4 bottom-6 h-3 w-3 rounded-full bg-white/60 animate-ping',
        style: { animationDuration: '6s' },
      },
    ],
  },
  'clear-night': {
    gradient: 'from-indigo-900/35 via-slate-900/28 to-slate-800/18',
    glow: 'bg-sky-500/18',
    glyph: 'moon',
    glyphClass: 'text-sky-200',
    tempColor: 'text-sky-50',
    descriptionColor: 'text-sky-200/80',
    degreeColor: 'text-sky-200/70',
    particles: [
      {
        className:
          'absolute left-6 top-4 h-1.5 w-1.5 rounded-full bg-white/70',
        style: {
          animation: 'weatherTwinkle 4.5s ease-in-out infinite',
          animationDelay: '1s',
        },
      },
      {
        className:
          'absolute right-5 top-9 h-1 w-1 rounded-full bg-white/45',
        style: {
          animation: 'weatherTwinkle 5.5s ease-in-out infinite',
        },
      },
      {
        className:
          'absolute left-8 bottom-7 h-1 w-1 rounded-full bg-white/40',
        style: {
          animation: 'weatherTwinkle 6s ease-in-out infinite',
          animationDelay: '2.2s',
        },
      },
    ],
  },
  clouds: {
    gradient: 'from-slate-200/25 via-slate-400/18 to-slate-700/18',
    glow: 'bg-slate-300/18',
    glyph: 'cloud',
    glyphClass: 'text-slate-100',
    tempColor: 'text-white',
    descriptionColor: 'text-white/80',
    degreeColor: 'text-white/70',
    particles: [
      {
        className:
          'absolute -left-6 top-10 h-14 w-24 rounded-full bg-white/14 blur-2xl',
        style: { animationDuration: '12s' },
      },
      {
        className:
          'absolute right-0 top-4 h-16 w-24 rounded-full bg-white/12 blur-xl',
        style: { animationDuration: '10s' },
      },
    ],
  },
  'clouds-night': {
    gradient: 'from-slate-800/32 via-slate-700/24 to-slate-900/24',
    glow: 'bg-slate-600/18',
    glyph: 'cloud',
    glyphClass: 'text-slate-200',
    tempColor: 'text-slate-50',
    descriptionColor: 'text-slate-200/75',
    degreeColor: 'text-slate-200/70',
    particles: [
      {
        className:
          'absolute left-0 top-12 h-14 w-24 rounded-full bg-slate-300/16 blur-3xl',
        style: { animationDuration: '13s' },
      },
      {
        className:
          'absolute right-2 top-5 h-14 w-20 rounded-full bg-slate-400/14 blur-2xl',
        style: { animationDuration: '11s' },
      },
    ],
  },
  rain: {
    gradient: 'from-sky-400/25 via-slate-600/22 to-slate-900/28',
    glow: 'bg-sky-500/18',
    glyph: 'rain',
    glyphClass: 'text-sky-200',
    tempColor: 'text-white',
    descriptionColor: 'text-white/80',
    degreeColor: 'text-white/70',
    particles: [
      {
        className:
          'absolute left-6 top-2 h-12 w-1 rounded-full bg-sky-200/45 opacity-80',
        style: {
          animation: 'weatherDrop 1.6s linear infinite',
          animationDelay: '0s',
        },
      },
      {
        className:
          'absolute right-8 top-4 h-10 w-1 rounded-full bg-sky-300/40 opacity-70',
        style: {
          animation: 'weatherDrop 1.8s linear infinite',
          animationDelay: '0.4s',
        },
      },
      {
        className:
          'absolute left-10 top-6 h-9 w-1 rounded-full bg-sky-200/38 opacity-70',
        style: {
          animation: 'weatherDrop 1.9s linear infinite',
          animationDelay: '0.7s',
        },
      },
    ],
  },
  'rain-night': {
    gradient: 'from-slate-800/34 via-slate-900/30 to-black/24',
    glow: 'bg-sky-500/15',
    glyph: 'rain',
    glyphClass: 'text-sky-200',
    tempColor: 'text-sky-50',
    descriptionColor: 'text-sky-200/75',
    degreeColor: 'text-sky-200/70',
    particles: [
      {
        className:
          'absolute left-4 top-1 h-12 w-1 rounded-full bg-sky-200/38 opacity-75',
        style: {
          animation: 'weatherDrop 1.7s linear infinite',
          animationDelay: '0.15s',
        },
      },
      {
        className:
          'absolute right-7 top-5 h-10 w-1 rounded-full bg-sky-300/34 opacity-70',
        style: {
          animation: 'weatherDrop 1.8s linear infinite',
          animationDelay: '0.55s',
        },
      },
      {
        className:
          'absolute left-9 top-7 h-9 w-1 rounded-full bg-sky-200/32 opacity-70',
        style: {
          animation: 'weatherDrop 2s linear infinite',
          animationDelay: '0.9s',
        },
      },
    ],
  },
  storm: {
    gradient: 'from-indigo-900/32 via-slate-900/28 to-black/22',
    glow: 'bg-yellow-300/15',
    glyph: 'storm',
    glyphClass: 'text-amber-200',
    tempColor: 'text-white',
    descriptionColor: 'text-amber-100/80',
    degreeColor: 'text-amber-100/70',
    particles: [
      {
        className:
          'absolute left-2 top-4 h-16 w-16 rounded-full bg-slate-800/30 blur-2xl',
        style: { animationDuration: '10s' },
      },
      {
        className:
          'absolute right-2 top-10 h-20 w-20 rounded-full bg-slate-700/28 blur-2xl',
        style: { animationDuration: '12s' },
      },
      {
        className:
          'absolute right-8 top-5 h-10 w-1 rounded-full bg-amber-200/40 opacity-80',
        style: { animation: 'weatherDrop 1.4s linear infinite' },
      },
    ],
  },
  snow: {
    gradient: 'from-sky-100/28 via-slate-200/24 to-slate-500/18',
    glow: 'bg-blue-100/22',
    glyph: 'snow',
    glyphClass: 'text-sky-100',
    tempColor: 'text-white',
    descriptionColor: 'text-white/85',
    degreeColor: 'text-white/75',
    particles: [
      {
        className:
          'absolute left-6 top-3 h-2.5 w-2.5 rounded-full bg-white/60',
        style: { animation: 'weatherSnow 5.5s linear infinite' },
      },
      {
        className:
          'absolute right-8 top-4 h-2 w-2 rounded-full bg-white/50',
        style: {
          animation: 'weatherSnow 6s linear infinite',
          animationDelay: '1s',
        },
      },
      {
        className:
          'absolute left-10 top-6 h-2 w-2 rounded-full bg-white/52',
        style: {
          animation: 'weatherSnow 6.5s linear infinite',
          animationDelay: '2s',
        },
      },
    ],
  },
  'snow-night': {
    gradient: 'from-blue-900/35 via-slate-800/26 to-slate-900/22',
    glow: 'bg-blue-500/18',
    glyph: 'snow',
    glyphClass: 'text-sky-100',
    tempColor: 'text-sky-50',
    descriptionColor: 'text-sky-100/80',
    degreeColor: 'text-sky-100/70',
    particles: [
      {
        className:
          'absolute left-7 top-2 h-2.5 w-2.5 rounded-full bg-white/55',
        style: { animation: 'weatherSnow 6.2s linear infinite' },
      },
      {
        className:
          'absolute right-6 top-5 h-2 w-2 rounded-full bg-white/48',
        style: {
          animation: 'weatherSnow 6.8s linear infinite',
          animationDelay: '1.3s',
        },
      },
      {
        className:
          'absolute left-9 top-8 h-2 w-2 rounded-full bg-white/45',
        style: {
          animation: 'weatherSnow 7s linear infinite',
          animationDelay: '2.4s',
        },
      },
    ],
  },
  fog: {
    gradient: 'from-slate-200/20 via-slate-400/16 to-slate-600/18',
    glow: 'bg-slate-200/18',
    glyph: 'fog',
    glyphClass: 'text-slate-50',
    tempColor: 'text-white',
    descriptionColor: 'text-white/70',
    degreeColor: 'text-white/65',
    particles: [
      {
        className:
          'absolute left-1 top-8 h-3 w-36 rounded-full bg-white/10',
        style: { animationDuration: '8s' },
      },
      {
        className:
          'absolute left-2 top-16 h-3 w-32 rounded-full bg-white/8',
        style: { animationDuration: '9s' },
      },
    ],
  },
  'fog-night': {
    gradient: 'from-slate-800/32 via-slate-700/24 to-slate-900/20',
    glow: 'bg-slate-600/18',
    glyph: 'fog',
    glyphClass: 'text-slate-200',
    tempColor: 'text-slate-50',
    descriptionColor: 'text-slate-200/70',
    degreeColor: 'text-slate-200/65',
    particles: [
      {
        className:
          'absolute left-0 top-10 h-3 w-36 rounded-full bg-white/8',
        style: { animationDuration: '9s' },
      },
      {
        className:
          'absolute left-1 top-17 h-3 w-32 rounded-full bg-white/7',
        style: { animationDuration: '10s' },
      },
    ],
  },
  wind: {
    gradient: 'from-emerald-200/22 via-sky-200/16 to-slate-600/18',
    glow: 'bg-emerald-200/16',
    glyph: 'wind',
    glyphClass: 'text-emerald-100',
    tempColor: 'text-white',
    descriptionColor: 'text-white/75',
    degreeColor: 'text-white/70',
    particles: [
      {
        className:
          'absolute left-2 top-12 h-1 w-32 rounded-full bg-white/12',
        style: {
          animation: 'weatherDrift 4.5s ease-in-out infinite',
        },
      },
      {
        className:
          'absolute left-0 top-8 h-1 w-28 rounded-full bg-white/10',
        style: {
          animation: 'weatherDrift 5.5s ease-in-out infinite',
          animationDelay: '1s',
        },
      },
    ],
  },
  'wind-night': {
    gradient: 'from-slate-900/32 via-slate-800/24 to-slate-900/22',
    glow: 'bg-sky-500/18',
    glyph: 'wind',
    glyphClass: 'text-sky-200',
    tempColor: 'text-sky-50',
    descriptionColor: 'text-sky-100/75',
    degreeColor: 'text-sky-100/70',
    particles: [
      {
        className:
          'absolute left-1 top-12 h-1 w-32 rounded-full bg-white/10',
        style: {
          animation: 'weatherDrift 5s ease-in-out infinite',
        },
      },
      {
        className:
          'absolute left-0 top-7 h-1 w-30 rounded-full bg-white/8',
        style: {
          animation: 'weatherDrift 6s ease-in-out infinite',
          animationDelay: '1.2s',
        },
      },
    ],
  },
  default: {
    gradient: 'from-sky-200/20 via-slate-200/16 to-transparent',
    glow: 'bg-sky-200/16',
    glyph: 'compass',
    glyphClass: 'text-white/85',
    tempColor: 'text-white',
    descriptionColor: 'text-white/75',
    degreeColor: 'text-white/70',
    particles: [
      {
        className:
          'absolute right-6 top-6 h-6 w-6 rounded-full bg-white/14 blur-md animate-pulse',
        style: { animationDuration: '7s' },
      },
    ],
  },
  'default-night': {
    gradient: 'from-slate-900/32 via-slate-800/24 to-slate-900/22',
    glow: 'bg-sky-500/15',
    glyph: 'compass',
    glyphClass: 'text-sky-200',
    tempColor: 'text-sky-50',
    descriptionColor: 'text-sky-100/75',
    degreeColor: 'text-sky-100/70',
    particles: [
      {
        className:
          'absolute right-5 top-6 h-2 w-2 rounded-full bg-white/35',
        style: { animation: 'weatherTwinkle 5.5s ease-in-out infinite' },
      },
    ],
  },
}

function mapCondition(value) {
  if (!value) return ''
  const key = value.toLowerCase()
  if (['drizzle'].includes(key)) return 'rain'
  if (['thunderstorm'].includes(key)) return 'storm'
  if (['snow'].includes(key)) return 'snow'
  if (
    ['mist', 'fog', 'haze', 'smoke', 'dust', 'sand', 'ash'].includes(key)
  ) {
    return 'fog'
  }
  if (['squall', 'tornado'].includes(key)) return 'wind'
  if (['clouds'].includes(key)) return 'clouds'
  if (['clear'].includes(key)) return 'clear'
  if (['rain'].includes(key)) return 'rain'
  if (['wind', 'breeze'].includes(key)) return 'wind'
  return ''
}

function getVariantKey(condition, isNight) {
  const mapped = mapCondition(condition)
  if (!mapped) return isNight ? 'default-night' : 'default'
  const composite = `${mapped}${isNight ? '-night' : ''}`
  if (WEATHER_VARIANTS[composite]) return composite
  if (WEATHER_VARIANTS[mapped]) return mapped
  return isNight ? 'default-night' : 'default'
}

const WEATHER_ANIMATION_STYLE_ID = 'weather-animations'

function ensureWeatherAnimations() {
  if (typeof document === 'undefined') return
  if (document.getElementById(WEATHER_ANIMATION_STYLE_ID)) return

  const style = document.createElement('style')
  style.id = WEATHER_ANIMATION_STYLE_ID
  style.textContent = `
@keyframes weatherDrop {
  0% { transform: translateY(-24px); opacity: 0; }
  40% { opacity: 0.85; }
  100% { transform: translateY(28px); opacity: 0; }
}
@keyframes weatherSnow {
  0% { transform: translateY(-16px) translateX(-6px); opacity: 0; }
  40% { opacity: 0.9; }
  100% { transform: translateY(28px) translateX(6px); opacity: 0; }
}
@keyframes weatherDrift {
  0% { transform: translateX(-18px); opacity: 0; }
  30% { opacity: 0.65; }
  100% { transform: translateX(20px); opacity: 0; }
}
@keyframes weatherTwinkle {
  0%, 100% { transform: scale(0.85); opacity: 0.25; }
  50% { transform: scale(1.15); opacity: 0.9; }
}
`
  document.head.appendChild(style)
}

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
    ensureWeatherAnimations()
  }, [])

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
        condition: payload.weather?.[0]?.main ?? '',
        icon: payload.weather?.[0]?.icon ?? '',
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

  const iconCode = weather?.icon ?? ''
  const isNight = iconCode.endsWith('n')

  const formattedDescription = weather?.description
    ? weather.description
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : ''

  const displayCity = weather?.city ?? city ?? ''
  const hasCity = Boolean(city)
  const canRefresh = hasCity && Boolean(apiKey)

  let content
  if (!apiKey) {
    content = (
      <p className="text-xs text-white/70">
        Add your OpenWeather API key to see live conditions.
      </p>
    )
  } else if (isEditing) {
    content = (
      <div className="flex w-full flex-col gap-2">
        <input
          id="weather-city"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="City name"
          className="w-full rounded-2xl border border-white/25 bg-white/[0.1] px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-300/60"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCitySubmit}
            className="flex-1 rounded-full bg-sky-400/90 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_15px_30px_-20px_rgba(56,189,248,0.9)] transition hover:bg-sky-300 disabled:opacity-40"
            disabled={!inputValue.trim()}
          >
            Save
          </button>
          {hasCity && (
            <button
              type="button"
              onClick={() => {
                setInputValue(city)
                setIsEditing(false)
              }}
              className="flex-1 rounded-full border border-white/25 bg-white/[0.08] px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:border-white/40 hover:text-white"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    )
  } else if (!hasCity) {
    content = (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="rounded-full border border-white/25 bg-white/[0.08] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/75 transition hover:border-white/40 hover:text-white"
      >
        Choose City
      </button>
    )
  } else if (loading) {
    content = <p className="text-xs text-white/70">Updating...</p>
  } else if (weather) {
    const variantKey = getVariantKey(weather.condition, isNight)
    const variant =
      WEATHER_VARIANTS[variantKey] ??
      WEATHER_VARIANTS[isNight ? 'default-night' : 'default']

    content = (
      <WeatherVisual
        variant={variant}
        weather={weather}
        formattedDescription={formattedDescription}
      />
    )
  } else {
    content = (
      <p className="text-xs text-white/70">Tap refresh to load weather.</p>
    )
  }

  return (
    <section className={PANEL_CLASSES}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[0.55rem] font-semibold uppercase tracking-[0.4em] text-white/60">
            Weather
          </p>
          <p
            className={`mt-1 text-sm font-medium ${
              displayCity ? 'text-white/90' : 'text-white/60'
            }`}
          >
            {displayCity || 'Set City'}
          </p>
        </div>
        {!isEditing && (
          <div className="flex gap-2">
            {canRefresh ? (
              <button
                type="button"
                onClick={handleRefresh}
                className="rounded-full border border-white/25 bg-white/[0.08] p-1.5 text-white/75 transition hover:border-white/40 hover:text-white disabled:opacity-50"
                disabled={loading}
                aria-label="Refresh weather"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-3.5 w-3.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6a8 8 0 0113.657-2.657L20 6m0 0h-4m4 0v-4"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 18a8 8 0 01-13.657 2.657L4 18m0 0h4m-4 0v4"
                  />
                </svg>
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setInputValue(city)
                setIsEditing(true)
              }}
              className="rounded-full border border-white/25 bg-white/[0.08] p-1.5 text-white/75 transition hover:border-white/40 hover:text-white"
              aria-label={hasCity ? 'Change city' : 'Set city'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-3.5 w-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 3.487a2.25 2.25 0 113.182 3.182L8.25 18.463 3 20l1.537-5.25 12.325-11.263z"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-1 flex-col items-center justify-center text-center">
        {content}
      </div>
      {error ? (
        <p className="mt-3 rounded-2xl border border-rose-400/40 bg-rose-500/20 px-3 py-2 text-[0.65rem] text-rose-50/90">
          {error}
        </p>
      ) : null}
    </section>
  )
}

function WeatherVisual({ variant, weather, formattedDescription }) {
  const gradient =
    variant?.gradient ?? 'from-white/25 via-white/10 to-transparent'
  const glow = variant?.glow ?? 'bg-white/25'
  const particles = variant?.particles ?? []
  const glyph = variant?.glyph ?? 'compass'
  const glyphClass = variant?.glyphClass ?? 'text-white/85'
  const tempColor = variant?.tempColor ?? 'text-white'
  const descriptionColor = variant?.descriptionColor ?? 'text-white/70'
  const degreeColor = variant?.degreeColor ?? 'text-white/70'

  return (
    <div className="relative flex w-full flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      <div className={`absolute inset-0 ${glow} blur-3xl`} />
      {particles.map((particle, index) => (
        <span
          key={index}
          className={particle.className}
          style={particle.style}
        />
      ))}
      <div className="relative z-10 flex flex-col items-center">
        <WeatherGlyph
          type={glyph}
          className={`h-10 w-10 drop-shadow-lg ${glyphClass}`}
        />
        <p className={`mt-2 text-4xl font-semibold tracking-tight ${tempColor}`}>
          {weather.temp}
          <span className={`ml-1 text-base font-light ${degreeColor}`}>
            {'\u00B0'}C
          </span>
        </p>
        {formattedDescription ? (
          <p
            className={`mt-1 text-[0.65rem] uppercase tracking-[0.3em] ${descriptionColor}`}
          >
            {formattedDescription}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function WeatherGlyph({ type, className }) {
  const classes = ['h-10 w-10', className].filter(Boolean).join(' ')

  switch (type) {
    case 'sun':
      return (
        <svg
          className={classes}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="M4.93 4.93l1.42 1.42" />
          <path d="M17.65 17.65l1.42 1.42" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="M6.34 17.66l-1.42 1.41" />
          <path d="M17.66 6.34l1.41-1.41" />
        </svg>
      )
    case 'moon':
      return (
        <svg
          className={classes}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )
    case 'cloud':
      return (
        <svg
          className={classes}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 16a4 4 0 010-8 5 5 0 019.9-1A4.5 4.5 0 0118 16H5z" />
        </svg>
      )
    case 'rain':
      return (
        <svg
          className={classes}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 15a4 4 0 010-8 5 5 0 019.9-1A4.5 4.5 0 0118 15H5z" />
          <path d="M8 16v3" />
          <path d="M12 16v3" />
          <path d="M16 16v3" />
        </svg>
      )
    case 'storm':
      return (
        <svg
          className={classes}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 15a4 4 0 010-8 5 5 0 019.9-1A4.5 4.5 0 0118 15H5z" />
          <path d="M13 12l-2 4h3l-2 4" />
        </svg>
      )
    case 'snow':
      return (
        <svg
          className={classes}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 8v8" />
          <path d="M9 10l6 4" />
          <path d="M15 10l-6 4" />
          <path d="M9 14l-1.5 2" />
          <path d="M15 14l1.5 2" />
          <path d="M9 10L7.5 8" />
          <path d="M15 10l1.5-2" />
        </svg>
      )
    case 'fog':
      return (
        <svg
          className={classes}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 11h10" />
          <path d="M3 15h14" />
          <path d="M6 19h12" />
          <path d="M6 7a4 4 0 018 0" />
        </svg>
      )
    case 'wind':
      return (
        <svg
          className={classes}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 12h9a3 3 0 100-6" />
          <path d="M4 18h11a2 2 0 100-4" />
          <path d="M4 6h4" />
        </svg>
      )
    case 'compass':
    default:
      return (
        <svg
          className={classes}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M16 8l-2.5 6L8 16l2.5-6L16 8z" />
        </svg>
      )
  }
}

export default Weather
