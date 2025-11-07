# FocusLoom Dashboard

FocusLoom is a polished new-tab replacement that blends a search hub, personal widgets, and a distraction-free layout. It is built with React + Vite and shipped as a Chrome extension.

## Highlights

- Customisable wallpaper, typography, and widget layout.
- Greeting, clock, weather, todo list, and Pomodoro timer with local persistence.
- Search bar with multiple engines and inline suggestions.
- Chrome-extension ready bundle in `extension/` for manual upload.

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173/` for the full dashboard.

## Weather API Key

The production extension no longer bundles a shared OpenWeather key. Each user must provide their own key via **Settings -> Weather API Access**.

For local tooling you can still keep a key in `.env` (see `.env.example`), but this file is ignored by Git and the runtime code only uses the value entered inside the UI.

## Storage Helpers

Common persistence tasks now flow through `src/utils/storage.js` to ensure safe JSON parsing, SSR guards, and consistent key naming. When you need to read or write to `localStorage`, prefer these helpers over manual calls.

## Building & Packaging the Extension

1. `npm run build:extension` - builds the dashboard and mirrors `dist/` into `extension/newtab/`.
2. Zip the contents of `extension/` (not the folder itself) and upload it through the Chrome Web Store dashboard.
3. Verify `manifest.json` only requests the hosts you actually use (`https://api.openweathermap.org/*`, `https://duckduckgo.com/*`, etc.).
4. Attach updated screenshots, icons, and privacy policy links as part of the listing submission.

## Release Checklist

- [ ] `npm run build` passes without warnings.
- [ ] `extension/newtab/` contains the fresh build output.
- [ ] `.env` and other secrets are **not** included in the ZIP.
- [ ] Weather API instructions confirmed in the onboarding copy.
- [ ] Store assets (icons, screenshots, promo text) are up to date.

## Contributing

1. Fork and clone the repo.
2. Create a feature branch.
3. Run `npm run lint` (if configured) and `npm run build` before opening a PR.
4. Describe any UI or UX decisions, especially if they impact the extension packaging flow.

Thanks for helping keep FocusLoom sharp! Feel free to open issues for enhancement ideas or polish requests.
