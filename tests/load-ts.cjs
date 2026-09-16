/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

// Execute the same TS sources under Node without adding a second bundler or runtime dependency.
function loadTs(relativePath, overrides = {}) {
  const cache = new Map();
  function load(file) {
    const fullPath = path.resolve(root, file);
    if (cache.has(fullPath)) return cache.get(fullPath).exports;
    const loadedModule = { exports: {} };
    cache.set(fullPath, loadedModule);
    const source = ts.transpileModule(fs.readFileSync(fullPath, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
      fileName: fullPath,
    }).outputText;
    function localRequire(id) {
      if (Object.hasOwn(overrides, id)) return overrides[id];
      if (id === 'server-only') return {};
      if (id.startsWith('.') || id.startsWith('@/')) {
        const target = id.startsWith('@/') ? path.join(root, 'src', id.slice(2)) : path.resolve(path.dirname(fullPath), id);
        const resolved = [target, `${target}.ts`, `${target}.tsx`, path.join(target, 'index.ts')].find(p => fs.existsSync(p) && fs.statSync(p).isFile());
        if (!resolved) throw new Error(`Cannot resolve ${id} from ${file}`);
        return load(resolved);
      }
      return require(id);
    }
    new Function('require', 'module', 'exports', '__filename', '__dirname', source)(localRequire, loadedModule, loadedModule.exports, fullPath, path.dirname(fullPath));
    return loadedModule.exports;
  }
  return load(relativePath);
}
module.exports = { loadTs };
