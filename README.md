# Swim Workout Builder

A browser-based tool for building structured swimming workouts and exporting them as Garmin Connect-compatible JSON files.

## Features

- Build workouts with named set groups, each containing one or more steps
- Configure per-step: distance, repetitions, stroke, intensity, equipment (multi-select), rest intervals, and notes
- Supports 25 yd, 25 m, and 50 m pools
- Live total distance calculation
- Preview mode with a clean, printable workout card
- Export to Garmin Connect JSON format

## Getting Started

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## Build for Production

```bash
npm run build
```

Output goes to the `dist/` directory. Verify the build locally with `npm run preview`.

## Hosting

The app is a fully static bundle — no backend required (state persists in `localStorage`). Any static host works:

- **Managed (recommended):** push the repo to GitHub Pages, Netlify, Vercel, or Cloudflare Pages. They run `npm run build` and serve `dist/` automatically.
- **Manual:** run `npm run build` locally and upload `dist/` to S3, nginx, or any static file host.

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
