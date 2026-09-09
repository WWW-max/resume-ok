/* eslint-disable @typescript-eslint/no-require-imports -- Isolated loader for testing actual server TypeScript. */
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.resolve(__dirname, "../..");
module.exports = function loadTs(entry, stubs = {}) {
  const cache = new Map();
  function load(filename) {
    filename = path.resolve(root, filename);
    if (cache.has(filename)) return cache.get(filename).exports;
    const loaded = { exports: {} };
    cache.set(filename, loaded);
    const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText;
    const localRequire = (id) => {
      if (Object.hasOwn(stubs, id)) return stubs[id];
      if (id === "server-only") return {};
      if (id.startsWith("@/") || id.startsWith(".")) {
        const target = id.startsWith("@/")
          ? path.join(root, id.slice(2))
          : path.resolve(path.dirname(filename), id);
        return load(target.endsWith(".ts") ? target : `${target}.ts`);
      }
      return require(id);
    };
    new Function("require", "module", "exports", source)(
      localRequire,
      loaded,
      loaded.exports
    );
    return loaded.exports;
  }
  return load(entry);
};
