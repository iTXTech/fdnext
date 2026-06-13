import { defineConfig } from "tsdown";
import { fdnextCoreDependencyPattern, fdnextNodeBundleConfig } from "../../build.config.ts";

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
  )
]);
