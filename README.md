# Swim Workout Builder

A browser-based tool for building structured swimming workouts and exporting them as Garmin Connect-compatible JSON files.

## Features

- Build workouts with named set groups, each containing one or more steps
- Configure per-step: distance, repetitions, stroke, intensity, equipment (multi-select), rest intervals, and notes
- Supports 25 yd, 25 m, and 50 m pools
- Live total distance calculation
- Preview mode with a clean, printable workout card
- Export to Garmin Connect JSON format

## Saving your work

Nothing is stored in the browser — no `localStorage`, no cookies, no server. Closing the tab discards everything.

- **Export** downloads the whole app state — the workout being edited plus the entire library — as a single `swim-workouts.cbor` file.
- **Import** reads one back, replacing whatever is currently open.

The file is [CBOR](https://cbor.io/) rather than JSON so binary payloads can be embedded later without base64 inflation. It carries a `version` field so the format can change.

Enable "Ask where to save each file" in your browser to overwrite the same file each time instead of accumulating copies in Downloads.

Writing back to a file in place would need the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API), which Firefox has objected to, Safari has never shipped, Brave disables by default, and no mobile browser implements. Download and upload work everywhere.

## Layout

```
src/
  core/   model, distance math, Garmin export, state format — no React, no DOM
  gui/    React components and browser I/O
```

`core/` has no browser dependencies, so it can be imported from Node — that's the seam a CLI would use.

## Getting Started

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## Build for Production

```bash
npm run build
cd dist && python3 -m http.server 8000 #Then open http://localhost:8000
```

Output goes to the `dist/` directory. Verify the build locally with `npm run preview`.

## Hosting

The app is a fully static bundle — no backend required. Any static host works:

- **Managed (recommended):** push the repo to GitHub Pages, Netlify, Vercel, or Cloudflare Pages. They run `npm run build` and serve `dist/` automatically.
- **Manual:** run `npm run build` locally and upload `dist/` to S3, nginx, or any static file host.

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- cbor-x
