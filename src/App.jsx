import { useEffect, useMemo, useState } from 'react'
import { backgroundOptions, DEFAULT_BACKGROUND_ID } from './background'
import BackgroundLayer from './components/BackgroundLayer'
import { Clock } from './components/Clock'
import { Greeting } from './components/Greeting'
import { SearchBar } from './components/SearchBar'
import SettingsPanel from './components/SettingsPanel'

const THEME_KEY = 'focus_dashboard_theme'
const BACKGROUND_KEY = 'focus_dashboard_background'

function readStoredValue(key, fallback) {
  if (typeof window === 'undefined') return fallback
  return window.localStorage.getItem(key) ?? fallback
}

function App() {
  const [theme, setTheme] = useState(() => {
    const stored = readStoredValue(THEME_KEY, 'dark')
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = stored
    }
    return stored
  })
  const [backgroundId, setBackgroundId] = useState(() =>
    readStoredValue(BACKGROUND_KEY, DEFAULT_BACKGROUND_ID),
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(THEME_KEY, theme)
  }, [theme])

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

  const isLight = theme === 'light'
  const panelClasses = isLight
    ? 'border-slate-900/10 bg-white/85 text-slate-900 shadow-[0_25px_65px_-35px_rgba(15,23,42,0.35)]'
    : 'border-white/15 bg-white/[0.05] text-white shadow-[0_35px_70px_-40px_rgba(10,18,42,0.85)]'

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundLayer imageUrl={activeBackground?.url} theme={theme} />
      <SettingsPanel
        theme={theme}
        onThemeChange={setTheme}
        backgrounds={availableBackgrounds}
        selectedBackgroundId={activeBackground?.id ?? DEFAULT_BACKGROUND_ID}
        onBackgroundSelect={setBackgroundId}
      />
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-6">
        <div
          className={`flex w-full max-w-4xl flex-col gap-8 rounded-[28px] px-6 py-10 sm:px-10 ${panelClasses}`}
        >
          <header className="flex flex-col items-center gap-5 text-center">
            <Clock theme={theme} />
            <Greeting theme={theme} />
            <SearchBar theme={theme} />
          </header>
        </div>
      </main>
    </div>
  )
}

export default App
