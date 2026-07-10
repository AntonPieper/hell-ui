import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

import {
  componentEntrypoints,
  entrypointCategories,
  entrypointMetadataFileName,
  entrypointPublicApiFiles,
  entrypointStyleExports,
  libraryRoot,
  packageExportPath,
  renderNgPackageFile,
  renderPackageJsonExports,
  renderPublicApiFile,
  secondaryPackageEntrypoints,
  sourcePackageCondition,
} from './entrypoint-manifest.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

const allowedDocsLazyRouteCrossImports = [
  {
    from: 'apps/docs/src/app/pages/components/flyout/flyout.page.ts',
    to: 'apps/docs/src/app/pages/testing/floating-dismissal-harness.page.ts',
    rationale:
      'Flyout exposes the query-param-only floating dismissal browser harness; it is deliberately bundled only with the lazy flyout route, not the docs shell.',
  },
];

const docsHeavyLazyRoutePolicies = [
  {
    id: 'pdf-viewer-docs',
    label: 'PDF viewer docs examples',
    routePath: '/components/pdf-viewer',
    boundary: 'components/pdf-viewer',
    packageSpecifiers: ['@hell-ui/angular/features/pdf-viewer', 'pdfjs-dist'],
    sourceFragments: [
      '@hell-ui/angular/features/pdf-viewer/styles.css',
      'hell-ui/pdf-viewer/styles/styles.css',
      'pdfjs/pdf_viewer.css',
    ],
    forbiddenComponentStyleFragments: [
      '@hell-ui/angular/features/pdf-viewer/styles.css',
      '@hell-ui/pdf-viewer/styles',
    ],
  },
  {
    id: 'code-editor-docs',
    label: 'Code editor docs examples',
    routePath: '/components/code-editor',
    boundary: 'components/code-editor',
    packageSpecifiers: ['@hell-ui/angular/features/code-editor', '@codemirror/'],
    sourceFragments: ['@hell-ui/angular/features/code-editor/styles.css'],
  },
  {
    id: 'audio-player-docs',
    label: 'Audio player docs examples',
    routePath: '/components/audio-player',
    boundary: 'components/audio-player',
    packageSpecifiers: [
      '@hell-ui/angular/audio-player',
      '@hell-ui/angular/features/audio-transcript',
    ],
    sourceFragments: [],
  },
];

const codeEditorEntrypointSpecifier = '@hell-ui/angular/features/code-editor';
const docsCodePreviewLazyWrapperPath = 'apps/docs/src/app/shared/docs-code-viewer.ts';
const codeMirrorPackageSpecifierPrefixes = ['@codemirror/', '@lezer/'];
const audioTranscriptEntrypointSpecifier = '@hell-ui/angular/features/audio-transcript';
const audioTranscriptRuntimeTerms = [
  { label: 'SpeechRecognition', pattern: /\bSpeechRecognition\b|\bwebkitSpeechRecognition\b/ },
  { label: 'captureStream()', pattern: /\bcaptureStream\b/ },
];

