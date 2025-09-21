import { XXH32 } from "./xxhash32.js";
import { XXH64 } from "./xxhash64.js";

export { XXH32 } from "./xxhash32.js";
export { XXH64 } from "./xxhash64.js";

export const XXH = { h32: XXH32.h32, h64: XXH64.h64 };
