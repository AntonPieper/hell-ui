import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

import { entrypointPublicApiFiles } from './entrypoint-manifest.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const defaultDistRoot = join(root, 'dist/hell');
const splitPdfPackageName = '@hell-ui/pdf-viewer';

export function auditPackedPackage({ distRoot = defaultDistRoot, tarball, logger = console } = {}) {
  if (!tarball) throw new Error('Package pack audit requires a tarball path.');
  if (!existsSync(tarball)) throw new Error(`Package pack audit tarball missing: ${tarball}`);

  const files = packedFiles(tarball);
  const fileSet = new Set(files);
  const packageJsonPath = join(distRoot, 'package.json');
  if (!existsSync(packageJsonPath)) {
    throw new Error(`Package pack audit missing built package.json: ${packageJsonPath}`);
  }

  const packageJson = readJson(packageJsonPath);
  const failures = [];

  logPackedFiles(files, logger);
  failures.push(...findForbiddenPackedFileFailures(files));
  checkPackageBoundary(packageJson, files, failures);
  checkApfPackageJson(packageJson, fileSet, distRoot, failures);

  if (failures.length) {
    throw new Error(['Package pack audit failed:', ...failures.map((failure) => `- ${failure}`)].join('\n'));
  }

  logger.log(`[package-pack-audit] ok: ${files.length} packed files audited for ${packageJson.name}`);
  return { files, packageJson };
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
      label: 'generated docs package alias',
      pattern: /(^|\/)(?:projects\/hell-docs\/node_modules|node_modules\/@hell-ui\/angular|dist\/hell)(?:\/|$)/,
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

function checkApfPackageJson(packageJson, fileSet, distRoot, failures) {
  if (packageJson.type !== 'module') failures.push('APF package.json must declare "type": "module"');

  const exportsMap = packageJson.exports;
  if (!exportsMap || typeof exportsMap !== 'object' || Array.isArray(exportsMap)) {
    failures.push('APF package.json must declare an object exports map');
    return;
  }

  const packageJsonExport = exportsMap['./package.json'];
  if (packageJsonExport?.default !== './package.json') {
    failures.push('APF exports must expose ./package.json with default ./package.json');
  }

  if (!Array.isArray(packageJson.sideEffects) || !packageJson.sideEffects.includes('**/*.css')) {
    failures.push('APF package.json sideEffects must include **/*.css for style entry points');
  }

  checkPublishMetadata(packageJson, failures);

  const expectedCodeExports = expectedCodeExportKeys(packageJson.name);
  for (const key of expectedCodeExports) {
    checkCodeExport(key, exportsMap[key], fileSet, distRoot, failures);
  }

  for (const [key, exportValue] of Object.entries(exportsMap)) {
    if (key === './package.json' || expectedCodeExports.has(key)) continue;

    if (isStyleExport(exportValue)) {
      checkStyleExport(key, exportValue, fileSet, failures);
      continue;
    }

    failures.push(`APF exports contains unexpected non-style export ${key}`);
  }
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
  if (packageName === splitPdfPackageName) return 'projects/hell-pdf-viewer';
  return 'projects/hell';
}

export function findPackageBoundaryFailures(packageJson, files) {
  const failures = [];
  checkPackageBoundary(packageJson, files, failures);
  return failures;
}

function checkPackageBoundary(packageJson, files, failures) {
  if (packageJson.name !== '@hell-ui/angular') return;

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
}

function expectedCodeExportKeys(packageName) {
  if (packageName === splitPdfPackageName) return new Set(['.']);

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

function checkCodeExport(key, exportValue, fileSet, distRoot, failures) {
  if (!exportValue || typeof exportValue !== 'object' || Array.isArray(exportValue)) {
    failures.push(`APF code export ${key} must be an object with types/default conditions`);
    return;
  }

  const types = checkExportTarget(key, 'types', exportValue.types, '.d.ts', 'types/', fileSet, failures);
  const fesm = checkExportTarget(key, 'default', exportValue.default, '.mjs', 'fesm2022/', fileSet, failures);

  if (key === '.') return;

  const packageJsonPath = `${key.slice(2)}/package.json`;
  if (!fileSet.has(packageJsonPath)) {
    failures.push(`Secondary entry point ${key} is missing packed ${packageJsonPath}`);
    return;
  }

  const diskPackageJsonPath = join(distRoot, packageJsonPath);
  if (!existsSync(diskPackageJsonPath)) {
    failures.push(`Secondary entry point ${key} is missing built ${packageJsonPath}`);
    return;
  }

  if (!types || !fesm) return;

  const secondaryPackage = readJson(diskPackageJsonPath);
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

function checkExportTarget(key, condition, rawTarget, extension, directory, fileSet, failures) {
  const target = normalizeExportTarget(rawTarget);
  if (!target) {
    failures.push(`APF export ${key}.${condition} must point at a ${extension} file`);
    return null;
  }
  if (!target.startsWith(directory) || !target.endsWith(extension)) {
    failures.push(`APF export ${key}.${condition} must point at ${directory}*${extension}; found ${rawTarget}`);
    return target;
  }
  if (!fileSet.has(target)) {
    failures.push(`APF export ${key}.${condition} points at ${rawTarget}, missing from packed files`);
  }
  return target;
}

function isStyleExport(exportValue) {
  return !!exportValue && typeof exportValue === 'object' && !Array.isArray(exportValue) && 'style' in exportValue;
}

function checkStyleExport(key, exportValue, fileSet, failures) {
  for (const condition of ['style', 'default']) {
    const target = normalizeExportTarget(exportValue[condition]);
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
