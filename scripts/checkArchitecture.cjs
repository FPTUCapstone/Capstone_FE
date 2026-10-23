/* eslint-disable @typescript-eslint/no-require-imports */
// Static source guard for convention sections 3 and 5; invoked by tests/architecture.test.cjs.
// It follows literal imports/reexports/require calls, not computed module names, package
// internals, runtime authorization or unmarked privileged code. Runtime edges exclude
// explicit type-only syntax; this is a conservative source graph, not bundler output.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const codeExtension = /\.[cm]?[jt]sx?$/;
const declaration = /\.d\.[cm]?ts$/;
const assetExtension = /\.(?:css|scss|sass|less|svg|png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|eot|mp4|webm|mp3|wav|json)(?:\?.*)?$/i;
const slash = (value) => value.split(path.sep).join('/');

function importsFrom(source) {
  const dependencies = [];
  function add(specifier, runtime) {
    if (specifier && ts.isStringLiteralLike(specifier)) dependencies.push({ specifier: specifier.text, runtime });
  }
  function visit(node) {
    if (ts.isImportDeclaration(node)) {
      const clause = node.importClause;
      const named = clause?.namedBindings;
      const runtime = !clause || (!clause.isTypeOnly && (
        !!clause.name || !named || ts.isNamespaceImport(named) ||
        named.elements.length === 0 || named.elements.some((item) => !item.isTypeOnly)
      ));
      add(node.moduleSpecifier, runtime);
    } else if (ts.isExportDeclaration(node)) {
      const clause = node.exportClause;
      const runtime = !node.isTypeOnly && (!clause || !ts.isNamedExports(clause) ||
        clause.elements.length === 0 || clause.elements.some((item) => !item.isTypeOnly));
      add(node.moduleSpecifier, runtime);
    } else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
      add(node.moduleReference.expression, !node.isTypeOnly);
    } else if (ts.isCallExpression(node) && (
      node.expression.kind === ts.SyntaxKind.ImportKeyword ||
      (ts.isIdentifier(node.expression) && node.expression.text === 'require')
    )) {
      add(node.arguments[0], true);
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
      add(node.argument.literal, false);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return dependencies;
}

function productionRoots(root) {
  const files = [];
  function walk(directory) {
    if (!fs.existsSync(directory)) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        // Legacy is historical reference, but scan it normally if imported by production.
        if (!['legacy', 'tests', '__tests__', '__mocks__', 'node_modules'].includes(entry.name)) walk(target);
      } else if (codeExtension.test(entry.name) && !declaration.test(entry.name) && !/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(entry.name)) {
        files.push(target);
      }
    }
  }
  walk(path.join(root, 'app'));
  walk(path.join(root, 'src'));
  return files.sort();
}

