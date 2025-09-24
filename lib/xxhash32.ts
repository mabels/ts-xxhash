/**
xxHash implementation in pure Javascript

Copyright (C) 2013, Pierre Curto
MIT license
*/

import { XXHSeed, XXHInput, txtEncoder, isXXHSeed } from "./types.js";

/*
 * Constants
 */
const PRIME32_1 = 2654435761 >>> 0;
const PRIME32_2 = 2246822519 >>> 0;
const PRIME32_3 = 3266489917 >>> 0;
const PRIME32_4 = 668265263 >>> 0;
const PRIME32_5 = 374761393 >>> 0;

export function rotl32(value: number, n: number): number {
  // const n = shift & 31;
  return (((value << n) >>> 0) | (value >>> (32 - n))) >>> 0;
}

export function uint8To32(uint8Array: Uint8Array, i: number): number {
  return ((uint8Array[i + 3] << 24) | (uint8Array[i + 2] << 16) | (uint8Array[i + 1] << 8) | uint8Array[i]) >>> 0;
}

const nullBuffer = new Uint8Array(16);

class XXH32Result {
  private readonly hash32: number;
  constructor(hash: number) {
    this.hash32 = hash >>> 0;
  }
  toString(radix = 16): string {
    const digits = Math.floor((32 * Math.log(2)) / Math.log(radix));
    return this.hash32.toString(radix).padStart(digits, "0").toUpperCase();
    // return this.digest().toString(radix).padStart(digits, "0");
  }
  toNumber(): number {
    return this.hash32;
  }
  toBigInt(): bigint {
    return BigInt(this.hash32);
  }
  toUint8Array(): Uint8Array {
    const arr = new Uint8Array(4);
    arr[0] = this.hash32 & 0xff;
    arr[1] = (this.hash32 >> 8) & 0xff;
    arr[2] = (this.hash32 >> 16) & 0xff;
    arr[3] = (this.hash32 >> 24) & 0xff;
    return arr;
  }
}
/**
 * XXH object used as a constructor or a function
 */
export class XXH32 {
  private readonly seed: number;
  private v1 = 0;
  private v2 = 0;
  private v3 = 0;
  private v4 = 0;
  private total_len = 0;
  private memsize = 0;
  private readonly memory = new Uint8Array(16);

  constructor(seed?: XXHSeed) {
    this.seed = Number(seed || 0) >>> 0;
    this.#reset();
  }

