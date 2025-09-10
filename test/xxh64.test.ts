import { describe, it, expect } from "vitest";
import { XXH } from "../lib/index.js";

describe("XXH64", () => {
  const seed = 0;

  describe("with small input multiple of 4", () => {
    const input = "abcd";
    const expected = "de0327b0d25d92cc".toUpperCase(); // Computed with xxHash C version

    it("should return hash in a single step", () => {
      const h = XXH.h64(input, seed).toString(16).toUpperCase();
      expect(h).toBe(expected);
    });

    it("should return hash in many steps", () => {
      const H = XXH.h64(seed);
      const h = H.update(input).digest().toString(16).toUpperCase();
      expect(h).toBe(expected);
    });
  });

  describe("with medium input multiple of 4", () => {
    const input = Array(1001).join("abcd");
    const expected = "205219d38e8898bc".toUpperCase();

    it("should return hash in a single step", () => {
      const h = XXH.h64(input, seed).toString(16).toUpperCase();
      expect(h).toBe(expected);
    });

    it("should return hash in many steps", () => {
      const H = XXH.h64(seed);
      const h = H.update(input).digest().toString(16).toUpperCase();
      expect(h).toBe(expected);
    });
  });

  describe("with small input", () => {
    const input = "abc";
    const expected = "44BC2CF5AD770999"; // Computed with xxHash C version

    it("should return hash in a single step", () => {
      const h = XXH.h64(input, seed).toString(16).toUpperCase();
      expect(h).toBe(expected);
    });

    it("should return hash in many steps", () => {
      const H = XXH.h64(seed);
      const h = H.update(input).digest().toString(16).toUpperCase();
      expect(h).toBe(expected);
    });
  });

  describe("with medium input", () => {
    const input = Array(1000).join("abc");
    const expected = "933eb85613976467".toUpperCase();

    it("should return hash in a single step", () => {
      const h = XXH.h64(input, seed).toString(16).toUpperCase();
      expect(h).toBe(expected);
    });

    it("should return hash in many steps", () => {
      const H = XXH.h64(seed);
      const h = H.update(input).digest().toString(16).toUpperCase();
      expect(h).toBe(expected);
    });
  });

  describe("with split medium input", () => {
    const input = Array(1000).join("abc");
    const expected = "933eb85613976467".toUpperCase();

    it("should return hash with split input < 32", () => {
      const H = XXH.h64(seed);
      const h = H.update(input.slice(0, 10)).update(input.slice(10)).digest().toString(16).toUpperCase();

      expect(h).toBe(expected);
    });

    it("should return hash with split input = 32", () => {
      const H = XXH.h64(seed);
      const h = H.update(input.slice(0, 32)).update(input.slice(32)).digest().toString(16).toUpperCase();

      expect(h).toBe(expected);
    });

    it("should return hash with split input > 32", () => {
      const H = XXH.h64(seed);
      const h = H.update(input.slice(0, 40)).update(input.slice(40)).digest().toString(16).toUpperCase();

      expect(h).toBe(expected);
    });
  });

  describe("with utf-8 strings", () => {
    const input = "heiå";
    const expected = "b9d3d990d2001a1a".toUpperCase(); // Computed with xxHash C version

    it("should return hash", () => {
      const h = XXH.h64(input, seed).toString(16).toUpperCase();
      expect(h).toBe(expected);
    });

    it("should return hash in many steps", () => {
      const H = XXH.h64(seed);
      const h = H.update(input).digest().toString(16).toUpperCase();
      expect(h).toBe(expected);
    });
  });

  describe("with utf-8 strings", () => {
    const input = "κόσμε";
    const expected = "da3c12b63a72dd83".toUpperCase(); // Computed with xxHash C version

    it("should return hash", () => {
      const h = XXH.h64(input, seed).toString(16).toUpperCase();
      expect(h).toBe(expected);
    });

    it("should return hash in many steps", () => {
      const H = XXH.h64(seed);
      const h = H.update(input).digest().toString(16).toUpperCase();
      expect(h).toBe(expected);
    });
  });
});
