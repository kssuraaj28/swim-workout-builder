// Shared inputs for the tests. "fixtures.ts" is the more conventional name for
// this file in most test suites, if that is what you are looking for.

import type { Workout } from '../src/core/types.ts';

// Built fresh on every call so one test cannot mutate another's input.

export function kitchenSinkWorkout(): Workout {
  return {
    name: 'Kitchen Sink',
    createdAt: '2026-08-17',
    description: 'Exercises every branch of the Garmin exporter.',
    poolLength: 25,
    poolLengthUnit: 'yard',
    sets: [
      {
        id: 'set-main',
        name: 'Main',
        iterations: 3,
        steps: [
          {
            id: 'step-repeat-fixed-rest',
            repetitions: 4,
            strokeType: 'free',
            distance: 100,
            equipment: ['fins', 'paddles'],
            track: true,
            targetPace: '1:30',
            description: 'focus on catch',
            restType: 'rest',
            restValue: 15,
          },
          {
            id: 'step-single-interval',
            repetitions: 1,
            strokeType: 'backstroke',
            distance: 200,
            equipment: [],
            track: true,
            targetPace: '',
            description: '',
            restType: 'interval',
            restValue: 210,
          },
        ],
      },
      {
        id: 'set-drills',
        name: 'Drills',
        iterations: 1,
        steps: [
          {
            id: 'step-repeat-lap-button-drill',
            repetitions: 2,
            strokeType: 'mixed',
            distance: 50,
            equipment: ['snorkel'],
            track: false,
            targetPace: '',
            description: 'catch-up',
            restType: 'lap_button',
            restValue: 0,
          },
          {
            id: 'step-single-no-rest',
            repetitions: 1,
            strokeType: 'breaststroke',
            distance: 100,
            equipment: [],
            track: true,
            targetPace: '',
            description: '',
            restType: 'rest',
            restValue: 0,
          },
        ],
      },
    ],
  };
}

export function metricWorkout(): Workout {
  return {
    name: 'Metric',
    createdAt: '2026-08-17',
    description: '',
    poolLength: 50,
    poolLengthUnit: 'meter',
    sets: [
      {
        id: 'set-only',
        name: '',
        iterations: 2,
        steps: [
          {
            id: 'step-only',
            repetitions: 1,
            strokeType: 'free',
            distance: 200,
            equipment: [],
            track: true,
            targetPace: '',
            description: '',
            restType: 'rest',
            restValue: 30,
          },
        ],
      },
    ],
  };
}