  /**
   * Initialize the XXH instance with the given seed
   */
  #reset(): this {
    this.v1 = (this.seed + PRIME32_1 + PRIME32_2) >>> 0;
    this.v2 = (this.seed + PRIME32_2) >>> 0;
    this.v3 = this.seed >>> 0;
    this.v4 = (this.seed - PRIME32_1) >>> 0;
    this.total_len = 0;
    this.memsize = 0;
    return this;
  }

  /**
   * Add data to be computed for the XXH hash
   */
  update(input: XXHInput): this {
    let processedInput: Uint8Array;

    // Convert all strings to utf-8 first (issue #5)
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

    if (this.memsize === 0) {
      this.memory.set(nullBuffer);
    }

    if (this.memsize + len < 16) {
      // fill in tmp buffer
      // XXH_memcpy(this.memory + this.memsize, input, len)
      this.memory.set(processedInput.subarray(0, len), this.memsize);
      this.memsize += len;
      return this;
    }

    if (this.memsize > 0) {
      // some data left from previous update
      // XXH_memcpy(this.memory + this.memsize, input, 16-this.memsize);
      this.memory.set(processedInput.subarray(0, 16 - this.memsize), this.memsize);

      let p32 = 0;
      const mem = this.memory;

      this.v1 = Math.imul(rotl32(((this.v1 + Math.imul(uint8To32(mem, p32), PRIME32_2)) >>> 0) >>> 0, 13), PRIME32_1) >>> 0;
      p32 += 4;
      this.v2 = Math.imul(rotl32(((this.v2 + Math.imul(uint8To32(mem, p32), PRIME32_2)) >>> 0) >>> 0, 13), PRIME32_1) >>> 0;
      p32 += 4;
      this.v3 = Math.imul(rotl32(((this.v3 + Math.imul(uint8To32(mem, p32), PRIME32_2)) >>> 0) >>> 0, 13), PRIME32_1) >>> 0;
      p32 += 4;
      this.v4 = Math.imul(rotl32(((this.v4 + Math.imul(uint8To32(mem, p32), PRIME32_2)) >>> 0) >>> 0, 13), PRIME32_1) >>> 0;

      p += 16 - this.memsize;
      this.memsize = 0;
    }

    if (p <= bEnd - 16) {
      const limit = bEnd - 16;

      do {
        this.v1 =
          Math.imul(rotl32(((this.v1 + Math.imul(uint8To32(processedInput, p), PRIME32_2)) >>> 0) >>> 0, 13), PRIME32_1) >>> 0;
        p += 4;
        this.v2 =
          Math.imul(rotl32(((this.v2 + Math.imul(uint8To32(processedInput, p), PRIME32_2)) >>> 0) >>> 0, 13), PRIME32_1) >>> 0;
        p += 4;
        this.v3 =
          Math.imul(rotl32(((this.v3 + Math.imul(uint8To32(processedInput, p), PRIME32_2)) >>> 0) >>> 0, 13), PRIME32_1) >>> 0;
        p += 4;
        this.v4 =
          Math.imul(rotl32(((this.v4 + Math.imul(uint8To32(processedInput, p), PRIME32_2)) >>> 0) >>> 0, 13), PRIME32_1) >>> 0;
        p += 4;
      } while (p <= limit);
    }

    if (p < bEnd) {
      // XXH_memcpy(this.memory, p, bEnd-p);
      this.memory.set(processedInput.subarray(p, bEnd), this.memsize);
      this.memsize = bEnd - p;
    }

    return this;
  }

  /**
   * Finalize the XXH computation. The XXH instance is ready for reuse for the given seed
   */
  digest(): XXH32Result {
    const input = this.memory;
    let p = 0;
    const bEnd = this.memsize;
    let h32: number;

    if (this.total_len >= 16) {
      h32 = rotl32(this.v1, 1);
      h32 = (h32 + rotl32(this.v2, 7)) >>> 0;
      h32 = (h32 + rotl32(this.v3, 12)) >>> 0;
      h32 = (h32 + rotl32(this.v4, 18)) >>> 0;
    } else {
      h32 = (this.seed + PRIME32_5) >>> 0;
    }

    h32 = (h32 + this.total_len) >>> 0;

    while (p <= bEnd - 4) {
      h32 = Math.imul(rotl32((h32 + (Math.imul(uint8To32(input, p), PRIME32_3) >>> 0)) >>> 0, 17), PRIME32_4) >>> 0;
      p += 4;
    }

    while (p < bEnd) {
      h32 = Math.imul(rotl32(((h32 + Math.imul(input[p++], PRIME32_5)) >>> 0) >>> 0, 11), PRIME32_1) >>> 0;
    }

    h32 = Math.imul(h32 ^ ((h32 >>> 15) >>> 0), PRIME32_2) >>> 0;
    h32 = Math.imul(h32 ^ ((h32 >>> 13) >>> 0), PRIME32_3) >>> 0;
    h32 = (h32 ^ ((h32 >>> 16) >>> 0)) >>> 0;

    // Reset the state
    this.#reset();

    return new XXH32Result(h32);
  }

  toString(radix = 16): string {
    const digits = Math.floor((32 * Math.log(2)) / Math.log(radix));
    return this.digest().toString(radix).padStart(digits, "0").toUpperCase();
    // return this.digest().toString(radix).padStart(digits, "0");
  }

  static h32 = (inputOrSeed?: XXHInput | XXHSeed, seed: XXHSeed = 0): XXH32 => {
    if (!inputOrSeed) {
      return new XXH32();
    }
    if (isXXHSeed(inputOrSeed)) {
      return new XXH32(inputOrSeed);
    }
    return new XXH32(seed).update(inputOrSeed);
  };

  // Static method for one-shot hashing
  static hash(input: XXHInput, seed: XXHSeed = 0): XXH32Result {
    return new XXH32(seed).update(input).digest();
  }
}
