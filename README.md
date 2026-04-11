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

Output goes to the `dist/` directory and can be served as static files.

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
