import { bench, describe } from "vitest";
import { XXH } from "../lib/index.js";
import { lorem_1mb as input } from "./lorem_1mb.txt.js";

describe("XXH Benchmark", () => {
  const seed = 0xabcd;
  bench("XXH one step", () => {
    XXH.h32(input, seed).toString(16);
  });

  bench("XXH incremental", () => {
    XXH.h32(seed).update(input).digest().toString(16);
  });
});