function main() {
  checkDocsExamples();
  checkDocsLazyRouteImportGraphContract();
  checkDocsRootImportContract();
  checkDocsCategoryNavigationContract();
  checkPackageEntryPoints();
  checkCodeMirrorEntrypointIsolationContract();
  checkAudioTranscriptEntrypointIsolationContract();
  checkApiStabilityContract();
  checkPackageDependencyContract();
  checkStyleEntryPoints();
  checkComponentContract();
  checkNativeButtonSelectorContract();
  checkInteractiveTriggerSelectorContract();
  checkTableAdapterBoundaryContract();
  checkNgpStateWriterContract();

  if (failures.length) {
    console.error('Architecture checks failed:\n');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log('Architecture checks passed.');
}

function checkDocsExamples() {
  const catalogPath = join(root, 'apps/docs/src/app/docs-catalog.ts');
  const searchIndexPath = join(root, 'apps/docs/src/app/docs-search-index.ts');
  const catalog = readFile(catalogPath);
  const searchIndex = readFile(searchIndexPath);
  const routePaths = catalogRoutePaths(catalog);
  const examples = docsSearchIndexSeeds(searchIndex, 'HD_DOCS_EXAMPLES');
  const usages = docsSearchIndexSeeds(searchIndex, 'HD_DOCS_CODE_USAGES');
  const pagesRoot = join(root, 'apps/docs/src/app/pages');

  checkDocsCatalogExampleSeam(catalog);

  const indexedDetails = new Set(examples.map((example) => example.detail));
  const actualExamples = walk(pagesRoot)
    .filter((file) => file.endsWith('.example.ts'))
    .map((file) => file.slice(pagesRoot.length + 1));
  for (const detail of actualExamples) {
    if (!indexedDetails.has(detail)) failures.push(`Docs Example file is not indexed: ${detail}`);
  }

  const seenOwnerDetail = new Set();
  const seenDetail = new Set();
  for (const example of examples) {
    const key = `${example.path}:${example.detail}`;
    if (seenOwnerDetail.has(key)) failures.push(`Duplicate Docs Example entry: ${key}`);
    seenOwnerDetail.add(key);

    if (seenDetail.has(example.detail)) {
      failures.push(`Duplicate Docs Example detail: ${example.detail}`);
    }
    seenDetail.add(example.detail);

    const detailRoute = docsExampleRouteFromDetail(example.detail, example.title);
    if (detailRoute && detailRoute !== example.path) {
      failures.push(
        `Docs Example "${example.title}" is registered on ${example.path} but detail belongs to ${detailRoute}`,
      );
    }

    if (!routePaths.has(example.path)) {
      failures.push(`Docs Example "${example.title}" points at missing route ${example.path}`);
    }

    const examplePath = join(pagesRoot, example.detail);
    if (!existsSync(examplePath)) {
      failures.push(`Docs Example "${example.title}" points at missing file ${example.detail}`);
      continue;
    }

    const pagePath = pagePathForRoute(example.path);
    if (!existsSync(pagePath)) {
      failures.push(`Docs Example "${example.title}" has no page file for ${example.path}`);
      continue;
    }

    const exampleSource = readFile(examplePath);
    const pageSource = readFile(pagePath);
    const meta = docsExampleComponentMeta(example, exampleSource);
    if (!meta) continue;

    checkDocsExamplePageBinding(example, pageSource, meta);
  }

  const seenUsages = new Set();
  for (const usage of usages) {
    const key = `${usage.path}:${usage.title}`;
    if (seenUsages.has(key)) {
      failures.push(`Duplicate Docs Usage entry: ${key}`);
    }
    seenUsages.add(key);

    if (!routePaths.has(usage.path)) {
      failures.push(`Docs Usage "${usage.title}" points at missing route ${usage.path}`);
    }
  }
}

function checkDocsLazyRouteImportGraphContract() {
  const docsRoot = join(root, 'apps/docs/src/app');
  const pagesRoot = join(docsRoot, 'pages');
  const catalogPath = join(docsRoot, 'docs-catalog.ts');
  const routeEntries = docsLazyRouteEntries(catalogPath, pagesRoot);
  const routeEntriesByBoundary = docsRouteEntriesByBoundary(routeEntries);

  for (const policy of docsHeavyLazyRoutePolicies) {
    const routeEntry = routeEntries.find(
      (entry) => entry.boundary === policy.boundary && entry.routePaths.includes(policy.routePath),
    );
    if (!routeEntry) {
      failures.push(
        `Docs Lazy Route Import Graph policy ${policy.id} must be backed by lazy route ${policy.routePath} in apps/docs/src/app/docs-catalog.ts`,
      );
    }
  }

  const docsFiles = walk(docsRoot).filter((file) => file.endsWith('.ts'));
  const moduleImports = docsFiles.flatMap((file) => moduleImportSpecifiers(file));

  const unusedAllowances = new Set(
    allowedDocsLazyRouteCrossImports.map((allowance) => `${allowance.from}->${allowance.to}`),
  );

  for (const importHit of moduleImports) {
    const target = resolveRelativeModuleFile(importHit.file, importHit.specifier);
    if (!target || !isWithinDirectory(target, pagesRoot)) continue;
    if (isDocsCatalogLazyRouteImport(importHit, target, catalogPath, routeEntries)) continue;

    const fromRel = relPath(importHit.file);
    const toRel = relPath(target);

    if (!isWithinDirectory(importHit.file, pagesRoot)) {
      failures.push(
        `Docs Lazy Route Import Graph ${fromRel}:${importHit.line} imports ${importHit.specifier} -> ${toRel}; ` +
          'docs shell/shared/search files must not eagerly reference lazy page or example code. Move shared code to apps/docs/src/app/shared or add a documented narrow allowance.',
      );
      continue;
    }

    const fromBoundary = docsPageBoundary(importHit.file, pagesRoot, routeEntriesByBoundary);
    const toBoundary = docsPageBoundary(target, pagesRoot, routeEntriesByBoundary);
    if (fromBoundary.boundary === toBoundary.boundary) continue;

    const allowanceKey = `${fromRel}->${toRel}`;
    if (unusedAllowances.has(allowanceKey)) {
      unusedAllowances.delete(allowanceKey);
      continue;
    }

    failures.push(
      `Docs Lazy Route Import Graph ${fromRel}:${importHit.line} imports ${importHit.specifier} -> ${toRel}; ` +
        `${fromBoundary.label} must not eagerly reference ${toBoundary.label}. Move shared code to apps/docs/src/app/shared or add a documented narrow allowance.`,
    );
  }

  for (const allowanceKey of unusedAllowances) {
    const allowance = allowedDocsLazyRouteCrossImports.find(
      (candidate) => `${candidate.from}->${candidate.to}` === allowanceKey,
    );
    failures.push(
      `Docs Lazy Route Import Graph allowance is stale: ${allowance.from} no longer imports ${allowance.to}`,
    );
  }

  for (const importHit of moduleImports) {
    for (const policy of docsHeavyLazyRoutePolicies) {
      if (!matchesDocsHeavyPackagePolicy(importHit.specifier, policy)) continue;
      if (isFileInDocsBoundary(importHit.file, pagesRoot, policy.boundary)) continue;
      if (policy.id === 'code-editor-docs' && isDocsCodePreviewLazyWrapper(importHit.file))
        continue;

      failures.push(
        `Docs Lazy Route Import Graph ${relPath(importHit.file)}:${importHit.line} imports ${importHit.specifier}; ` +
          `${policy.label} imports must stay inside lazy route ${policy.routePath} (${policy.boundary}).`,
      );
    }
  }

  for (const file of docsFiles) {
    const source = readFile(file);
    for (const policy of docsHeavyLazyRoutePolicies) {
      for (const fragment of policy.sourceFragments) {
        if (!source.includes(fragment)) continue;
        if (isFileInDocsBoundary(file, pagesRoot, policy.boundary)) continue;
        if (policy.id === 'code-editor-docs' && isDocsCodePreviewLazyWrapper(file)) continue;

        failures.push(
          `Docs Lazy Route Import Graph ${relPath(file)} references ${fragment}; ` +
            `${policy.label} stylesheet/runtime references must stay inside lazy route ${policy.routePath} (${policy.boundary}).`,
        );
      }

      for (const fragment of policy.forbiddenComponentStyleFragments ?? []) {
        const escaped = escapeRegExp(fragment);
        if (!new RegExp(`styles\\s*:\\s*\\[[\\s\\S]*${escaped}`).test(source)) continue;
        failures.push(
          `Docs Lazy Route Import Graph ${relPath(file)} references ${fragment} in component styles; ` +
            `${policy.label} CSS must load as a lazy external asset, not Angular component styles.`,
        );
      }
    }
  }
}

function docsLazyRouteEntries(catalogPath, pagesRoot) {
  const catalog = readFile(catalogPath);
  const entries = [];
  const seen = new Set();
  const routeImportRegex =
    /(?:routePath|path):\s*'([^']*)'[\s\S]*?loadComponent:\s*\(\)\s*=>\s*import\(\s*'([^']+)'\s*\)/g;

  for (const match of catalog.matchAll(routeImportRegex)) {
    const routePath = match[1] ? `/${match[1]}` : '/';
    const modulePath = resolveRelativeModuleFile(catalogPath, match[2]);
    if (!modulePath || !isWithinDirectory(modulePath, pagesRoot)) continue;

    const boundary = relPathFrom(pagesRoot, dirname(modulePath));
    const key = `${routePath}:${boundary}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({ routePath, routePaths: [routePath], boundary, modulePath });
  }

  return mergeDocsRouteEntries(entries);
}

function mergeDocsRouteEntries(entries) {
  const byBoundary = new Map();
  for (const entry of entries) {
    const existing = byBoundary.get(entry.boundary);
    if (!existing) {
      byBoundary.set(entry.boundary, { ...entry });
      continue;
    }

    existing.routePaths.push(entry.routePath);
  }

  return [...byBoundary.values()].map((entry) => ({
    ...entry,
    routePaths: [...new Set(entry.routePaths)].sort(),
  }));
}

function isDocsCatalogLazyRouteImport(importHit, target, catalogPath, routeEntries) {
  return (
    importHit.file === catalogPath &&
    importHit.kind === 'dynamic' &&
    routeEntries.some((entry) => entry.modulePath === target)
  );
}

function docsRouteEntriesByBoundary(entries) {
  return new Map(entries.map((entry) => [entry.boundary, entry]));
}

function docsPageBoundary(file, pagesRoot, routeEntriesByBoundary) {
  const rel = relPathFrom(pagesRoot, file);
  const routeEntry = [...routeEntriesByBoundary.values()]
    .sort((a, b) => b.boundary.length - a.boundary.length)
    .find((entry) => rel === entry.boundary || rel.startsWith(`${entry.boundary}/`));

  if (routeEntry) {
    return {
      boundary: routeEntry.boundary,
      label: `${routeEntry.routePaths.join(' or ')} lazy route boundary`,
    };
  }

  const parts = rel.split('/');
  const examplesIndex = parts.indexOf('examples');
  const boundary =
    examplesIndex > 0 ? parts.slice(0, examplesIndex).join('/') : parts.slice(0, -1).join('/');
  return { boundary, label: `${boundary} unrouted docs page boundary` };
}

function isFileInDocsBoundary(file, pagesRoot, boundary) {
  if (!isWithinDirectory(file, pagesRoot)) return false;
  const rel = relPathFrom(pagesRoot, file);
  return rel === boundary || rel.startsWith(`${boundary}/`);
}

function isDocsCodePreviewLazyWrapper(file) {
  return relPath(file) === docsCodePreviewLazyWrapperPath;
}

function matchesDocsHeavyPackagePolicy(specifier, policy) {
  return policy.packageSpecifiers.some((prefix) => {
    if (prefix.endsWith('/')) return specifier.startsWith(prefix);
    return specifier === prefix || specifier.startsWith(`${prefix}/`);
  });
}

function moduleImportSpecifiers(file) {
  const source = readFile(file);
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const imports = [];

  function pushImport(node, specifier, kind) {
    const line = sourceFile.getLineAndCharacterOfPosition(specifier.getStart(sourceFile)).line + 1;
    imports.push({ file, kind, line, specifier: specifier.text });
  }

  function visit(node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      if (!isTypeOnlyImportDeclaration(node)) pushImport(node, node.moduleSpecifier, 'static');
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      if (!isTypeOnlyExportDeclaration(node)) pushImport(node, node.moduleSpecifier, 'export');
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      pushImport(node, node.arguments[0], 'dynamic');
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return imports;
}

function moduleSpecifierReferences(file) {
  const source = readFile(file);
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const references = [];

  function pushReference(specifier, kind) {
    const line = sourceFile.getLineAndCharacterOfPosition(specifier.getStart(sourceFile)).line + 1;
    references.push({ file, kind, line, specifier: specifier.text });
  }

  function visit(node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      pushReference(node.moduleSpecifier, 'import');
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      pushReference(node.moduleSpecifier, 'export');
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      pushReference(node.arguments[0], 'dynamic');
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return references;
}

function isTypeOnlyImportDeclaration(node) {
  if (!node.importClause) return false;
  if (node.importClause.isTypeOnly) return true;
  if (node.importClause.name) return false;

  const bindings = node.importClause.namedBindings;
  if (!bindings || ts.isNamespaceImport(bindings)) return false;

  return bindings.elements.length > 0 && bindings.elements.every((element) => element.isTypeOnly);
}

function isTypeOnlyExportDeclaration(node) {
  if (node.isTypeOnly) return true;
  const clause = node.exportClause;
  if (!clause || !ts.isNamedExports(clause)) return false;
  return clause.elements.length > 0 && clause.elements.every((element) => element.isTypeOnly);
}

function resolveRelativeModuleFile(fromFile, specifier) {
  if (!specifier.startsWith('.')) return null;

  const withoutQuery = specifier.replace(/[?#].*$/, '');
  const basePath = resolve(dirname(fromFile), withoutQuery);
  const candidates = [basePath, `${basePath}.ts`, `${basePath}.tsx`, join(basePath, 'index.ts')];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function isWithinDirectory(file, directory) {
  const rel = relative(directory, file);
  return rel === '' || (!rel.startsWith('..') && !rel.startsWith('/') && !rel.startsWith('\\'));
}

function relPathFrom(basePath, file) {
  return relative(basePath, file).replaceAll('\\', '/');
}

function relPath(file) {
  return relPathFrom(root, file);
}

function catalogRoutePaths(catalog) {
  return new Set(
    [...catalog.matchAll(/routePath:\s*'([^']*)'/g)].map((match) =>
      match[1] ? `/${match[1]}` : '/',
    ),
  );
}

function docsSearchIndexSeeds(searchIndex, variable) {
  const declaration = new RegExp(`const\\s+${variable}[^=]*=\\s*\\[`).exec(searchIndex);
  if (!declaration) {
    failures.push(`Docs Search Index missing ${variable}`);
    return [];
  }

  const bodyStart = declaration.index + declaration[0].length;
  const bodyEnd = searchIndex.indexOf('];', bodyStart);
  if (bodyEnd < 0) {
    failures.push(`Docs Search Index block for ${variable} is malformed`);
    return [];
  }

  const body = searchIndex.slice(bodyStart, bodyEnd);
  const seeds = [];
  for (const match of body.matchAll(
    /\{\s*title:\s*'([^']+)'\s*,\s*path:\s*'([^']+)'\s*,\s*detail:\s*'([^']+)'\s*,\s*terms:\s*'([^']*)'/g,
  )) {
    seeds.push({
      title: match[1],
      path: match[2],
      detail: match[3],
      terms: match[4],
    });
  }

  return seeds;
}

function checkDocsCatalogExampleSeam(catalog) {
  const staticExampleImport =
    /(?:^|\n)\s*import\s+(?:[^'"]+\s+from\s+)?['"]\.\/pages\/[^'"]*\/examples\//;
  const dynamicExampleImport = /import\(\s*['"]\.\/pages\/[^'"]*\/examples\//;
  if (staticExampleImport.test(catalog) || dynamicExampleImport.test(catalog)) {
    failures.push('Docs Catalog must not eagerly import Docs Example implementations');
  }
}

function docsExampleRouteFromDetail(detail, title) {
  if (detail.startsWith('/') || detail.includes('..')) {
    failures.push(`Docs Example "${title}" has unsafe detail path ${detail}`);
    return null;
  }

  const match = /^(.+)\/examples\/[^/]+\.example\.ts$/.exec(detail);
  if (!match) {
    failures.push(`Docs Example "${title}" detail must point at a .example.ts file: ${detail}`);
    return null;
  }

  return `/${match[1]}`;
}

function docsExampleComponentMeta(example, source) {
  if (docsExampleCodeOnly(source)) {
    return { codeOnly: true, stem: basename(example.detail, '.ts') };
  }

  const selector = source.match(/selector:\s*'([^']+)'/)?.[1] ?? null;
  if (!selector) {
    failures.push(`Docs Example "${example.title}" has no Angular selector in ${example.detail}`);
    return null;
  }

  const className = source.match(/export\s+class\s+([A-Za-z0-9_]+)/)?.[1] ?? null;
  if (!className) {
    failures.push(`Docs Example "${example.title}" has no exported class in ${example.detail}`);
    return null;
  }

  return { selector, className, stem: basename(example.detail, '.ts') };
}

function checkDocsExamplePageBinding(example, pageSource, meta) {
  const stemPattern = escapeRegExp(meta.stem);
  if (!meta.codeOnly) {
    const classImport = new RegExp(
      `import\\s+\\{[^}]*\\b${escapeRegExp(meta.className)}\\b[^}]*\\}\\s+from\\s+['"]\\.\\/examples\\/${stemPattern}['"]`,
    );
    if (!classImport.test(pageSource)) {
      failures.push(`Docs Example "${example.title}" is indexed but not imported by its page`);
    }
  }

  const rawImport = new RegExp(
    `import\\s+([A-Za-z0-9_]+)\\s+from\\s+['"]\\.\\/examples\\/${stemPattern}\\.ts\\?raw['"][^;]*?with\\s*\\{[^}]*?loader:\\s*['"]text['"][^}]*?\\}\\s*;`,
  ).exec(pageSource);
  if (!rawImport) {
    failures.push(
      `Docs Example "${example.title}" is indexed but its raw source is not imported with loader: 'text'`,
    );
    return;
  }

  const codeField = new RegExp(
    `readonly\\s+([A-Za-z0-9_]+)\\s*=\\s*${escapeRegExp(rawImport[1])}\\s*;`,
  ).exec(pageSource)?.[1];
  if (!codeField) {
    failures.push(`Docs Example "${example.title}" raw source is not exposed through a code field`);
    return;
  }

  const exampleTabs = pageSource.match(/<hd-example-tabs\b[\s\S]*?<\/hd-example-tabs>/g) ?? [];
  const matchingTabs = exampleTabs.filter((block) => {
    if (!block.includes(`[code]="${codeField}"`)) return false;
    return meta.codeOnly || block.includes(`<${meta.selector}`);
  });
  if (matchingTabs.length !== 1) {
    const requirement = meta.codeOnly
      ? `bind ${codeField} in exactly one code-only hd-example-tabs block`
      : `bind ${codeField} and render <${meta.selector}> in exactly one hd-example-tabs block`;
    failures.push(`Docs Example "${example.title}" must ${requirement}`);
  }
}

