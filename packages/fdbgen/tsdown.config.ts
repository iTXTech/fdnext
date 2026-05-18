import { defineConfig } from "tsdown";
import { fdnextCoreDependencyPattern, fdnextNodeBundleConfig } from "../../build.config.ts";

export default defineConfig([
  fdnextNodeBundleConfig(
    {
      entry: {
        index: "src/index.ts"
      },
      deps: {
        alwaysBundle: [fdnextCoreDependencyPattern]
      }
    }
  ),
  fdnextNodeBundleConfig(
    {
      entry: {
        cli: "src/cli.ts"
      },
      deps: {
        alwaysBundle: [fdnextCoreDependencyPattern]
      }
    },
    { executable: ["dist/cli.js"] }
  )
]);
