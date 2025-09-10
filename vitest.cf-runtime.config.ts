import tsconfigPaths from "vite-tsconfig-paths";
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  plugins: [tsconfigPaths()],
  test: {
    name: "cf-runtime",
    globals: true,
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.test.toml" },
      },
    },
    include: ["**/*test.?(c|m)[jt]s?(x)"],
  },
});
