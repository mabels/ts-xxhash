/**
xxHash64 implementation in pure Javascript

Copyright (C) 2016, Pierre Curto
MIT license
*/

import { XXHInput, XXHSeed, isXXHSeed, txtEncoder } from "./types.js";

/*
 * Constants
 */
const [PRIME64_1, PRIME64_2, PRIME64_3, PRIME64_4, PRIME64_5] = [
  11400714785074694791n,
  14029467366897019727n,
  1609587929392839161n,
  9650029242287828579n,
  2870177450012600261n,
];

const nullBuffer = new Uint8Array(32);

function rotl(value: bigint, shift: bigint): bigint {
  const n = shift & 63n;
  return ((value << n) & 0xffff_ffff_ffff_ffffn) | ((value & 0xffff_ffff_ffff_ffffn) >> (64n - n));
}

function uint8To64(uint8Array: Uint8Array, i: number): bigint {
  return (
    (BigInt(uint8Array[i + 7]) << 56n) |
    (BigInt(uint8Array[i + 6]) << 48n) |
    (BigInt(uint8Array[i + 5]) << 40n) |
    (BigInt(uint8Array[i + 4]) << 32n) |
    (BigInt(uint8Array[i + 3]) << 24n) |
    (BigInt(uint8Array[i + 2]) << 16n) |
    (BigInt(uint8Array[i + 1]) << 8n) |
    BigInt(uint8Array[i])
  );
}

/**
 * XXH64 object used as a constructor or a function
 */
export class XXH64 {
  private readonly id = Math.random().toString(36).substring(2);
  private readonly seed: bigint;
  private v1: bigint;
  private v2: bigint;
  private v3: bigint;
  private v4: bigint;
  private total_len: number;
  private memsize: number;
  private readonly memory = new Uint8Array(32);

  constructor(seed?: XXHSeed) {
    this.seed = BigInt(seed || 0);
    this.#reset();
  }

