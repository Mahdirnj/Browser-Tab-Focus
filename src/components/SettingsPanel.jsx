import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import BackgroundSection from './settings/BackgroundSection'
import BackupSection from './settings/BackupSection'
import CalendarSection from './settings/CalendarSection'
import GreetingSection from './settings/GreetingSection'
import PomodoroSection from './settings/PomodoroSection'
import ProfileSection from './settings/ProfileSection'
import SearchSection from './settings/SearchSection'
import TextColorSection from './settings/TextColorSection'
import TimezoneSection from './settings/TimezoneSection'
import WeatherApiSection from './settings/WeatherApiSection'
import WidgetsSection from './settings/WidgetsSection'

/**
 * Orchestrator component for the Settings panel.
 *
 * The 1,200+ line monolith was split into focused subcomponents under
 * `./settings/*` — each owns its own JSX, state where appropriate, and
 * stays consistent via the shared `SectionShell`. This file now handles
 * just the panel chrome: open/close lifecycle, click-outside dismissal,
 * and prop relay.
 */
export function SettingsPanel({
  backgrounds,
  selectedBackgroundId,
  onBackgroundSelect,
  currentName,
  onNameEditRequest,
  clockTimezone,
  onClockTimezoneChange,
  widgetsEnabled,
  onWidgetToggle,
  onOpenChange,
  textColorOptions,
  selectedTextColorId,
  onTextColorChange,
  openSearchInNewTab,
  onSearchBehaviorChange,
  weatherApiKey,
  onWeatherApiKeyChange,
  pomodoroDurations,
  onPomodoroDurationsChange,
  onAddCustomBackground,
  onDeleteCustomBackground,
  calendarId,
  calendarOptions,
  onCalendarChange,
  overlayStrength,
  onOverlayStrengthChange,
  greetingSubline,
  onGreetingSublineChange,
}) {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const panelRef = useRef(null)
  const triggerRef = useRef(null)

  const widgetStates = useMemo(
    () => ({
      weather: widgetsEnabled?.weather !== false,
      todo: widgetsEnabled?.todo !== false,
      pomodoro: widgetsEnabled?.pomodoro !== false,
      dailyFocus: widgetsEnabled?.dailyFocus !== false,
      quote: widgetsEnabled?.quote !== false,
    }),
    [widgetsEnabled],
  )
  const searchOpensInNewTab = openSearchInNewTab !== false

  const textColorItems = useMemo(
    () =>
      (textColorOptions ?? []).map((item) => ({
        id: item.id,
        label: item.label,
        hex: item.hex,
        isSelected: item.id === selectedTextColorId,
      })),
    [textColorOptions, selectedTextColorId],
  )

  const openPanel = useCallback(() => {
    setVisible(true)
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => setOpen(true))
    } else {
      setOpen(true)
    }
  }, [])

  const closePanel = useCallback(() => {
    setOpen(false)
  }, [])

  const toggleOpen = useCallback(() => {
    if (open) closePanel()
    else openPanel()
  }, [open, closePanel, openPanel])

  useEffect(() => {
    onOpenChange?.(open)
  }, [open, onOpenChange])

  useEffect(() => {
    if (!visible) return

    const handleClick = (event) => {
      if (
        !panelRef.current?.contains(event.target) &&
        !triggerRef.current?.contains(event.target)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [visible])

  return (
    <div className="absolute right-6 top-6 z-20">
      <div className="relative inline-flex flex-col items-end">
        <button
          type="button"
          onClick={toggleOpen}
          ref={triggerRef}
          className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-[0_20px_40px_-20px_rgba(15,23,42,0.9)] transition-[border-color,background-color] duration-150 ${
            open
              ? 'border-white/30 bg-white/20 text-white'
              : 'border-white/20 bg-white/10 text-[color:var(--dashboard-text-100)] hover:border-white/35 hover:bg-white/20'
          }`}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="settings-panel"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            strokeWidth="1.6"
            stroke="currentColor"
            fill="none"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 3.06-1.756 3.486 0a1.724 1.724 0 002.573 1.066c1.543-.93 3.31.836 2.38 2.38a1.724 1.724 0 001.065 2.572c1.756.426 1.756 3.06 0 3.486a1.724 1.724 0 00-1.066 2.573c.93 1.543-.836 3.31-2.38 2.38a1.724 1.724 0 00-2.572 1.065c-.426 1.756-3.06 1.756-3.486 0a1.724 1.724 0 00-2.573-1.066c-1.543.93-3.31-.836-2.38-2.38a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-3.06 0-3.486a1.724 1.724 0 001.066-2.573c-.93-1.543.836-3.31 2.38-2.38.996.6 2.276.16 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>

        {visible && (
          <div
            id="settings-panel"
            ref={panelRef}
            style={{ backdropFilter: 'blur(22px) saturate(1.3)', WebkitBackdropFilter: 'blur(22px) saturate(1.3)' }}
            className={`absolute right-0 top-full mt-3 flex h-[84vh] w-[22rem] flex-col overflow-hidden rounded-[26px] border border-white/[0.14] bg-white/[0.08] text-[color:var(--dashboard-text-100)] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.85)] transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.22,0.61,0.36,1)] ${
              open
                ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
                : 'pointer-events-none translate-y-2 scale-[0.97] opacity-0'
            }`}
          >
            {/* ─── Header ─── */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.08]">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor" fill="none" className="h-3.5 w-3.5 text-[color:var(--dashboard-text-60)]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 3.06-1.756 3.486 0a1.724 1.724 0 002.573 1.066c1.543-.93 3.31.836 2.38 2.38a1.724 1.724 0 001.065 2.572c1.756.426 1.756 3.06 0 3.486a1.724 1.724 0 00-1.066 2.573c.93 1.543-.836 3.31-2.38 2.38a1.724 1.724 0 00-2.572 1.065c-.426 1.756-3.06 1.756-3.486 0a1.724 1.724 0 00-2.573-1.066c-1.543.93-3.31-.836-2.38-2.38a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-3.06 0-3.486a1.724 1.724 0 001.066-2.573c-.93-1.543.836-3.31 2.38-2.38.996.6 2.276.16 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-sm font-semibold tracking-[0.06em] text-[color:var(--dashboard-text-90)]">
                  Settings
                </h2>
              </div>
              <button
                type="button"
                onClick={closePanel}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.06] text-[color:var(--dashboard-text-50)] transition-[background-color,color] duration-100 hover:bg-white/[0.14] hover:text-[color:var(--dashboard-text-90)]"
                aria-label="Close settings"
              >
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                  <path d="M2 2l10 10M12 2L2 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* thin separator */}
            <div className="mx-5 h-px bg-white/[0.07]" />

            {/* ─── Scrollable content ─── */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 custom-scroll">
              <div className="space-y-3">
                <ProfileSection
                  currentName={currentName}
                  onNameEditRequest={onNameEditRequest}
                />
                <GreetingSection
                  sublineMode={greetingSubline}
                  onSublineModeChange={onGreetingSublineChange}
                />
                <WidgetsSection
                  widgetStates={widgetStates}
                  onWidgetToggle={onWidgetToggle}
                />
                <SearchSection
                  openInNewTab={searchOpensInNewTab}
                  onSearchBehaviorChange={onSearchBehaviorChange}
                />
                <PomodoroSection
                  pomodoroDurations={pomodoroDurations}
                  onPomodoroDurationsChange={onPomodoroDurationsChange}
                />
                <TextColorSection
                  items={textColorItems}
                  onTextColorChange={onTextColorChange}
                />
                <WeatherApiSection
                  weatherApiKey={weatherApiKey}
                  onWeatherApiKeyChange={onWeatherApiKeyChange}
                />
                <CalendarSection
                  calendarOptions={calendarOptions}
                  calendarId={calendarId}
                  onCalendarChange={onCalendarChange}
                />
                <TimezoneSection
                  clockTimezone={clockTimezone}
                  onClockTimezoneChange={onClockTimezoneChange}
                />
                <BackgroundSection
                  backgrounds={backgrounds}
                  selectedBackgroundId={selectedBackgroundId}
                  onBackgroundSelect={onBackgroundSelect}
                  onAddCustomBackground={onAddCustomBackground}
                  onDeleteCustomBackground={onDeleteCustomBackground}
                  overlayStrength={overlayStrength}
                  onOverlayStrengthChange={onOverlayStrengthChange}
                />
                <BackupSection />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SettingsPanel
