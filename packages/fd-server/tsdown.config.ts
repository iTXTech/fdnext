import { defineConfig } from "tsdown";
import { fdnextBundleConfig, fdnextCoreDependencyPattern, fdnextNodeBundleConfig } from "../../build.config.ts";

export default defineConfig([
  fdnextNodeBundleConfig(
    {
      entry: {
        index: "src/index.ts"
      },
      deps: {
        alwaysBundle: [fdnextCoreDependencyPattern, /^@hapi\/hapi$/]
      }
    }
  ),
  fdnextNodeBundleConfig(
    {
      entry: {
        bin: "src/bin.ts"
      },
      deps: {
        alwaysBundle: [fdnextCoreDependencyPattern, /^@hapi\/hapi$/]
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
