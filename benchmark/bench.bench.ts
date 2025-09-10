import { readFileSync } from "fs";
import { resolve, join } from "path";
import { bench, describe } from "vitest";
import * as XXH from "../lib/index.js";

const inputFileName = process.argv[2] || join(__dirname, "lorem_1mb.txt");
console.log("Input file:", inputFileName);

let input: string | Buffer;
try {
  input = readFileSync(resolve(inputFileName));
} catch (error) {
  console.warn(`Could not read ${inputFileName}, using fallback string`);
  input = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(1000);
}

const seed = 0xabcd;

describe("XXH Benchmark", () => {
  bench("XXH one step", () => {
    XXH.h32(input, seed).toString(16);
  });

  bench("XXH incremental", () => {
    XXH.h32(seed).update(input).digest().toString(16);
  });
});
