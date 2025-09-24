/**
xxHash64 implementation using uint32 math instead of bigint
Based on the reference implementation from https://github.com/Cyan4973/xxHash

Copyright (C) 2016, Pierre Curto
MIT license
*/

import { XXHInput, XXHSeed, isXXHSeed, txtEncoder } from "./types.js";

/*
 * Constants
 */
const PRIME64_1_LOW = 0x85ebca87;
const PRIME64_1_HIGH = 0x9e3779b1;
const PRIME64_2_LOW = 0x27d4eb4f;
const PRIME64_2_HIGH = 0xc2b2ae3d;
const PRIME64_3_LOW = 0x9e3779f9;
const PRIME64_3_HIGH = 0x165667b1;
const PRIME64_4_LOW = 0xc2b2ae63;
const PRIME64_4_HIGH = 0x85ebca77;
const PRIME64_5_LOW = 0x165667c5;
const PRIME64_5_HIGH = 0x27d4eb2f;

export interface U64 {
  low: number;
  high: number;
}

export function u64(low: number, high = 0): U64 {
  return { low: low >>> 0, high: high >>> 0 };
}

export function u64Add(a: U64, b: U64): U64 {
  const low = (a.low + b.low) >>> 0;
  const carry = low < a.low ? 1 : 0;
  const high = (a.high + b.high + carry) >>> 0;
  return u64(low, high);
}

export function u64Mul(a: U64, b: U64): U64 {
  // Use the standard algorithm but be more careful about intermediate results
  const a00 = a.low & 0xffff;
  const a16 = a.low >>> 16;
  const a32 = a.high & 0xffff;
  const a48 = a.high >>> 16;

  const b00 = b.low & 0xffff;
  const b16 = b.low >>> 16;
  const b32 = b.high & 0xffff;
  const b48 = b.high >>> 16;

  let c00 = a00 * b00;
  let c16 = (c00 >>> 16) + a16 * b00;
  c00 &= 0xffff;
  c16 += (a00 * b16) >>> 0;
  // let c32 = (c16 >>> 16) & 0xffff;
  let c32 = Math.floor(c16 / 0x10000); // Handle potential overflow beyond 32 bits
  c16 &= 0xffff;
  c32 += a32 * b00 + a16 * b16 + a00 * b32;
  let c48 = Math.floor(c32 / 0x10000); // Handle potential overflow beyond 32 bits
  // let c48 = c32 >>> 16;
  c32 &= 0xffff;
  c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
  c48 &= 0xffff;

  const low = (c00 | (c16 << 16)) >>> 0;
  const high = (c32 | (c48 << 16)) >>> 0;
  return u64(low, high);
}

export function u64Xor(a: U64, b: U64): U64 {
  return u64((a.low ^ b.low) >>> 0, (a.high ^ b.high) >>> 0);
}

export function u64Rotl(value: U64, shift: number): U64 {
  const n = shift & 63;
  if (n === 0) return u64(value.low, value.high);

  if (n === 32) {
    return u64(value.high, value.low);
  }

  if (n < 32) {
    const low = ((value.low << n) | (value.high >>> (32 - n))) >>> 0;
    const high = ((value.high << n) | (value.low >>> (32 - n))) >>> 0;
    return u64(low, high);
  } else {
    const n2 = n - 32;
    const low = ((value.high << n2) | (value.low >>> (32 - n2))) >>> 0;
    const high = ((value.low << n2) | (value.high >>> (32 - n2))) >>> 0;
    return u64(low, high);
  }
}

export function u64Shr(value: U64, shift: number): U64 {
  if (shift >= 64) return u64(0, 0); // Handle 64-bit shifts first
  const n = shift & 63;
  if (n === 0) return u64(value.low, value.high);

  if (n >= 32) {
    return u64((value.high >>> (n - 32)) >>> 0, 0);
  } else {
    const low = ((value.low >>> n) | (value.high << (32 - n))) >>> 0;
    const high = (value.high >>> n) >>> 0;
    return u64(low, high);
  }
}

