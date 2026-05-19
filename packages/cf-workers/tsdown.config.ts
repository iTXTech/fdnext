import { defineConfig } from "tsdown";
import { fdnextBundleConfig, fdnextCoreDependencyPattern } from "../../build.config.ts";

export default defineConfig(
  fdnextBundleConfig({
    entry: {
      index: "src/index.ts"
    },
    deps: {
      alwaysBundle: [fdnextCoreDependencyPattern]
    },
    platform: "neutral"
  })
);
