import { describe, it, expect } from "vitest";
import { XXH } from "../lib/index.js";
import { rotl32, uint8To32 } from "../lib/xxhash32.js";

describe("XXH", () => {
  const seed = 0;

  describe("uint8To32", () => {
    it("XXH32 rotl32", () => {
      const input = new Uint8Array([0xff, 0xff, 0xef, 0xee]);
      expect(rotl32(uint8To32(input, 0), 12)).toBe(0xffff_feee);
    });

    it("XXH32 rotl32", () => {
      const input = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
      expect(rotl32(uint8To32(input, 0), 16)).toBe(0x0201_0403);
    });

    it("XXH32 uint8To32", () => {
      const input = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
      expect(uint8To32(input, 0)).toBe(0x04030201);
    });

    it("XXH32 uint8To32", () => {
      const input = new Uint8Array([-0x01, -0x02, -0x03, -0x04]);
      expect(uint8To32(input, 0)).toBe(0xfcfdfeff);
    });

    it("XXH32 uint8To32", () => {
      const input = new Uint8Array([0xf0, 0x00, 0x00, 0x000]);
      expect(uint8To32(input, 0)).toBe(0xf0);
    });

    it("XXH32 uint8To32", () => {
      const input = new Uint8Array([0x0, 0xf0, 0x00, 0x000]);
      expect(uint8To32(input, 0)).toBe(0xf000);
    });

    it("XXH32 uint8To32", () => {
      const input = new Uint8Array([0x0, 0x0, 0xf0, 0x000]);
      expect(uint8To32(input, 0)).toBe(0xf0_0000);
    });

    it("XXH32 uint8To32", () => {
      const input = new Uint8Array([0x0, 0x0, 0x0, 0xf0]);
      expect(uint8To32(input, 0)).toBe(0xf000_0000);
    });
  });

  describe("with small input multiple of 4", () => {
    const input = "abcd";
    const expected = "A3643705"; // Computed with xxHash C version

    it("should return hash in a single step", () => {
      const h = XXH.h32(input, seed).toString(16).toUpperCase();
      expect(h).toBe(expected);
    });

    it("should return hash in many steps", () => {
      const H = XXH.h32(seed);
      const h = H.update(input).digest().toString(16).toUpperCase();
      expect(h).toBe(expected);
    });
  });

  describe("with medium input multiple of 4", () => {
    const input = Array(1001).join("abcd");
    const expected = "0E18CBEA";

    it("should return hash in a single step", () => {
      const h = XXH.h32(input, seed).toString(16).toUpperCase();
      expect(h).toBe(expected);
    });

    it("should return hash in many steps", () => {
      const H = XXH.h32(seed);
      const h = H.update(input).digest().toString(16).toUpperCase();
      expect(h).toBe(expected);
    });
  });

  describe("with small input", () => {
    const input = "abc";
    const expected = "32D153FF"; // Computed with xxHash C version

    it("should return hash in a single step", () => {
      const h = XXH.h32(input, seed).toString(16).toUpperCase();
      expect(h).toBe(expected);
    });

    it("should return hash in many steps", () => {
      const H = XXH.h32(seed);
      const h = H.update(input).digest().toString(16).toUpperCase();
      expect(h).toBe(expected);
    });
  });

  describe("with medium input", () => {
    const input = Array(1000).join("abc");
    const expected = "89DA9B6E";

    it("should return hash in a single step", () => {
      const h = XXH.h32(input, seed).toString(16).toUpperCase();
      expect(h).toBe(expected);
    });

    it("should return hash in many steps", () => {
      const H = XXH.h32(seed);
      const h = H.update(input).digest().toString(16).toUpperCase();
      expect(h).toBe(expected);
    });
  });

  describe("with split medium input", () => {
    const input = Array(1000).join("abc");
    const expected = "89DA9B6E";

    it("should return hash with split input < 16", () => {
      const H = XXH.h32(seed);
      const h = H.update(input.slice(0, 10)).update(input.slice(10)).digest().toString(16).toUpperCase();

      expect(h).toBe(expected);
    });

    it("should return hash with split input = 16", () => {
      const H = XXH.h32(seed);
      const h = H.update(input.slice(0, 16)).update(input.slice(16)).digest().toString(16).toUpperCase();

      expect(h).toBe(expected);
    });

    it("should return hash with split input > 16", () => {
      const H = XXH.h32(seed);
      const h = H.update(input.slice(0, 20)).update(input.slice(20)).digest().toString(16).toUpperCase();

      expect(h).toBe(expected);
    });
  });

  describe("with utf-8 strings", () => {
    const input = "heiå";
    const expected = "DB5ABCCC"; // Computed with xxHash C version

    it("should return hash", () => {
      const h = XXH.h32(input, seed).toString(16).toUpperCase();
      expect(h).toBe(expected);
    });

    it("should return hash in many steps", () => {
      const H = XXH.h32(seed);
      const h = H.update(input).digest().toString(16).toUpperCase();
      expect(h).toBe(expected);
    });
  });

  describe("with utf-8 strings", () => {
    const input = "κόσμε";
    const expected = "749c591f".toUpperCase(); // Computed with xxHash C version

    it("should return hash", () => {
      const h = XXH.h32(input, seed).toString(16).toUpperCase();
      expect(h).toBe(expected);
    });

    it("should return hash in many steps", () => {
      const H = XXH.h32(seed);
      const h = H.update(input).digest().toString(16).toUpperCase();
      expect(h).toBe(expected);
    });
  });
});
