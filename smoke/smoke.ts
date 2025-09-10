import { XXH } from "@adviser/ts-xxhash";

const h32 = XXH.h32("abcd", 0xabcd).toString(16);

const h64 = XXH.h64("abcd", 0xabcd).toString(16);

if (h32 !== "cda8fae4") {
  throw new Error("h32 is not correct");
}
if (h64 !== "e29f70f8b8c96df7") {
  throw new Error("h64 is not correct");
}
console.log(`All is well: ${h32} should be cda8fae4`);
console.log(`All is well: ${h64} should be e29f70f8b8c96df7`);
