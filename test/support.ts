import assert from 'node:assert/strict';
import { NormalizeError } from '../src/core/utils.ts';

export function assertNormalizeError(fn: () => unknown, containing: string): void {
  try {
    fn();
  } catch (err) {
    if (err instanceof NormalizeError && err.message.includes(containing)) return;
    throw err;
  }
  assert.fail(`expected NormalizeError containing "${containing}"`);
}
