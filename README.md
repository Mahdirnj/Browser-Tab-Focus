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
2. `npm run package-extension` (or `npm run release` to run both steps) - generates `release/focusloom-extension-v*.zip` ready for upload.
3. Upload the generated ZIP via the Chrome Web Store dashboard.
4. Verify `manifest.json` only requests the hosts you actually use (`https://api.openweathermap.org/*`, `https://duckduckgo.com/*`, etc.).
5. Attach updated screenshots, icons, privacy policy, and support links as part of the listing submission.

## Release Checklist

- [ ] `npm run build` passes without warnings.
- [ ] `extension/newtab/` contains the fresh build output (`npm run build:extension`).
- [ ] `release/…zip` was regenerated (`npm run package-extension` or `npm run release`).
- [ ] `.env` and other secrets are **not** included in the ZIP.
- [ ] Weather API instructions confirmed in the onboarding copy.
- [ ] Store assets (icons, screenshots, promo text) are up to date.

## Wallpaper Payload

The 30+ bundled wallpapers contribute roughly 50 MB to the extension ZIP. Chrome Web Store reviewers often flag oversized packages, especially for new-tab overrides because they slow down installs and the first paint. To keep the listing healthy:

- Trim the default wallpaper set to a handful of curated images.
- Re-compress background assets (e.g., WebP/AVIF at lower quality or 2–3k resolution).
- Consider hosting additional backgrounds on a CDN or allowing users to add their own URLs so they aren’t baked into every release.

Keeping the bundle lean not only improves reviewer experience but also reduces the time users wait before seeing the dashboard after installation.

## Contributing

1. Fork and clone the repo.
2. Create a feature branch.
3. Run `npm run lint` (if configured) and `npm run build` before opening a PR.
4. Describe any UI or UX decisions, especially if they impact the extension packaging flow.

Thanks for helping keep FocusLoom sharp! Feel free to open issues for enhancement ideas or polish requests.
