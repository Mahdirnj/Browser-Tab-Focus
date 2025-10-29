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
const CLOCK_TIMEZONE_KEY = 'focus_dashboard_clockTimezone'
const WIDGETS_KEY = 'focus_dashboard_widgets'
const TEXT_COLOR_KEY = 'focus_dashboard_textColor'
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

function readStoredValue(key, fallback) {
  if (typeof window === 'undefined') return fallback
  return window.localStorage.getItem(key) ?? fallback
}

function readStoredName() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(USER_NAME_KEY) ?? ''
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

function readStoredTextColor() {
  if (typeof window === 'undefined') return TEXT_COLOR_PRESETS[0].id
  const stored = window.localStorage.getItem(TEXT_COLOR_KEY)
  const isValid = TEXT_COLOR_PRESETS.some((item) => item.id === stored)
  return isValid ? stored : TEXT_COLOR_PRESETS[0].id
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
    readStoredValue(BACKGROUND_KEY, DEFAULT_BACKGROUND_ID),
  )
  const [nameEditSignal, setNameEditSignal] = useState(0)
  const [userName, setUserName] = useState(() => readStoredName())
  const [clockTimezone, setClockTimezone] = useState(() =>
    readStoredClockTimezone(),
  )
  const [widgetsEnabled, setWidgetsEnabled] = useState(() =>
    readStoredWidgets(),
  )
  const [textColorId, setTextColorId] = useState(() => readStoredTextColor())
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(BACKGROUND_KEY, backgroundId)
  }, [backgroundId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(CLOCK_TIMEZONE_KEY, clockTimezone)
  }, [clockTimezone])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(WIDGETS_KEY, JSON.stringify(widgetsEnabled))
  }, [widgetsEnabled])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(TEXT_COLOR_KEY, textColorId)
  }, [textColorId])

  useEffect(() => {
    const active = TEXT_COLOR_PRESETS.find((item) => item.id === textColorId)
    applyTextColorPreset(active?.hex ?? TEXT_COLOR_PRESETS[0].hex)
  }, [textColorId])
  const availableBackgrounds = backgroundOptions
  const activeBackground = useMemo(() => {
    return (
      availableBackgrounds.find((item) => item.id === backgroundId) ??
      availableBackgrounds[0]
    )
  }, [availableBackgrounds, backgroundId])

  const panelClasses = 'text-[color:var(--dashboard-text-95)]'
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
      <div className="pointer-events-none absolute inset-x-0 top-12 z-20 flex justify-center">
        <div className="pointer-events-auto flex flex-col items-center gap-2">
          <BrandMark />
          <Clock timezone={clockTimezone} />
        </div>
      </div>
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
        clockTimezone={clockTimezone}
        onClockTimezoneChange={setClockTimezone}
        widgetsEnabled={widgetsEnabled}
        onWidgetToggle={toggleWidget}
        onOpenChange={setSettingsOpen}
        textColorOptions={TEXT_COLOR_PRESETS}
        selectedTextColorId={textColorId}
        onTextColorChange={setTextColorId}
      />
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-6">
        <div
          className={`relative flex w-full max-w-4xl flex-col gap-8 rounded-[28px] px-6 py-10 sm:px-10 ${panelClasses}`}
        >
          <header className="mt-32 flex flex-col items-center gap-5 text-center">
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
