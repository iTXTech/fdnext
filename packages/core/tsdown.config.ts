import { defineConfig } from "tsdown";
import { fdnextBundleConfig } from "../../build.config.ts";

export default defineConfig(
  fdnextBundleConfig({
    entry: {
      index: "src/index.ts",
      decodepack: "src/decodepack/index.ts",
      runtime: "src/runtime/index.ts",
      cli: "src/cli/index.ts"
    },
    platform: "neutral"
  }, { executable: ["dist/cli.js"] })
);
