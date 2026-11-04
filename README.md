# ARISE — Player System (Solo Leveling style)

A real-life leveling tracker built with React + Vite. Native full-screen UI (no iframe), with the System
notification on open, the Player Record status window, and animated electric / flame / aura borders.

## Run locally
```
npm install
npm run dev      # development
npm run build    # production build in dist/
```

## Publish on GitHub Pages
1. Push this folder to the `main` branch of your repo (`Chitesh268/anima`).
2. Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The included workflow (`.github/workflows/deploy-pages.yml`) builds and deploys automatically.
   Your site will be at `https://chitesh268.github.io/anima/`.

## Save data
Same format as before (`localStorage` key `solo-system-v2`), so existing progress and exported
backups keep working on the same browser.

## Effects
Settings → **Visual effects**: High (desktop default), Medium (phone default, lighter), Off.
Reduced-motion system settings turn effects off automatically.

* Borders: thin crisp edge, a small light that runs up the left and down the right side only, and corner/gem artwork that glows up and down like a bulb in the level colour (works in every mode, including Off).
* Flames (High + Medium): soft blue plumes with a wavy light line on the top and bottom edge of every border except the four small tiles, which get a breathing edge glow instead.
* Big frames (header, status window) and system alerts: looping aura dust on the top and bottom edges.
* Theme colour follows your level: bright blue (Lv 1) → dark blue (Lv 30) → purple (Lv 60) → dark purple (Lv 90+). Edit `STOPS` in `src/game.js` to change it.
* Sound: `alert.mp3` plays every time a notification/alert appears (a notification that arrives as the app opens waits behind a TOUCH TO ENTER screen, because phones block sound until the first tap). `quest.mp3` plays on every button click, including buttons inside notifications.

## Notes
The app only uses `react` and `react-dom`. `framer-motion` and `lucide-react` are still listed in
`package.json` (so `package-lock.json` stays in sync for `npm ci`) but are unused; remove them any time with
`npm uninstall framer-motion lucide-react`.
