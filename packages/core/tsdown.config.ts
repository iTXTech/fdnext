import { defineConfig } from "tsdown";
import { fdnextBundleConfig, fdnextNodeBundleConfig } from "../../build.config.ts";

export default defineConfig([
  fdnextBundleConfig({
    entry: {
      index: "src/index.ts",
      decodepack: "src/decodepack/index.ts",
      runtime: "src/runtime/index.ts"
    },
    platform: "neutral"
  }),
  fdnextNodeBundleConfig(
    {
      entry: {
        cli: "src/cli/index.ts"
      }
    },
    { executable: ["dist/cli.js"] }
  )
]);
