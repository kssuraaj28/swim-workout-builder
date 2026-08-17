import type { AppState } from '../core/state';
import { decodeState, encodeState } from '../core/state';

export const FILE_NAME = 'swimstate.cbor';

export function downloadState(state: AppState, fileName = FILE_NAME): void {
  const bytes = encodeState(state);
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);

  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/cbor' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function readStateFromFile(file: File): Promise<AppState> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength === 0) {
    throw new Error(`${file.name} is empty.`);
  }
  return decodeState(bytes);
}
