import { useEffect, useMemo, useState } from 'react'
import { backgroundOptions, DEFAULT_BACKGROUND_ID } from './background'
import BackgroundLayer from './components/BackgroundLayer'
import { Clock } from './components/Clock'
import { Greeting } from './components/Greeting'
import { SearchBar } from './components/SearchBar'
import SettingsPanel from './components/SettingsPanel'

const BACKGROUND_KEY = 'focus_dashboard_background'

function readStoredValue(key, fallback) {
  if (typeof window === 'undefined') return fallback
  return window.localStorage.getItem(key) ?? fallback
}

function App() {
  const [backgroundId, setBackgroundId] = useState(() =>
    readStoredValue(BACKGROUND_KEY, DEFAULT_BACKGROUND_ID),
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(BACKGROUND_KEY, backgroundId)
  }, [backgroundId])

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
      <SettingsPanel
        backgrounds={availableBackgrounds}
        selectedBackgroundId={activeBackground?.id ?? DEFAULT_BACKGROUND_ID}
        onBackgroundSelect={setBackgroundId}
      />
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-6">
        <div
          className={`flex w-full max-w-4xl flex-col gap-8 rounded-[28px] px-6 py-10 sm:px-10 ${panelClasses}`}
        >
          <header className="flex flex-col items-center gap-5 text-center">
            <Clock />
            <Greeting />
            <SearchBar />
          </header>
        </div>
      </main>
    </div>
  )
}

export default App
