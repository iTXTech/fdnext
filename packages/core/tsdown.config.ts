import { defineConfig } from "tsdown";
import { fdnextBundleConfig, fdnextNodeBundleConfig } from "../../build.config.ts";

export default defineConfig([
  fdnextBundleConfig({
    entry: {
      index: "src/index.ts",
      decodepack: "src/decodepack/index.ts",
      runtime: "src/runtime/index.ts",
      cli: "src/cli/index.ts",
      bin: "src/cli/bin.ts"
    },
    platform: "neutral"
  }, { executable: ["dist/bin.js"] }),
  fdnextNodeBundleConfig({
    entry: {
      "node-http": "src/node-http/index.ts"
    }
  })
]);
