import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

import { entrypointPublicApiFiles, entrypointStyleExports } from './entrypoint-manifest.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const angularPackageName = '@hell-ui/angular';
export const splitPdfPackageName = '@hell-ui/pdf-viewer';

export const packagePeerGroups = Object.freeze({
  core: Object.freeze([
    '@angular/cdk',
    '@angular/common',
    '@angular/core',
    '@angular/forms',
    '@floating-ui/dom',
    '@ng-icons/core',
    'ng-primitives',
    'rxjs',
  ]),
  style: Object.freeze(['tailwindcss']),
  router: Object.freeze(['@angular/router']),
  fontAwesome: Object.freeze(['@ng-icons/font-awesome']),
  codeEditor: Object.freeze([
    '@codemirror/commands',
    '@codemirror/language',
    '@codemirror/state',
    '@codemirror/view',
    '@lezer/highlight',
  ]),
  pdfViewer: Object.freeze(['pdfjs-dist']),
  tanStackTable: Object.freeze(['@tanstack/angular-table']),
  tanStackVirtual: Object.freeze(['@tanstack/virtual-core']),
});

export const tableAdapterPeerGroup = Object.freeze([
  ...packagePeerGroups.tanStackTable,
  ...packagePeerGroups.tanStackVirtual,
]);
export const heavyFeaturePeerGroup = Object.freeze([
  ...packagePeerGroups.codeEditor,
  ...packagePeerGroups.pdfViewer,
]);

export const packageConsumerPeerTiers = new Set([
  'core',
  'primitive',
  'composite',
  'table',
  'table-tanstack',
  'audio-transcript',
  'code-editor',
  'pdf-viewer',
]);

export const peerGroupContracts = Object.freeze({
  core: { tier: 'core', peers: packagePeerGroups.core },
  'primitive-ui': { tier: 'primitive', peers: packagePeerGroups.core },
  primitive: {
    tier: 'primitive',
    peers: [...packagePeerGroups.core, ...packagePeerGroups.style],
  },
  'primitive-icons': {
    tier: 'primitive',
    peers: [
      ...packagePeerGroups.core,
      ...packagePeerGroups.style,
      ...packagePeerGroups.fontAwesome,
    ],
  },
  composite: {
    tier: 'composite',
    peers: [...packagePeerGroups.core, ...packagePeerGroups.style],
  },
  'composite-icons': {
    tier: 'composite',
    peers: [
      ...packagePeerGroups.core,
      ...packagePeerGroups.style,
      ...packagePeerGroups.fontAwesome,
    ],
  },
  table: { tier: 'table', peers: [...packagePeerGroups.core, ...packagePeerGroups.style] },
  'table-tanstack': {
    tier: 'table-tanstack',
    peers: [
      ...packagePeerGroups.core,
      ...packagePeerGroups.style,
      ...packagePeerGroups.tanStackTable,
    ],
  },
  'table-tanstack-virtual': {
    tier: 'table-tanstack',
    peers: [
      ...packagePeerGroups.core,
      ...packagePeerGroups.style,
      ...packagePeerGroups.tanStackTable,
      ...packagePeerGroups.tanStackVirtual,
    ],
  },
  'audio-transcript': {
    tier: 'audio-transcript',
    peers: [
      ...packagePeerGroups.core,
      ...packagePeerGroups.style,
      ...packagePeerGroups.fontAwesome,
    ],
  },
  'code-editor': {
    tier: 'code-editor',
    peers: [
      ...packagePeerGroups.core,
      ...packagePeerGroups.style,
      ...packagePeerGroups.codeEditor,
    ],
  },
  'pdf-viewer': {
    tier: 'pdf-viewer',
    peers: [
      ...packagePeerGroups.core,
      ...packagePeerGroups.style,
      ...packagePeerGroups.fontAwesome,
      ...packagePeerGroups.pdfViewer,
    ],
  },
});

