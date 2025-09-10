/**
xxHash64 implementation in pure Javascript

Copyright (C) 2016, Pierre Curto
MIT license
*/

import { Uint64, XXHInput, XXHSeed, isXXHSeed, txtEncoder } from "./types.js";

/*
 * Constants
 */
const PRIME64_1 = new Uint64("11400714785074694791");
const PRIME64_2 = new Uint64("14029467366897019727");
const PRIME64_3 = new Uint64("1609587929392839161");
const PRIME64_4 = new Uint64("9650029242287828579");
const PRIME64_5 = new Uint64("2870177450012600261");

const nullBuffer = new Uint8Array(32);

/**
 * XXH64 object used as a constructor or a function
 */
export class XXH64 {
  private readonly seed: Uint64 = new Uint64();
  private readonly v1: Uint64 = new Uint64();
  private readonly v2: Uint64 = new Uint64();
  private readonly v3: Uint64 = new Uint64();
  private readonly v4: Uint64 = new Uint64();
  private total_len = 0;
  private memsize = 0;
  private readonly memory = new Uint8Array(32);

  constructor(seed?: XXHSeed) {
    this.seed = Uint64.from(seed || 0);
    this.#reset();
  }

  /**
   * Initialize the XXH64 instance with the given seed
   */
  #reset(): this {
    this.v1.assign(this.seed).add(PRIME64_1).add(PRIME64_2);
    this.v2.assign(this.seed).add(PRIME64_2);
    this.v3.assign(this.seed);
    this.v4.assign(this.seed).subtract(PRIME64_1);
    this.total_len = 0;
    this.memsize = 0;
    return this;
  }

  /**
   * Add data to be computed for the XXH64 hash
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

    if (this.memsize + len < 32) {
      // fill in tmp buffer
      // XXH64_memcpy(this.memory + this.memsize, input, len)
      this.memory.set(processedInput.subarray(0, len), this.memsize);
      this.memsize += len;
      return this;
    }

    if (this.memsize > 0) {
      // some data left from previous update
      // XXH64_memcpy(this.memory + this.memsize, input, 32-this.memsize);
      this.memory.set(processedInput.subarray(0, 32 - this.memsize), this.memsize);

      let p64 = 0;
      let other: Uint64;
      const mem = this.memory;
      other = new Uint64().fromBits(
        (mem[p64 + 1] << 8) | mem[p64],
        (mem[p64 + 3] << 8) | mem[p64 + 2],
        (mem[p64 + 5] << 8) | mem[p64 + 4],
        (mem[p64 + 7] << 8) | mem[p64 + 6],
      );
      this.v1.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
      p64 += 8;
      other = new Uint64().fromBits(
        (mem[p64 + 1] << 8) | mem[p64],
        (mem[p64 + 3] << 8) | mem[p64 + 2],
        (mem[p64 + 5] << 8) | mem[p64 + 4],
        (mem[p64 + 7] << 8) | mem[p64 + 6],
      );
      this.v2.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
      p64 += 8;
      other = new Uint64().fromBits(
        (mem[p64 + 1] << 8) | mem[p64],
        (mem[p64 + 3] << 8) | mem[p64 + 2],
        (mem[p64 + 5] << 8) | mem[p64 + 4],
        (mem[p64 + 7] << 8) | mem[p64 + 6],
      );
      this.v3.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
      p64 += 8;
      other = new Uint64().fromBits(
        (mem[p64 + 1] << 8) | mem[p64],
        (mem[p64 + 3] << 8) | mem[p64 + 2],
        (mem[p64 + 5] << 8) | mem[p64 + 4],
        (mem[p64 + 7] << 8) | mem[p64 + 6],
      );
      this.v4.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);

      p += 32 - this.memsize;
      this.memsize = 0;
    }

    if (p <= bEnd - 32) {
      const limit = bEnd - 32;

      do {
        let other: Uint64;
        other = new Uint64().fromBits(
          (processedInput[p + 1] << 8) | processedInput[p],
          (processedInput[p + 3] << 8) | processedInput[p + 2],
          (processedInput[p + 5] << 8) | processedInput[p + 4],
          (processedInput[p + 7] << 8) | processedInput[p + 6],
        );
        this.v1.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
        p += 8;
        other = new Uint64().fromBits(
          (processedInput[p + 1] << 8) | processedInput[p],
          (processedInput[p + 3] << 8) | processedInput[p + 2],
          (processedInput[p + 5] << 8) | processedInput[p + 4],
          (processedInput[p + 7] << 8) | processedInput[p + 6],
        );
        this.v2.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
        p += 8;
        other = new Uint64().fromBits(
          (processedInput[p + 1] << 8) | processedInput[p],
          (processedInput[p + 3] << 8) | processedInput[p + 2],
          (processedInput[p + 5] << 8) | processedInput[p + 4],
          (processedInput[p + 7] << 8) | processedInput[p + 6],
        );
        this.v3.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
        p += 8;
        other = new Uint64().fromBits(
          (processedInput[p + 1] << 8) | processedInput[p],
          (processedInput[p + 3] << 8) | processedInput[p + 2],
          (processedInput[p + 5] << 8) | processedInput[p + 4],
          (processedInput[p + 7] << 8) | processedInput[p + 6],
        );
        this.v4.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
        p += 8;
      } while (p <= limit);
    }

    if (p < bEnd) {
      // XXH64_memcpy(this.memory, p, bEnd-p);
      this.memory.set(processedInput.subarray(p, bEnd), this.memsize);
      this.memsize = bEnd - p;
    }

    return this;
  }

  /**
   * Finalize the XXH64 computation. The XXH64 instance is ready for reuse for the given seed
   */
  digest(): Uint64 {
    const input = this.memory;
    let p = 0;
    const bEnd = this.memsize;
    let h64: Uint64, h: Uint64;
    const u = new Uint64();

    if (this.total_len >= 32) {
      h64 = this.v1.clone().rotl(1);
      h64.add(this.v2.clone().rotl(7));
      h64.add(this.v3.clone().rotl(12));
      h64.add(this.v4.clone().rotl(18));

      h64.xor(this.v1.clone().multiply(PRIME64_2).rotl(31).multiply(PRIME64_1));
      h64.multiply(PRIME64_1).add(PRIME64_4);

      h64.xor(this.v2.clone().multiply(PRIME64_2).rotl(31).multiply(PRIME64_1));
      h64.multiply(PRIME64_1).add(PRIME64_4);

      h64.xor(this.v3.clone().multiply(PRIME64_2).rotl(31).multiply(PRIME64_1));
      h64.multiply(PRIME64_1).add(PRIME64_4);

      h64.xor(this.v4.clone().multiply(PRIME64_2.clone()).rotl(31).multiply(PRIME64_1.clone()));
      h64.multiply(PRIME64_1).add(PRIME64_4);
    } else {
      h64 = this.seed.clone().add(PRIME64_5);
    }

    h64.add(u.fromNumber(this.total_len));

    while (p <= bEnd - 8) {
      u.fromBits(
        (input[p + 1] << 8) | input[p],
        (input[p + 3] << 8) | input[p + 2],
        (input[p + 5] << 8) | input[p + 4],
        (input[p + 7] << 8) | input[p + 6],
      );
      u.multiply(PRIME64_2).rotl(31).multiply(PRIME64_1);
      h64.xor(u.clone()).rotl(27).multiply(PRIME64_1).add(PRIME64_4);
      p += 8;
    }

    if (p + 4 <= bEnd) {
      u.fromBits((input[p + 1] << 8) | input[p], (input[p + 3] << 8) | input[p + 2], 0, 0);
      h64.xor(u.clone().multiply(PRIME64_1)).rotl(23).multiply(PRIME64_2).add(PRIME64_3);
      p += 4;
    }

    while (p < bEnd) {
      u.fromBits(input[p++], 0, 0, 0);
      h64.xor(u.clone().multiply(PRIME64_5)).rotl(11).multiply(PRIME64_1);
    }

    h = h64.clone().shiftRight(33);
    h64.xor(h).multiply(PRIME64_2);

    h = h64.clone().shiftRight(29);
    h64.xor(h).multiply(PRIME64_3);

    h = h64.clone().shiftRight(32);
    h64.xor(h);

    // Reset the state
    this.#reset();

    return h64;
  }

  toString(radix?: number): string {
    return this.digest()
      .toNumber()
      .toString(radix || 10);
  }

  static h64(inputOrSeed?: XXHInput | XXHSeed, seed: XXHSeed = 0): XXH64 {
    if (!inputOrSeed) {
      return new XXH64();
    }
    if (isXXHSeed(inputOrSeed)) {
      return new XXH64(inputOrSeed);
    }
    return new XXH64(seed).update(inputOrSeed);
  }

  // Static method for one-shot hashing
  static hash(input: XXHInput, seed: XXHSeed = 0): Uint64 {
    return new XXH64(seed).update(input).digest();
  }
}
