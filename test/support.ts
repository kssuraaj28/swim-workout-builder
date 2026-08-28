import assert from 'node:assert/strict';
import type { Warned } from '../src/core/utils.ts';

/** Assert the normalized result warned at least once about the given substring. */
export function assertWarned<T>(result: Warned<T>, containing: string): void {
  if (!result.warnings.some(w => w.includes(containing))) {
    assert.fail(`expected a warning containing "${containing}"; got: ${JSON.stringify(result.warnings)}`);
  }
}

/** Assert the normalized result produced no warnings. */
export function assertClean<T>(result: Warned<T>): void {
  if (result.warnings.length > 0) {
    assert.fail(`expected no warnings; got: ${JSON.stringify(result.warnings)}`);
  }
}
