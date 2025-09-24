import { describe, it, expect } from "vitest";
import { u64, u64Add, u64Mul, u64Xor, u64Rotl, u64Shr, u64ToBigInt, bigintToU64 } from "../lib/xxhash64.js";

describe("U64 Math Functions", () => {
  describe("u64Add", () => {
    it("should add zero correctly", () => {
      const result = u64Add(u64(0, 0), u64(0, 0));
      expect(u64ToBigInt(result)).toBe(0n);
    });

    it("should add simple values", () => {
      const result = u64Add(u64(1, 0), u64(1, 0));
      expect(u64ToBigInt(result)).toBe(2n);
    });

    it("should handle 32-bit overflow", () => {
      const result = u64Add(u64(0xffffffff, 0), u64(1, 0));
      expect(u64ToBigInt(result)).toBe(0x100000000n);
    });

    it("should handle 64-bit overflow (wrap)", () => {
      const a = bigintToU64(0xffffffffffffffffn);
      const b = u64(1, 0);
      const result = u64Add(a, b);
      expect(u64ToBigInt(result)).toBe(0n);
    });

    it("should add large values correctly", () => {
      const a = bigintToU64(0x123456789abcdefn);
      const b = bigintToU64(0xfedcba987654321n);
      const result = u64Add(a, b);
      const expected = (0x123456789abcdefn + 0xfedcba987654321n) & 0xffffffffffffffffn;
      expect(u64ToBigInt(result)).toBe(expected);
    });
  });

  describe("u64Mul", () => {
    it("should multiply by zero", () => {
      const result = u64Mul(u64(123, 456), u64(0, 0));
      expect(u64ToBigInt(result)).toBe(0n);
    });

    it("should multiply by one", () => {
      const a = u64(123, 456);
      const result = u64Mul(a, u64(1, 0));
      expect(u64ToBigInt(result)).toBe(u64ToBigInt(a));
    });

    it("should multiply 32-bit values", () => {
      const result = u64Mul(u64(0xffffffff, 0), u64(0xffffffff, 0));
      const expected = (0xffffffffn * 0xffffffffn) & 0xffffffffffffffffn;
      expect(u64ToBigInt(result)).toBe(expected);
    });

    it("should multiply large values", () => {
      const a = bigintToU64(0x123456789abcdefn);
      const b = bigintToU64(0x2n);
      const result = u64Mul(a, b);
      const expected = (0x123456789abcdefn * 0x2n) & 0xffffffffffffffffn;
      expect(u64ToBigInt(result)).toBe(expected);
    });

    it("should multiply PRIME64 constants correctly", () => {
      const prime1 = bigintToU64(0x9e3779b185ebca87n);
      const prime2 = bigintToU64(0xc2b2ae3d27d4eb4fn);
      const result = u64Mul(prime1, prime2);
      const expected = (0x9e3779b185ebca87n * 0xc2b2ae3d27d4eb4fn) & 0xffffffffffffffffn;
      expect(u64ToBigInt(result)).toBe(expected);
    });
  });

  describe("u64Rotl", () => {
    it("should rotate by zero (no change)", () => {
      const value = bigintToU64(0x123456789abcdefn);
      const result = u64Rotl(value, 0);
      expect(u64ToBigInt(result)).toBe(0x123456789abcdefn);
    });

    it("should rotate by 1", () => {
      const value = bigintToU64(0x123456789abcdefn);
      const result = u64Rotl(value, 1);
      const expected = ((0x123456789abcdefn << 1n) | (0x123456789abcdefn >> 63n)) & 0xffffffffffffffffn;
      expect(u64ToBigInt(result)).toBe(expected);
    });

    it("should rotate by 31", () => {
      const value = bigintToU64(0x123456789abcdefn);
      const result = u64Rotl(value, 31);
      const expected = ((0x123456789abcdefn << 31n) | (0x123456789abcdefn >> 33n)) & 0xffffffffffffffffn;
      expect(u64ToBigInt(result)).toBe(expected);
    });

    it("should rotate by 32 (swap high/low)", () => {
      const value = bigintToU64(0x123456789abcdefn);
      const result = u64Rotl(value, 32);
      const expected = ((0x123456789abcdefn << 32n) | (0x123456789abcdefn >> 32n)) & 0xffffffffffffffffn;
      expect(u64ToBigInt(result)).toBe(expected);
    });

    it("should rotate by 33", () => {
      const value = bigintToU64(0x123456789abcdefn);
      const result = u64Rotl(value, 33);
      const expected = ((0x123456789abcdefn << 33n) | (0x123456789abcdefn >> 31n)) & 0xffffffffffffffffn;
      expect(u64ToBigInt(result)).toBe(expected);
    });

    it("should rotate by 63", () => {
      const value = bigintToU64(0x123456789abcdefn);
      const result = u64Rotl(value, 63);
      const expected = ((0x123456789abcdefn << 63n) | (0x123456789abcdefn >> 1n)) & 0xffffffffffffffffn;
      expect(u64ToBigInt(result)).toBe(expected);
    });

    it("should handle MSB set", () => {
      const value = bigintToU64(0x8000000000000000n);
      const result = u64Rotl(value, 1);
      const expected = ((0x8000000000000000n << 1n) | (0x8000000000000000n >> 63n)) & 0xffffffffffffffffn;
      expect(u64ToBigInt(result)).toBe(expected);
    });
  });

  describe("u64Xor", () => {
    it("should XOR with zero", () => {
      const value = bigintToU64(0x123456789abcdefn);
      const result = u64Xor(value, u64(0, 0));
      expect(u64ToBigInt(result)).toBe(0x123456789abcdefn);
    });

    it("should XOR with self (result zero)", () => {
      const value = bigintToU64(0x123456789abcdefn);
      const result = u64Xor(value, value);
      expect(u64ToBigInt(result)).toBe(0n);
    });

    it("should XOR with all ones", () => {
      const value = bigintToU64(0x123456789abcdefn);
      const allOnes = bigintToU64(0xffffffffffffffffn);
      const result = u64Xor(value, allOnes);
      expect(u64ToBigInt(result)).toBe(0x123456789abcdefn ^ 0xffffffffffffffffn);
    });

    it("should XOR alternating patterns", () => {
      const a = bigintToU64(0xaaaaaaaaaaaaaaaan);
      const b = bigintToU64(0x5555555555555555n);
      const result = u64Xor(a, b);
      expect(u64ToBigInt(result)).toBe(0xffffffffffffffffn);
    });
  });

  describe("u64Shr", () => {
    it("should shift by zero (no change)", () => {
      const value = bigintToU64(0x123456789abcdefn);
      const result = u64Shr(value, 0);
      expect(u64ToBigInt(result)).toBe(0x123456789abcdefn);
    });

    it("should shift by 1", () => {
      const value = bigintToU64(0x123456789abcdefn);
      const result = u64Shr(value, 1);
      expect(u64ToBigInt(result)).toBe(0x123456789abcdefn >> 1n);
    });

    it("should shift by 31", () => {
      const value = bigintToU64(0x123456789abcdefn);
      const result = u64Shr(value, 31);
      expect(u64ToBigInt(result)).toBe(0x123456789abcdefn >> 31n);
    });

    it("should shift by 32", () => {
      const value = bigintToU64(0x123456789abcdefn);
      const result = u64Shr(value, 32);
      expect(u64ToBigInt(result)).toBe(0x123456789abcdefn >> 32n);
    });

    it("should shift by 33", () => {
      const value = bigintToU64(0x123456789abcdefn);
      const result = u64Shr(value, 33);
      expect(u64ToBigInt(result)).toBe(0x123456789abcdefn >> 33n);
    });

    it("should shift by 63", () => {
      const value = bigintToU64(0x123456789abcdefn);
      const result = u64Shr(value, 63);
      expect(u64ToBigInt(result)).toBe(0x123456789abcdefn >> 63n);
    });

    it("should shift all bits out", () => {
      const value = bigintToU64(0xffffffffffffffffn);
      const result = u64Shr(value, 64);
      expect(u64ToBigInt(result)).toBe(0n);
    });
  });

  describe("helper functions", () => {
    it("should convert bigint to U64 and back correctly", () => {
      const testValues = [0n, 1n, 0xffffffffn, 0x100000000n, 0xffffffffffffffffn, 0x123456789abcdefn];

      for (const value of testValues) {
        const u64Val = bigintToU64(value);
        const backToBigint = u64ToBigInt(u64Val);
        expect(backToBigint).toBe(value);
      }
    });
  });
});
