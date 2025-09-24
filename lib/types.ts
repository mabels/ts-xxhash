export type XXHInput = string | ArrayBuffer | Uint8Array;
export type XXHSeed = number | bigint;

export function isXXHSeed(value: unknown): value is XXHSeed {
  return typeof value === "number" || typeof value === "bigint";
}

export function isXXHInput(value: unknown): value is XXHInput {
  return typeof value === "string" || value instanceof ArrayBuffer || value instanceof Uint8Array;
}

export const txtEncoder = new TextEncoder();
