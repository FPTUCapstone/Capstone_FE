/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');

function inspect(files) {
  const root = mkdtempSync(join(tmpdir(), 'tripmate-architecture-'));
  try {
    const config = { compilerOptions: { moduleResolution: 'bundler', module: 'esnext', paths: { '@/*': ['./src/*'] } } };
    for (const [name, source] of Object.entries({ 'tsconfig.json': JSON.stringify(config), ...files })) {
      const target = join(root, name);
      mkdirSync(resolve(target, '..'), { recursive: true });
      writeFileSync(target, source);
    }
    return require('../scripts/checkArchitecture.cjs').checkArchitecture(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function hasRule(result, rule) {
  return result.issues.some((issue) => issue.rule === rule);
}

for (const target of ['src/features/auth/session.ts', 'app/page.tsx', 'src/lib/routes.ts', 'src/lib/server/session.ts', 'src/lib/session.ts', 'src/services/transport.ts', 'src/lib/authApi.ts']) {
  test(`generic UI rejects dependency on ${target}`, () => {
    const result = inspect({
      'src/components/ui/Button.tsx': `import '${'../../../' + target}';`,
      [target]: 'export const value = 1;',
    });
    assert.ok(hasRule(result, 'generic-ui'), JSON.stringify(result.issues));
  });
}

test('generic UI follows alias and index reexports to a feature', () => {
  const result = inspect({
    'src/components/ui/Button.tsx': "import { value } from '@/lib/bridge';",
    'src/lib/bridge/index.ts': "export { value } from '@/features/auth/session';",
    'src/features/auth/session.ts': 'export const value = 1;',
  });
  const issue = result.issues.find((item) => item.rule === 'generic-ui');
  assert.deepEqual(issue.path, ['src/components/ui/Button.tsx', 'src/lib/bridge/index.ts', 'src/features/auth/session.ts']);
});

test('high-level auth/navigation composites and neutral primitive helpers are allowed', () => {
  const result = inspect({
    'src/components/navigation/Header.tsx': "import { user } from '@/features/auth/session';",
    'src/features/auth/session.ts': 'export const user = null;',
    'src/components/ui/Button.tsx': "import { size } from '@/lib/size';",
    'src/lib/size.ts': 'export const size = 16;',
  });
  assert.deepEqual(result.issues, []);
});

test('generic UI also rejects feature ownership hidden by a type-only import', () => {
  const result = inspect({
    'src/components/ui/Button.tsx': "import type { User } from '@/features/auth/types';",
    'src/features/auth/types.ts': 'export type User = { id: string };',
  });
  assert.ok(hasRule(result, 'generic-ui'));
  assert.equal(result.stats.runtimeEdges, 0);
});

test('runtime cycles include reexports and self-imports', () => {
  const result = inspect({
    'src/a.ts': "export { value } from './b';",
    'src/b.ts': "import './a'; export const value = 1;",
    'src/self.ts': "import './self';",
  });
  assert.equal(result.issues.filter((issue) => issue.rule === 'runtime-cycle').length, 2);
  assert.ok(result.issues.some((issue) => issue.path.join(' -> ') === 'src/a.ts -> src/b.ts -> src/a.ts'));
});

test('type-only declaration and inline imports/exports do not create runtime cycles', () => {
  const result = inspect({
    'src/a.ts': "import type { B } from './b'; export { type B } from './b'; export type A = B;",
    'src/b.ts': "import { type A } from './a'; export type { A } from './a'; export type B = { id: string };",
  });
  assert.deepEqual(result.issues, []);
  assert.equal(result.stats.runtimeEdges, 0);
});

test('mixed imports and exports retain their runtime edge', () => {
  const result = inspect({
    'src/a.ts': "import { type B, value } from './b'; export { type B, value } from './b';",
    'src/b.ts': "import './a'; export type B = {}; export const value = 1;",
  });
  assert.ok(hasRule(result, 'runtime-cycle'));
});

test('client transitive dependency on server-only reports the complete path', () => {
  const result = inspect({
    'src/components/View.tsx': "'use client'; import { value } from '@/lib/bridge';",
    'src/lib/bridge.ts': "export { value } from './secret';",
    'src/lib/secret.ts': "import 'server-only'; export const value = 1;",
  });
  const issue = result.issues.find((item) => item.rule === 'client-server');
  assert.deepEqual(issue.path, ['src/components/View.tsx', 'src/lib/bridge.ts', 'src/lib/secret.ts']);
});

test('server composition can import client UI and its own server-only service', () => {
  const result = inspect({
    'app/page.tsx': "import '@/components/View'; import '@/lib/secret';",
    'src/components/View.tsx': "'use client'; import type { Result } from '@/lib/secret';",
    'src/lib/secret.ts': "import 'server-only'; export type Result = string;",
  });
  assert.deepEqual(result.issues, []);
});

test('literal dynamic imports and require calls retain runtime dependencies', () => {
  const result = inspect({
    'src/components/View.tsx': "'use client'; const task = import('@/lib/bridge');",
    'src/lib/bridge.ts': "const secret = require('./secret');",
    'src/lib/secret.ts': "import 'server-only';",
  });
  assert.ok(hasRule(result, 'client-server'));
});

for (const specifier of ['./missing', '@/missing']) {
  test(`unresolved local import is reported: ${specifier}`, () => {
    const result = inspect({ 'src/value.ts': `import '${specifier}';` });
    assert.ok(hasRule(result, 'unresolved-local'));
    assert.match(result.issues[0].message, /missing/);
  });
}

test('external packages and known non-code assets are outside the source graph', () => {
  const result = inspect({
    'src/components/View.tsx': "import React from 'react'; import './view.css'; import logo from './logo.svg'; import settings from './settings.json';",
    'src/components/settings.json': '{"enabled":true}',
  });
  assert.deepEqual(result.issues, []);
  assert.equal(result.stats.modules, 1);
});

test('historical legacy and tests are not roots, but imported legacy is inspected', () => {
  const files = {
    'src/view.test.ts': "import './missing';",
    'src/__tests__/other.ts': "import './missing';",
    'src/types.d.ts': "import './missing';",
    'src/legacy/mobile/Old.ts': "import './missing';",
    'src/components/View.tsx': "'use client'; export const value = 1;",
  };
  assert.deepEqual(inspect(files).issues, []);
  const imported = inspect({ ...files, 'src/components/View.tsx': "'use client'; import '../legacy/mobile/Old';" });
  assert.ok(hasRule(imported, 'unresolved-local'));
});

test('current production graph satisfies the enforced convention boundaries', () => {
  const result = require('../scripts/checkArchitecture.cjs').checkArchitecture(resolve(__dirname, '..'));
  assert.deepEqual(result.issues, [], JSON.stringify(result.issues, null, 2));
  assert.ok(result.stats.modules > 0);
  console.log('Architecture graph:', JSON.stringify(result.stats));
});
for (const [extension, specifier] of [['ts', 'types'], ['mts', 'types.mjs'], ['cts', 'types.cjs']]) {
  test(`generic UI follows local .d.${extension} ownership directly and through reexports`, () => {
    for (const bridge of [false, true]) {
      const target = `src/features/auth/types.d.${extension}`;
      const result = inspect({
        'src/components/ui/Button.tsx': `import type { User } from '${bridge ? '@/lib/bridge' : '@/features/auth/' + specifier}';`,
        ...(bridge ? { 'src/lib/bridge.d.ts': `export type { User } from '@/features/auth/${specifier}';` } : {}),
        [target]: 'export interface User { id: string }',
      });
      assert.deepEqual(result.issues, [{
        rule: 'generic-ui',
        path: ['src/components/ui/Button.tsx', ...(bridge ? ['src/lib/bridge.d.ts'] : []), target],
        message: 'Generic UI depends on feature, route, session or service code',
      }]);
      assert.equal(result.stats.runtimeEdges, 0);
    }
  });
}

test('declarations retain ownership edges without emitting runtime imports or directives', () => {
  const result = inspect({
    'src/view.ts': "'use client'; import { value } from './types';",
    'src/types.d.ts': "'use client'; import 'server-only'; export { value } from './secret'; import './other';",
    'src/other.d.ts': "import './types';",
    'src/secret.ts': "import 'server-only'; export const value = 1;",
  });
  assert.deepEqual(result.issues, []);
  assert.equal(result.stats.allEdges, 4);
  assert.equal(result.stats.runtimeEdges, 0);
  assert.equal(result.stats.clientModules, 1);
  assert.equal(result.stats.serverOnlyModules, 1);
});

test('resolved package declarations stay outside the source graph', () => {
  const result = inspect({
    'src/view.ts': "import type { Value } from 'fixture';",
    'node_modules/fixture/package.json': '{"name":"fixture","types":"index.d.ts"}',
    'node_modules/fixture/index.d.ts': "import './missing'; export type Value = string;",
  });
  assert.deepEqual(result.issues, []);
  assert.equal(result.stats.modules, 1);
});
