import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  backgroundOptions,
  DEFAULT_BACKGROUND_ID,
  loadBackgroundImage,
} from './background'
import BackgroundLayer from './components/BackgroundLayer'
import { Clock } from './components/Clock'
import { Greeting } from './components/Greeting'
import { SearchBar } from './components/SearchBar'
import SettingsPanel from './components/SettingsPanel'
import PomodoroTimer from './components/PomodoroTimer'
import TodoList from './components/TodoList'
import Weather from './components/Weather'
import {
  BACKGROUND_KEY,
  CLOCK_TIMEZONE_KEY,
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
    <span className="text-xs font-semibold uppercase tracking-[0.5em] text-[color:var(--dashboard-text-65)] md:text-sm">
      {BRAND_NAME}
    </span>
  )
}

const DEFAULT_WIDGET_SETTINGS = {
  weather: true,
  todo: true,
  pomodoro: true,
}

const detectDefaultTimezone = () => {
  if (typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function') {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  }
  return 'UTC'
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
    readString(CLOCK_TIMEZONE_KEY, detectDefaultTimezone()),
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

  useEffect(() => {
    writeString(BACKGROUND_KEY, backgroundId)
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

  const availableBackgrounds = backgroundOptions
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
  }, [activeBackground?.id, backgroundId])

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
  const showUtilityColumn = showWeather || showTodo
  const handleWeatherApiKeyChange = useCallback((nextKey) => {
    setWeatherApiKey(nextKey?.trim() ?? '')
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
          <Clock timezone={clockTimezone} />
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
      />
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-6">
        <div
          className={`relative flex w-full max-w-4xl flex-col gap-6 rounded-[28px] px-5 py-10 sm:px-8 lg:gap-8 lg:px-10 ${panelClasses}`}
        >
          <header className="mt-20 flex flex-col items-center gap-5 text-center sm:mt-24 lg:mt-32">
            <Greeting
              editSignal={nameEditSignal}
              onNameChange={setUserName}
              timezone={clockTimezone}
            />
            <SearchBar openInNewTab={openSearchInNewTab} />
          </header>
        </div>
      </main>
      {showPomodoro ? (
        <div
          className={`pointer-events-auto absolute bottom-6 right-6 z-10 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            settingsOpen
              ? 'pointer-events-none translate-y-3 opacity-0'
              : 'translate-y-0 opacity-100'
          }`}
        >
          <PomodoroTimer isObscured={settingsOpen} />
        </div>
      ) : null}
    </div>
  )
}

export default App
