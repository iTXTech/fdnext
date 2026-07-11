import { defineConfig } from "tsdown";
import { fdnextNodeBundleConfig } from "../../build.config.ts";

export default defineConfig(
  fdnextNodeBundleConfig(
    {
      entry: {
        index: "src/index.ts",
        bin: "src/bin.ts"
      }
    },
    { executable: ["dist/bin.js"] }
  )
);