export function auditPackedPackage({ tarball, logger = console } = {}) {
  if (!tarball) throw new Error('Package pack audit requires a tarball path.');
  if (!existsSync(tarball)) throw new Error(`Package pack audit tarball missing: ${tarball}`);

  runPackagePackAuditSelfTest();

  const files = packedFiles(tarball);
  const fileSet = new Set(files);
  const packageJson = readPackedJson(tarball, 'package.json');
  const failures = [];

  logPackedFiles(files, logger);
  failures.push(...findForbiddenPackedFileFailures(files));
  checkPackageBoundary(packageJson, files, failures);
  checkApfPackageJson(packageJson, fileSet, tarball, failures);
  checkPackageMetadata(packageJson, failures);
  checkPackagePeers(packageJson, failures);
  checkPackedFileAccounting(packageJson, tarball, files, fileSet, failures);

  if (failures.length) {
    throw new Error(['Package pack audit failed:', ...failures.map((failure) => `- ${failure}`)].join('\n'));
  }

  logger.log(`[package-pack-audit] ok: ${files.length} packed files audited for ${packageJson.name}`);
  return { files, packageJson };
}

let selfTested = false;

function runPackagePackAuditSelfTest() {
  if (selfTested) return;
  selfTested = true;

  const fixtures = [
    ['source map', ['fesm2022/hell-ui-angular.mjs.map']],
    ['secret-bearing file', ['.env.production']],
    ['test artifact or test source', ['src/button.spec.ts']],
    ['workspace node_modules leak', ['apps/docs/node_modules/@hell-ui/angular/package.json']],
    ['unexpected worker asset', ['assets/pdf.worker.min.mjs']],
  ];

  for (const [label, files] of fixtures) {
    const failures = findForbiddenPackedFileFailures(['package.json', ...files]);
    if (!failures.some((failure) => failure.includes(label))) {
      throw new Error(`Package pack audit self-test did not catch ${label}: ${files.join(', ')}`);
    }
  }

  const pdfLeakFailures = findPackageBoundaryFailures(
    { name: angularPackageName, exports: {}, peerDependencies: {}, peerDependenciesMeta: {} },
    ['package.json', 'styles/features/pdf-viewer.css'],
  );
  if (!pdfLeakFailures.some((failure) => failure.includes('split PDF viewer files'))) {
    throw new Error('Package pack audit self-test did not catch split PDF viewer files');
  }

  const legacyAliasFailures = findPackageBoundaryFailures(
    { name: angularPackageName, exports: { './data-table': {} } },
    ['package.json', 'data-table/package.json'],
  );
  if (!legacyAliasFailures.some((failure) => failure.includes('legacy table'))) {
    throw new Error('Package pack audit self-test did not catch legacy table alias files');
  }
}