export function u64ToBigInt(value: U64): bigint {
  return BigInt(value.low) | (BigInt(value.high) << 32n);
}

export function bigintToU64(value: bigint): U64 {
  return u64(Number(value & 0xffffffffn), Number(value >> 32n));
}

function readU64LE(buffer: Uint8Array, offset: number): U64 {
  const low = (buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16) | (buffer[offset + 3] << 24)) >>> 0;
  const high = (buffer[offset + 4] | (buffer[offset + 5] << 8) | (buffer[offset + 6] << 16) | (buffer[offset + 7] << 24)) >>> 0;
  return u64(low, high);
}

function readU32LE(buffer: Uint8Array, offset: number): number {
  return (buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16) | (buffer[offset + 3] << 24)) >>> 0;
}

const PRIME64_1 = u64(PRIME64_1_LOW, PRIME64_1_HIGH);
const PRIME64_2 = u64(PRIME64_2_LOW, PRIME64_2_HIGH);
const PRIME64_3 = u64(PRIME64_3_LOW, PRIME64_3_HIGH);
const PRIME64_4 = u64(PRIME64_4_LOW, PRIME64_4_HIGH);
const PRIME64_5 = u64(PRIME64_5_LOW, PRIME64_5_HIGH);

function xxh64Round(acc: U64, input: U64): U64 {
  acc = u64Add(acc, u64Mul(input, PRIME64_2));
  acc = u64Rotl(acc, 31);
  acc = u64Mul(acc, PRIME64_1);
  return acc;
}

function xxh64MergeRound(acc: U64, val: U64): U64 {
  val = xxh64Round(u64(0, 0), val);
  acc = u64Xor(acc, val);
  acc = u64Mul(acc, PRIME64_1);
  acc = u64Add(acc, PRIME64_4);
  return acc;
}

export class XXH64 {
  private readonly id = Math.random().toString(36).substring(2);
  private v1: U64;
  private v2: U64;
  private v3: U64;
  private v4: U64;
  private readonly seed: U64;
  private total_len = 0;
  private memsize = 0;
  private readonly memory = new Uint8Array(32);

  constructor(seed?: XXHSeed) {
    const seedValue = typeof seed === "bigint" ? u64(Number(seed & 0xffffffffn), Number(seed >> 32n)) : u64(seed || 0, 0);

    this.seed = seedValue;
    this.v1 = u64(0, 0);
    this.v2 = u64(0, 0);
    this.v3 = u64(0, 0);
    this.v4 = u64(0, 0);
    this.#reset();
  }

