import { defineConfig } from "tsdown";
import { fdnextBundleConfig, fdnextNodeBundleConfig } from "../../build.config.ts";

export default defineConfig([
  fdnextBundleConfig({
    entry: {
      index: "src/index.ts"
    },
    platform: "neutral"
  }),
  fdnextBundleConfig({
    entry: {
      decodepack: "src/decodepack/index.ts"
    },
    platform: "neutral"
  }),
  fdnextBundleConfig({
    entry: {
      runtime: "src/runtime/index.ts"
    },
    platform: "neutral"
  }),
  fdnextBundleConfig({
    entry: {
      external: "src/external.ts"
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
