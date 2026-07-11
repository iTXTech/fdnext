import assert from "node:assert/strict";
import test from "node:test";
import {
  createEngine,
  getDefaultPreparedCatalog,
  prepareCatalog
} from "../../src/index";
import { getEmbeddedResourceBundle } from "../../src/resources";

test("prepared catalogs are immutable and cached by resource identity", () => {
  const resources = getEmbeddedResourceBundle();
  const first = prepareCatalog(resources);
  const second = prepareCatalog(resources);

  assert.strictEqual(first, second);
  assert.strictEqual(first, getDefaultPreparedCatalog());
  assert.ok(Object.isFrozen(first));
});

test("engines can share one prepared catalog while keeping engine configuration separate", () => {
  const catalog = getDefaultPreparedCatalog();
  const english = createEngine({ catalog, fallbackLang: "eng" });
  const chinese = createEngine({ catalog, fallbackLang: "chs" });

  assert.equal(english.getVersion(), chinese.getVersion());
  assert.equal(
    english.decodePart({ query: "MT29F64G08CBABA", lang: "eng" }).input.normalized,
    chinese.decodePart({ query: "MT29F64G08CBABA", lang: "eng" }).input.normalized
  );
});

test("catalog and raw resources cannot be supplied together", () => {
  assert.throws(
    () => createEngine({
      catalog: getDefaultPreparedCatalog(),
      resources: getEmbeddedResourceBundle()
    }),
    /mutually exclusive/
  );
});
