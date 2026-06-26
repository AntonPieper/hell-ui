import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const packageName = '@hell-ui/angular';
export const libraryRoot = 'packages/angular';
export const sourcePackageCondition = '@heinrich/source';
export const entrypointMetadataFileName = 'hell-entrypoint.json';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const libraryRootPath = join(root, libraryRoot);

export const entrypointCategories = {
  ROOT: 'root',
  CORE: 'core',
  INTERNAL: 'internal',
  TESTING: 'testing',
  STYLED_PRIMITIVE: 'styled-primitive',
  MIXED_ENTRYPOINT: 'mixed-entrypoint',
  COMPOSITE: 'composite',
  FEATURE: 'feature',
  TABLE_PRIMITIVES: 'table-primitives',
  TANSTACK_TABLE_SHELL: 'tanstack-table-shell',
  TANSTACK_TABLE_BODY_STRATEGY: 'tanstack-table-body-strategy',
};

const categorySort = new Map(
  [
    entrypointCategories.ROOT,
    entrypointCategories.CORE,
    entrypointCategories.INTERNAL,
    entrypointCategories.TESTING,
    entrypointCategories.TABLE_PRIMITIVES,
    entrypointCategories.TANSTACK_TABLE_SHELL,
    entrypointCategories.TANSTACK_TABLE_BODY_STRATEGY,
    entrypointCategories.STYLED_PRIMITIVE,
    entrypointCategories.MIXED_ENTRYPOINT,
    entrypointCategories.COMPOSITE,
    entrypointCategories.FEATURE,
  ].map((category, index) => [category, index]),
);

export const entrypointManifest = readEntrypointManifest();

export function entrypointPublicApiFiles() {
  return [entrypointManifest.root, ...entrypointManifest.entries];
}

export function secondaryPackageEntrypoints() {
  return entrypointManifest.entries.map((entrypoint) => ({
    ...entrypoint,
    packagePath: `${entrypoint.packageDir}/ng-package.json`,
  }));
}

export function entrypointTsconfigPaths() {
  return entrypointPublicApiFiles().map((entrypoint) => ({
    specifier: entrypoint.specifier,
    path: `./${entrypoint.publicApiPath}`,
  }));
}

export function entrypointPackageExports() {
  return Object.fromEntries(
    entrypointPublicApiFiles().map((entrypoint) => [
      packageExportPath(entrypoint.specifier),
      {
        [sourcePackageCondition]: `./${relativeToLibrary(entrypoint.publicApiPath)}`,
      },
    ]),
  );
}

export function entrypointStyleExports() {
  return [
    { exportPath: './tokens.css', sourcePath: './tokens.css' },
    ...entrypointManifest.entries
      .map((entrypoint) => {
        const sourcePath = `./${relativeToLibrary(`${entrypoint.packageDir}/styles.css`)}`;
        return {
          entrypoint,
          exportPath: `${packageExportPath(entrypoint.specifier)}/styles.css`,
          sourcePath,
        };
      })
      .filter((styleEntry) => existsSync(join(root, libraryRoot, styleEntry.sourcePath.slice(2)))),
  ];
}

export function entrypointPackageStyleExports() {
  return Object.fromEntries(
    entrypointStyleExports().map((styleEntry) => [
      styleEntry.exportPath,
      {
        [sourcePackageCondition]: styleEntry.sourcePath,
        style: styleEntry.sourcePath,
        default: styleEntry.sourcePath,
      },
    ]),
  );
}

export function renderPackageJsonExports() {
  return {
    ...entrypointPackageExports(),
    ...entrypointPackageStyleExports(),
  };
}

export function renderPackageJsonFile(packageJson) {
  return `${JSON.stringify({ ...packageJson, exports: renderPackageJsonExports() }, null, 2)}\n`;
}

export function packageExportPath(specifier) {
  return specifier === packageName ? '.' : `.${specifier.slice(packageName.length)}`;
}

export function componentEntrypoints() {
  return entrypointManifest.entries.filter((entrypoint) =>
    [
      entrypointCategories.STYLED_PRIMITIVE,
      entrypointCategories.MIXED_ENTRYPOINT,
      entrypointCategories.COMPOSITE,
      entrypointCategories.FEATURE,
      entrypointCategories.TABLE_PRIMITIVES,
      entrypointCategories.TANSTACK_TABLE_SHELL,
      entrypointCategories.TANSTACK_TABLE_BODY_STRATEGY,
    ].includes(entrypoint.category),
  );
}

