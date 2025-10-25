import { useEffect, useMemo, useState } from 'react'
import { backgroundOptions, DEFAULT_BACKGROUND_ID } from './background'
import BackgroundLayer from './components/BackgroundLayer'
import { Clock } from './components/Clock'
import { Greeting } from './components/Greeting'
import { SearchBar } from './components/SearchBar'
import { Weather } from './components/Weather'
import SettingsPanel from './components/SettingsPanel'

const BACKGROUND_KEY = 'focus_dashboard_background'
const USER_NAME_KEY = 'focus_dashboard_userName'
const CLOCK_POSITION_KEY = 'focus_dashboard_clockPosition'

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

function App() {
  const [backgroundId, setBackgroundId] = useState(() =>
    readStoredValue(BACKGROUND_KEY, DEFAULT_BACKGROUND_ID),
  )
  const [nameEditSignal, setNameEditSignal] = useState(0)
  const [userName, setUserName] = useState(() => readStoredName())
  const [clockPosition, setClockPosition] = useState(() =>
    readStoredClockPosition(),
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(BACKGROUND_KEY, backgroundId)
  }, [backgroundId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(CLOCK_POSITION_KEY, clockPosition)
  }, [clockPosition])

  const availableBackgrounds = backgroundOptions
  const activeBackground = useMemo(() => {
    return (
      availableBackgrounds.find((item) => item.id === backgroundId) ??
      availableBackgrounds[0]
    )
  }, [availableBackgrounds, backgroundId])

  const panelClasses = 'text-white'

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundLayer imageUrl={activeBackground?.url} />
      {clockPosition === 'top' ? (
        <div className="pointer-events-none absolute inset-x-0 top-12 z-20 flex justify-center">
          <div className="pointer-events-auto">
            <Clock />
          </div>
        </div>
      ) : null}
      <div className="absolute left-6 top-6 z-20">
        <Weather />
      </div>
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
            {clockPosition === 'middle' ? <Clock /> : null}
            <Greeting
              editSignal={nameEditSignal}
              onNameChange={setUserName}
            />
            <SearchBar />
          </header>
        </div>
      </main>
    </div>
  )
}

export default App
