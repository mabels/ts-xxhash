import { bench, describe } from "vitest";
import { XXH } from "../lib/index.js";
import { lorem_1mb as input } from "./lorem_1mb.txt.js";

describe("XXH Benchmark", () => {
  const seed = 0xabcd;
  bench(
    "XXH32 one step",
    () => {
      XXH.h32(input, seed).toString(16);
    },
    {
      iterations: 50, // Run exactly 1000 times
      time: 5000, // OR run for 5000ms (whichever comes first)
    },
  );

  bench(
    "XXH32 incremental",
    () => {
      XXH.h32(seed).update(input).digest().toString(16);
    },
    {
      iterations: 50, // Run exactly 1000 times
      time: 5000, // OR run for 5000ms (whichever comes first)
    },
  );

  bench(
    "XXH64 one step",
    () => {
      XXH.h64(input, seed).toString(16);
    },
    {
      iterations: 50, // Run exactly 1000 times
      time: 5000, // OR run for 5000ms (whichever comes first)
    },
  );

  bench(
    "XXH64 incremental",
    () => {
      XXH.h64(seed).update(input).digest().toString(16);
    },
    {
      iterations: 50, // Run exactly 1000 times
      time: 5000, // OR run for 5000ms (whichever comes first)
    },
  );
});
