/**
xxHash implementation in pure Javascript

Copyright (C) 2013, Pierre Curto
MIT license
*/

import { XXHSeed, XXHInput, txtEncoder, Uint32, isXXHSeed } from "./types.js";

/*
 * Constants
 */
const PRIME32_1 = new Uint32("2654435761");
const PRIME32_2 = new Uint32("2246822519");
const PRIME32_3 = new Uint32("3266489917");
const PRIME32_4 = new Uint32("668265263");
const PRIME32_5 = new Uint32("374761393");

function xxh_update(v: Uint32, low: number, high: number): Uint32 {
  const other = new Uint32().fromBits(low, high);
  return v.add(other.multiply(PRIME32_2)).rotl(13).multiply(PRIME32_1);
}

const nullBuffer = new Uint8Array(16);

/**
 * XXH object used as a constructor or a function
 */
export class XXH32 {
  private readonly seed: Uint32;
  private readonly v1: Uint32 = new Uint32();
  private readonly v2: Uint32 = new Uint32();
  private readonly v3: Uint32 = new Uint32();
  private readonly v4: Uint32 = new Uint32();
  private total_len = 0;
  private memsize = 0;
  private readonly memory: Uint8Array = new Uint8Array(16);

  constructor(seed?: XXHSeed) {
    this.seed = Uint32.from(seed || 0);
    this.#reset();
  }

  /**
   * Initialize the XXH instance with the given seed
   */
  #reset(): this {
    this.v1.assign(this.seed).add(PRIME32_1).add(PRIME32_2);
    this.v2.assign(this.seed).add(PRIME32_2);
    this.v3.assign(this.seed);
    this.v4.assign(this.seed).subtract(PRIME32_1);
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
      xxh_update(this.v1, (mem[p32 + 1] << 8) | mem[p32], (mem[p32 + 3] << 8) | mem[p32 + 2]);
      p32 += 4;
      xxh_update(this.v2, (mem[p32 + 1] << 8) | mem[p32], (mem[p32 + 3] << 8) | mem[p32 + 2]);
      p32 += 4;
      xxh_update(this.v3, (mem[p32 + 1] << 8) | mem[p32], (mem[p32 + 3] << 8) | mem[p32 + 2]);
      p32 += 4;
      xxh_update(this.v4, (mem[p32 + 1] << 8) | mem[p32], (mem[p32 + 3] << 8) | mem[p32 + 2]);

      p += 16 - this.memsize;
      this.memsize = 0;
    }

    if (p <= bEnd - 16) {
      const limit = bEnd - 16;

      do {
        xxh_update(
          this.v1,
          (processedInput[p + 1] << 8) | processedInput[p],
          (processedInput[p + 3] << 8) | processedInput[p + 2],
        );
        p += 4;
        xxh_update(
          this.v2,
          (processedInput[p + 1] << 8) | processedInput[p],
          (processedInput[p + 3] << 8) | processedInput[p + 2],
        );
        p += 4;
        xxh_update(
          this.v3,
          (processedInput[p + 1] << 8) | processedInput[p],
          (processedInput[p + 3] << 8) | processedInput[p + 2],
        );
        p += 4;
        xxh_update(
          this.v4,
          (processedInput[p + 1] << 8) | processedInput[p],
          (processedInput[p + 3] << 8) | processedInput[p + 2],
        );
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
  digest(): Uint32 {
    const input = this.memory;
    let p = 0;
    const bEnd = this.memsize;
    let h32: Uint32, h: Uint32;
    const u = new Uint32();

    if (this.total_len >= 16) {
      h32 = this.v1
        .clone()
        .rotl(1)
        .add(
          this.v2
            .clone()
            .rotl(7)
            .add(this.v3.clone().rotl(12).add(this.v4.clone().rotl(18))),
        );
    } else {
      h32 = this.seed.clone().add(PRIME32_5);
    }

    h32.add(u.fromNumber(this.total_len));

    while (p <= bEnd - 4) {
      u.fromBits((input[p + 1] << 8) | input[p], (input[p + 3] << 8) | input[p + 2]);
      h32.add(u.clone().multiply(PRIME32_3)).rotl(17).multiply(PRIME32_4.clone());
      p += 4;
    }

    while (p < bEnd) {
      u.fromBits(input[p++], 0);
      h32.add(u.clone().multiply(PRIME32_5)).rotl(11).multiply(PRIME32_1);
    }

    h = h32.clone().shiftRight(15);
    h32.xor(h).multiply(PRIME32_2);

    h = h32.clone().shiftRight(13);
    h32.xor(h).multiply(PRIME32_3);

    h = h32.clone().shiftRight(16);
    h32.xor(h);

    // Reset the state
    this.#reset();

    return h32;
  }

  toString(radix?: number): string {
    return this.digest().toString(radix);
  }

  static h32(inputOrSeed: XXHInput | XXHSeed, seed: XXHSeed = 0): XXH32 {
    if (isXXHSeed(inputOrSeed)) {
      return new XXH32(inputOrSeed);
    }
    return new XXH32(seed).update(inputOrSeed);
  }

  // Static method for one-shot hashing
  static hash(input: XXHInput, seed: XXHSeed = 0): Uint32 {
    return new XXH32(seed).update(input).digest();
  }
}
