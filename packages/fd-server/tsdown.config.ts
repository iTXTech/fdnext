import { defineConfig } from "tsdown";
import { fdnextBundleConfig, fdnextCoreDependencyPattern, fdnextNodeBundleConfig } from "../../build.config.ts";

export default defineConfig([
  fdnextNodeBundleConfig(
    {
      entry: {
        index: "src/index.ts",
        bin: "src/bin.ts"
      }
    },
    { executable: ["dist/bin.js"] }
  ),
  fdnextBundleConfig(
    {
      entry: {
        worker: "src/worker.ts"
      },
      deps: {
        alwaysBundle: [fdnextCoreDependencyPattern]
      },
      platform: "neutral"
    }
  )
]);
