import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addCustomBackground,
  bundledBackgrounds,
  DEFAULT_BACKGROUND_ID,
  deleteCustomBackground,
  getCustomBackgroundsSnapshot,
  isCustomBackgroundId,
  loadBackgroundImage,
  primeCustomBackgrounds,
  subscribeBackgrounds,
} from './background'
import BackgroundLayer from './components/BackgroundLayer'
import Bookmarks from './components/Bookmarks'
import { Clock } from './components/Clock'
import { DailyFocus } from './components/DailyFocus'
import { Greeting } from './components/Greeting'
import { Quote } from './components/Quote'
import { SearchBar } from './components/SearchBar'
import SettingsPanel from './components/SettingsPanel'
import PomodoroTimer from './components/PomodoroTimer'
import TodoList from './components/TodoList'
import Weather from './components/Weather'
import {
  ACTIVE_BACKGROUND_DATA_KEY,
  BACKGROUND_KEY,
  CALENDAR_KEY,
  CLOCK_TIMEZONE_KEY,
  POMODORO_DURATIONS_KEY,
  SEARCH_BEHAVIOR_KEY,
  TEXT_COLOR_KEY,
  USER_NAME_KEY,
  WEATHER_API_KEY_KEY,
  WIDGETS_KEY,
} from './constants/storageKeys'
import {
  readJSON,
  readString,
  removeKey,
  writeJSON,
  writeString,
} from './utils/storage'
import { CALENDAR_OPTIONS, DEFAULT_CALENDAR_ID, getCalendarOption } from './utils/calendar'
import { getDefaultTimezone } from './utils/timezone'
const BRAND_NAME = 'FocusLoom'

const TEXT_COLOR_PRESETS = [
  { id: 'glow', label: 'Glow', hex: '#ffffff' },
  { id: 'frost', label: 'Frost', hex: '#f5f5f5' },
  { id: 'aqua', label: 'Aqua', hex: '#d1f4ff' },
  { id: 'coral', label: 'Coral', hex: '#ffd0c2' },
  { id: 'sol', label: 'Sol', hex: '#fde68a' },
  { id: 'obsidian', label: 'Obsidian', hex: '#000000' },
]

function BrandMark() {
  return (
    <span className="animate-brand-glow text-xs font-semibold uppercase tracking-[0.5em] text-[color:var(--dashboard-text-65)] md:text-sm">
      {BRAND_NAME}
    </span>
  )
}

const DEFAULT_WIDGET_SETTINGS = {
  weather: true,
  todo: true,
  pomodoro: true,
}

function resolveInitialWidgets() {
  const stored = readJSON(WIDGETS_KEY, null)
  if (!stored || typeof stored !== 'object') {
    return DEFAULT_WIDGET_SETTINGS
  }
  return {
    ...DEFAULT_WIDGET_SETTINGS,
    ...stored,
  }
}

function resolveInitialTextColor() {
  const stored = readString(TEXT_COLOR_KEY, TEXT_COLOR_PRESETS[0].id)
  const isValid = TEXT_COLOR_PRESETS.some((item) => item.id === stored)
  return isValid ? stored : TEXT_COLOR_PRESETS[0].id
}

function resolveInitialSearchBehavior() {
  const stored = readString(SEARCH_BEHAVIOR_KEY, 'new')
  return stored !== 'current'
}

function applyTextColorPreset(hex) {
  if (typeof document === 'undefined') return
  if (!hex) return
  const raw = hex.replace('#', '')
  if (raw.length !== 3 && raw.length !== 6) return

  const expand = (value) => (value.length === 1 ? value + value : value)
  const r = parseInt(expand(raw.slice(0, raw.length === 3 ? 1 : 2)), 16)
  const g = parseInt(
    expand(raw.slice(raw.length === 3 ? 1 : 2, raw.length === 3 ? 2 : 4)),
    16,
  )
  const b = parseInt(expand(raw.slice(raw.length === 3 ? 2 : 4)), 16)

  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return
  document.documentElement.style.setProperty('--dashboard-text-rgb', `${r}, ${g}, ${b}`)
}