function docsExampleCodeOnly(source) {
  return source.includes('@hell-docs-code-only');
}

function checkDocsRootImportContract() {
  const docsRoot = join(root, 'apps/docs/src/app');
  const docsFiles = walk(docsRoot).filter((file) => file.endsWith('.ts'));

  for (const file of docsFiles) {
    const source = readFile(file);
    if (/(?:from|import\()\s*['\"]@hell-ui\/angular['\"]/.test(source)) {
      failures.push(
        `Docs app file ${file.slice(root.length + 1)} imports the root @hell-ui/angular entry point; docs must demonstrate narrow import-path entry points`,
      );
    }
  }
}

// Every component Package Entry Point must have a registered docs page. Entry
// points deliberately documented on another entry point's page are listed as
// explicit exceptions naming the page that owns them.
const docsCategoryPageExceptions = new Map([
  // The transcript provider is an opt-in seam of the audio player Composite.
  ['features/audio-transcript', 'components/audio-player'],
  // Both supported table paths are documented together on the table page.
  ['table-tanstack', 'components/table'],
  ['table-tanstack/virtual', 'components/table'],
]);

function checkDocsCategoryNavigationContract() {
  const catalog = readFile(join(root, 'apps/docs/src/app/docs-catalog.ts'));
  const registeredRoutes = new Set(
    [...catalog.matchAll(/routePath:\s*'([^']+)'/g)].map((match) => match[1]),
  );

  for (const entrypoint of componentEntrypoints()) {
    const exceptionRoute = docsCategoryPageExceptions.get(entrypoint.id);
    const route = exceptionRoute ?? `components/${basename(entrypoint.id)}`;
    const pagePath = pagePathForRoute(`/${route}`);
    if (!existsSync(pagePath)) {
      failures.push(
        `Docs Catalog is missing a page for ${entrypoint.specifier} (${entrypoint.category}); expected ${relPath(pagePath)}`,
      );
      continue;
    }
    if (!registeredRoutes.has(route)) {
      failures.push(
        `Docs Catalog does not register route ${route} for ${entrypoint.specifier} (${entrypoint.category})`,
      );
      continue;
    }
  }
}

function checkPackageEntryPoints() {
  const publicApiFiles = entrypointPublicApiFiles();
  const rootPublicApi = publicApiFiles.find((entrypoint) => entrypoint.id === 'root');
  const rootApiPath = join(root, rootPublicApi.publicApiPath);
  const rootApi = readFile(rootApiPath);
  const secondaryApis = publicApiFiles.filter((entrypoint) => entrypoint.id !== 'root');

  // Light Root Entry Point: the root public API re-exports stable core only.
  const nonCoreRootExports = exportPaths(rootApi).filter(
    (path) => path !== './core/public-api' && !path.startsWith('./core/'),
  );
  if (nonCoreRootExports.length) {
    failures.push(
      `Light Root Entry Point must export core only from packages/angular/public-api.ts; found: ${nonCoreRootExports.join(', ')}`,
    );
  }

  const internalCoreExports = new Set(['floating-dismissal', 'floating-scope', 'resize-behavior']);
  for (const [api, source] of [
    [rootPublicApi.publicApiPath, rootApi],
    ...secondaryApis
      .filter((entrypoint) => entrypoint.category !== entrypointCategories.INTERNAL)
      .filter((entrypoint) => existsSync(join(root, entrypoint.publicApiPath)))
      .map((entrypoint) => [
        entrypoint.publicApiPath,
        readFile(join(root, entrypoint.publicApiPath)),
      ]),
  ]) {
    for (const exportPath of exportPaths(source)) {
      const module = basename(exportPath);
      if (internalCoreExports.has(module)) {
        failures.push(`Package Entry Point ${api} exports internal core module ${module}`);
      }
    }
  }

  const requiredRootApiExports = new Set(rootPublicApi.exports);
  for (const requiredExport of requiredRootApiExports) {
    if (!rootApi.includes(`'${requiredExport}'`) && !rootApi.includes(`"${requiredExport}"`)) {
      failures.push(`Root Package Entry Point is missing ${requiredExport}`);
    }
  }

  const tsconfig = parseJsonWithComments(readFile(join(root, 'tsconfig.json')));
  if (tsconfig.compilerOptions?.paths) {
    failures.push(
      'Root tsconfig.json must not define Hell package path aliases; package exports with @heinrich/source are the local source-resolution contract',
    );
  }

  const tsconfigBase = parseJsonWithComments(readFile(join(root, 'tsconfig.base.json')));
  const customConditions = tsconfigBase.compilerOptions?.customConditions ?? [];
  if (!customConditions.includes(sourcePackageCondition)) {
    failures.push(`tsconfig.base.json must include custom condition ${sourcePackageCondition}`);
  }

  const packageJson = parseJsonWithComments(readFile(join(root, 'packages/angular/package.json')));
  const packageExports = packageJson.exports ?? {};
  const expectedPackageExports = renderPackageJsonExports();
  if (JSON.stringify(packageExports) !== JSON.stringify(expectedPackageExports)) {
    failures.push(
      'Package Entry Point exports in packages/angular/package.json are stale (run pnpm run generate:entrypoints)',
    );
  }

  const angularWorkspace = parseJsonWithComments(readFile(join(root, 'packages/angular/angular.json')));
  const angularSourceRoot = angularWorkspace.projects?.hell?.sourceRoot;
  if (angularSourceRoot !== '.') {
    failures.push(
      `@hell-ui/angular Angular project sourceRoot must be "." for import-path-first package layout; found ${angularSourceRoot ?? 'missing'}`,
    );
  }
  for (const entrypoint of publicApiFiles) {
    const exportPath = packageExportPath(entrypoint.specifier);
    const expectedSource = expectedPackageExports[exportPath]?.[sourcePackageCondition];
    if (packageExports[exportPath]?.[sourcePackageCondition] !== expectedSource) {
      failures.push(
        `Package Entry Point ${entrypoint.specifier} export ${exportPath} must resolve ${sourcePackageCondition} to ${expectedSource}`,
      );
    }
  }

  const manifestSpecifiers = new Set(publicApiFiles.map((entrypoint) => entrypoint.specifier));
  const supportedTableSpecifiers = [
    '@hell-ui/angular/table',
    '@hell-ui/angular/table-tanstack',
    '@hell-ui/angular/table-tanstack/virtual',
  ];
  for (const specifier of supportedTableSpecifiers) {
    if (!manifestSpecifiers.has(specifier))
      failures.push(`Entrypoint metadata is missing table entry point ${specifier}`);
  }

  const packagePaths = secondaryPackageEntrypoints().map((entrypoint) => entrypoint.packagePath);

  for (const packagePath of packagePaths) {
    if (!existsSync(join(root, packagePath))) {
      failures.push(`Package Entry Point is missing ${packagePath}`);
    }
  }

  checkEntrypointManifestSourceCoverage();
  checkGeneratedEntrypointFiles();
}

function checkCodeMirrorEntrypointIsolationContract() {
  const codeEditorEntrypoint = entrypointPublicApiFiles().find(
    (entrypoint) => entrypoint.specifier === codeEditorEntrypointSpecifier,
  );
  if (!codeEditorEntrypoint) {
    failures.push(`Entrypoint metadata is missing ${codeEditorEntrypointSpecifier}`);
    return;
  }
  if (codeEditorEntrypoint.category !== entrypointCategories.FEATURE) {
    failures.push(`${codeEditorEntrypointSpecifier} must be categorized as a feature entry point`);
  }

  const nonCodeEditorEntrypointPaths = [
    ...entrypointPublicApiFiles()
      .filter((entrypoint) => entrypoint.specifier !== codeEditorEntrypointSpecifier)
      .map((entrypoint) => entrypoint.publicApiPath),
    ...libraryProductionTsFiles().filter(
      (file) => !isEntrypointSourcePath(file, codeEditorEntrypoint),
    ),
  ];

  const boundaries = [
    { label: 'non-code-editor package entrypoint', paths: nonCodeEditorEntrypointPaths },
  ];

  for (const boundary of boundaries) {
    for (const rel of [...new Set(boundary.paths)].sort()) {
      const file = join(root, rel);
      if (!existsSync(file)) continue;

      const hits = moduleSpecifierReferences(file).filter((hit) =>
        isCodeMirrorBoundarySpecifier(hit.specifier),
      );
      for (const hit of hits) {
        failures.push(
          `CodeMirror Optional Entrypoint ${boundary.label} boundary ${rel}:${hit.line} references ${hit.specifier}; ` +
            'CodeMirror exports/imports must stay inside @hell-ui/angular/features/code-editor.',
        );
      }
    }
  }
}

function productionTsFilesUnder(relDir) {
  const dir = join(root, relDir);
  if (!existsSync(dir)) return [];

  return walk(dir)
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.spec.ts') && !file.endsWith('.d.ts'))
    .map(relPath);
}

function libraryPackageFiles() {
  const files = [join(root, 'packages/angular/public-api.ts')];
  for (const dir of new Set(secondaryPackageEntrypoints().map((entrypoint) => entrypoint.packageDir))) {
    const fullDir = join(root, dir);
    if (existsSync(fullDir)) files.push(...walk(fullDir));
  }
  return [...new Set(files)].filter((file) => !relPath(file).includes('/node_modules/'));
}

function libraryProductionTsFiles() {
  return libraryPackageFiles()
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.spec.ts') && !file.endsWith('.d.ts'))
    .map(relPath);
}

function isEntrypointSourcePath(relPath, entrypoint) {
  return relPath === entrypoint.publicApiPath || relPath.startsWith(`${entrypoint.packageDir}/`);
}

function isCodeMirrorBoundarySpecifier(specifier) {
  return (
    specifier === codeEditorEntrypointSpecifier ||
    specifier.startsWith(`${codeEditorEntrypointSpecifier}/`) ||
    /(?:^|\/)code-editor(?:\/|$)/.test(specifier) ||
    specifier.includes('features/code-editor') ||
    codeMirrorPackageSpecifierPrefixes.some((prefix) => specifier.startsWith(prefix))
  );
}

function checkAudioTranscriptEntrypointIsolationContract() {
  const libraryProductionPaths = [
    'packages/angular/public-api.ts',
    ...entrypointPublicApiFiles().map((entrypoint) => entrypoint.publicApiPath),
    ...libraryProductionTsFiles(),
  ];

  for (const rel of [...new Set(libraryProductionPaths)].sort()) {
    if (isAudioTranscriptFeatureSeamPath(rel)) continue;
    const file = join(root, rel);
    if (!existsSync(file)) continue;

    const source = readFile(file);
    for (const term of audioTranscriptRuntimeTerms) {
      if (term.pattern.test(source)) {
        failures.push(
          `Audio Transcript Optional Entrypoint boundary ${rel} references ${term.label}; ` +
            'browser transcript runtime must stay inside @hell-ui/angular/features/audio-transcript.',
        );
      }
    }

    const hits = moduleSpecifierReferences(file).filter((hit) =>
      isAudioTranscriptFeatureSpecifier(hit.specifier),
    );
    for (const hit of hits) {
      failures.push(
        `Audio Transcript Optional Entrypoint boundary ${rel}:${hit.line} references ${hit.specifier}; ` +
          'base audio-player and composites must not import the transcript feature seam.',
      );
    }
  }
}

function isAudioTranscriptFeatureSeamPath(rel) {
  return (
    rel === 'packages/angular/features/audio-transcript/public-api.ts' ||
    rel.includes('/features/audio-transcript/')
  );
}

function isAudioTranscriptFeatureSpecifier(specifier) {
  return (
    specifier === audioTranscriptEntrypointSpecifier ||
    specifier.startsWith(`${audioTranscriptEntrypointSpecifier}/`) ||
    specifier.includes('features/audio-transcript')
  );
}

function checkApiStabilityContract() {
  checkPublicApiInternalExportContract();
}

function checkPublicApiInternalExportContract() {
  const internalDirectoryNames = new Set(['internal', 'adapters', 'ng-primitives']);

  const allowedPublicInternalExports = new Set([
    // Format: `${publicApiPath} -> ${exportPath}`. Each exception must include a release-policy rationale.
  ]);

  for (const entrypoint of entrypointPublicApiFiles()) {
    if (entrypoint.category === entrypointCategories.INTERNAL) continue;

    const publicApiPath = entrypoint.publicApiPath;
    const fullPath = join(root, publicApiPath);
    if (!existsSync(fullPath)) continue;

    const source = readFile(fullPath);
    for (const exportPath of exportPaths(source)) {
      const exportKey = `${publicApiPath} -> ${exportPath}`;
      if (allowedPublicInternalExports.has(exportKey)) continue;

      const resolvedPath = resolvePublicExportPath(publicApiPath, exportPath);
      const segments = resolvedPath.split('/').filter(Boolean);
      const internalSegment = segments.find((segment) => internalDirectoryNames.has(segment));
      if (internalSegment) {
        failures.push(
          `Public API ${publicApiPath} exports ${exportPath} from internal directory "${internalSegment}" without an explicit architecture allowlist entry`,
        );
      }
    }
  }
}

function resolvePublicExportPath(publicApiPath, exportPath) {
  if (!exportPath.startsWith('.')) return exportPath;
  return join(dirname(publicApiPath), exportPath).replaceAll('\\', '/');
}

function checkPackageDependencyContract() {
  const packageJson = parseJsonWithComments(readFile(join(root, 'packages/angular/package.json')));
  const workspaceCatalog = readWorkspaceCatalog();
  const optionalDependencies = Object.keys(packageJson.optionalDependencies ?? {});
  if (optionalDependencies.length) {
    failures.push(
      `Package dependency contract uses optionalDependencies instead of optional peer dependencies: ${optionalDependencies.join(', ')}`,
    );
  }

  const sourceFiles = libraryProductionTsFiles().map((file) => join(root, file));
  const peerDependencies = packageJson.peerDependencies ?? {};
  const peerDependenciesMeta = packageJson.peerDependenciesMeta ?? {};
  const dependencies = packageJson.dependencies ?? {};
  const importedPackages = new Set(
    sourceFiles
      .flatMap((file) => externalImportPackages(readFile(file)))
      .filter((dependency) => dependency !== packageJson.name),
  );

  const lightStackPeers = new Set([
    '@angular/cdk',
    '@angular/common',
    '@angular/core',
    '@angular/forms',
    '@floating-ui/dom',
    'ng-primitives',
    'rxjs',
  ]);
  // Icon-backed entry points only; non-icon consumers install without them.
  const iconOnlyPeers = new Set(['@ng-icons/core', '@ng-icons/font-awesome']);
  const transitiveOnlyPeers = new Set(['@angular/router']);
  const featureOnlyPeers = new Set([
    '@codemirror/commands',
    '@codemirror/language',
    '@codemirror/state',
    '@codemirror/view',
    '@lezer/highlight',
    'pdfjs-dist',
  ]);
  const adapterOnlyPeers = new Set(['@tanstack/angular-table', '@tanstack/virtual-core']);
  const styleOnlyPeers = new Set(['tailwindcss']);

  for (const dependency of importedPackages) {
    if (!peerDependencies[dependency] && !dependencies[dependency]) {
      failures.push(`Package dependency contract is missing dependency for imported ${dependency}`);
    }
  }

  const nonTsPeerDependencies = new Set([
    // CSS entry points depend on Tailwind theme variables.
    'tailwindcss',
    // ng-primitives exposes these as strict peers consumed by primitive wrappers.
    '@angular/cdk',
    '@floating-ui/dom',
    // ng-primitives/dialog imports Router even though Hell only exposes it via dialog surfaces.
    '@angular/router',
  ]);
  for (const dependency of Object.keys(peerDependencies)) {
    if (!importedPackages.has(dependency) && !nonTsPeerDependencies.has(dependency)) {
      failures.push(`Package dependency contract declares unused peer dependency ${dependency}`);
    }

    if (!peerDependencies[dependency]) continue;
    if (lightStackPeers.has(dependency) && peerDependenciesMeta[dependency]?.optional === true) {
      failures.push(
        `Package dependency contract must keep ${dependency} required because it is part of the light root/primitives stack`,
      );
    }

    if (featureOnlyPeers.has(dependency) && peerDependenciesMeta[dependency]?.optional !== true) {
      failures.push(
        `Package dependency contract must keep ${dependency} optional for feature-only consumers`,
      );
    } else if (
      adapterOnlyPeers.has(dependency) &&
      peerDependenciesMeta[dependency]?.optional !== true
    ) {
      failures.push(
        `Package dependency contract must keep ${dependency} optional for adapter-only consumers`,
      );
    } else if (
      styleOnlyPeers.has(dependency) &&
      peerDependenciesMeta[dependency]?.optional !== true
    ) {
      failures.push(
        `Package dependency contract must keep ${dependency} optional for style-only consumers`,
      );
    } else if (
      iconOnlyPeers.has(dependency) &&
      peerDependenciesMeta[dependency]?.optional !== true
    ) {
      failures.push(
        `Package dependency contract must keep ${dependency} optional for icon-only consumers`,
      );
    } else if (
      transitiveOnlyPeers.has(dependency) &&
      peerDependenciesMeta[dependency]?.optional !== true
    ) {
      failures.push(
        `Package dependency contract must keep ${dependency} optional for transitive-only consumers`,
      );
    }
  }

  for (const dependency of Object.keys(peerDependenciesMeta)) {
    if (!peerDependencies[dependency]) {
      failures.push(
        `Package dependency contract has peerDependenciesMeta for undeclared ${dependency}`,
      );
    } else if (
      !featureOnlyPeers.has(dependency) &&
      !adapterOnlyPeers.has(dependency) &&
      !styleOnlyPeers.has(dependency) &&
      !iconOnlyPeers.has(dependency) &&
      !transitiveOnlyPeers.has(dependency) &&
      peerDependenciesMeta[dependency]?.optional
    ) {
      failures.push(
        `Package dependency contract marks ${dependency} optional but it is not a known feature-only, adapter-only, icon-only, style-only, or transitive-only peer`,
      );
    }
  }

  for (const dependency of lightStackPeers) {
    if (!peerDependencies[dependency]) {
      failures.push(
        `Package dependency contract is missing required light peer dependency ${dependency}`,
      );
    }
  }

  for (const dependency of featureOnlyPeers) {
    if (!peerDependencies[dependency]) {
      failures.push(
        `Package dependency contract is missing optional feature peer dependency ${dependency}`,
      );
    }
  }

  for (const dependency of adapterOnlyPeers) {
    if (!peerDependencies[dependency]) {
      failures.push(
        `Package dependency contract is missing optional adapter peer dependency ${dependency}`,
      );
    }
  }

  for (const dependency of styleOnlyPeers) {
    if (!peerDependencies[dependency]) {
      failures.push(
        `Package dependency contract is missing optional style peer dependency ${dependency}`,
      );
    }
  }

  for (const dependency of iconOnlyPeers) {
    if (!peerDependencies[dependency]) {
      failures.push(
        `Package dependency contract is missing optional icon peer dependency ${dependency}`,
      );
    }
  }

  for (const dependency of transitiveOnlyPeers) {
    if (!peerDependencies[dependency]) {
      failures.push(
        `Package dependency contract is missing optional transitive peer dependency ${dependency}`,
      );
    }
  }

  const tanStackImportOffenders = sourceFiles
    .filter((file) => !relPath(file).includes('/table-tanstack/'))
    .filter((file) => relPath(file) !== 'packages/angular/table-tanstack/public-api.ts')
    .filter((file) => readFile(file).includes('@tanstack/angular-table'))
    .map(relPath);
  if (tanStackImportOffenders.length) {
    failures.push(
      `Package dependency contract must keep @tanstack/angular-table inside @hell-ui/angular/table-tanstack: ${tanStackImportOffenders.join(', ')}`,
    );
  }

  const tanStackVirtualImportOffenders = sourceFiles
    .filter((file) => !relPath(file).includes('/table-tanstack/virtual/'))
    .filter((file) => readFile(file).includes('@tanstack/virtual-core'))
    .map(relPath);
  if (tanStackVirtualImportOffenders.length) {
    failures.push(
      `Package dependency contract must keep @tanstack/virtual-core inside @hell-ui/angular/table-tanstack virtual strategy files: ${tanStackVirtualImportOffenders.join(', ')}`,
    );
  }

  const pdfJsImportOffenders = sourceFiles
    .filter((file) => !relPath(file).includes('/features/pdf-viewer/'))
    .filter((file) => readFile(file).includes('pdfjs-dist'))
    .map(relPath);
  if (pdfJsImportOffenders.length) {
    failures.push(
      `Package dependency contract must keep pdfjs-dist inside @hell-ui/angular/features/pdf-viewer: ${pdfJsImportOffenders.join(', ')}`,
    );
  }

  if (peerDependencies['pdfjs-dist'] !== workspaceCatalog['pdfjs-dist']) {
    failures.push(
      `Package dependency contract must pin the optional pdfjs-dist peer to workspace catalog version ${workspaceCatalog['pdfjs-dist']}`,
    );
  }

  const rootNgPackage = parseJsonWithComments(
    readFile(join(root, 'packages/angular/ng-package.json')),
  );
  if (JSON.stringify(rootNgPackage.assets ?? []).includes('pdf.worker')) {
    failures.push(
      'Root package assets must not copy pdf.worker.mjs; PDF viewer requires an app-provided worker source',
    );
  }
}

function checkStyleEntryPoints() {
  for (const { exportPath, sourcePath } of entrypointStyleExports()) {
    if (!existsSync(join(root, libraryRoot, sourcePath.slice(2)))) {
      failures.push(`Style Package Entry Point ${exportPath} points at missing ${sourcePath}`);
    }
  }

  checkTokenSubstrateDoesNotOwnComponentSkins();
}

function checkTokenSubstrateDoesNotOwnComponentSkins() {
  const tokensPath = 'packages/angular/tokens.css';
  const tokens = readFile(join(root, tokensPath)).replace(/\/\*[\s\S]*?\*\//g, '');
  const selectorPattern = /([^{}]+)\{/g;
  for (const match of tokens.matchAll(selectorPattern)) {
    const selector = match[1].trim();
    if (!selector.includes('[data-hell-skin')) continue;

    const selectorWithoutSkinAttribute = selector.replace(/\[data-hell-skin[^\]]*\]/g, '');
    if (!/(?:\[[^\]]*hell[A-Z][^\]]*\]|data-hell-(?!skin\b)[a-z-]+)/.test(selectorWithoutSkinAttribute)) {
      continue;
    }

    failures.push(
      `${tokensPath} must not contain component-specific skin selector "${selector.replace(/\s+/g, ' ')}"; move it to @hell-ui/angular/themes/*.css`,
    );
  }
}

function checkComponentContract() {
  const productionFiles = libraryProductionTsFiles();
  const classIndex = partStyleClassIndex(productionFiles);
  const files = productionFiles.filter((file) => !file.includes('/core/'));
  const publicStyleableModules = new Map();

  for (const rel of files) {
    const file = join(root, rel);
    const source = readFile(file);
    for (const module of decoratedClassModules(source).map((candidate) => ({
      ...candidate,
      rel,
      source,
    }))) {
      const styleInfo = partStyleInfoForClass(module, classIndex);
      if (!styleInfo) continue;

      const { className } = module;
      if (publicStyleableModules.has(className)) {
        failures.push(`Duplicate public styled Module ${className} in ${rel}`);
      }
      publicStyleableModules.set(className, rel);

      checkPartStylePipeline(rel, module, styleInfo);
      checkPartSlotUnionContract(rel, source, module, styleInfo);
    }
  }
}

function partStyleClassIndex(relFiles) {
  const index = new Map();
  for (const rel of relFiles) {
    const source = readFile(join(root, rel));
    for (const module of decoratedClassModules(source)) {
      index.set(module.className, { ...module, rel, source });
    }
  }
  return index;
}

function partStyleInfoForClass(module, classIndex, seen = new Set()) {
  if (seen.has(module.className)) return null;
  seen.add(module.className);

  const local = localPartStyleInfo(module);
  if (local) return local;

  const baseClass = classBaseName(module.classSource);
  if (!baseClass) return null;

  const baseModule = classIndex.get(baseClass);
  if (!baseModule) return null;

  return partStyleInfoForClass(baseModule, classIndex, seen);
}

function localPartStyleInfo(module) {
  const uiPart = uiInputPartType(module.moduleSource);
  const stylerPart = hellPartStylerPartType(module.moduleSource);
  if (!uiPart && !stylerPart) return null;

  return {
    ownerClassName: module.className,
    partType: uiPart ?? stylerPart,
    uiPart,
    stylerPart,
    source: module.source,
    rel: module.rel,
  };
}

function checkPartStylePipeline(rel, module, styleInfo) {
  if (styleInfo.ownerClassName !== module.className) return;

  const { className, moduleSource } = module;
  if (!styleInfo.uiPart) {
    failures.push(`${rel} ${className} must declare its typed [ui] signal input`);
  }
  if (!styleInfo.stylerPart) {
    failures.push(`${rel} ${className} must compose hellPartStyler over its ui input`);
  }
  if (styleInfo.uiPart && styleInfo.stylerPart && styleInfo.uiPart !== styleInfo.stylerPart) {
    failures.push(
      `${rel} ${className} ui input part type ${styleInfo.uiPart} must match hellPartStyler part type ${styleInfo.stylerPart}`,
    );
  }
  if (moduleSource.includes('hellPartStyler')) {
    if (!moduleSource.includes('part(') || !moduleSource.includes('recipe')) {
      failures.push(
        `${rel} ${className} composes hellPartStyler but does not use the Part-Class Pipeline`,
      );
    }
  }
}

function checkPartSlotUnionContract(rel, source, module, styleInfo) {
  const partNames = literalUnionMembers(styleInfo.source, styleInfo.partType);
  if (!partNames.length) {
    failures.push(`${styleInfo.rel} must export literal union ${styleInfo.partType}`);
    return;
  }

  if (/['"]\[attr\.data-slot\]['"]\s*:/.test(module.moduleSource)) {
    failures.push(
      `${rel} ${module.className} must not compute data-slot dynamically; it must match public parts`,
    );
  }

  const literalSlots = literalDataSlots(partStyleTemplateSource(source, module.moduleSource, rel));
  for (const slot of literalSlots) {
    if (!partNames.includes(slot)) {
      failures.push(
        `${rel} ${module.className} renders data-slot="${slot}" outside ${styleInfo.partType}`,
      );
    }
  }
  for (const part of partNames) {
    if (!literalSlots.includes(part)) {
      failures.push(`${rel} ${module.className} public part "${part}" has no matching data-slot`);
    }
  }
}

function classBaseName(classSource) {
  return /extends\s+([A-Za-z0-9_]+)/.exec(classSource)?.[1] ?? null;
}

function uiInputPartType(moduleSource) {
  return /readonly\s+ui\s*=\s*input\s*<\s*HellUiInput\s*<\s*([A-Za-z0-9_]+)\s*>\s*>\s*\(\s*undefined\s*,\s*\{\s*alias\s*:\s*['"]ui['"]/.exec(
    moduleSource,
  )?.[1] ?? null;
}

function hellPartStylerPartType(moduleSource) {
  return /hellPartStyler\s*<\s*([A-Za-z0-9_]+)\s*>\s*\(\s*this\.ui/.exec(moduleSource)?.[1] ?? null;
}

function literalUnionMembers(source, typeName) {
  const match = new RegExp(`export\\s+type\\s+${typeName}\\s*=([\\s\\S]*?);`).exec(source);
  if (!match) return [];

  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map((candidate) => candidate[1]);
}

function literalDataSlots(source) {
  const patterns = [
    /\bdata-slot\s*=\s*"([^"]+)"/g,
    /\bdata-slot\s*=\s*'([^']+)'/g,
    /['"]data-slot['"]\s*:\s*['"]([^'"]+)['"]/g,
  ];
  return [
    ...new Set(
      patterns.flatMap((pattern) => [...source.matchAll(pattern)].map((candidate) => candidate[1])),
    ),
  ];
}

function partStyleTemplateSource(source, moduleSource, rel) {
  const templateUrl = /templateUrl\s*:\s*['"]([^'"]+)['"]/.exec(moduleSource)?.[1];
  if (templateUrl) {
    const templatePath = join(root, dirname(rel), templateUrl);
    if (existsSync(templatePath)) return `${moduleSource}\n${readFile(templatePath)}`;
  }

  const templateRef = /template\s*:\s*([A-Za-z0-9_]+)/.exec(moduleSource)?.[1];
  if (!templateRef) return moduleSource;

  const pattern = new RegExp(`const\\s+${escapeRegExp(templateRef)}\\s*=\\s*\`([\\s\\S]*?)\`;`);
  const template = pattern.exec(source)?.[1];
  return template ? `${moduleSource}\n${template}` : moduleSource;
}

function decoratedClassModules(source) {
  const matches = [
    ...source.matchAll(/export\s+(?:abstract\s+)?class\s+([A-Za-z0-9_]+)(?:<[^>{}]*>)?[\s\S]*?\{/g),
  ];
  const moduleStarts = matches.map((match, index) => {
    const classStart = match.index;
    const previousClassStart = index === 0 ? 0 : matches[index - 1].index;
    const directiveStart = source.lastIndexOf('@Directive', classStart);
    const componentStart = source.lastIndexOf('@Component', classStart);
    const decoratorStart = Math.max(directiveStart, componentStart);
    return decoratorStart > previousClassStart ? decoratorStart : classStart;
  });

  return matches.map((match, index) => ({
    className: match[1],
    classSource: match[0],
    moduleSource: source.slice(moduleStarts[index], moduleStarts[index + 1] ?? source.length),
  }));
}

function checkNativeButtonSelectorContract() {
  const files = libraryProductionTsFiles().map((file) => join(root, file));

  for (const file of files) {
    const source = readFile(file);
    const rel = file.slice(root.length + 1);
    for (const module of decoratedClassModules(source)) {
      if (!/\btype:\s*['"]button['"]/.test(module.moduleSource)) continue;

      const selector = /selector:\s*['"]([^'"]+)['"]/.exec(module.moduleSource)?.[1];
      if (!selector) continue;

      const unsafeArms = selector
        .split(',')
        .map((arm) => arm.trim())
        .filter((arm) => !/^button(?:\b|\[|\.|#|:)/.test(arm));

      if (unsafeArms.length) {
        failures.push(
          `${rel} ${module.className} sets type=button but selector allows non-button hosts: ${unsafeArms.join(', ')}`,
        );
      }
    }
  }
}

function checkInteractiveTriggerSelectorContract() {
  const nativeInteractiveTriggers = new Set([
    'hellDialogTrigger',
    'hellPopoverTrigger',
    'hellTooltipTrigger',
    'hellMenuTrigger',
    'hellFlyoutTrigger',
  ]);
  const files = libraryProductionTsFiles().map((file) => join(root, file));

  for (const file of files) {
    const source = readFile(file);
    const rel = file.slice(root.length + 1);
    for (const module of decoratedClassModules(source)) {
      const selector = /selector:\s*['"]([^'"]+)['"]/.exec(module.moduleSource)?.[1];
      if (!selector) continue;
      const trigger = [...nativeInteractiveTriggers].find((name) => selector.includes(name));
      if (!trigger) continue;

      const unsafeArms = selector
        .split(',')
        .map((arm) => arm.trim())
        .filter((arm) => !/^(?:button|a)(?:\b|\[|\.|#|:)/.test(arm));

      if (unsafeArms.length) {
        failures.push(
          `${rel} ${module.className} exposes ${trigger} on non-native interactive hosts: ${unsafeArms.join(', ')}`,
        );
      }
    }
  }
}

function checkTableAdapterBoundaryContract() {
  const coreTableBoundaryDirs = [
    'packages/angular/table',
  ];
  const coreTableBoundaryFiles = [
    ...coreTableBoundaryDirs.flatMap((rel) => walk(join(root, rel))),
    join(root, 'packages/angular/table/public-api.ts'),
  ].filter((file) => file.endsWith('.ts') && !file.endsWith('.spec.ts') && !file.endsWith('.d.ts'));
  const adapterDirs = ['packages/angular/table-tanstack'];
  const adapterFiles = adapterDirs
    .flatMap((rel) => walk(join(root, rel)))
    .filter(
      (file) => file.endsWith('.ts') && !file.endsWith('.spec.ts') && !file.endsWith('.d.ts'),
    );
  const policies = [
    {
      label: 'TanStack Table',
      matches: (specifier) =>
        specifier.startsWith('@tanstack/angular-table') || specifier.startsWith('@tanstack/table'),
      allowedDir: 'packages/angular/table-tanstack',
    },
    {
      label: 'TanStack Virtual',
      matches: (specifier) => specifier.startsWith('@tanstack/virtual'),
      allowedDir: 'packages/angular/table-tanstack/virtual',
    },
    {
      label: 'Angular CDK table adapter',
      matches: (specifier) => specifier.startsWith('@angular/cdk/'),
      allowedDir: 'FORBIDDEN',
    },
  ];
  const adapterSourceDirs = new Set(adapterDirs);

  for (const file of [...coreTableBoundaryFiles, ...adapterFiles]) {
    const rel = relPath(file);
    const hits = moduleSpecifierReferences(file);
    for (const hit of hits) {
      for (const policy of policies) {
        if (!policy.matches(hit.specifier)) continue;
        if (rel === policy.allowedDir || rel.startsWith(`${policy.allowedDir}/`)) continue;
        failures.push(
          `Table adapter boundary ${rel}:${hit.line} imports ${hit.specifier}; ${policy.label} imports must stay inside ${policy.allowedDir}.`,
        );
      }

      const target = resolveRelativeModuleFile(file, hit.specifier);
      if (!target) continue;
      const targetRel = relPath(target);
      const adapterDir = [...adapterSourceDirs].find(
        (dir) => targetRel === dir || targetRel.startsWith(`${dir}/`),
      );
      if (adapterDir && !rel.startsWith(`${adapterDir}/`)) {
        failures.push(
          `Table adapter boundary ${rel}:${hit.line} imports ${hit.specifier} -> ${targetRel}; core table primitives must not depend on adapter entrypoints.`,
        );
      }
    }
  }
}

function checkNgpStateWriterContract() {
  const adapterRelPath = 'packages/angular/internal/ng-primitives/ngp-state-adapters.ts';
  const adapterPath = join(root, adapterRelPath);
  const adapterSource = readFile(adapterPath);
  const ngpPackage = parseJsonWithComments(
    readFile(join(root, 'packages/angular/node_modules/ng-primitives/package.json')),
  );
  const workspaceCatalog = readWorkspaceCatalog();
  const libraryPackage = parseJsonWithComments(readFile(join(root, 'packages/angular/package.json')));
  const expectedVersion = `ng-primitives@${ngpPackage.version}`;

  if (!adapterSource.includes(`HELL_NGP_STATE_WRITER_VERSION = '${expectedVersion}'`)) {
    failures.push(`ng-primitives state writer version must match installed ${expectedVersion}`);
  }

  if (workspaceCatalog['ng-primitives'] !== ngpPackage.version) {
    failures.push(
      `workspace ng-primitives catalog entry must be pinned to ${ngpPackage.version} while the state writer fallback is version-bound`,
    );
  }

  if (libraryPackage.peerDependencies?.['ng-primitives'] !== ngpPackage.version) {
    failures.push(
      `ng-primitives peer dependency must be pinned to ${ngpPackage.version} while the state writer fallback is version-bound`,
    );
  }

  const allowedBridgeFiles = new Set([
    adapterRelPath,
    'packages/angular/internal/ng-primitives/public-api.ts',
    'packages/angular/internal/ng-primitives/ngp-state-adapters.spec.ts',
    'packages/angular/combobox/combobox.ts',
    'packages/angular/radio/radio.ts',
  ]);
  const stateWriterTokens = [
    'HELL_NGP_STATE_WRITER_VERSION',
    'HELL_NGP_STATE_WRITER_UPGRADE_PATH',
    'writeComboboxStateValue',
    'writeComboboxStateDisabled',
    'writeRadioGroupStateValue',
    'writeRadioGroupStateDisabled',
    'writeRovingFocusActiveItem',
  ];
  const indexedStateWritePatterns = [
    {
      token: 'state[\'value\'].set(...) or state["value"].set(...)',
      pattern: /\bstate\[['"]value['"]\]\.set\(/,
    },
    {
      token: 'state[\'disabled\'].set(...) or state["disabled"].set(...)',
      pattern: /\bstate\[['"]disabled['"]\]\.set\(/,
    },
    {
      token: 'state[\'activeItem\'].set(...) or state["activeItem"].set(...)',
      pattern: /\bstate\[['"]activeItem['"]\]\.set\(/,
    },
    {
      token: 'state()[\'value\'].set(...) or state()["value"].set(...)',
      pattern: /\b(?:this\.)?[A-Za-z_$][\w$]*\(\)\[['"]value['"]\]\.set\(/,
    },
    {
      token: 'state()[\'disabled\'].set(...) or state()["disabled"].set(...)',
      pattern: /\b(?:this\.)?[A-Za-z_$][\w$]*\(\)\[['"]disabled['"]\]\.set\(/,
    },
    {
      token: 'state()[\'activeItem\'].set(...) or state()["activeItem"].set(...)',
      pattern: /\b(?:this\.)?[A-Za-z_$][\w$]*\(\)\[['"]activeItem['"]\]\.set\(/,
    },
  ];
  const directStateChannelWritePatterns = [
    {
      token: 'State<T>.value.set(...)',
      pattern: /\b(?:this\.)?[A-Za-z_$][\w$]*(?:\(\))?\.value\.set\(/,
    },
    {
      token: 'State<T>.disabled.set(...)',
      pattern: /\b(?:this\.)?[A-Za-z_$][\w$]*(?:\(\))?\.disabled\.set\(/,
    },
    {
      token: 'State<T>.activeItem.set(...)',
      pattern: /\b(?:this\.)?[A-Za-z_$][\w$]*(?:\(\))?\.activeItem\.set\(/,
    },
    {
      token: 'State<T>[\'value\'].set(...) or State<T>["value"].set(...)',
      pattern: /\b(?:this\.)?[A-Za-z_$][\w$]*(?:\(\))?\[['"]value['"]\]\.set\(/,
    },
    {
      token: 'State<T>[\'disabled\'].set(...) or State<T>["disabled"].set(...)',
      pattern: /\b(?:this\.)?[A-Za-z_$][\w$]*(?:\(\))?\[['"]disabled['"]\]\.set\(/,
    },
    {
      token: 'State<T>[\'activeItem\'].set(...) or State<T>["activeItem"].set(...)',
      pattern: /\b(?:this\.)?[A-Za-z_$][\w$]*(?:\(\))?\[['"]activeItem['"]\]\.set\(/,
    },
  ];
  const directPrimitiveStateAccessPattern = /\b(?:this\.)?[A-Za-z_$][\w$]*\.state\b/;
  const guardedFormStateTokens = [
    'NgpSelect',
    'NgpCombobox',
    'NgpRadioGroup',
    'NgpRovingFocusGroup',
    'injectSelectState',
    'injectComboboxState',
    'injectRadioGroupState',
    'injectRovingFocusGroupState',
    'State<NgpSelect',
    'State<NgpCombobox',
    'State<NgpRadioGroup',
    'NgpRovingFocusGroupState',
  ];
  const sourceFiles = libraryPackageFiles().filter((file) => file.endsWith('.ts'));

  for (const file of sourceFiles) {
    const source = readFile(file);
    const rel = file.slice(root.length + 1);
    const isSpec = rel.endsWith('.spec.ts');
    const isAdapter = rel === adapterRelPath;
    const usesGuardedFormState = guardedFormStateTokens.some((token) => source.includes(token));

    if (!isSpec) {
      for (const { token, pattern } of indexedStateWritePatterns) {
        if (pattern.test(source)) {
          failures.push(
            `Ad hoc ng-primitives State<T> channel write ${token} is not allowed in ${rel}; use ${adapterRelPath}`,
          );
        }
      }

      if (usesGuardedFormState && !isAdapter) {
        for (const { token, pattern } of directStateChannelWritePatterns) {
          if (pattern.test(source)) {
            failures.push(
              `Ad hoc ng-primitives ${token} is not allowed in ${rel}; use ${adapterRelPath}`,
            );
          }
        }

        if (directPrimitiveStateAccessPattern.test(source)) {
          failures.push(
            `Direct ng-primitives primitive .state access is not allowed in ${rel}; use injected State<T> through ${adapterRelPath}`,
          );
        }
      }
    }
    if (/\bngp[A-Za-z0-9_]*\.state\b/.test(source)) {
      failures.push(
        `Direct ng-primitives instance state access is not allowed in ${rel}; use injected State<T> adapter seam`,
      );
    }
    if (allowedBridgeFiles.has(rel)) continue;
    const usesStateWriter =
      source.includes('ngp-state-adapters') ||
      stateWriterTokens.some((token) => source.includes(token));
    if (usesStateWriter) {
      failures.push(`ng-primitives state writer usage is not approved in ${rel}`);
    }
  }
}

function checkEntrypointManifestSourceCoverage() {
  const discoveredMetadataPaths = new Set();
  for (const entrypoint of entrypointPublicApiFiles()) {
    if (!existsSync(join(root, entrypoint.packageDir))) {
      failures.push(
        `Entrypoint Metadata ${entrypoint.id} references missing package directory ${entrypoint.packageDir}`,
      );
    }
    discoveredMetadataPaths.add(entrypoint.metadataPath);
    if (!entrypoint.metadataPath || !existsSync(join(root, entrypoint.metadataPath))) {
      failures.push(
        `Entrypoint Metadata ${entrypoint.id} is missing ${entrypointMetadataFileName} in ${entrypoint.packageDir}`,
      );
    }
    if (!entrypoint.category) {
      failures.push(`Entrypoint Metadata ${entrypoint.id} is missing category metadata`);
    }
  }

  const packageMetadataPaths = walk(join(root, libraryRoot))
    .filter((path) => basename(path) === 'ng-package.json')
    .map((path) => `${relative(root, dirname(path))}/${entrypointMetadataFileName}`);
  for (const metadataPath of packageMetadataPaths) {
    if (!existsSync(join(root, metadataPath))) {
      failures.push(`Package Entry Point is missing entrypoint metadata ${metadataPath}`);
    } else if (!discoveredMetadataPaths.has(metadataPath)) {
      failures.push(`Entrypoint Metadata is not discoverable: ${metadataPath}`);
    }
  }
}

function checkGeneratedEntrypointFiles() {
  for (const entrypoint of entrypointPublicApiFiles()) {
    const filePath = join(root, entrypoint.publicApiPath);
    if (!existsSync(filePath)) {
      failures.push(`Entrypoint generated public API is missing ${entrypoint.publicApiPath}`);
      continue;
    }

    const expected = renderPublicApiFile(entrypoint);
    if (readFile(filePath) !== expected) {
      failures.push(
        `Entrypoint generated public API is stale: ${entrypoint.publicApiPath} (run pnpm run generate:entrypoints)`,
      );
    }
  }

  for (const entrypoint of secondaryPackageEntrypoints()) {
    const filePath = join(root, entrypoint.packagePath);
    if (!existsSync(filePath)) {
      failures.push(`Entrypoint generated ng-package is missing ${entrypoint.packagePath}`);
      continue;
    }

    const expected = renderNgPackageFile(entrypoint);
    if (readFile(filePath) !== expected) {
      failures.push(
        `Entrypoint generated ng-package is stale: ${entrypoint.packagePath} (run pnpm run generate:entrypoints)`,
      );
    }
  }
}

function externalImportPackages(source) {
  const packages = [];
  const importRegex =
    /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?['"]([^.'"/][^'"]*)['"]/g;
  for (const match of source.matchAll(importRegex)) {
    packages.push(packageNameFromSpecifier(match[1]));
  }

  const dynamicImportRegex = /import\(\s*['"]([^.'"/][^'"]*)['"]\s*\)/g;
  for (const match of source.matchAll(dynamicImportRegex)) {
    packages.push(packageNameFromSpecifier(match[1]));
  }

  return packages;
}

function packageNameFromSpecifier(specifier) {
  if (specifier.startsWith('@')) {
    return specifier.split('/').slice(0, 2).join('/');
  }
  return specifier.split('/')[0];
}

function pagePathForRoute(routePath) {
  if (routePath === '/') {
    return join(root, 'apps/docs/src/app/pages/overview/overview.page.ts');
  }

  const route = routePath.replace(/^\//, '');
  return join(root, 'apps/docs/src/app/pages', route, `${basename(route)}.page.ts`);
}

function exportPaths(source) {
  return [...source.matchAll(/export\s+[^;]*?\s+from\s+['"]([^'"]+)['"]/g)].map(
    (match) => match[1],
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseJsonWithComments(source) {
  let json = '';
  let inString = false;
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    const next = source[i + 1];

    if (inLineComment) {
      if (char === '\n') {
        inLineComment = false;
        json += char;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (inString) {
      json += char;
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\\\') {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      json += char;
      continue;
    }

    if (char === '/' && next === '*') {
      inBlockComment = true;
      i += 1;
      continue;
    }

    if (char === '/' && next === '/') {
      inLineComment = true;
      i += 1;
      continue;
    }

    json += char;
  }

  return JSON.parse(json);
}

function readFile(path) {
  return readFileSync(path, 'utf8');
}

function readWorkspaceCatalog() {
  const source = readFile(join(root, 'pnpm-workspace.yaml'));
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

function walk(path) {
  const out = [];
  for (const name of readdirSync(path)) {
    const fullPath = join(path, name);
    if (statSync(fullPath).isDirectory()) out.push(...walk(fullPath));
    else out.push(fullPath);
  }
  return out;
}

main();
