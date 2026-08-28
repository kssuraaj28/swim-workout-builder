/** Thrown when input from an untrusted source (a state file, authored code) fails to match its type. */
export class NormalizeError extends Error {}

export function normalizeFail(message: string): never {
  throw new NormalizeError(message);
}


export function rejectUnknown(obj: Record<string, unknown>, required: readonly string[], optional: readonly string[]): void {
  const known = new Set<string>([...required, ...optional]);
  for (const key of Object.keys(obj)) {
    if (!known.has(key)) normalizeFail(`unknown field \`${key}\``);
  }
}

export function asObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    normalizeFail('must be an object');
  }
  return value as Record<string, unknown>;
}

export function int(value: unknown, field: string, min: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min) {
    normalizeFail(`${field} must be a whole number >= ${min}`);
  }
  return value;
}

export function bool(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') normalizeFail(`${field} must be true or false`);
  return value;
}

export function str(value: unknown, field: string): string {
  if (typeof value !== 'string') normalizeFail(`${field} must be a string`);
  return value;
}

export function oneOf<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) {
    normalizeFail(`${field} must be one of: ${allowed.join(', ')}`);
  }
  return value as T;
}

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}