function checkArchitecture(projectRoot) {
  const root = path.resolve(projectRoot);
  const configFile = path.join(root, 'tsconfig.json');
  const config = ts.readConfigFile(configFile, ts.sys.readFile);
  if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
  const parsed = ts.parseJsonConfigFileContent(config.config, { ...ts.sys, readDirectory: () => [] }, root);
  const configErrors = parsed.errors.filter((error) => error.code !== 18003);
  if (configErrors.length) throw new Error(configErrors.map((error) => ts.flattenDiagnosticMessageText(error.messageText, '\n')).join('\n'));
  const options = parsed.options;
  const resolverCache = ts.createModuleResolutionCache(root, (name) => ts.sys.useCaseSensitiveFileNames ? name : name.toLowerCase(), options);
  const aliases = Object.keys(options.paths ?? {}).map((pattern) => {
    const escaped = pattern.split('*').map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return new RegExp(`^${escaped.join('.*')}$`);
  });
  const nameOf = (file) => slash(path.relative(root, file));
  const isInside = (file) => {
    const name = path.relative(root, file);
    return !name.startsWith(`..${path.sep}`) && name !== '..' && !path.isAbsolute(name);
  };
  const modules = new Map();
  const issues = [];
  const roots = productionRoots(root);
  const queue = [...roots];
  for (let position = 0; position < queue.length; position += 1) {
    const file = queue[position];
    if (modules.has(file)) continue;
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const directives = [];
    for (const statement of source.statements) {
      if (!ts.isExpressionStatement(statement) || !ts.isStringLiteral(statement.expression)) break;
      directives.push(statement.expression.text);
    }
    const info = { all: new Set(), runtime: new Set(), client: !source.isDeclarationFile && directives.includes('use client'), serverOnly: false };
    modules.set(file, info);
    for (const { specifier, runtime } of importsFrom(source)) {
      if (specifier === 'server-only' && runtime && !source.isDeclarationFile) info.serverOnly = true;
      if (assetExtension.test(specifier)) continue;
      const resolved = ts.resolveModuleName(specifier, file, options, ts.sys, resolverCache).resolvedModule;
      const local = specifier.startsWith('.') || path.isAbsolute(specifier) || aliases.some((alias) => alias.test(specifier));
      if (!resolved) {
        if (local) issues.push({ rule: 'unresolved-local', path: [nameOf(file)], message: `Cannot resolve ${specifier} from ${nameOf(file)}` });
        continue;
      }
      const target = path.resolve(resolved.resolvedFileName);
      if (!isInside(target) || target.split(path.sep).includes('node_modules') || !codeExtension.test(target)) continue;
      info.all.add(target);
      // Declarations participate in ownership only, even with value import syntax.
      if (runtime && !source.isDeclarationFile && !declaration.test(target)) info.runtime.add(target);
      if (!modules.has(target)) queue.push(target);
    }
  }

  function findPath(start, edges, predicate) {
    const pending = [[start]];
    const visited = new Set([start]);
    for (let position = 0; position < pending.length; position += 1) {
      const route = pending[position];
      const file = route[route.length - 1];
      if (predicate(file)) return route;
      for (const target of modules.get(file)[edges]) {
        if (!visited.has(target)) {
          visited.add(target);
          pending.push([...route, target]);
        }
      }
    }
    return null;
  }

  function forbiddenPrimitiveDependency(file) {
    const name = nameOf(file);
    return name.startsWith('app/') || name.startsWith('src/features/') ||
      /(?:^|\/)(?:routes?|services?|sessions?|server)(?:\/|\.)/i.test(name) ||
      /(?:^|\/)[^/]*(?:Session|Service)\.[^.]+$/.test(name) ||
      /^src\/lib\/authApi\./.test(name) || modules.get(file).serverOnly;
  }
  for (const [file, info] of modules) {
    if (nameOf(file).startsWith('src/components/ui/')) {
      const route = findPath(file, 'all', (candidate) => candidate !== file && forbiddenPrimitiveDependency(candidate));
      if (route) issues.push({ rule: 'generic-ui', path: route.map(nameOf), message: 'Generic UI depends on feature, route, session or service code' });
    }
    if (info.client) {
      const route = findPath(file, 'runtime', (candidate) => modules.get(candidate).serverOnly);
      if (route) issues.push({ rule: 'client-server', path: route.map(nameOf), message: 'Client dependency reaches a server-only module' });
    }
  }

  // DFS back-edges report actual cycles (including reexports and self-imports).
  const state = new Map();
  const stack = [];
  function inspectCycles(file) {
    state.set(file, 'active');
    stack.push(file);
    for (const target of modules.get(file).runtime) {
      if (state.get(target) === 'active') {
        const route = [...stack.slice(stack.indexOf(target)), target];
        issues.push({ rule: 'runtime-cycle', path: route.map(nameOf), message: 'Runtime dependency cycle' });
      } else if (!state.has(target)) inspectCycles(target);
    }
    stack.pop();
    state.set(file, 'complete');
  }
  for (const file of modules.keys()) if (!state.has(file)) inspectCycles(file);

  const stats = {
    roots: roots.length,
    modules: modules.size,
    allEdges: [...modules.values()].reduce((total, info) => total + info.all.size, 0),
    runtimeEdges: [...modules.values()].reduce((total, info) => total + info.runtime.size, 0),
    clientModules: [...modules.values()].filter((info) => info.client).length,
    serverOnlyModules: [...modules.values()].filter((info) => info.serverOnly).length,
  };
  return { issues, stats };
}

module.exports = { checkArchitecture };
if (require.main === module) {
  const result = checkArchitecture(path.resolve(__dirname, '..'));
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.issues.length ? 1 : 0;
}