function App() {
  const [backgroundId, setBackgroundId] = useState(() =>
    readString(BACKGROUND_KEY, DEFAULT_BACKGROUND_ID),
  )
  const [nameEditSignal, setNameEditSignal] = useState(0)
  const [userName, setUserName] = useState(() =>
    readString(USER_NAME_KEY, ''),
  )
  const [clockTimezone, setClockTimezone] = useState(() =>
    readString(CLOCK_TIMEZONE_KEY, getDefaultTimezone()),
  )
  const [widgetsEnabled, setWidgetsEnabled] = useState(() =>
    resolveInitialWidgets(),
  )
  const [textColorId, setTextColorId] = useState(() =>
    resolveInitialTextColor(),
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isCompactLayout, setIsCompactLayout] = useState(false)
  const [openSearchInNewTab, setOpenSearchInNewTab] = useState(() =>
    resolveInitialSearchBehavior(),
  )
  const [weatherApiKey, setWeatherApiKey] = useState(() =>
    readString(WEATHER_API_KEY_KEY, ''),
  )
  const [pomodoroDurations, setPomodoroDurations] = useState(() =>
    readJSON(POMODORO_DURATIONS_KEY, { focus: 25, shortBreak: 5, longBreak: 15 }),
  )
  const [calendarId, setCalendarId] = useState(() => {
    const stored = readString(CALENDAR_KEY, DEFAULT_CALENDAR_ID)
    return getCalendarOption(stored).id
  })
  const [customBackgrounds, setCustomBackgrounds] = useState(() =>
    getCustomBackgroundsSnapshot(),
  )

  // Prime custom backgrounds from IndexedDB once and stay subscribed for changes
  useEffect(() => {
    let cancelled = false
    primeCustomBackgrounds().then(() => {
      if (!cancelled) setCustomBackgrounds(getCustomBackgroundsSnapshot())
    })
    const unsubscribe = subscribeBackgrounds(() => {
      setCustomBackgrounds(getCustomBackgroundsSnapshot())
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    writeString(BACKGROUND_KEY, backgroundId)
    // Maintain a tiny localStorage shadow of the active background's source.
    // The pre-React bootstrap reads this so custom backgrounds paint on the
    // first frame without waiting on IndexedDB.
    if (isCustomBackgroundId(backgroundId)) {
      const src = loadBackgroundImage(backgroundId)
      if (src) {
        writeString(ACTIVE_BACKGROUND_DATA_KEY, src)
      }
    } else {
      removeKey(ACTIVE_BACKGROUND_DATA_KEY)
    }
  }, [backgroundId])

  useEffect(() => {
    writeString(CLOCK_TIMEZONE_KEY, clockTimezone)
  }, [clockTimezone])

  useEffect(() => {
    writeJSON(WIDGETS_KEY, widgetsEnabled)
  }, [widgetsEnabled])

  useEffect(() => {
    writeString(TEXT_COLOR_KEY, textColorId)
  }, [textColorId])

  useEffect(() => {
    writeString(SEARCH_BEHAVIOR_KEY, openSearchInNewTab ? 'new' : 'current')
  }, [openSearchInNewTab])

  useEffect(() => {
    writeString(CALENDAR_KEY, calendarId)
  }, [calendarId])

  useEffect(() => {
    const trimmed = weatherApiKey?.trim()
    if (!trimmed) {
      removeKey(WEATHER_API_KEY_KEY)
      return
    }
    writeString(WEATHER_API_KEY_KEY, trimmed)
  }, [weatherApiKey])

  useEffect(() => {
    const active = TEXT_COLOR_PRESETS.find((item) => item.id === textColorId)
    applyTextColorPreset(active?.hex ?? TEXT_COLOR_PRESETS[0].hex)
  }, [textColorId])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
      return undefined

    const mediaQuery = window.matchMedia('(max-width: 1023px)')
    const updateLayoutMode = () => setIsCompactLayout(mediaQuery.matches)

    updateLayoutMode()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateLayoutMode)
      return () => mediaQuery.removeEventListener('change', updateLayoutMode)
    }

    mediaQuery.addListener(updateLayoutMode)
    return () => mediaQuery.removeListener(updateLayoutMode)
  }, [])

  const availableBackgrounds = useMemo(
    () => [...bundledBackgrounds, ...customBackgrounds],
    [customBackgrounds],
  )
  const activeBackground = useMemo(() => {
    return (
      availableBackgrounds.find((item) => item.id === backgroundId) ??
      availableBackgrounds[0]
    )
  }, [availableBackgrounds, backgroundId])
  const backgroundSrc = useMemo(() => {
    const resolved = loadBackgroundImage(backgroundId)
    if (resolved) return resolved
    if (activeBackground?.id && activeBackground.id !== backgroundId) {
      const fallback = loadBackgroundImage(activeBackground.id)
      if (fallback) return fallback
    }
    return loadBackgroundImage(DEFAULT_BACKGROUND_ID)
    // `customBackgrounds` is intentionally listed: when IDB primes a custom
    // background after first paint, this memo must re-run so the data URL
    // surfaces. The lint rule can't see that loadBackgroundImage reads from
    // a module-level cache that the customBackgrounds state changes signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBackground?.id, backgroundId, customBackgrounds])

  const panelClasses = 'text-[color:var(--dashboard-text-95)]'
  const toggleWidget = (key, value) => {
    setWidgetsEnabled((current) => ({
      ...current,
      [key]: value,
    }))
  }
  const showWeather = !isCompactLayout && widgetsEnabled.weather !== false
  const showTodo = !isCompactLayout && widgetsEnabled.todo !== false
  const showPomodoro = !isCompactLayout && widgetsEnabled.pomodoro !== false
  const showDailyFocus = widgetsEnabled.dailyFocus !== false
  const showQuote = widgetsEnabled.quote !== false
  const showBookmarks = !isCompactLayout
  const showUtilityColumn = showWeather || showTodo
  const handleWeatherApiKeyChange = useCallback((nextKey) => {
    setWeatherApiKey(nextKey?.trim() ?? '')
  }, [])

  const handlePomodoroDurationsChange = useCallback((next) => {
    setPomodoroDurations(next)
    writeJSON(POMODORO_DURATIONS_KEY, next)
  }, [])

  const handleAddCustomBackground = useCallback(async (record) => {
    const saved = await addCustomBackground(record)
    setBackgroundId(saved.id)
    return saved
  }, [])

  const handleDeleteCustomBackground = useCallback(
    async (id) => {
      await deleteCustomBackground(id)
      // If the deleted background was the active one, snap back to the default.
      setBackgroundId((current) => (current === id ? DEFAULT_BACKGROUND_ID : current))
    },
    [],
  )

  // Request notification permission once — only if not yet decided and not already asked.
  // Runs after 2.5s so it doesn't interrupt the page load experience.
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'default') return
    if (localStorage.getItem('focus_notif_asked')) return

    const id = window.setTimeout(() => {
      localStorage.setItem('focus_notif_asked', '1')
      Notification.requestPermission()
    }, 2500)

    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined' || !backgroundSrc) return
    document.documentElement.style.setProperty(
      '--instant-background-image',
      `url("${backgroundSrc}")`,
    )
  }, [backgroundSrc])


  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundLayer imageUrl={backgroundSrc} />
      <div className="pointer-events-none absolute inset-x-0 top-6 z-20 flex justify-center sm:top-10 lg:top-12">
        <div className="pointer-events-auto flex flex-col items-center gap-2">
          <BrandMark />
          <Clock timezone={clockTimezone} calendarId={calendarId} />
          {showDailyFocus ? <DailyFocus /> : null}
        </div>
      </div>
      {showUtilityColumn ? (
        <div className="absolute left-6 top-6 z-20 space-y-3">
          {showWeather ? (
            <Weather apiKey={weatherApiKey} isActive={showWeather && !settingsOpen} />
          ) : null}
          {showTodo ? <TodoList /> : null}
        </div>
      ) : null}
      <SettingsPanel
        backgrounds={availableBackgrounds}
        selectedBackgroundId={activeBackground?.id ?? DEFAULT_BACKGROUND_ID}
        onBackgroundSelect={setBackgroundId}
        onNameEditRequest={() =>
          setNameEditSignal((current) => current + 1)
        }
        currentName={userName}
        clockTimezone={clockTimezone}
        onClockTimezoneChange={setClockTimezone}
        widgetsEnabled={widgetsEnabled}
        onWidgetToggle={toggleWidget}
        onOpenChange={setSettingsOpen}
        textColorOptions={TEXT_COLOR_PRESETS}
        selectedTextColorId={textColorId}
        onTextColorChange={setTextColorId}
        openSearchInNewTab={openSearchInNewTab}
        onSearchBehaviorChange={setOpenSearchInNewTab}
        weatherApiKey={weatherApiKey}
        onWeatherApiKeyChange={handleWeatherApiKeyChange}
        pomodoroDurations={pomodoroDurations}
        onPomodoroDurationsChange={handlePomodoroDurationsChange}
        onAddCustomBackground={handleAddCustomBackground}
        onDeleteCustomBackground={handleDeleteCustomBackground}
        calendarId={calendarId}
        calendarOptions={CALENDAR_OPTIONS}
        onCalendarChange={setCalendarId}
      />
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-6">
        <div
          className={`relative flex w-full max-w-4xl flex-col gap-6 rounded-[28px] px-5 py-10 sm:px-8 lg:gap-8 lg:px-10 ${panelClasses}`}
        >
          <header className="mt-32 flex flex-col items-center gap-5 text-center sm:mt-36 lg:mt-48">
            <Greeting
              editSignal={nameEditSignal}
              onNameChange={setUserName}
              timezone={clockTimezone}
            />
            <SearchBar openInNewTab={openSearchInNewTab} />
            {showQuote ? <Quote /> : null}
          </header>
        </div>
      </main>
      <a
        href="https://github.com/Mahdirnj"
        target="_blank"
        rel="noreferrer"
        className={`absolute bottom-5 left-1/2 z-10 -translate-x-1/2 flex items-center gap-1.5 text-[0.6rem] font-medium tracking-[0.18em] uppercase transition-all duration-200 ${
          settingsOpen
            ? 'pointer-events-none opacity-0'
            : 'text-[color:var(--dashboard-text-40)] opacity-100 hover:text-[color:var(--dashboard-text-70)]'
        }`}
        aria-label="GitHub profile"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 flex-shrink-0">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
        Mahdirnj
      </a>
      {showBookmarks || showPomodoro ? (
        <div
          className={`pointer-events-auto absolute bottom-6 right-6 z-10 flex flex-col gap-3 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            settingsOpen
              ? 'pointer-events-none translate-y-3 opacity-0'
              : 'translate-y-0 opacity-100'
          }`}
        >
          {showBookmarks ? <Bookmarks /> : null}
          {showPomodoro ? <PomodoroTimer isObscured={settingsOpen} pomodoroDurations={pomodoroDurations} /> : null}
        </div>
      ) : null}
    </div>
  )
}

export default App