  /**
   * Initialize the XXH64 instance with the given seed
   */
  #reset(): this {
    this.v1 = this.seed + PRIME64_1 + PRIME64_2;
    this.v2 = this.seed + PRIME64_2;
    this.v3 = this.seed;
    this.v4 = this.seed - PRIME64_1;
    this.total_len = 0;
    this.memsize = 0;
    return this;
  }

  // uint8ArrayToBigInt64Array(uint8Array: Uint8Array, b64Array: BigInt64Array, offset: number): BigInt64Array {
  //   // const bigInt64Array = new BigInt64Array(uint8Array.length / 8);
  //   for (let i = 0; i < uint8Array.length; i += 8) {
  //     bigInt64Array[i / 8] = this.uint8ArrayToBigInt64(uint8Array, i);
  //   }
  //   return bigInt64Array;
  // }

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

    this.total_len = this.total_len + len;

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
      const mem = this.memory;

      //  this.v1.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
      this.v1 = rotl(this.v1 + uint8To64(mem, p64) * PRIME64_2, 31n) * PRIME64_1;
      p64 += 8;
      this.v2 = rotl(this.v2 + uint8To64(mem, p64) * PRIME64_2, 31n) * PRIME64_1;
      p64 += 8;
      this.v3 = rotl(this.v3 + uint8To64(mem, p64) * PRIME64_2, 31n) * PRIME64_1;
      p64 += 8;
      this.v4 = rotl(this.v4 + uint8To64(mem, p64) * PRIME64_2, 31n) * PRIME64_1;

      p += 32 - this.memsize;
      this.memsize = 0;
    }

    if (p <= bEnd - 32) {
      const limit = bEnd - 32;

      do {
        this.v1 = rotl(this.v1 + uint8To64(processedInput, p) * PRIME64_2, 31n) * PRIME64_1;
        p += 8;
        this.v2 = rotl(this.v2 + uint8To64(processedInput, p) * PRIME64_2, 31n) * PRIME64_1;
        p += 8;
        this.v3 = rotl(this.v3 + uint8To64(processedInput, p) * PRIME64_2, 31n) * PRIME64_1;
        p += 8;
        this.v4 = rotl(this.v4 + uint8To64(processedInput, p) * PRIME64_2, 31n) * PRIME64_1;
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
  digest(): bigint {
    const input = this.memory;
    let p = 0;
    const bEnd = this.memsize;
    let h64: bigint, h: bigint;


    if (this.total_len >= 32) {
      h64 = rotl(this.v1, 1n);
      h64 = h64 + rotl(this.v2, 7n);
      h64 = h64 + rotl(this.v3, 12n);
      h64 = h64 + rotl(this.v4, 18n);

      h64 = h64 ^ (rotl(this.v1 * PRIME64_2, 31n) * PRIME64_1);
      h64 = h64 * PRIME64_1 + PRIME64_4;

      h64 = h64 ^ (rotl(this.v2 * PRIME64_2, 31n) * PRIME64_1);
      h64 = h64 * PRIME64_1 + PRIME64_4;

      h64 = h64 ^ (rotl(this.v3 * PRIME64_2, 31n) * PRIME64_1);
      h64 = h64 * PRIME64_1 + PRIME64_4;

      h64 = h64 ^ (rotl(this.v4 * PRIME64_2, 31n) * PRIME64_1);
      h64 = h64 * PRIME64_1 + PRIME64_4;
    } else {
      h64 = this.seed + PRIME64_5;
    }
    h64 += BigInt(this.total_len);

    while (p <= bEnd - 8) {
      //      u.fromBits(
      //        (input[p + 1] << 8) | input[p],
      //        (input[p + 3] << 8) | input[p + 2],
      //        (input[p + 5] << 8) | input[p + 4],
      //        (input[p + 7] << 8) | input[p + 6],
      //      );
      //      u.multiply(PRIME64_2).rotl(31).multiply(PRIME64_1);
      //      h64.xor(u.clone()).rotl(27).multiply(PRIME64_1).add(PRIME64_4);

      const u = rotl(uint8To64(input, p) * PRIME64_2, 31n) * PRIME64_1;
      h64 = rotl(h64 ^ u, 27n) * PRIME64_1 + PRIME64_4;
      p += 8;
    }

    if (p + 4 <= bEnd) {
      // u.fromBits((input[p + 1] << 8) | input[p], (input[p + 3] << 8) | input[p + 2], 0, 0);
      // h64.xor(u.clone().multiply(PRIME64_1)).rotl(23).multiply(PRIME64_2).add(PRIME64_3);
      // const u = input[p + 1] << 8n | input[p] | input[p + 3] << 8n | input[p + 2] << 24n;
      const u = BigInt(
        BigInt(input[p + 0]) << 0n | 
        BigInt(input[p + 1] )<< 8n | 
        BigInt(input[p + 2] )<< 16n | 
        BigInt(input[p + 3] )<< 24n);
      // u.fromBits(, (input[p + 3] << 8) | input[p + 2], 0, 0);

      h64 = rotl(h64 ^ (u * PRIME64_1), 23n) * PRIME64_2 + PRIME64_3;
      p += 4;
    }

    while (p < bEnd) {
      // u.fromBits(input[p++], 0, 0, 0);
      // h64.xor(u.clone().multiply(PRIME64_5)).rotl(11).multiply(PRIME64_1);
      const u = BigInt(input[p++]);
      // u.fromBits(input[p++], 0, 0, 0);
      h64 = rotl(h64 ^ (u * PRIME64_5), 11n) * PRIME64_1;
      // h64.xor(u.clone().multiply(PRIME64_5)).rotl(11).multiply(PRIME64_1);
    }

    h = (h64 & 0xffff_ffff_ffff_ffffn) >> 33n;
    h64 = ((h64 ^ h) * PRIME64_2) & 0xffff_ffff_ffff_ffffn;

    h = h64 >> 29n;
    h64 = ((h64 ^ h) * PRIME64_3) & 0xffff_ffff_ffff_ffffn;

    h = h64 >> 32n;
    h64 = h64 ^ h;

    // Reset the state
    this.#reset();

    return h64; // & 0xffff_ffff_ffff_ffffn;
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

  // Static method for one-shot hashing
  static hash(input: XXHInput, seed: XXHSeed = 0): bigint {
    return new XXH64(seed).update(input).digest();
  }
}