function packedFiles(tarball) {
  const result = spawnSync('tar', ['-tzf', tarball], { encoding: 'utf8' });
  if (result.error) {
    throw new Error(`Unable to inspect packed package ${tarball}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`Unable to inspect packed package ${tarball}: ${result.stderr || result.stdout}`);
  }

  return result.stdout
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry) => !entry.endsWith('/'))
    .map((entry) => entry.replace(/^package\//, ''))
    .sort((a, b) => a.localeCompare(b));
}

function packedTextFile(tarball, file) {
  const result = spawnSync('tar', ['-xOf', tarball, `package/${file}`], { encoding: 'utf8' });
  if (result.error) {
    throw new Error(`Unable to read ${file} from packed package ${tarball}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`Unable to read ${file} from packed package ${tarball}: ${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

function readPackedJson(tarball, file) {
  try {
    return JSON.parse(packedTextFile(tarball, file));
  } catch (error) {
    throw new Error(`Unable to parse ${file} from packed package ${tarball}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function readPackedJsonOrFail(tarball, file, failures) {
  try {
    return readPackedJson(tarball, file);
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
    return null;
  }
}

function logPackedFiles(files, logger) {
  logger.log(`[package-pack-audit] packed files (${files.length}):`);
  for (const file of files) logger.log(`[package-pack-audit] - ${file}`);
}

export function findForbiddenPackedFileFailures(files) {
  const failures = [];
  const forbidden = [
    {
      label: 'source map',
      pattern: /\.map$/i,
    },
    {
      label: 'secret-bearing file',
      pattern: /(^|\/)(?:\.env(?:\..*)?|\.npmrc|id_rsa|id_dsa|credentials?|secrets?|service-account)(?:$|\/|\.)|\.(?:pem|p12|pfx|key|crt)$/i,
    },
    {
      label: 'test artifact or test source',
      pattern: /(^|\/)(?:__tests__|coverage|e2e|test-results)(?:\/|$)|\.(?:spec|test)\.[cm]?[jt]sx?$/i,
    },
    {
      label: 'workspace node_modules leak',
      pattern: /(^|\/)node_modules(?:\/|$)/,
    },
    {
      label: 'unexpected worker asset',
      pattern: /(^|\/)[^/]*worker[^/]*\.(?:mjs|cjs|js|ts)$/i,
    },
  ];

  for (const rule of forbidden) {
    const matches = files.filter((file) => rule.pattern.test(file));
    if (matches.length) failures.push(`Packed package includes ${rule.label}: ${matches.join(', ')}`);
  }

  return failures;
}

function checkApfPackageJson(packageJson, fileSet, tarball, failures) {
  if (![angularPackageName, splitPdfPackageName].includes(packageJson.name)) {
    failures.push(
      `APF package.json name must be ${angularPackageName} or ${splitPdfPackageName}; found ${packageJson.name ?? 'missing'}`,
    );
  }

  if (packageJson.type !== 'module') failures.push('APF package.json must declare "type": "module"');

  const exportsMap = packageJson.exports;
  if (!exportsMap || typeof exportsMap !== 'object' || Array.isArray(exportsMap)) {
    failures.push('APF package.json must declare an object exports map');
    return;
  }

  const packageJsonExport = exportsMap['./package.json'];
  checkExportConditions('./package.json', packageJsonExport, ['default'], failures);
  if (packageJsonExport?.default !== './package.json') {
    failures.push('APF exports must expose ./package.json with default ./package.json');
  }

  if (!Array.isArray(packageJson.sideEffects) || !packageJson.sideEffects.includes('**/*.css')) {
    failures.push('APF package.json sideEffects must include **/*.css for style entry points');
  }

  checkPublishMetadata(packageJson, failures);

  const expectedCodeExports = expectedCodeExportKeys(packageJson.name);
  for (const key of expectedCodeExports) {
    checkCodeExport(packageJson.name, key, exportsMap[key], fileSet, tarball, failures);
  }

  checkExpectedStyleExports(packageJson, exportsMap, fileSet, failures);

  for (const key of Object.keys(exportsMap)) {
    if (
      key === './package.json' ||
      expectedCodeExports.has(key) ||
      expectedStyleExportKeys(packageJson.name).has(key)
    ) {
      continue;
    }

    if (packageJson.name === angularPackageName && (key === './styles' || key.startsWith('./styles/'))) {
      failures.push(`@hell-ui/angular must not include legacy category style export ${key}`);
      continue;
    }

    failures.push(`APF exports contains unexpected export ${key}`);
  }
}

function checkExpectedStyleExports(packageJson, exportsMap, fileSet, failures) {
  const expectedStyleExports = expectedStyleExportTargets(packageJson.name);
  for (const [key, expectedTarget] of expectedStyleExports) {
    checkStyleExport(key, exportsMap[key], fileSet, failures, { expectedTarget });
  }
}

function expectedStyleExportKeys(packageName) {
  return new Set(expectedStyleExportTargets(packageName).keys());
}

function expectedStyleExportTargets(packageName) {
  if (packageName === splitPdfPackageName) {
    return new Map([
      ['./styles', './pdf-viewer/pdf-viewer.css'],
      ['./styles/pdf-viewer', './pdf-viewer/pdf-viewer.css'],
    ]);
  }
  if (packageName !== angularPackageName) return new Map();

  return new Map(
    entrypointStyleExports().map((styleEntry) => [styleEntry.exportPath, styleEntry.sourcePath]),
  );
}

function checkPublishMetadata(packageJson, failures) {
  if (packageJson.repository?.url !== 'git+https://github.com/AntonPieper/hell-ui.git') {
    failures.push('APF package.json repository.url must match the trusted-publishing GitHub repository');
  }
  const expectedDirectory = expectedRepositoryDirectory(packageJson.name);
  if (packageJson.repository?.directory !== expectedDirectory) {
    failures.push(`APF package.json repository.directory must be ${expectedDirectory}`);
  }
  if (packageJson.publishConfig?.registry !== 'https://registry.npmjs.org/') {
    failures.push('APF package.json publishConfig.registry must be https://registry.npmjs.org/');
  }
  if (packageJson.publishConfig?.access !== 'public') {
    failures.push('APF package.json publishConfig.access must be public');
  }
  if (packageJson.publishConfig?.provenance !== true) {
    failures.push('APF package.json publishConfig.provenance must be true');
  }
}

function expectedRepositoryDirectory(packageName) {
  if (packageName === splitPdfPackageName) return 'packages/pdf-viewer';
  return 'packages/angular';
}

function checkPackageMetadata(packageJson, failures) {
  if (!packageJson.version) failures.push('APF package.json must declare a version');
  if (!packageJson.description) failures.push('APF package.json must declare a description');

  const expectedFiles = expectedPackageFiles(packageJson.name);
  if (expectedFiles) {
    assertSameSet(
      `${packageJson.name} package.json files`,
      expectedFiles,
      packageJson.files ?? [],
      failures,
    );
  }

  const dependencies = Object.keys(packageJson.dependencies ?? {});
  const expectedDependencies = packageJson.name === angularPackageName ? ['tailwind-merge', 'tslib'] : ['tslib'];
  assertSameSet(`${packageJson.name} package dependencies`, expectedDependencies, dependencies, failures);
}

function expectedPackageFiles(packageName) {
  if (packageName === angularPackageName) {
    return [
      'README.md',
      'package.json',
      '**/package.json',
      'fesm2022/*.mjs',
      'types/*.d.ts',
      '**/*.css',
      'button/button.ts',
      'input/input.ts',
      'dialpad/dialpad.ts',
      'assets/**',
    ];
  }
  if (packageName === splitPdfPackageName) {
    return ['README.md', 'package.json', 'fesm2022/*.mjs', 'types/*.d.ts', 'pdf-viewer/**/*.css'];
  }
  return null;
}

function checkPackagePeers(packageJson, failures) {
  const peers = packageJson.peerDependencies ?? {};
  const peerNames = Object.keys(peers);
  const optionalPeers = optionalPeerNames(packageJson);

  for (const [metaPeer, meta] of Object.entries(packageJson.peerDependenciesMeta ?? {})) {
    if (!peers[metaPeer]) {
      failures.push(`${packageJson.name} package.json has peerDependenciesMeta for undeclared ${metaPeer}`);
    }
    if (meta?.optional !== true) {
      failures.push(`${packageJson.name} peerDependenciesMeta for ${metaPeer} must set optional true`);
    }
  }

  if (packageJson.name === angularPackageName) {
    const expectedOptionalPeers = [
      ...packagePeerGroups.style,
      ...packagePeerGroups.router,
      ...packagePeerGroups.fontAwesome,
      ...packagePeerGroups.tanStackTable,
      ...packagePeerGroups.tanStackVirtual,
      ...packagePeerGroups.codeEditor,
    ];
    const expectedPeers = [...packagePeerGroups.core, ...expectedOptionalPeers];
    assertSameSet('@hell-ui/angular peerDependencies', expectedPeers, peerNames, failures);
    assertSameSet(
      '@hell-ui/angular required peerDependencies',
      packagePeerGroups.core,
      requiredPeerNames(packageJson),
      failures,
    );
    assertSameSet(
      '@hell-ui/angular optional peerDependenciesMeta',
      expectedOptionalPeers,
      [...optionalPeers],
      failures,
    );

    if (peers['pdfjs-dist'] || optionalPeers.has('pdfjs-dist')) {
      failures.push('@hell-ui/angular must not advertise pdfjs-dist after the PDF viewer split');
    }
    return;
  }

  if (packageJson.name === splitPdfPackageName) {
    const expectedPeers = [
      '@angular/common',
      '@angular/core',
      angularPackageName,
      '@ng-icons/core',
      '@ng-icons/font-awesome',
      ...packagePeerGroups.pdfViewer,
      ...packagePeerGroups.style,
    ];
    const expectedRequiredPeers = expectedPeers.filter((peer) => !packagePeerGroups.style.includes(peer));
    assertSameSet('@hell-ui/pdf-viewer peerDependencies', expectedPeers, peerNames, failures);
    assertSameSet(
      '@hell-ui/pdf-viewer required peerDependencies',
      expectedRequiredPeers,
      requiredPeerNames(packageJson),
      failures,
    );
    assertSameSet(
      '@hell-ui/pdf-viewer optional peerDependenciesMeta',
      packagePeerGroups.style,
      [...optionalPeers],
      failures,
    );

    const workspaceCatalog = readWorkspaceCatalog();
    if (peers['pdfjs-dist'] !== workspaceCatalog['pdfjs-dist']) {
      failures.push(
        `@hell-ui/pdf-viewer must pin pdfjs-dist peer to workspace catalog version ${workspaceCatalog['pdfjs-dist']}`,
      );
    }

    const angularPackageJson = readJson(join(root, 'packages/angular/package.json'));
    if (peers[angularPackageName] !== angularPackageJson.version) {
      failures.push(`@hell-ui/pdf-viewer must peer ${angularPackageName}@${angularPackageJson.version}`);
    }
  }

}

function optionalPeerNames(packageJson) {
  return new Set(
    Object.entries(packageJson.peerDependenciesMeta ?? {})
      .filter(([, meta]) => meta?.optional === true)
      .map(([peer]) => peer),
  );
}

function requiredPeerNames(packageJson) {
  const optionalPeers = optionalPeerNames(packageJson);
  return Object.keys(packageJson.peerDependencies ?? {}).filter((peer) => !optionalPeers.has(peer));
}

export function findPackageBoundaryFailures(packageJson, files) {
  const failures = [];
  checkPackageBoundary(packageJson, files, failures);
  return failures;
}

function checkPackageBoundary(packageJson, files, failures) {
  if (packageJson.name === splitPdfPackageName) {
    checkPdfPackageBoundary(packageJson, files, failures);
    return;
  }
  if (packageJson.name !== angularPackageName) return;

  const pdfPeer = packageJson.peerDependencies?.['pdfjs-dist'];
  const pdfPeerMeta = packageJson.peerDependenciesMeta?.['pdfjs-dist'];
  if (pdfPeer || pdfPeerMeta) {
    failures.push('@hell-ui/angular must not advertise pdfjs-dist after the PDF viewer split');
  }

  const pdfExports = Object.keys(packageJson.exports ?? {}).filter((key) => key.includes('pdf-viewer'));
  if (pdfExports.length) {
    failures.push(`@hell-ui/angular must not export PDF viewer paths: ${pdfExports.join(', ')}`);
  }

  const leakedFiles = files.filter((file) => /(^|\/)(?:features\/pdf-viewer|styles\/(?:features|components)\/pdf-viewer\.css|types\/.*pdf-viewer|fesm2022\/.*pdf-viewer)/i.test(file));
  if (leakedFiles.length) {
    failures.push(`@hell-ui/angular package includes split PDF viewer files: ${leakedFiles.join(', ')}`);
  }

  const legacyTableExports = Object.keys(packageJson.exports ?? {}).filter((key) =>
    [
      './features/data-table',
      './features/table-utilities',
      './data-table',
      './table-virtual',
      './table-cdk',
      './styles/features/data-table',
      './styles/features/table-utilities',
    ].includes(key),
  );
  if (legacyTableExports.length) {
    failures.push(`@hell-ui/angular must not export legacy table paths: ${legacyTableExports.join(', ')}`);
  }

  const legacyTableFiles = files.filter((file) =>
    /(^|\/)(?:(?:data-table|table-virtual|table-cdk|features\/(?:data-table|table-utilities))\/package\.json|styles\/(?:features\/(?:data-table|table-utilities)|components\/(?:data-table|table-utilities|table-renderer))\.css|types\/hell-ui-angular-(?:data-table|table-virtual|table-cdk|features-(?:data-table|table-utilities))\.d\.ts)/i.test(file),
  );
  if (legacyTableFiles.length) {
    failures.push(`@hell-ui/angular package includes legacy table alias files: ${legacyTableFiles.join(', ')}`);
  }
}

function checkPdfPackageBoundary(packageJson, files, failures) {
  const exportsMap = packageJson.exports ?? {};
  for (const exportPath of Object.keys(exportsMap)) {
    if (exportPath.startsWith('./styles/components/')) {
      failures.push(`@hell-ui/pdf-viewer must not export legacy component style path ${exportPath}`);
    }
  }

  const unexpectedAngularFiles = files.filter((file) =>
    /(^|\/)(?:button|table|table-tanstack|features\/code-editor)\/package\.json|types\/hell-ui-angular(?:-|\.d\.ts)|fesm2022\/hell-ui-angular/.test(file),
  );
  if (unexpectedAngularFiles.length) {
    failures.push(`@hell-ui/pdf-viewer package includes @hell-ui/angular files: ${unexpectedAngularFiles.join(', ')}`);
  }

  const workerFiles = files.filter((file) => /(^|\/)[^/]*pdf\.worker[^/]*\.(?:mjs|cjs|js)$/i.test(file));
  if (workerFiles.length) {
    failures.push(`@hell-ui/pdf-viewer must not package pdf.js worker assets: ${workerFiles.join(', ')}`);
  }
}

function expectedCodeExportKeys(packageName) {
  if (packageName === splitPdfPackageName) return new Set(['.']);
  if (packageName !== angularPackageName) return new Set();

  return new Set(
    entrypointPublicApiFiles().map((entrypoint) => {
      if (entrypoint.specifier === packageName) return '.';
      if (entrypoint.specifier.startsWith(`${packageName}/`)) {
        return `.${entrypoint.specifier.slice(packageName.length)}`;
      }
      throw new Error(`Entrypoint ${entrypoint.id} does not belong to package ${packageName}`);
    }),
  );
}

function checkCodeExport(packageName, key, exportValue, fileSet, tarball, failures) {
  if (!exportValue || typeof exportValue !== 'object' || Array.isArray(exportValue)) {
    failures.push(`APF code export ${key} must be an object with types/default conditions`);
    return;
  }

  checkExportConditions(key, exportValue, ['types', 'default'], failures);

  const expected = expectedCodeExportTargets(packageName, key);
  const types = checkExportTarget(
    key,
    'types',
    exportValue.types,
    '.d.ts',
    'types/',
    fileSet,
    failures,
    expected.types,
  );
  const fesm = checkExportTarget(
    key,
    'default',
    exportValue.default,
    '.mjs',
    'fesm2022/',
    fileSet,
    failures,
    expected.default,
  );

  if (key === '.') return;

  const packageJsonPath = `${key.slice(2)}/package.json`;
  if (!fileSet.has(packageJsonPath)) {
    failures.push(`Secondary entry point ${key} is missing packed ${packageJsonPath}`);
    return;
  }

  if (!types || !fesm) return;

  const secondaryPackage = readPackedJsonOrFail(tarball, packageJsonPath, failures);
  if (!secondaryPackage) return;

  const packageDir = posix.dirname(packageJsonPath);
  const expectedModule = posix.relative(packageDir, fesm);
  const expectedTypings = posix.relative(packageDir, types);

  if (secondaryPackage.module !== expectedModule) {
    failures.push(
      `Secondary entry point ${key} package.json module is ${secondaryPackage.module ?? 'missing'}, expected ${expectedModule}`,
    );
  }
  if (secondaryPackage.typings !== expectedTypings) {
    failures.push(
      `Secondary entry point ${key} package.json typings is ${secondaryPackage.typings ?? 'missing'}, expected ${expectedTypings}`,
    );
  }
}

function expectedCodeExportTargets(packageName, key) {
  const packageSlug = packageName.replace(/^@/, '').replace(/\//g, '-');
  const exportSlug = key === '.' ? packageSlug : `${packageSlug}-${key.slice(2).replace(/\//g, '-')}`;
  return {
    types: `types/${exportSlug}.d.ts`,
    default: `fesm2022/${exportSlug}.mjs`,
  };
}

function checkExportTarget(key, condition, rawTarget, extension, directory, fileSet, failures, expectedTarget = null) {
  const target = normalizeExportTarget(rawTarget);
  if (!target) {
    failures.push(`APF export ${key}.${condition} must point at a ${extension} file`);
    return null;
  }
  if (!target.startsWith(directory) || !target.endsWith(extension)) {
    failures.push(`APF export ${key}.${condition} must point at ${directory}*${extension}; found ${rawTarget}`);
    return target;
  }
  if (expectedTarget && target !== expectedTarget) {
    failures.push(`APF export ${key}.${condition} must point at ./${expectedTarget}; found ${rawTarget}`);
  }
  if (!fileSet.has(target)) {
    failures.push(`APF export ${key}.${condition} points at ${rawTarget}, missing from packed files`);
  }
  return target;
}

function checkExportConditions(key, exportValue, expectedConditions, failures) {
  if (!exportValue || typeof exportValue !== 'object' || Array.isArray(exportValue)) return;

  const expected = new Set(expectedConditions);
  for (const condition of Object.keys(exportValue)) {
    if (!expected.has(condition)) {
      failures.push(`APF export ${key} must not include unexpected ${condition} condition`);
    }
  }
  for (const condition of expectedConditions) {
    if (!(condition in exportValue)) {
      failures.push(`APF export ${key} is missing ${condition} condition`);
    }
  }
}

function isStyleExport(exportValue) {
  return !!exportValue && typeof exportValue === 'object' && !Array.isArray(exportValue) && 'style' in exportValue;
}

function checkStyleExport(key, exportValue, fileSet, failures, { expectedTarget = null } = {}) {
  if (!isStyleExport(exportValue)) {
    failures.push(`Style export ${key} must be an object with style/default conditions`);
    return;
  }

  checkExportConditions(key, exportValue, ['style', 'default'], failures);

  const styleTarget = normalizeExportTarget(exportValue.style);
  const defaultTarget = normalizeExportTarget(exportValue.default);
  if (styleTarget && defaultTarget && styleTarget !== defaultTarget) {
    failures.push(`Style export ${key} style/default targets must match`);
  }

  for (const condition of ['style', 'default']) {
    const rawTarget = exportValue[condition];
    if (expectedTarget && rawTarget !== expectedTarget) {
      failures.push(
        `Style export ${key}.${condition} must point at ${expectedTarget}; found ${rawTarget ?? 'missing'}`,
      );
      continue;
    }

    const target = normalizeExportTarget(rawTarget);
    if (!target) {
      failures.push(`Style export ${key}.${condition} must point at a CSS file`);
      continue;
    }
    if (!target.endsWith('.css')) {
      failures.push(`Style export ${key}.${condition} must point at CSS; found ${exportValue[condition]}`);
      continue;
    }
    if (!matchesPackedPattern(target, fileSet)) {
      failures.push(`Style export ${key}.${condition} points at ${exportValue[condition]}, missing from packed files`);
    }
  }
}

function checkPackedFileAccounting(packageJson, tarball, files, fileSet, failures) {
  const exportsMap = packageJson.exports;
  if (!exportsMap || typeof exportsMap !== 'object' || Array.isArray(exportsMap)) return;

  const allowed = new Set(['README.md', 'package.json']);

  const packageJsonExportTarget = normalizeExportTarget(exportsMap['./package.json']?.default);
  if (packageJsonExportTarget) allowed.add(packageJsonExportTarget);

  for (const key of expectedCodeExportKeys(packageJson.name)) {
    const exportValue = exportsMap[key];
    if (!exportValue || typeof exportValue !== 'object' || Array.isArray(exportValue)) continue;

    for (const condition of ['types', 'default']) {
      const target = normalizeExportTarget(exportValue[condition]);
      if (target) allowed.add(target);
    }

    if (key !== '.') allowed.add(`${key.slice(2)}/package.json`);
  }

  for (const key of expectedStyleExportKeys(packageJson.name)) {
    const exportValue = exportsMap[key];
    if (!exportValue || typeof exportValue !== 'object' || Array.isArray(exportValue)) continue;

    for (const condition of ['style', 'default']) {
      const target = normalizeExportTarget(exportValue[condition]);
      if (target && !target.includes('*')) allowed.add(target);
      if (target?.includes('*')) {
        for (const file of files) {
          if (matchesPackedPattern(target, new Set([file]))) allowed.add(file);
        }
      }
    }
  }

  for (const file of expectedExplicitPackedFiles(packageJson.name)) {
    allowed.add(file);
    if (!fileSet.has(file)) failures.push(`${packageJson.name} package is missing expected packed file ${file}`);
  }

  addCssImportClosure(tarball, allowed, fileSet, failures);

  const unexpected = files.filter((file) => !allowed.has(file));
  if (unexpected.length) {
    failures.push(`Packed package includes unexpected files: ${unexpected.join(', ')}`);
  }
}

function expectedExplicitPackedFiles(packageName) {
  if (packageName === angularPackageName) {
    return ['button/button.ts', 'input/input.ts', 'dialpad/dialpad.ts', 'assets/hell-ui-logo.svg'];
  }
  return [];
}

function addCssImportClosure(tarball, allowed, fileSet, failures) {
  const queue = [...allowed].filter((file) => file.endsWith('.css'));
  const visited = new Set();

  while (queue.length) {
    const cssFile = queue.shift();
    if (!cssFile || visited.has(cssFile) || !fileSet.has(cssFile)) continue;
    visited.add(cssFile);

    let source;
    try {
      source = packedTextFile(tarball, cssFile);
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
      continue;
    }

    for (const specifier of cssImportSpecifiers(source)) {
      if (!specifier.startsWith('.')) continue;

      const target = posix.normalize(posix.join(posix.dirname(cssFile), specifier));
      if (target.startsWith('../') || target.startsWith('/')) {
        failures.push(`Packed CSS file ${cssFile} imports path outside package: ${specifier}`);
        continue;
      }
      if (!target.endsWith('.css')) continue;
      if (!fileSet.has(target)) {
        failures.push(`Packed CSS file ${cssFile} imports missing CSS file ${target}`);
        continue;
      }
      if (!allowed.has(target)) {
        allowed.add(target);
        queue.push(target);
      }
    }
  }
}

function cssImportSpecifiers(source) {
  return [...source.matchAll(/@import\s+(?:url\()?['"]([^'")]+)['"]\)?/g)].map(
    (match) => match[1],
  );
}

function assertSameSet(label, expected, actual, failures) {
  const expectedList = uniqueSorted(expected);
  const actualList = uniqueSorted(actual);
  if (
    expectedList.length === actualList.length &&
    expectedList.every((value, index) => value === actualList[index])
  ) {
    return;
  }

  failures.push(
    `${label} mismatch; expected ${expectedList.join(', ') || '(none)'}, found ${actualList.join(', ') || '(none)'}`,
  );
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function readWorkspaceCatalog() {
  const workspacePath = join(root, 'pnpm-workspace.yaml');
  const source = readFileSync(workspacePath, 'utf8');
  const catalog = {};
  let inCatalog = false;

  for (const line of source.split(/\r?\n/)) {
    if (/^\S/.test(line)) inCatalog = line === 'catalog:';
    if (!inCatalog || !line.startsWith('  ')) continue;

    const match = line.match(/^\s+(['"]?)([^'":]+)\1:\s+(['"]?)([^'"]+)\3\s*$/);
    if (match) catalog[match[2]] = match[4];
  }

  return catalog;
}

function normalizeExportTarget(target) {
  if (typeof target !== 'string' || !target.startsWith('./')) return null;
  if (target.includes('..')) return null;
  return target.slice(2);
}

function matchesPackedPattern(target, fileSet) {
  if (!target.includes('*')) return fileSet.has(target);

  const [prefix, suffix] = target.split('*');
  return [...fileSet].some((file) => file.startsWith(prefix) && file.endsWith(suffix));
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}
