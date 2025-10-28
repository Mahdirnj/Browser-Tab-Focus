import { useEffect, useMemo, useState } from 'react'
import { backgroundOptions, DEFAULT_BACKGROUND_ID } from './background'
import BackgroundLayer from './components/BackgroundLayer'
import { Clock } from './components/Clock'
import { Greeting } from './components/Greeting'
import { SearchBar } from './components/SearchBar'
import { Weather } from './components/Weather'
import { TodoList } from './components/TodoList'
import { PomodoroTimer } from './components/PomodoroTimer'
import SettingsPanel from './components/SettingsPanel'

const BACKGROUND_KEY = 'focus_dashboard_background'
const USER_NAME_KEY = 'focus_dashboard_userName'
const CLOCK_POSITION_KEY = 'focus_dashboard_clockPosition'
const CLOCK_TIMEZONE_KEY = 'focus_dashboard_clockTimezone'
const WIDGETS_KEY = 'focus_dashboard_widgets'
const BRAND_NAME = 'FocusLoom'

function BrandMark() {
  return (
    <span className="text-xs font-semibold uppercase tracking-[0.5em] text-white/65 md:text-sm">
      {BRAND_NAME}
    </span>
  )
}

const DEFAULT_WIDGET_SETTINGS = {
  weather: true,
  todo: true,
  pomodoro: true,
}

function readStoredValue(key, fallback) {
  if (typeof window === 'undefined') return fallback
  return window.localStorage.getItem(key) ?? fallback
}

function readStoredName() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(USER_NAME_KEY) ?? ''
}

function readStoredClockPosition() {
  if (typeof window === 'undefined') return 'middle'
  return window.localStorage.getItem(CLOCK_POSITION_KEY) ?? 'middle'
}

function readStoredClockTimezone() {
  const fallback =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'UTC'

  if (typeof window === 'undefined') return fallback
  const stored = window.localStorage.getItem(CLOCK_TIMEZONE_KEY)
  return stored ?? fallback
}

function readStoredWidgets() {
  if (typeof window === 'undefined') return DEFAULT_WIDGET_SETTINGS
  try {
    const raw = window.localStorage.getItem(WIDGETS_KEY)
    if (!raw) return DEFAULT_WIDGET_SETTINGS
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_WIDGET_SETTINGS,
      ...(parsed ?? {}),
    }
  } catch (error) {
    console.warn('Unable to parse stored widget settings', error)
    return DEFAULT_WIDGET_SETTINGS
  }
}

function App() {
  const [backgroundId, setBackgroundId] = useState(() =>
    readStoredValue(BACKGROUND_KEY, DEFAULT_BACKGROUND_ID),
  )
  const [nameEditSignal, setNameEditSignal] = useState(0)
  const [userName, setUserName] = useState(() => readStoredName())
  const [clockPosition, setClockPosition] = useState(() =>
    readStoredClockPosition(),
  )
  const [clockTimezone, setClockTimezone] = useState(() =>
    readStoredClockTimezone(),
  )
  const [widgetsEnabled, setWidgetsEnabled] = useState(() =>
    readStoredWidgets(),
  )
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(BACKGROUND_KEY, backgroundId)
  }, [backgroundId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(CLOCK_POSITION_KEY, clockPosition)
  }, [clockPosition])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(CLOCK_TIMEZONE_KEY, clockTimezone)
  }, [clockTimezone])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(WIDGETS_KEY, JSON.stringify(widgetsEnabled))
  }, [widgetsEnabled])

  const availableBackgrounds = backgroundOptions
  const activeBackground = useMemo(() => {
    return (
      availableBackgrounds.find((item) => item.id === backgroundId) ??
      availableBackgrounds[0]
    )
  }, [availableBackgrounds, backgroundId])

  const panelClasses = 'text-white'
  const toggleWidget = (key, value) => {
    setWidgetsEnabled((current) => ({
      ...current,
      [key]: value,
    }))
  }
  const showWeather = widgetsEnabled.weather !== false
  const showTodo = widgetsEnabled.todo !== false
  const showPomodoro = widgetsEnabled.pomodoro !== false
  const showUtilityColumn = showWeather || showTodo

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundLayer imageUrl={activeBackground?.url} />
      {clockPosition === 'top' ? (
        <div className="pointer-events-none absolute inset-x-0 top-12 z-20 flex justify-center">
          <div className="pointer-events-auto flex flex-col items-center gap-2">
            <BrandMark />
            <Clock timezone={clockTimezone} />
          </div>
        </div>
      ) : null}
      {showUtilityColumn ? (
        <div className="absolute left-6 top-6 z-20 space-y-3">
          {showWeather ? <Weather /> : null}
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
        clockPosition={clockPosition}
        onClockPositionChange={setClockPosition}
        clockTimezone={clockTimezone}
        onClockTimezoneChange={setClockTimezone}
        widgetsEnabled={widgetsEnabled}
        onWidgetToggle={toggleWidget}
        onOpenChange={setSettingsOpen}
      />
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-6">
        <div
          className={`flex w-full max-w-4xl flex-col gap-8 rounded-[28px] px-6 py-10 sm:px-10 ${panelClasses}`}
        >
          <header
            className={`flex flex-col items-center gap-5 text-center ${
              clockPosition === 'top' ? 'mt-32' : ''
            }`}
          >
            {clockPosition === 'middle' ? (
              <div className="flex flex-col items-center gap-2">
                <BrandMark />
                <Clock timezone={clockTimezone} />
              </div>
            ) : null}
            <Greeting
              editSignal={nameEditSignal}
              onNameChange={setUserName}
            />
            <SearchBar />
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
