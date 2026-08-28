import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import type { Workout } from '../core/workouts.ts';
import type { AppState } from '../core/state.ts';
import { decodeState } from '../core/state.ts';
import { calcTotalDistance } from '../core/workouts.ts';

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function loadState(path: string): AppState {
  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(readFileSync(path));
  } catch (err) {
    fail(`Cannot read ${path}: ${err instanceof Error ? err.message : String(err)}`);
  }
  const { value, warnings } = decodeState(bytes);
  for (const w of warnings) console.error(`warning: ${w}`);
  return value;
}

function unit(workout: Workout): string {
  return `${workout.poolLengthUnit}s`;
}

function describe(workout: Workout): string {
  const sets = workout.sets.length;
  return [
    `${calcTotalDistance(workout)} ${unit(workout)}`,
    `${sets} ${sets === 1 ? 'set' : 'sets'}`,
    `${workout.poolLength} ${workout.poolLengthUnit} pool`,
  ].join('  ·  ');
}

function main(): void {
  const path = process.argv[2];
  if (!path) {
    console.error('usage: node src/cli/inspect-state.ts <path-to-state.cbor>');
    process.exit(2);
  }

  const state = loadState(path);
  const { workout, library } = state;

  console.log(`${basename(path)}  (format v${state.version})`);
  console.log();

  console.log('Editing');
  if (workout.sets.length === 0) {
    console.log('  (empty)');
  } else {
    console.log(`  ${workout.name || 'Untitled'}  —  ${workout.createdAt}`);
    console.log(`  ${describe(workout)}`);
  }
  console.log();

  console.log(`Library (${library.length})`);
  if (library.length === 0) {
    console.log('  (empty)');
    return;
  }

  const width = Math.max(...library.map(w => (w.name || 'Untitled').length));
  for (const w of library) {
    console.log(`  ${w.createdAt}  ${(w.name || 'Untitled').padEnd(width)}  ${describe(w)}`);
  }

  const units = new Set(library.map(unit));
  if (units.size === 1) {
    const total = library.reduce((sum, w) => sum + calcTotalDistance(w), 0);
    console.log();
    console.log(`  ${total} ${[...units][0]} across ${library.length} workouts`);
  }
}

main();
