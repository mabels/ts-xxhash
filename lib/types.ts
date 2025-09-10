const mask32 = 0xffffffffn;
/**
 * BigInt-based 32-bit unsigned integer operations for xxhash
 */
export class Uint32 {
  private value: bigint;

  static from(value: number | string | bigint | Uint32 | Uint64): Uint32 {
    if (value instanceof Uint32) {
      return value.clone();
    } else if (value instanceof Uint64) {
      return new Uint32(value.toNumber());
    } else {
      return new Uint32(value);
    }
  }

  constructor(value: number | string | bigint = 0) {
    this.value = BigInt(value) & mask32;
  }

  clone(): Uint32 {
    return new Uint32(this.value);
  }

  assign(other: Uint32 | bigint | number): Uint32 {
    if (other instanceof Uint32) {
      this.value = other.value;
    } else {
      this.value = BigInt(other) & mask32;
    }
    return this;
  }

  add(other: Uint32): Uint32 {
    this.value = (this.value + other.value) & mask32;
    return this;
  }

  subtract(other: Uint32): Uint32 {
    this.value = (this.value - other.value) & mask32;
    return this;
  }

  multiply(other: Uint32): Uint32 {
    this.value = (this.value * other.value) & mask32;
    return this;
  }

  xor(other: Uint32): Uint32 {
    this.value = this.value ^ other.value;
    return this;
  }

  rotl(bits: number): Uint32 {
    const n = BigInt(bits) & 31n;
    this.value = ((this.value << n) | (this.value >> (32n - n))) & mask32;
    return this;
  }

  shiftRight(bits: number): Uint32 {
    this.value = this.value >> BigInt(bits);
    return this;
  }

  fromNumber(n: number): Uint32 {
    this.value = BigInt(n) & 0xffffffffn;
    return this;
  }

  fromBits(low: number, high: number): Uint32 {
    this.value = (BigInt(high & 0xffff) << 16n) | BigInt(low & 0xffff);
    return this;
  }

  toNumber(): bigint {
    return this.value;
  }

  toString(radix?: number): string {
    const n = this.value.toString(radix || 10);
    if (radix === 16) {
      return n.padStart(8, "0");
    }
    return n;
  }
}

const mask64 = 0xffffffffffffffffn;
/**
 * BigInt-based 64-bit unsigned integer operations for xxhash64
 */
export class Uint64 {
  private value: bigint;

  static from(value: number | string | bigint | Uint32 | Uint64): Uint64 {
    if (value instanceof Uint64) {
      return value.clone();
    } else if (value instanceof Uint32) {
      return new Uint64(value.toNumber());
    } else {
      return new Uint64(value);
    }
  }

  constructor(value: number | string | bigint = 0) {
    this.value = BigInt(value) & mask64;
  }

  clone(): Uint64 {
    return new Uint64(this.value);
  }

  assign(other: Uint64 | bigint | number): Uint64 {
    if (other instanceof Uint64) {
      this.value = other.value;
    } else {
      this.value = BigInt(other) & mask64;
    }
    return this;
  }

  add(other: Uint64): Uint64 {
    this.value = (this.value + other.value) & mask64;
    return this;
  }

  subtract(other: Uint64): Uint64 {
    this.value = (this.value - other.value) & mask64;
    return this;
  }

  multiply(other: Uint64): Uint64 {
    this.value = (this.value * other.value) & mask64;
    return this;
  }

  xor(other: Uint64): Uint64 {
    this.value = this.value ^ other.value;
    return this;
  }

  rotl(bits: number): Uint64 {
    const n = BigInt(bits) & 63n;
    this.value = ((this.value << n) | (this.value >> (64n - n))) & mask64;
    return this;
  }

  shiftRight(bits: number): Uint64 {
    this.value = this.value >> BigInt(bits);
    return this;
  }

  fromNumber(n: number): Uint64 {
    this.value = BigInt(n) & mask64;
    return this;
  }

  fromBits(a00: number, a16: number, a32: number, a48: number): Uint64 {
    this.value =
      (BigInt(a48 & 0xffff) << 48n) | (BigInt(a32 & 0xffff) << 32n) | (BigInt(a16 & 0xffff) << 16n) | BigInt(a00 & 0xffff);
    return this;
  }

  toNumber(): bigint {
    return this.value;
  }
  toString(radix?: number): string {
    const n = this.value.toString(radix || 10);
    if (radix === 16) {
      return n.padStart(16, "0");
    }
    return n;
  }
}

export type XXHInput = string | ArrayBuffer | Uint8Array;
export type XXHSeed = number | bigint | Uint32 | Uint64;

export function isXXHSeed(value: unknown): value is XXHSeed {
  return typeof value === "number" || typeof value === "bigint" || value instanceof Uint32 || value instanceof Uint64;
}

export function isXXHInput(value: unknown): value is XXHInput {
  return typeof value === "string" || value instanceof ArrayBuffer || value instanceof Uint8Array;
}

export const txtEncoder = new TextEncoder();