  #reset(): this {
    this.v1 = u64Add(u64Add(this.seed, PRIME64_1), PRIME64_2);
    this.v2 = u64Add(this.seed, PRIME64_2);
    this.v3 = this.seed;
    this.v4 = u64Add(this.seed, u64(-PRIME64_1_LOW >>> 0, (~PRIME64_1_HIGH + (PRIME64_1_LOW ? 0 : 1)) >>> 0));
    this.total_len = 0;
    this.memsize = 0;
    return this;
  }

  update(input: XXHInput): this {
    let processedInput: Uint8Array;

    if (typeof input === "string") {
      processedInput = txtEncoder.encode(input);
    } else if (typeof ArrayBuffer !== "undefined" && input instanceof ArrayBuffer) {
      processedInput = new Uint8Array(input);
    } else {
      processedInput = input as Uint8Array;
    }

    let p = 0;
    const len = processedInput.length;
    const bEnd = p + len;

    if (len === 0) return this;

    this.total_len += len;

    if (this.memsize + len < 32) {
      this.memory.set(processedInput.subarray(0, len), this.memsize);
      this.memsize += len;
      return this;
    }

    if (this.memsize > 0) {
      this.memory.set(processedInput.subarray(0, 32 - this.memsize), this.memsize);

      this.v1 = xxh64Round(this.v1, readU64LE(this.memory, 0));
      this.v2 = xxh64Round(this.v2, readU64LE(this.memory, 8));
      this.v3 = xxh64Round(this.v3, readU64LE(this.memory, 16));
      this.v4 = xxh64Round(this.v4, readU64LE(this.memory, 24));

      p += 32 - this.memsize;
      this.memsize = 0;
    }

    if (p <= bEnd - 32) {
      const limit = bEnd - 32;

      do {
        this.v1 = xxh64Round(this.v1, readU64LE(processedInput, p));
        this.v2 = xxh64Round(this.v2, readU64LE(processedInput, p + 8));
        this.v3 = xxh64Round(this.v3, readU64LE(processedInput, p + 16));
        this.v4 = xxh64Round(this.v4, readU64LE(processedInput, p + 24));
        p += 32;
      } while (p <= limit);
    }

    if (p < bEnd) {
      this.memory.set(processedInput.subarray(p, bEnd), 0);
      this.memsize = bEnd - p;
    }

    return this;
  }

  digest(): bigint {
    const input = this.memory;
    let p = 0;
    const bEnd = this.memsize;
    let h64: U64;

    if (this.total_len >= 32) {
      h64 = u64Rotl(this.v1, 1);
      h64 = u64Add(h64, u64Rotl(this.v2, 7));
      h64 = u64Add(h64, u64Rotl(this.v3, 12));
      h64 = u64Add(h64, u64Rotl(this.v4, 18));

      h64 = xxh64MergeRound(h64, this.v1);
      h64 = xxh64MergeRound(h64, this.v2);
      h64 = xxh64MergeRound(h64, this.v3);
      h64 = xxh64MergeRound(h64, this.v4);
    } else {
      h64 = u64Add(this.seed, PRIME64_5);
    }

    h64 = u64Add(h64, u64(this.total_len, 0));

    while (p + 8 <= bEnd) {
      let k1 = readU64LE(input, p);
      k1 = xxh64Round(u64(0, 0), k1);
      h64 = u64Xor(h64, k1);
      h64 = u64Rotl(h64, 27);
      h64 = u64Mul(h64, PRIME64_1);
      h64 = u64Add(h64, PRIME64_4);
      p += 8;
    }

    if (p + 4 <= bEnd) {
      const k1 = u64Mul(u64(readU32LE(input, p), 0), PRIME64_1);
      h64 = u64Xor(h64, k1);
      h64 = u64Rotl(h64, 23);
      h64 = u64Mul(h64, PRIME64_2);
      h64 = u64Add(h64, PRIME64_3);
      p += 4;
    }

    while (p < bEnd) {
      const k1 = u64Mul(u64(input[p], 0), PRIME64_5);
      h64 = u64Xor(h64, k1);
      h64 = u64Rotl(h64, 11);
      h64 = u64Mul(h64, PRIME64_1);
      p++;
    }

    h64 = u64Xor(h64, u64Shr(h64, 33));
    h64 = u64Mul(h64, PRIME64_2);
    h64 = u64Xor(h64, u64Shr(h64, 29));
    h64 = u64Mul(h64, PRIME64_3);
    h64 = u64Xor(h64, u64Shr(h64, 32));

    this.#reset();

    return u64ToBigInt(h64);
  }

  toString(radix = 16): string {
    const digits = Math.floor((64 * Math.log(2)) / Math.log(radix));
    return this.digest().toString(radix).padStart(digits, "0");
  }

  static readonly h64 = (inputOrSeed?: XXHInput | XXHSeed, seed: XXHSeed = 0): XXH64 => {
    if (!inputOrSeed) {
      return new XXH64();
    }
    if (isXXHSeed(inputOrSeed)) {
      return new XXH64(inputOrSeed);
    }
    return new XXH64(seed).update(inputOrSeed);
  };

  static hash(input: XXHInput, seed: XXHSeed = 0): bigint {
    return new XXH64(seed).update(input).digest();
  }
}