export function renderPublicApiFile(entrypoint) {
  const lines = [];
  if (entrypoint.header?.length) {
    lines.push(...entrypoint.header);
  }
  lines.push(...entrypoint.exports.map((exportPath) => `export * from '${exportPath}';`));
  if (entrypoint.extraExports?.length) {
    lines.push(...entrypoint.extraExports);
  }
  if (entrypoint.footer?.length) {
    lines.push('', ...entrypoint.footer);
  }
  return `${lines.join('\n')}\n`;
}

export function renderNgPackageFile(entrypoint) {
  return `${JSON.stringify({ lib: { entryFile: entrypoint.entryFile } }, null, 2)}\n`;
}

function readEntrypointManifest() {
  const entries = discoverEntrypointMetadataFiles().map(readEntrypointMetadataFile);
  const rootEntries = entries.filter(
    (entrypoint) => entrypoint.category === entrypointCategories.ROOT,
  );
  if (rootEntries.length !== 1) {
    throw new Error(
      `Expected exactly one ${entrypointMetadataFileName} with category "${entrypointCategories.ROOT}" in ${libraryRoot}; found ${rootEntries.length}`,
    );
  }
  const [rootEntry] = rootEntries;

  const secondaryEntries = entries
    .filter((entrypoint) => entrypoint !== rootEntry)
    .sort(compareEntrypoints);

  return { root: rootEntry, entries: secondaryEntries };
}

function discoverEntrypointMetadataFiles() {
  const files = [];
  visit(libraryRootPath);
  return files.sort();

  function visit(directory) {
    for (const dirent of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, dirent.name);
      if (dirent.isDirectory()) {
        visit(path);
        continue;
      }
      if (dirent.isFile() && dirent.name === entrypointMetadataFileName) {
        files.push(path);
      }
    }
  }
}

function readEntrypointMetadataFile(path) {
  const metadata = JSON.parse(readFileSync(path, 'utf8'));
  assertKnownMetadataKeys(path, metadata);
  const packageDir = toRepoPath(dirname(path));
  const relPackageDir = packageDir.slice(libraryRoot.length).replace(/^\//, '');
  const category = metadata.category;
  const validCategories = new Set(Object.values(entrypointCategories));
  if (!validCategories.has(category)) {
    throw new Error(
      `${relative(root, path)} must declare category as one of ${[...validCategories].join(', ')}`,
    );
  }

  return {
    id: relPackageDir || 'root',
    category,
    specifier: relPackageDir ? `${packageName}/${relPackageDir}` : packageName,
    packageDir,
    metadataPath: toRepoPath(path),
    publicApiPath: `${packageDir}/public-api.ts`,
    entryFile: stringValue(path, metadata, 'entryFile') ?? 'public-api.ts',
    exports: stringArray(path, metadata, 'exports') ?? defaultExports(packageDir, category),
    header: stringArray(path, metadata, 'header'),
    footer: stringArray(path, metadata, 'footer'),
    extraExports: stringArray(path, metadata, 'extraExports'),
  };
}

function assertKnownMetadataKeys(path, metadata) {
  const allowed = new Set(['category', 'entryFile', 'exports', 'header', 'footer', 'extraExports']);
  for (const key of Object.keys(metadata)) {
    if (!allowed.has(key)) {
      throw new Error(`${relative(root, path)} declares unknown entrypoint metadata key "${key}"`);
    }
  }
}

function stringValue(path, metadata, key) {
  const value = metadata[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    throw new Error(`${relative(root, path)} metadata key "${key}" must be a string`);
  }
  return value;
}

function stringArray(path, metadata, key) {
  const value = metadata[key];
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`${relative(root, path)} metadata key "${key}" must be an array of strings`);
  }
  return value;
}

function defaultExports(packageDir, category) {
  if (category === entrypointCategories.ROOT) return [];
  return [`./${basename(packageDir)}`];
}

function compareEntrypoints(a, b) {
  const categoryDelta = categoryRank(a.category) - categoryRank(b.category);
  if (categoryDelta) return categoryDelta;
  return a.packageDir.localeCompare(b.packageDir);
}

function categoryRank(category) {
  return categorySort.get(category) ?? Number.MAX_SAFE_INTEGER;
}

function relativeToLibrary(path) {
  return relative(libraryRoot, path).split(sep).join('/');
}

function toRepoPath(path) {
  return relative(root, path).split(sep).join('/');
}
