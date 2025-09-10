import { describe, it, expect } from "vitest";
import { XXH } from "../lib/index.js";

describe("XXH", () => {
  const seed = 0;

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
