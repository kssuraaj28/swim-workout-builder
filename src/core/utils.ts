/** Accumulator for normalize warnings. Add-only from the outside; iterable for readers. */
export class NormalizeWarnings {
  #list: string[] = [];

  add(message: string): void {
    this.#list.push(message);
  }

  /** Merge another accumulator's messages into this one. */
  merge(other: NormalizeWarnings): void {
    for (const m of other) this.add(m);
  }

  get length(): number {
    return this.#list.length;
  }

  some(predicate: (message: string) => boolean): boolean {
    return this.#list.some(predicate);
  }

  [Symbol.iterator](): Iterator<string> {
    return this.#list[Symbol.iterator]();
  }
}

/** A value paired with any warnings produced while normalizing it. */
export type Warned<T> = { value: T; warnings: NormalizeWarnings };

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

// Field validators used by the normalize* functions. Each takes a shared `warnings` accumulator;
// on bad input, it appends a message and returns the fallback rather than throwing.

export function asObject(value: unknown, field: string, warnings: NormalizeWarnings): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    warnings.add(`${field} was not an object; using empty object`);
    return {};
  }
  return value as Record<string, unknown>;
}

export function int(value: unknown, field: string, min: number, fallback: number, warnings: NormalizeWarnings): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min) {
    warnings.add(`${field} was ${describe(value)}; using ${fallback}`);
    return fallback;
  }
  return value;
}

export function bool(value: unknown, field: string, fallback: boolean, warnings: NormalizeWarnings): boolean {
  if (typeof value !== 'boolean') {
    warnings.add(`${field} was ${describe(value)}; using ${fallback}`);
    return fallback;
  }
  return value;
}

export function str(value: unknown, field: string, fallback: string, warnings: NormalizeWarnings): string {
  if (typeof value !== 'string') {
    warnings.add(`${field} was ${describe(value)}; using ${JSON.stringify(fallback)}`);
    return fallback;
  }
  return value;
}

export function oneOf<T extends string>(
  value: unknown, allowed: readonly T[], field: string, fallback: T, warnings: NormalizeWarnings,
): T {
  if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) {
    warnings.add(`${field} was ${describe(value)}; using ${JSON.stringify(fallback)}`);
    return fallback;
  }
  return value as T;
}

export function warnUnknown(obj: Record<string, unknown>, known: readonly string[], warnings: NormalizeWarnings): void {
  const set = new Set(known);
  for (const key of Object.keys(obj)) {
    if (!set.has(key)) warnings.add(`unknown field \`${key}\`; ignored`);
  }
}

function describe(value: unknown): string {
  if (value === undefined) return 'missing';
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'an array';
  return `${typeof value} ${JSON.stringify(value)}`;
}
