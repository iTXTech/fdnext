import { defineConfig } from "tsdown";
import { fdnextNodeBundleConfig } from "../../build.config.ts";

export default defineConfig(
  fdnextNodeBundleConfig(
    {
      entry: {
        index: "src/index.ts",
        cli: "src/cli.ts"
      }
    },
    { executable: ["dist/cli.js"] }
  )
);
