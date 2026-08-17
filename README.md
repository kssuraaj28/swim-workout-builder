# Swim Workout Builder

A browser-based tool for building structured swimming workouts and exporting them as Garmin Connect-compatible JSON files.

## Layout

```
src/
  core/   model, distance math, Garmin export, state format — no React, no DOM
  gui/    React components and browser I/O
  cli/    command-line tools
```

`core/` has no browser dependencies, so `gui/` and `cli/` both import it and neither imports the other.

## CLI

Summarise a state file:

```bash
npm run inspect -- swim-workouts.cbor
```

Runs directly under Node's built-in TypeScript stripping — no build step, no transpiler. Requires Node 23.6+, where stripping is on by default.

This is why `core/` imports carry explicit `.ts` extensions: Node's ESM resolver requires them, while Vite and `tsc` accept them either way.

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
