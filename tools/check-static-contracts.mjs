import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

// Static source/package contract gate only. Behavior, visual, API-report,
// package-consumer, and release claims need their own evidence commands.
import {
  apiDocsDisclosurePolicyEntries,
  apiReportPolicyEntries,
  entrypointPolicyEntries,
  entrypointPublicApiFiles,
  entrypointSourceGroups,
  entrypointTsconfigPaths,
  renderNgPackageFile,
  renderPublicApiFile,
  secondaryPackageEntrypoints,
  styleEntrypointPolicyEntries,
} from './entrypoint-manifest.mjs';
import {
  loadStaticContractManifest,
  peerCategoryContractsFromManifest,
  peersFromPeerSets,
} from './static-contract-manifests.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

const docsLazyRouteBoundaryManifest = loadStaticContractManifest('docs-lazy-route-boundaries.json');
const docsExampleImportBoundaryDocPath = docsLazyRouteBoundaryManifest.docPath;
const allowedDocsLazyRouteCrossImports = docsLazyRouteBoundaryManifest.allowedCrossImports;
const docsHeavyLazyRoutePolicies = docsLazyRouteBoundaryManifest.heavyLazyRoutePolicies;
const docsCodePreviewLazyWrapperPath = docsLazyRouteBoundaryManifest.codePreviewLazyWrapperPath;
const docsCodeEditorIsolation = docsLazyRouteBoundaryManifest.codeEditorIsolation;
const docsPdfViewerIsolation = docsLazyRouteBoundaryManifest.pdfViewerIsolation;

const packageConsumerPeerContractManifest = loadStaticContractManifest(
  'package-consumer-peer-contracts.json',
);
const browserGlobalSeamManifest = loadStaticContractManifest('browser-global-seams.json');

const codeEditorEntrypointSpecifier = '@hell-ui/angular/features/code-editor';
const codeMirrorPackageSpecifierPrefixes = ['@codemirror/', '@lezer/'];
const audioTranscriptEntrypointSpecifier = '@hell-ui/angular/features/audio-transcript';
const audioTranscriptRuntimeTerms = [
  { label: 'SpeechRecognition', pattern: /\bSpeechRecognition\b|\bwebkitSpeechRecognition\b/ },
  { label: 'captureStream()', pattern: /\bcaptureStream\b/ },
];
const apiStatusTags = ['beta', 'experimental', 'deprecated'];

function main() {
  checkDocsExamples();
  checkDocsLazyRouteImportGraphContract();
  checkDocsRootImportContract();
  checkDocsShellNarrowEntrypointContract();
  checkDocsCodeEditorIsolationContract();
  checkDocsPdfViewerIsolationContract();
  checkPackageEntryPoints();
  checkCodeMirrorEntrypointIsolationContract();
  checkAudioTranscriptEntrypointIsolationContract();
  checkApiReportContract();
  checkApiStabilityContract();
  checkApiDocsDisclosureContract();
  checkPackageDependencyContract();
  checkStyleEntryPoints();
  checkNgClassCustomizationContract();
  checkAngularHostMetadataContract();
  checkAppShellBreakpointContract();
  checkComponentContract();
  checkLabelContract();
  checkCodeEditorRuntimeContract();
  checkExperimentalFeatureContract();
  checkNativeButtonSelectorContract();
  checkInteractiveTriggerSelectorContract();
  checkTableUtilityContract();
  checkTableLegacyRemovalContract();
  checkTableAdapterBoundaryContract();
  checkFloatingAdapterContract();
  checkBrowserGlobalContract();
  checkNgpStateWriterContract();

  if (failures.length) {
    console.error('Static contract checks failed:\n');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log('Static contract checks passed.');
}

function checkDocsExamples() {
  const catalogPath = join(root, 'projects/hell-docs/src/app/docs-catalog.ts');
  const searchIndexPath = join(root, 'projects/hell-docs/src/app/docs-search-index.ts');
  const catalog = readFile(catalogPath);
  const searchIndex = readFile(searchIndexPath);
  const routePaths = catalogRoutePaths(catalog);
  const examples = docsSearchIndexSeeds(searchIndex, 'HD_DOCS_EXAMPLES');
  const usages = docsSearchIndexSeeds(searchIndex, 'HD_DOCS_CODE_USAGES');
  const pagesRoot = join(root, 'projects/hell-docs/src/app/pages');

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
  const docsRoot = join(root, 'projects/hell-docs/src/app');
  const pagesRoot = join(docsRoot, 'pages');
  const catalogPath = join(docsRoot, 'docs-catalog.ts');
  const docPath = join(root, docsExampleImportBoundaryDocPath);
  const routeEntries = docsLazyRouteEntries(catalogPath, pagesRoot);
  const routeEntriesByBoundary = docsRouteEntriesByBoundary(routeEntries);

  checkDocsExampleImportBoundaryDocs(docPath);

  for (const policy of docsHeavyLazyRoutePolicies) {
    const routeEntry = routeEntries.find(
      (entry) => entry.boundary === policy.boundary && entry.routePaths.includes(policy.routePath),
    );
    if (!routeEntry) {
      failures.push(
        `Docs Lazy Route Import Graph policy ${policy.id} must be backed by lazy route ${policy.routePath} in projects/hell-docs/src/app/docs-catalog.ts`,
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
          'docs shell/shared/search files must not eagerly reference lazy page or example code. Move shared code to projects/hell-docs/src/app/shared or add a documented narrow allowance.',
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
        `${fromBoundary.label} must not eagerly reference ${toBoundary.label}. Move shared code to projects/hell-docs/src/app/shared or add a documented narrow allowance.`,
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
      if (policy.id === 'code-editor-docs' && isDocsCodePreviewLazyWrapper(importHit.file)) continue;

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
    }
  }
}

function checkDocsExampleImportBoundaryDocs(docPath) {
  if (!existsSync(docPath)) {
    failures.push(`Docs Lazy Route Import Graph missing ${docsExampleImportBoundaryDocPath}`);
    return;
  }

  const docs = readFile(docPath);
  const requiredParts = [
    'docs-example-import-boundaries',
    'tools/static-contracts/docs-lazy-route-boundaries.json',
    'tools/check-static-contracts.mjs',
    'projects/hell-docs/src/app/docs-catalog.ts',
    'projects/hell-docs/src/app/pages/<route>/examples/',
    'projects/hell-docs/src/app/shared/',
  ];
  for (const part of requiredParts) {
    if (!docs.includes(part)) {
      failures.push(`Docs Lazy Route Import Graph note is missing ${part}`);
    }
  }
}

function docsLazyRouteEntries(catalogPath, pagesRoot) {
  const catalog = readFile(catalogPath);
  const entries = [];
  const seen = new Set();
  const routeImportRegex = /(?:routePath|path):\s*'([^']*)'[\s\S]*?loadComponent:\s*\(\)\s*=>\s*import\(\s*'([^']+)'\s*\)/g;

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
  const boundary = examplesIndex > 0 ? parts.slice(0, examplesIndex).join('/') : parts.slice(0, -1).join('/');
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
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
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
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
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
  for (const match of body.matchAll(/\{\s*title:\s*'([^']+)'\s*,\s*path:\s*'([^']+)'\s*,\s*detail:\s*'([^']+)'/g)) {
    seeds.push({
      title: match[1],
      path: match[2],
      detail: match[3],
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
  const docsRoot = join(root, 'projects/hell-docs/src/app');
  const docsFiles = walk(docsRoot).filter((file) => file.endsWith('.ts'));

  for (const file of docsFiles) {
    const source = readFile(file);
    if (/(?:from|import\()\s*['\"]hell(?:\/|['\"])/.test(source)) {
      failures.push(
        `Docs app file ${file.slice(root.length + 1)} imports legacy unscoped hell root or hell/* subpath`,
      );
    }
    if (/(?:from|import\()\s*['\"]@hell-ui\/angular['\"]/.test(source)) {
      failures.push(
        `Docs app file ${file.slice(root.length + 1)} imports the root @hell-ui/angular entry point`,
      );
    }
  }
}

function checkDocsShellNarrowEntrypointContract() {
  const shellFiles = [
    'projects/hell-docs/src/app/app.ts',
    'projects/hell-docs/src/app/shared/code-block.ts',
    'projects/hell-docs/src/app/shared/example-tabs.ts',
  ];

  for (const file of shellFiles) {
    const path = join(root, file);
    if (!existsSync(path)) {
      failures.push(`Docs shell narrow-entrypoint check references missing file ${file}`);
      continue;
    }

    const source = readFile(path);
    if (/(?:from|import\()\s*['"]@hell-ui\/angular\/(?:primitives|composites)['"]/.test(source)) {
      failures.push(
        `Docs shell file ${file} must import component-specific @hell-ui/angular/* entry points instead of aggregate primitives/composites`,
      );
    }
  }
}

function checkDocsCodeEditorIsolationContract() {
  const directSharedFiles = docsCodeEditorIsolation.directSharedFiles;
  const deferredSharedFiles = docsCodeEditorIsolation.lazyWrapperImportFiles;
  const codeEditorImports = docsCodeEditorIsolation.packageSpecifiers;

  for (const file of directSharedFiles) {
    const path = join(root, file);
    if (!existsSync(path)) {
      failures.push(`Docs static contract check references missing file ${file}`);
      continue;
    }

    const source = readFile(path);
    if (hasPackageImport(source, codeEditorImports)) {
      failures.push(
        `Docs shared file ${file} must not import CodeMirror or @hell-ui/angular/features/code-editor directly; use the deferred docs code viewer wrapper`,
      );
    }
    if (/<pre\b/.test(source)) {
      failures.push(`Docs shared file ${file} must not render raw <pre> code blocks for shared code previews`);
    }
  }

  for (const file of deferredSharedFiles) {
    const path = join(root, file);
    if (!hasDynamicImportTo(path, docsCodePreviewLazyWrapperPath)) {
      failures.push(
        `Docs shared file ${file} must lazy-load shared docs code previews through the docs-code-viewer dynamic component`,
      );
    }
    if (hasStaticImportTo(path, docsCodePreviewLazyWrapperPath)) {
      failures.push(`Docs shared file ${file} must not statically import ${docsCodePreviewLazyWrapperPath}`);
    }
  }

  const wrapperPath = join(root, docsCodePreviewLazyWrapperPath);
  if (!existsSync(wrapperPath)) {
    failures.push(`Docs static contract check references missing file ${docsCodePreviewLazyWrapperPath}`);
  } else {
    const wrapperSource = readFile(wrapperPath);
    for (const specifier of docsCodeEditorIsolation.wrapperPackageSpecifiers) {
      if (!hasPackageImport(wrapperSource, [specifier])) {
        failures.push(`Docs code viewer wrapper must import ${specifier}`);
      }
    }
    if (/<pre\b/.test(wrapperSource)) {
      failures.push('Docs code viewer wrapper must render HellCodeEditor instead of raw <pre> code blocks');
    }
  }

  const docsPagesRoot = join(root, 'projects/hell-docs/src/app/pages');
  const docsPages = walk(docsPagesRoot).filter((file) => file.endsWith('.ts'));
  for (const file of docsPages) {
    if (isFileInDocsBoundary(file, docsPagesRoot, docsCodeEditorIsolation.pageBoundary)) continue;
    if (/\bcode-editor\b/i.test(file)) continue;

    const source = readFile(file);
    if (hasPackageImport(source, codeEditorImports)) {
      failures.push(
        `Docs page ${file.replace(root + '/', '')} must keep CodeMirror imports within /components/code-editor`,
      );
    }
  }
}

function checkDocsPdfViewerIsolationContract() {
  const heavyImports = docsPdfViewerIsolation.packageSpecifiers;
  const globalDocsFiles = docsPdfViewerIsolation.globalDocsFiles;
  const sharedFiles = docsPdfViewerIsolation.sharedFiles;
  const pdfViewerPageImportFragment = `pages/${docsPdfViewerIsolation.pageBoundary}`;

  for (const file of globalDocsFiles) {
    const path = join(root, file);
    if (!existsSync(path)) {
      failures.push(`Docs static contract check references missing file ${file}`);
      continue;
    }

    const source = readFile(path);
    if (hasPackageImport(source, heavyImports)) {
      failures.push(
        `Docs global catalog/search file ${file} must not import pdf.js or @hell-ui/pdf-viewer`,
      );
    }
    if (hasStaticImportFrom(source, pdfViewerPageImportFragment)) {
      failures.push(
        `Docs global catalog/search file ${file} must lazy-load the PDF viewer page instead of statically importing it`,
      );
    }
    if (hasDynamicImportFrom(source, `${pdfViewerPageImportFragment}/examples`)) {
      failures.push(
        `Docs global catalog/search file ${file} must not import PDF viewer demo code; keep examples behind the PDF page boundary`,
      );
    }
  }

  for (const file of sharedFiles) {
    const path = join(root, file);
    if (!existsSync(path)) {
      failures.push(`Docs static contract check references missing file ${file}`);
      continue;
    }

    const source = readFile(path);
    if (hasPackageImport(source, heavyImports)) {
      failures.push(
        `Docs shared file ${file} must not import pdf.js or @hell-ui/pdf-viewer`,
      );
    }
  }

  const docsPagesRoot = join(root, 'projects/hell-docs/src/app/pages');
  const docsPages = walk(docsPagesRoot).filter((file) => file.endsWith('.ts'));
  for (const file of docsPages) {
    if (isFileInDocsBoundary(file, docsPagesRoot, docsPdfViewerIsolation.pageBoundary)) continue;

    const source = readFile(file);
    if (hasPackageImport(source, heavyImports)) {
      failures.push(
        `Docs page ${file.replace(root + '/', '')} must keep pdf.js imports within /components/pdf-viewer`,
      );
    }
  }

  const pdfViewerPagePath = join(root, docsPdfViewerIsolation.pagePath);
  const pdfViewerPage = readFile(pdfViewerPagePath);
  if (componentStyleArrayIncludes(pdfViewerPage, docsPdfViewerIsolation.forbiddenComponentStyleSpecifiers)) {
    failures.push(
      'PDF viewer docs page must load feature CSS as a lazy external asset, not an Angular component style',
    );
  }
}

function hasPackageImport(source, specifiers) {
  return specifiers.some((specifier) => {
    const escaped = escapeRegExp(specifier);
    const pattern = new RegExp(
      `(?:from\\s*['"]${escaped}(?:/[^'"]*)?['"]|import\\s*(?:\\(\\s*)?['"]${escaped}(?:/[^'"]*)?['"])`,
    );
    return pattern.test(source);
  });
}

function hasStaticImportFrom(source, pathFragment) {
  return source.split('\n').some((line) => {
    const trimmed = line.trimStart();
    return trimmed.startsWith('import ') && !trimmed.startsWith('import(') && line.includes(pathFragment);
  });
}

function hasDynamicImportFrom(source, pathFragment) {
  const escaped = escapeRegExp(pathFragment);
  return new RegExp(`import\\s*\\(\\s*['"][^'"]*${escaped}[^'"]*['"]`).test(source);
}

function hasDynamicImportTo(file, targetRelPath) {
  return hasModuleReferenceTo(file, targetRelPath, (kind) => kind === 'dynamic');
}

function hasStaticImportTo(file, targetRelPath) {
  return hasModuleReferenceTo(file, targetRelPath, (kind) => kind !== 'dynamic');
}

function hasModuleReferenceTo(file, targetRelPath, kindMatches) {
  if (!existsSync(file)) return false;

  return moduleImportSpecifiers(file).some((hit) => {
    if (!kindMatches(hit.kind)) return false;
    const target = resolveRelativeModuleFile(hit.file, hit.specifier);
    return target ? relPath(target) === targetRelPath : false;
  });
}

function componentStyleArrayIncludes(source, specifiers) {
  const stylesBlock = /styles\s*:\s*\[([\s\S]*?)\]/.exec(source)?.[1] ?? '';
  return specifiers.some((specifier) => stylesBlock.includes(specifier));
}

function checkPackageEntryPoints() {
  const publicApiFiles = entrypointPublicApiFiles();
  const rootPublicApi = publicApiFiles.find((entrypoint) => entrypoint.id === 'root');
  const rootApiPath = join(root, rootPublicApi.publicApiPath);
  const rootApi = readFile(rootApiPath);
  const secondaryApis = publicApiFiles
    .filter((entrypoint) => entrypoint.id !== 'root')
    .map((entrypoint) => entrypoint.publicApiPath);

  const disallowedRootExports = exportPaths(rootApi).filter((path) =>
    path.includes('public-api-primitives') || path.includes('public-api-primitive-') ||
    path.includes('public-api-composites') || path.includes('public-api-feature') ||
    path.includes('/primitives/') ||
    path.includes('/features/') || path.includes('/composites/')
  );
  if (disallowedRootExports.length) {
    failures.push(
      `Light Root Entry Point exports composites/features from projects/hell/src/public-api.ts: ${disallowedRootExports.join(', ')}`,
    );
  }

  const internalCoreExports = new Set(['floating-dismissal', 'floating-scope', 'resize-behavior']);
  for (const [api, source] of [
    [rootPublicApi.publicApiPath, rootApi],
    ...secondaryApis
      .filter((api) => existsSync(join(root, api)))
      .map((api) => [api, readFile(join(root, api))]),
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
  const paths = tsconfig.compilerOptions?.paths ?? {};
  const expectedPaths = Object.fromEntries(
    entrypointTsconfigPaths().map((entrypoint) => [entrypoint.specifier, entrypoint.path]),
  );

  for (const [entryPoint, expectedPath] of Object.entries(expectedPaths)) {
    const actual = paths[entryPoint]?.[0];
    if (actual !== expectedPath) {
      failures.push(
        `Package Entry Point ${entryPoint} maps to ${actual ?? 'nothing'}, expected ${expectedPath}`,
      );
    }
  }

  const manifestSpecifiers = new Set(publicApiFiles.map((entrypoint) => entrypoint.specifier));
  for (const specifier of [
    '@hell-ui/angular/table',
    '@hell-ui/angular/data-table',
    '@hell-ui/angular/table-tanstack',
    '@hell-ui/angular/table-virtual',
    '@hell-ui/angular/table-cdk',
  ]) {
    if (!manifestSpecifiers.has(specifier)) failures.push(`Table Entrypoint Manifest is missing ${specifier}`);
  }
  for (const specifier of [
    '@hell-ui/angular/features/data-table',
    '@hell-ui/angular/features/table-utilities',
  ]) {
    if (manifestSpecifiers.has(specifier) || paths[specifier]) {
      failures.push(`Legacy table entry point must be removed from manifest/tsconfig: ${specifier}`);
    }
  }

  const legacyPaths = Object.keys(paths).filter((entryPoint) => entryPoint.startsWith('hell'));
  if (legacyPaths.length) {
    failures.push(`Package Identity still exposes legacy alias paths in tsconfig.json: ${legacyPaths.join(', ')}`);
  }

  const packagePaths = secondaryPackageEntrypoints().map((entrypoint) => entrypoint.packagePath);

  for (const packagePath of packagePaths) {
    if (!existsSync(join(root, packagePath))) {
      failures.push(`Package Entry Point is missing ${packagePath}`);
    }
  }

  checkEntrypointManifestSourceCoverage();
  checkGeneratedEntrypointFiles();
  checkEntrypointPolicyManifestContract();
}

function checkEntrypointPolicyManifestContract() {
  const policyEntries = entrypointPolicyEntries();
  const stylePolicyEntries = styleEntrypointPolicyEntries();
  const apiReportEntries = apiReportPolicyEntries();
  const validTiers = new Set(['stable', 'beta', 'experimental', 'deprecated', 'internal']);
  const validApiReportExpectations = new Set(['required', 'covered-by', 'excluded', 'not-applicable']);
  const validPeerTiers = new Set(packageConsumerPeerContractManifest.peerTiers ?? []);
  const validScenarios = new Set(
    Object.keys(packageConsumerPeerContractManifest.scenarioPeerContracts ?? {}),
  );

  const expectedTsSpecifiers = new Set([
    ...entrypointPublicApiFiles().map((entrypoint) => entrypoint.specifier),
    '@hell-ui/pdf-viewer',
  ]);
  const actualTsSpecifiers = new Set(policyEntries.map((entrypoint) => entrypoint.specifier));
  assertSameSet(
    'Entrypoint Stability Manifest TypeScript specifiers',
    expectedTsSpecifiers,
    actualTsSpecifiers,
  );

  const tsconfig = parseJsonWithComments(readFile(join(root, 'tsconfig.json')));
  const packageAliases = new Set(
    Object.keys(tsconfig.compilerOptions?.paths ?? {}).filter(
      (specifier) =>
        specifier === '@hell-ui/angular' ||
        specifier.startsWith('@hell-ui/angular/') ||
        specifier === '@hell-ui/pdf-viewer' ||
        specifier.startsWith('@hell-ui/pdf-viewer/'),
    ),
  );
  assertSameSet(
    'Entrypoint Stability Manifest TypeScript package aliases',
    packageAliases,
    actualTsSpecifiers,
  );
  const tsconfigPaths = tsconfig.compilerOptions?.paths ?? {};
  for (const entrypoint of policyEntries) {
    const expectedPath = `./${entrypoint.publicApiPath}`;
    const actualPath = tsconfigPaths[entrypoint.specifier]?.[0];
    if (actualPath !== expectedPath) {
      failures.push(
        `Entrypoint Stability Manifest ${entrypoint.specifier} tsconfig path is ${actualPath ?? 'missing'}, expected ${expectedPath}`,
      );
    }
  }

  const expectedNgPackagePaths = new Set([
    'projects/hell/ng-package.json',
    'projects/hell-pdf-viewer/ng-package.json',
    ...secondaryPackageEntrypoints().map((entrypoint) => entrypoint.packagePath),
  ]);
  const actualNgPackagePaths = new Set(
    walk(join(root, 'projects'))
      .filter((file) => basename(file) === 'ng-package.json')
      .map(relPath),
  );
  assertSameSet('Entrypoint Stability Manifest ng-package files', expectedNgPackagePaths, actualNgPackagePaths);

  const styleSpecifiers = new Set(stylePolicyEntries.map((entrypoint) => entrypoint.specifier));
  const styleExportMaps = new Map();
  const concreteStyleSpecifiers = new Set(
    stylePolicyEntries
      .filter((entrypoint) => entrypoint.kind === 'style')
      .map((entrypoint) => entrypoint.specifier),
  );
  const expectedConcreteStyleSpecifiers = new Set();
  for (const [packagePath, packageName] of [
    ['projects/hell/package.json', '@hell-ui/angular'],
    ['projects/hell-pdf-viewer/package.json', '@hell-ui/pdf-viewer'],
  ]) {
    const packageJson = parseJsonWithComments(readFile(join(root, packagePath)));
    styleExportMaps.set(packageName, packageJson.exports ?? {});
    for (const exportPath of Object.keys(packageJson.exports ?? {})) {
      const specifier = styleSpecifierForExport(packageName, exportPath);
      if (!styleSpecifiers.has(specifier)) {
        failures.push(`Entrypoint Stability Manifest is missing style entrypoint ${specifier}`);
      }
      if (!exportPath.includes('*')) expectedConcreteStyleSpecifiers.add(specifier);
    }
  }
  for (const file of readdirSync(join(root, 'projects/hell/src/lib/styles/components')).filter((name) =>
    name.endsWith('.css'),
  )) {
    expectedConcreteStyleSpecifiers.add(
      `@hell-ui/angular/styles/components/${basename(file, '.css')}`,
    );
  }
  assertSameSet(
    'Entrypoint Stability Manifest concrete style entrypoints',
    expectedConcreteStyleSpecifiers,
    concreteStyleSpecifiers,
  );

  for (const entrypoint of stylePolicyEntries) {
    const exportsMap = styleExportMaps.get(entrypoint.ownerPackage);
    if (!styleEntrypointHasPackageExport(entrypoint, exportsMap)) {
      failures.push(
        `Entrypoint Stability Manifest ${entrypoint.specifier} is not backed by an importable package style export`,
      );
    }
  }

  const requiredReportSpecifiers = new Set(
    policyEntries
      .filter((entrypoint) => entrypoint.apiReport?.expectation === 'required')
      .map((entrypoint) => entrypoint.specifier),
  );
  const policyEntryBySpecifier = new Map(
    policyEntries.map((entrypoint) => [entrypoint.specifier, entrypoint]),
  );
  const requiredReportFileNames = new Set(
    apiReportEntries
      .filter((entrypoint) => entrypoint.apiReport.expectation === 'required')
      .map((entrypoint) => entrypoint.apiReport.reportFileName),
  );
  const actualReportFileNames = new Set(
    readdirSync(join(root, 'etc/api-reports')).filter((name) => name.endsWith('.api.md')),
  );
  assertSameSet(
    'Entrypoint Stability Manifest API report baselines',
    requiredReportFileNames,
    actualReportFileNames,
  );
  for (const entrypoint of [...policyEntries, ...stylePolicyEntries]) {
    const label = `Entrypoint Stability Manifest ${entrypoint.specifier}`;
    if (!validTiers.has(entrypoint.tier)) failures.push(`${label} has invalid tier ${entrypoint.tier}`);
    if (!entrypoint.ownerPackage) failures.push(`${label} is missing ownerPackage`);
    if (!validPeerTiers.has(entrypoint.peerTier)) {
      failures.push(`${label} has unknown peer tier ${entrypoint.peerTier}`);
    }
    if (!validScenarios.has(entrypoint.consumerScenario)) {
      failures.push(`${label} has unknown package-consumer scenario ${entrypoint.consumerScenario}`);
    }

    const expectation = entrypoint.apiReport?.expectation;
    if (!validApiReportExpectations.has(expectation)) {
      failures.push(`${label} has invalid API report expectation ${expectation}`);
    }
    if ((entrypoint.kind === 'style' || entrypoint.kind === 'style-pattern') && expectation !== 'not-applicable') {
      failures.push(`${label} is a style entrypoint and must not claim API report coverage`);
    }
    if (entrypoint.kind === 'typescript' && ['stable', 'beta'].includes(entrypoint.tier) && !['required', 'covered-by'].includes(expectation)) {
      failures.push(`${label} is ${entrypoint.tier} and must be API-report required or covered-by another report`);
    }
    if (entrypoint.kind === 'typescript' && entrypoint.tier === 'experimental' && expectation !== 'excluded') {
      failures.push(`${label} is experimental and must carry an explicit API report exclusion`);
    }
    if (expectation === 'required' && !/\.api\.md$/.test(entrypoint.apiReport.reportFileName ?? '')) {
      failures.push(`${label} requires an API report but has no reportFileName`);
    }
    if (expectation === 'covered-by' && !requiredReportSpecifiers.has(entrypoint.apiReport.coveredBy)) {
      failures.push(`${label} is covered by unknown API report entrypoint ${entrypoint.apiReport.coveredBy}`);
    }
    if (expectation === 'covered-by' && requiredReportSpecifiers.has(entrypoint.apiReport.coveredBy)) {
      const coveringEntry = policyEntryBySpecifier.get(entrypoint.apiReport.coveredBy);
      const missingExports = (entrypoint.exports ?? []).filter(
        (exportPath) => !coveringEntry?.exports?.includes(exportPath),
      );
      if (missingExports.length) {
        failures.push(
          `${label} claims API report coverage from ${entrypoint.apiReport.coveredBy}, but its exports are not in that aggregate entrypoint: ${missingExports.join(', ')}`,
        );
      }
    }
    if (expectation === 'excluded' && !entrypoint.apiReport.reason) {
      failures.push(`${label} excludes API reports without a reason`);
    }
  }
}

function styleSpecifierForExport(packageName, exportPath) {
  return `${packageName}/${exportPath.replace(/^\.\//, '')}`;
}

function styleEntrypointHasPackageExport(entrypoint, exportsMap) {
  if (!exportsMap) return false;
  const exact = exportsMap[entrypoint.exportPath];
  if (entrypoint.kind === 'style-pattern') return styleExportTargetsCss(exact, true);
  if (styleExportTargetsCss(exact, false)) return true;

  return Object.entries(exportsMap).some(
    ([exportPath, exportValue]) =>
      exportPath.includes('*') &&
      styleExportTargetsCss(exportValue, true) &&
      exportPathPatternMatches(exportPath, entrypoint.exportPath),
  );
}

function styleExportTargetsCss(exportValue, allowPattern) {
  if (!exportValue || typeof exportValue !== 'object' || Array.isArray(exportValue)) return false;
  return ['style', 'default'].every((condition) => {
    const target = exportValue[condition];
    return (
      typeof target === 'string' &&
      target.startsWith('./') &&
      target.endsWith('.css') &&
      !target.includes('..') &&
      (allowPattern || !target.includes('*'))
    );
  });
}

function exportPathPatternMatches(pattern, exportPath) {
  const [prefix, suffix] = pattern.split('*');
  return exportPath.startsWith(prefix) && exportPath.endsWith(suffix);
}

function assertSameSet(label, expected, actual) {
  const expectedList = [...expected].sort();
  const actualList = [...actual].sort();
  const missing = expectedList.filter((value) => !actual.has(value));
  const unexpected = actualList.filter((value) => !expected.has(value));
  if (!missing.length && !unexpected.length) return;

  const parts = [];
  if (missing.length) parts.push(`missing ${missing.join(', ')}`);
  if (unexpected.length) parts.push(`unexpected ${unexpected.join(', ')}`);
  failures.push(`${label} mismatch: ${parts.join('; ')}`);
}

function checkPublicApiStatusPolicy(policyEntries) {
  const policyTiers = new Set(
    policyEntries
      .filter((entrypoint) => entrypoint.kind === 'typescript')
      .map((entrypoint) => entrypoint.tier),
  );
  for (const tier of ['stable', 'beta', 'experimental']) {
    if (!policyTiers.has(tier)) {
      failures.push(`Entrypoint Stability Manifest must classify at least one TypeScript entrypoint as ${tier}`);
    }
  }

  for (const entrypoint of policyEntries) {
    const expectedTag = apiStatusTagForTier(entrypoint.tier);
    const header = entrypoint.header?.join('\n') ?? '';
    for (const tag of apiStatusTags) {
      if (tag !== expectedTag && apiStatusTagPattern(tag).test(header)) {
        failures.push(
          `Entrypoint Stability Manifest ${entrypoint.specifier} header uses @${tag}, but its tier is ${entrypoint.tier}`,
        );
      }
    }

    if (!entrypoint.statusTagRequired) continue;
    if (!expectedTag) {
      failures.push(
        `Entrypoint Stability Manifest ${entrypoint.specifier} requires a public status tag, but its tier ${entrypoint.tier} has no API status tag`,
      );
      continue;
    }
    if (!apiStatusTagPattern(expectedTag).test(header)) {
      failures.push(
        `Entrypoint Stability Manifest ${entrypoint.specifier} requires @${expectedTag} in its manifest header`,
      );
      continue;
    }

    const publicApi = readFile(join(root, entrypoint.publicApiPath));
    if (!apiStatusTagPattern(expectedTag).test(publicApi)) {
      failures.push(
        `Entrypoint Stability Manifest ${entrypoint.specifier} declares ${entrypoint.tier}, but ${entrypoint.publicApiPath} is missing @${expectedTag}`,
      );
    }
  }
}

function apiStatusTagForTier(tier) {
  return apiStatusTags.includes(tier) ? tier : null;
}

function apiStatusTagPattern(tag) {
  return new RegExp(`@${escapeRegExp(tag)}\\b`);
}

function checkCodeMirrorEntrypointIsolationContract() {
  const rootCorePaths = [
    'projects/hell/src/public-api.ts',
    'projects/hell/src/lib/public-api-core.ts',
    ...productionTsFilesUnder('projects/hell/src/lib/core'),
  ];
  const compositePaths = [
    'projects/hell/src/lib/public-api-composites.ts',
    ...entrypointPublicApiFiles()
      .filter((entrypoint) => entrypoint.group === 'composites')
      .map((entrypoint) => entrypoint.publicApiPath),
    ...productionTsFilesUnder('projects/hell/src/lib/composites'),
  ];
  const nonCodeEditorFeaturePaths = [
    ...entrypointPublicApiFiles()
      .filter((entrypoint) => entrypoint.group === 'features' && entrypoint.slug !== 'code-editor')
      .map((entrypoint) => entrypoint.publicApiPath),
    ...productionTsFilesUnder('projects/hell/src/lib/features').filter(
      (file) => !file.includes('/features/code-editor/'),
    ),
  ];

  const boundaries = [
    { label: 'root/core', paths: rootCorePaths },
    { label: 'composites', paths: compositePaths },
    { label: 'non-code-editor feature', paths: nonCodeEditorFeaturePaths },
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

function isCodeMirrorBoundarySpecifier(specifier) {
  return (
    specifier === codeEditorEntrypointSpecifier ||
    specifier.startsWith(`${codeEditorEntrypointSpecifier}/`) ||
    /(?:^|\/)code-editor(?:\/|$)/.test(specifier) ||
    specifier.includes('features/code-editor') ||
    specifier.includes('public-api-feature-code-editor') ||
    codeMirrorPackageSpecifierPrefixes.some((prefix) => specifier.startsWith(prefix))
  );
}

function checkAudioTranscriptEntrypointIsolationContract() {
  const audioTranscriptSourcePath = 'projects/hell/src/lib/features/audio-transcript/audio-transcript.ts';
  const audioTranscriptSource = readFile(join(root, audioTranscriptSourcePath));
  for (const symbol of [
    'provideHellAudioTranscript',
    'hellAudioSpeechSupported',
    'HellAudioSpeechTranscriptRuntime',
  ]) {
    if (!hasTaggedApiSymbol(audioTranscriptSource, 'experimental', symbol)) {
      failures.push(`${audioTranscriptSourcePath} ${symbol} must carry @experimental API JSDoc`);
    }
  }

  const libraryProductionPaths = [
    'projects/hell/src/public-api.ts',
    ...entrypointPublicApiFiles().map((entrypoint) => entrypoint.publicApiPath),
    ...productionTsFilesUnder('projects/hell/src/lib'),
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
    rel === 'projects/hell/src/lib/public-api-feature-audio-transcript.ts' ||
    rel.includes('/features/audio-transcript/')
  );
}

function isAudioTranscriptFeatureSpecifier(specifier) {
  return (
    specifier === audioTranscriptEntrypointSpecifier ||
    specifier.startsWith(`${audioTranscriptEntrypointSpecifier}/`) ||
    specifier.includes('features/audio-transcript') ||
    specifier.includes('public-api-feature-audio-transcript')
  );
}

function checkApiReportContract() {
  const packageJson = parseJsonWithComments(readFile(join(root, 'package.json')));
  const script = readFile(join(root, 'tools/check-api-reports.mjs'));
  const expectedEntrypoints = apiReportPolicyEntries().filter(
    (entrypoint) => entrypoint.apiReport.expectation === 'required',
  );

  if (packageJson.scripts?.['test:api-report'] !== 'node tools/check-api-reports.mjs') {
    failures.push('API Report contract must expose pnpm run test:api-report');
  }
  if (packageJson.scripts?.['api-report:update'] !== 'node tools/check-api-reports.mjs --local') {
    failures.push('API Report contract must expose pnpm run api-report:update for baseline approval');
  }
  if (!packageJson.scripts?.['ci:build']?.includes('pnpm run test:api-report')) {
    failures.push('API Report contract must run from ci:build after the library package is built');
  }

  if (!script.includes('apiReportPolicyEntries')) {
    failures.push('API Report contract must derive report entrypoints from entrypoint manifest policy');
  }
  if (!script.includes('excludedApiReportEntrypoints') || !script.includes('checked') || !script.includes('excluded')) {
    failures.push('API Report contract must print checked and excluded policy counts');
  }

  const expectedReportFiles = new Set();
  for (const entrypoint of expectedEntrypoints) {
    const reportFileName = entrypoint.apiReport.reportFileName;
    expectedReportFiles.add(reportFileName);
    const reportPath = join(root, 'etc/api-reports', reportFileName);
    if (!existsSync(reportPath)) {
      failures.push(`API Report baseline is missing etc/api-reports/${reportFileName}`);
    }
  }

  const actualReportFiles = new Set(
    readdirSync(join(root, 'etc/api-reports')).filter((name) => name.endsWith('.api.md')),
  );
  assertSameSet('API Report contract manifest baselines', expectedReportFiles, actualReportFiles);
}

function checkApiStabilityContract() {
  checkPublicApiStatusPolicy(entrypointPolicyEntries());

  const experimentalApiSymbols = [
    ['projects/hell/src/lib/features/code-editor/code-editor.ts', 'HellCodeEditorRuntimeFactory'],
    ['projects/hell/src/lib/features/code-editor/code-editor.ts', 'HELL_CODE_EDITOR_RUNTIME_FACTORY'],
    ['projects/hell/src/lib/features/code-editor/code-editor.ts', 'HellCodeEditor'],
    ['projects/hell/src/lib/features/code-editor/code-editor.runtime.ts', 'HellCodeEditorRuntimeAccessibilityOptions'],
    ['projects/hell/src/lib/features/code-editor/code-editor.runtime.ts', 'HellCodeEditorRuntimeOptions'],
    ['projects/hell/src/lib/features/code-editor/code-editor.runtime.ts', 'HellCodeEditorRuntimePort'],
    ['projects/hell/src/lib/features/code-editor/code-editor.runtime.ts', 'hellCodeEditorSetupFactory'],
    ['projects/hell/src/lib/features/code-editor/code-editor.runtime.ts', 'hellCodeEditorSetup'],
    ['projects/hell/src/lib/features/code-editor/code-editor.runtime.ts', 'hellCodeEditorTheme'],
    ['projects/hell-pdf-viewer/src/lib/pdf-viewer/pdf-viewer.ts', 'HellPdfRuntimeFactory'],
    ['projects/hell-pdf-viewer/src/lib/pdf-viewer/pdf-viewer.ts', 'HELL_PDF_RUNTIME_FACTORY'],
    ['projects/hell-pdf-viewer/src/lib/pdf-viewer/pdf-viewer.ts', 'HellPdfViewer'],
    ['projects/hell-pdf-viewer/src/lib/pdf-viewer/pdf-viewer.adapter.ts', 'HellPdfWorkerSource'],
    ['projects/hell/src/lib/composites/audio-player/audio-player.ts', 'HellAudioPlayer'],
  ];
  for (const [sourcePath, symbol] of experimentalApiSymbols) {
    const source = readFile(join(root, sourcePath));
    if (!hasTaggedApiSymbol(source, 'experimental', symbol)) {
      failures.push(`${sourcePath} ${symbol} must carry @experimental API JSDoc`);
    }
  }

  const tableUtilitiesSource = readFile(
    join(root, 'projects/hell/src/lib/features/table-utilities/table-utilities.ts'),
  );
  for (const removed of ['HELL_TABLE_UTILITY_DIRECTIVES', 'HELL_TABLE_DIRECTIVES', 'selectionSemantics']) {
    if (tableUtilitiesSource.includes(removed)) {
      failures.push(`${removed} legacy table API must be removed, not deprecated`);
    }
  }
  if (/readonly\s+interactive\b/.test(tableUtilitiesSource)) {
    failures.push('HellTableRow interactive legacy input must be removed, not deprecated');
  }

  const labelsSource = readFile(join(root, 'projects/hell/src/lib/core/labels.ts'));
  if (!/@deprecated[^\n]*\nexport\s+type\s+HellDataTableLabels\b/.test(labelsSource)) {
    failures.push('HellDataTableLabels compatibility alias must carry @deprecated API JSDoc');
  }

  const audioSource = readFile(join(root, 'projects/hell/src/lib/composites/audio-player/audio-player.ts'));
  if (!hasTaggedApiSymbol(audioSource, 'deprecated', 'allowLiveCaptions')) {
    failures.push('allowLiveCaptions compatibility alias must carry @deprecated API JSDoc');
  }

  const codeEditorRuntimeSource = readFile(
    join(root, 'projects/hell/src/lib/features/code-editor/code-editor.runtime.ts'),
  );
  if (!hasTaggedApiSymbol(codeEditorRuntimeSource, 'deprecated', 'hellCodeEditorSetup')) {
    failures.push('hellCodeEditorSetup compatibility alias must carry @deprecated API JSDoc');
  }

  checkPublicApiInternalExportContract();
}

function checkApiDocsDisclosureContract() {
  for (const disclosure of apiDocsDisclosurePolicyEntries()) {
    const label = `API Docs Disclosure Manifest ${disclosure.id}`;
    if (!apiStatusTags.includes(disclosure.status)) {
      failures.push(`${label} has invalid status ${disclosure.status}`);
    }
    if (disclosure.kind === 'entrypoint' && !['required', 'covered-by', 'excluded'].includes(disclosure.apiReportExpectation)) {
      failures.push(`${label} has invalid API report expectation ${disclosure.apiReportExpectation}`);
    }

    const docsPath = join(root, disclosure.docsPath);
    if (!existsSync(docsPath)) {
      failures.push(`${label} points at missing docs page ${disclosure.docsPath}`);
      continue;
    }

    const docs = readFile(docsPath);
    if (!apiDocsStatusPattern(disclosure.status).test(docs)) {
      failures.push(`${label} docs must include ${disclosure.status} status disclosure`);
    }
    for (const term of disclosure.terms ?? []) {
      if (!docs.includes(term)) {
        failures.push(`${label} docs must mention ${term}`);
      }
    }
  }
}

function apiDocsStatusPattern(status) {
  return new RegExp(`\\b${escapeRegExp(status)}\\b`, 'i');
}

function hasTaggedApiSymbol(source, tag, symbol) {
  const pattern = new RegExp(
    `@${escapeRegExp(tag)}\\b[\\s\\S]{0,1800}(?:export\\s+(?:abstract\\s+)?(?:class|const|type|interface|function)\\s+${escapeRegExp(symbol)}\\b|readonly\\s+${escapeRegExp(symbol)}\\b)`,
  );
  const decoratedClassPattern = new RegExp(
    `/\\*\\*[\\s\\S]*?@${escapeRegExp(tag)}\\b[\\s\\S]*?\\*/\\s*@Component\\([\\s\\S]*?\\)\\s*export\\s+class\\s+${escapeRegExp(symbol)}\\b`,
  );
  return pattern.test(source) || decoratedClassPattern.test(source);
}

function checkPublicApiInternalExportContract() {
  const internalDirectoryNames = new Set(['internal', 'adapters']);
  for (const group of entrypointSourceGroups()) {
    for (const internalDirectory of group.internalDirectories) {
      internalDirectoryNames.add(internalDirectory);
    }
  }

  const allowedPublicInternalExports = new Set([
    // Format: `${publicApiPath} -> ${exportPath}`. Each exception must include a release-policy rationale.
  ]);

  for (const entrypoint of entrypointPublicApiFiles()) {
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
          `Public API ${publicApiPath} exports ${exportPath} from internal directory "${internalSegment}" without an explicit static-contract allowlist entry`,
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
  const packageJson = parseJsonWithComments(readFile(join(root, 'projects/hell/package.json')));
  const workspacePackageJson = parseJsonWithComments(readFile(join(root, 'package.json')));
  const optionalDependencies = Object.keys(packageJson.optionalDependencies ?? {});
  if (optionalDependencies.length) {
    failures.push(
      `Package dependency contract uses optionalDependencies instead of optional peer dependencies: ${optionalDependencies.join(', ')}`,
    );
  }

  const sourceRoot = join(root, 'projects/hell/src/lib');
  const sourceFiles = walk(sourceRoot).filter(
    (file) => file.endsWith('.ts') && !file.endsWith('.spec.ts') && !file.endsWith('.d.ts'),
  );
  const peerDependencies = packageJson.peerDependencies ?? {};
  const peerDependenciesMeta = packageJson.peerDependenciesMeta ?? {};
  const dependencies = packageJson.dependencies ?? {};
  const importedPackages = new Set(
    sourceFiles.flatMap((file) => externalImportPackages(readFile(file))),
  );

  const mainPeerPolicy = packageConsumerPeerContractManifest.mainPackage;
  const lightStackPeers = new Set(
    peersFromPeerSets(packageConsumerPeerContractManifest, mainPeerPolicy.requiredPeerSets),
  );
  const optionalPeerCategories = peerCategoryContractsFromManifest(
    packageConsumerPeerContractManifest,
    mainPeerPolicy.optionalPeerCategories,
  );
  const featureOnlyPeers = new Set(optionalPeerCategories['feature-only']);
  const adapterOnlyPeers = new Set(optionalPeerCategories['adapter-only']);
  const styleOnlyPeers = new Set(optionalPeerCategories['style-only']);
  const iconOnlyPeers = new Set(optionalPeerCategories['icon-only']);
  const transitiveOnlyPeers = new Set(optionalPeerCategories['transitive-only']);
  const knownOptionalPeers = new Set(Object.values(optionalPeerCategories).flat());

  for (const dependency of importedPackages) {
    if (!peerDependencies[dependency] && !dependencies[dependency]) {
      failures.push(`Package dependency contract is missing dependency for imported ${dependency}`);
    }
  }

  const nonTsPeerDependencies = new Set(
    peersFromPeerSets(packageConsumerPeerContractManifest, mainPeerPolicy.nonTsPeerSets),
  );
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
    } else if (adapterOnlyPeers.has(dependency) && peerDependenciesMeta[dependency]?.optional !== true) {
      failures.push(
        `Package dependency contract must keep ${dependency} optional for adapter-only consumers`,
      );
    } else if (styleOnlyPeers.has(dependency) && peerDependenciesMeta[dependency]?.optional !== true) {
      failures.push(
        `Package dependency contract must keep ${dependency} optional for style-only consumers`,
      );
    } else if (iconOnlyPeers.has(dependency) && peerDependenciesMeta[dependency]?.optional !== true) {
      failures.push(
        `Package dependency contract must keep ${dependency} optional for icon-only consumers`,
      );
    } else if (transitiveOnlyPeers.has(dependency) && peerDependenciesMeta[dependency]?.optional !== true) {
      failures.push(
        `Package dependency contract must keep ${dependency} optional for transitive-only consumers`,
      );
    }
  }

  for (const dependency of Object.keys(peerDependenciesMeta)) {
    if (!peerDependencies[dependency]) {
      failures.push(`Package dependency contract has peerDependenciesMeta for undeclared ${dependency}`);
    } else if (
      !knownOptionalPeers.has(dependency) && peerDependenciesMeta[dependency]?.optional
    ) {
      failures.push(
        `Package dependency contract marks ${dependency} optional but it is not a known feature-only, adapter-only, icon-only, style-only, or transitive-only peer`,
      );
    }
  }

  for (const dependency of lightStackPeers) {
    if (!peerDependencies[dependency]) {
      failures.push(`Package dependency contract is missing required light peer dependency ${dependency}`);
    }
  }

  for (const [category, peers] of Object.entries(optionalPeerCategories)) {
    for (const dependency of peers) {
      if (!peerDependencies[dependency]) {
        failures.push(`Package dependency contract is missing optional ${category} peer dependency ${dependency}`);
      }
    }
  }

  const tanStackTablePeers = peersFromPeerSets(packageConsumerPeerContractManifest, ['tanstack-table']);
  const tanStackImportOffenders = sourceFiles
    .filter((file) => !relPath(file).includes('/table-tanstack/'))
    .filter((file) => relPath(file) !== 'projects/hell/src/lib/public-api-table-tanstack.ts')
    .filter((file) => tanStackTablePeers.some((peer) => readFile(file).includes(peer)))
    .map(relPath);
  if (tanStackImportOffenders.length) {
    failures.push(
      `Package dependency contract must keep @tanstack/angular-table inside @hell-ui/angular/table-tanstack: ${tanStackImportOffenders.join(', ')}`,
    );
  }

  const tanStackVirtualPeers = peersFromPeerSets(packageConsumerPeerContractManifest, ['tanstack-virtual']);
  const tanStackVirtualImportOffenders = sourceFiles
    .filter((file) => !relPath(file).includes('/table-virtual/'))
    .filter((file) => relPath(file) !== 'projects/hell/src/lib/public-api-table-virtual.ts')
    .filter((file) => tanStackVirtualPeers.some((peer) => readFile(file).includes(peer)))
    .map(relPath);
  if (tanStackVirtualImportOffenders.length) {
    failures.push(
      `Package dependency contract must keep @tanstack/virtual-core inside @hell-ui/angular/table-virtual: ${tanStackVirtualImportOffenders.join(', ')}`,
    );
  }

  for (const peer of mainPeerPolicy.forbiddenPeers ?? []) {
    if (peerDependencies[peer] || peerDependenciesMeta[peer]) {
      failures.push(`Main @hell-ui/angular package must not advertise ${peer} after the PDF viewer split`);
    }
  }

  checkPdfViewerPackageDependencyContract(workspacePackageJson);

  const rootNgPackage = parseJsonWithComments(readFile(join(root, 'projects/hell/ng-package.json')));
  if (JSON.stringify(rootNgPackage.assets ?? []).includes('pdf.worker')) {
    failures.push('Root package assets must not copy pdf.worker.mjs; PDF viewer requires an app-provided worker source');
  }
}

function checkPdfViewerPackageDependencyContract(workspacePackageJson) {
  const packageJson = parseJsonWithComments(readFile(join(root, 'projects/hell-pdf-viewer/package.json')));
  const mainPackageJson = parseJsonWithComments(readFile(join(root, 'projects/hell/package.json')));
  const optionalDependencies = Object.keys(packageJson.optionalDependencies ?? {});
  if (optionalDependencies.length) {
    failures.push(
      `PDF package dependency contract uses optionalDependencies instead of peer dependencies: ${optionalDependencies.join(', ')}`,
    );
  }

  const sourceRoot = join(root, 'projects/hell-pdf-viewer/src/lib');
  const sourceFiles = walk(sourceRoot).filter(
    (file) => file.endsWith('.ts') && !file.endsWith('.spec.ts') && !file.endsWith('.d.ts'),
  );
  const importedPackages = new Set(
    sourceFiles.flatMap((file) => externalImportPackages(readFile(file))),
  );
  const peerDependencies = packageJson.peerDependencies ?? {};
  const peerDependenciesMeta = packageJson.peerDependenciesMeta ?? {};
  const dependencies = packageJson.dependencies ?? {};

  for (const dependency of importedPackages) {
    if (!peerDependencies[dependency] && !dependencies[dependency]) {
      failures.push(`PDF package dependency contract is missing dependency for imported ${dependency}`);
    }
  }

  const pdfPeerPolicy = packageConsumerPeerContractManifest.pdfPackage;
  const requiredPeers = new Set(
    peersFromPeerSets(packageConsumerPeerContractManifest, pdfPeerPolicy.requiredPeerSets),
  );
  for (const peer of requiredPeers) {
    if (!peerDependencies[peer]) failures.push(`PDF package dependency contract is missing required peer ${peer}`);
    if (peerDependenciesMeta[peer]?.optional === true) {
      failures.push(`PDF package dependency contract must keep ${peer} required`);
    }
  }
  const workspacePinnedPeer = pdfPeerPolicy.workspacePinnedPeer;
  if (peerDependencies[workspacePinnedPeer] !== workspacePackageJson.dependencies?.[workspacePinnedPeer]) {
    failures.push(
      `PDF package dependency contract must pin ${workspacePinnedPeer} peer to workspace version ${workspacePackageJson.dependencies?.[workspacePinnedPeer]}`,
    );
  }
  const mainPackagePeer = pdfPeerPolicy.mainPackagePeer;
  if (peerDependencies[mainPackagePeer] !== mainPackageJson.version) {
    failures.push(`PDF package dependency contract must peer ${mainPackagePeer}@${mainPackageJson.version}`);
  }
  const optionalPdfPeers = peersFromPeerSets(
    packageConsumerPeerContractManifest,
    pdfPeerPolicy.optionalPeerSets,
  );
  for (const peer of optionalPdfPeers) {
    if (!peerDependencies[peer] || peerDependenciesMeta[peer]?.optional !== true) {
      failures.push(`PDF package dependency contract must declare optional ${peer} for CSS entry points`);
    }
  }
  for (const metaPeer of Object.keys(peerDependenciesMeta)) {
    if (!peerDependencies[metaPeer]) {
      failures.push(`PDF package dependency contract has peerDependenciesMeta for undeclared ${metaPeer}`);
    }
  }

  const packageExports = packageJson.exports ?? {};
  for (const exportPath of ['./styles', './styles/pdf-viewer', './styles/components/pdf-viewer']) {
    if (!packageExports[exportPath]?.style) {
      failures.push(`PDF package style export ${exportPath} is missing from projects/hell-pdf-viewer/package.json`);
    }
  }
  const ngPackage = parseJsonWithComments(readFile(join(root, 'projects/hell-pdf-viewer/ng-package.json')));
  if (JSON.stringify(ngPackage.assets ?? []).includes('pdf.worker')) {
    failures.push('PDF package must not copy pdf.worker.mjs into the package tarball');
  }
}

function checkStyleEntryPoints() {
  const packageJson = parseJsonWithComments(readFile(join(root, 'projects/hell/package.json')));
  const exportsMap = packageJson.exports ?? {};
  const features = featureDirectories();
  const stylelessFeatures = new Set(['audio-transcript']);
  const styledFeatures = features.filter((feature) => !stylelessFeatures.has(feature));
  const expectedStyleExports = [
    './styles',
    './styles/tokens',
    './styles/primitives',
    './styles/composites',
    './styles/table',
    ...styledFeatures.map((feature) => `./styles/features/${feature}`),
  ];

  for (const exportPath of expectedStyleExports) {
    const style = exportsMap[exportPath]?.style;
    if (!style) {
      failures.push(
        `Style Package Entry Point ${exportPath} is missing from projects/hell/package.json`,
      );
      continue;
    }

    const sourceStylePath = style.replace(/^\.\/styles/, 'src/lib/styles');
    if (!existsSync(join(root, 'projects/hell', sourceStylePath))) {
      failures.push(`Style Package Entry Point ${exportPath} points at missing ${style}`);
    }
  }

  for (const exportPath of ['./styles/features/data-table', './styles/features/table-utilities']) {
    if (exportsMap[exportPath]) {
      failures.push(`Legacy table CSS package export must be removed: ${exportPath}`);
    }
  }
  for (const relPath of [
    'projects/hell/src/lib/styles/features/data-table.css',
    'projects/hell/src/lib/styles/features/table-utilities.css',
    'projects/hell/src/lib/styles/components/data-table.css',
    'projects/hell/src/lib/styles/components/table-utilities.css',
  ]) {
    if (existsSync(join(root, relPath))) failures.push(`Legacy table CSS alias file must be removed: ${relPath}`);
  }

  const allStyles = readFile(join(root, 'projects/hell/src/lib/styles/hell.css'));
  if (!allStyles.includes('./table.css')) {
    failures.push('All-in style entry point is missing table CSS import');
  }
  for (const feature of styledFeatures) {
    if (!allStyles.includes(`./features/${feature}.css`)) {
      failures.push(`All-in style entry point is missing Feature CSS import for ${feature}`);
    }
  }

  const featureStyleDir = join(root, 'projects/hell/src/lib/styles/features');
  for (const file of readdirSync(featureStyleDir).filter((name) => name.endsWith('.css'))) {
    const feature = basename(file, '.css');
    const source = readFile(join(featureStyleDir, file));
    const expectedImport = `../components/${feature}.css`;
    if (!source.includes(expectedImport)) {
      failures.push(`Feature style entry point ${file} must import ${expectedImport}`);
    }
  }
}

function checkNgClassCustomizationContract() {
  const sourceRoot = join(root, 'projects/hell/src/lib');
  const files = walk(sourceRoot).filter(
    (file) =>
      file.endsWith('.ts') &&
      !file.endsWith('.spec.ts') &&
      !file.endsWith('.d.ts') &&
      !file.endsWith('pdf.worker.ts'),
  );

  for (const file of files) {
    const source = readFile(file);
    const ngClassImportFromCommon =
      /import\s+[^;]*@angular\/common[^;]*/.test(source) &&
      /\bNgClass\b/.test(source.match(/import\s+[^;]*@angular\/common[^;]*/)?.[0] ?? '');
    const ngClassTemplateBinding = /\[\s*ngClass\s*\]/.test(source);

    if (ngClassImportFromCommon || ngClassTemplateBinding) {
      failures.push(
        `${file.slice(root.length + 1)} uses NgClass or [ngClass]; style customization must use data attrs/CSS vars`,
      );
    }
  }
}

function checkAngularHostMetadataContract() {
  const sourceRoot = join(root, 'projects/hell/src/lib');
  const files = walk(sourceRoot).filter(
    (file) =>
      file.endsWith('.ts') &&
      !file.endsWith('.spec.ts') &&
      !file.endsWith('.d.ts') &&
      !file.endsWith('pdf.worker.ts'),
  );

  for (const file of files) {
    const source = readFile(file);
    if (!/\bHostBinding\b|\bHostListener\b|@HostBinding|@HostListener/.test(source)) continue;

    failures.push(
      `${file.slice(root.length + 1)} uses @HostBinding/@HostListener; use Angular host metadata instead`,
    );
  }
}

function checkAppShellBreakpointContract() {
  const shellSource = readFile(join(root, 'projects/hell/src/lib/composites/app-shell/app-shell.ts'));
  const shellStyles = readFile(join(root, 'projects/hell/src/lib/styles/components/app-shell.css'));
  const desktopMin = Number(
    /HELL_APP_SHELL_DESKTOP_MIN_WIDTH_PX\s*=\s*(\d+)/.exec(shellSource)?.[1],
  );

  if (!Number.isFinite(desktopMin)) {
    failures.push('App Shell breakpoint contract must expose HELL_APP_SHELL_DESKTOP_MIN_WIDTH_PX');
    return;
  }

  if (!shellSource.includes('HELL_APP_SHELL_MOBILE_MAX_WIDTH_PX = HELL_APP_SHELL_DESKTOP_MIN_WIDTH_PX - 1')) {
    failures.push('App Shell mobile matchMedia breakpoint must derive from the desktop CSS breakpoint');
  }

  if (!shellStyles.includes(`@media (min-width: ${desktopMin}px)`)) {
    failures.push(
      `App Shell CSS breakpoint must match HELL_APP_SHELL_DESKTOP_MIN_WIDTH_PX (${desktopMin}px)`,
    );
  }
}

function checkComponentContract() {
  const sourceRoot = join(root, 'projects/hell/src/lib');
  const files = walk(sourceRoot).filter(
    (file) =>
      file.endsWith('.ts') &&
      !file.endsWith('.spec.ts') &&
      !file.endsWith('.d.ts') &&
      !file.endsWith('pdf.worker.ts') &&
      !file.includes('/core/'),
  );
  const publicStyleableModules = new Map();

  for (const file of files) {
    const source = readFile(file);
    const styleableClasses = exportedStyleableClasses(source);
    if (!styleableClasses.length) continue;

    const rel = file.slice(root.length + 1);
    for (const { className, moduleSource } of styleableClasses) {
      if (publicStyleableModules.has(className)) {
        failures.push(`Duplicate public HellStyleable Module ${className} in ${rel}`);
      }
      publicStyleableModules.set(className, rel);
    }
  }

  const contractSpec = readFile(join(root, 'projects/hell/src/lib/component-contract.spec.ts'));
  const manifestSymbols = [...contractSpec.matchAll(/symbol:\s*'([A-Za-z0-9_]+)'/g)].map(
    (match) => match[1],
  );
  const manifestSet = new Set();
  for (const symbol of manifestSymbols) {
    if (manifestSet.has(symbol)) {
      failures.push(`Component Contract manifest declares ${symbol} more than once`);
    }
    manifestSet.add(symbol);
  }

  for (const [className, rel] of publicStyleableModules) {
    if (!manifestSet.has(className)) {
      failures.push(
        `${rel} exports HellStyleable Module ${className} but component-contract.spec.ts does not declare its Component Contract`,
      );
    }
  }

  for (const symbol of manifestSymbols) {
    if (!publicStyleableModules.has(symbol)) {
      failures.push(
        `component-contract.spec.ts declares ${symbol}, but no exported HellStyleable Module was found`,
      );
    }
  }
}

function checkLabelContract() {
  const labelsSource = readFile(join(root, 'projects/hell/src/lib/core/labels.ts'));
  for (const symbol of ['HELL_LABELS', 'HELL_DEFAULT_LABELS', 'provideHellLabels']) {
    if (!labelsSource.includes(symbol)) failures.push(`Label Contract is missing ${symbol}`);
  }

  const rootApi = readFile(join(root, 'projects/hell/src/public-api.ts'));
  const coreApi = readFile(join(root, 'projects/hell/src/lib/public-api-core.ts'));
  const rootApiExportsCoreAggregate =
    rootApi.includes('./lib/public-api-core') || rootApi.includes('./public-api-core');

  for (const [api, source] of [
    ['projects/hell/src/public-api.ts', rootApi],
    ['projects/hell/src/lib/public-api-core.ts', coreApi],
  ]) {
    const sourceExportsLabelContract =
      source.includes('./lib/core/labels') ||
      source.includes('./core/labels') ||
      (api === 'projects/hell/src/public-api.ts' && rootApiExportsCoreAggregate);
    if (!sourceExportsLabelContract) {
      failures.push(`Label Contract is not exported from ${api}`);
    }
  }

}

function exportedStyleableClasses(source) {
  const styleableBases = new Set([
    'HellNativeCheckbox',
    'HellNativeRadio',
    ...[...source.matchAll(/(?:abstract\s+)?class\s+([A-Za-z0-9_]+)[^{]*extends\s+(?:HellStyleable|HellNativeInteractiveDisabledGuard)\b/g)].map(
      (match) => match[1],
    ),
  ]);

  return decoratedClassModules(source).filter((module) => {
    if (module.classSource.includes('extends HellStyleable')) return true;

    const base = /extends\s+([A-Za-z0-9_]+)/.exec(module.classSource)?.[1];
    return !!base && styleableBases.has(base);
  });
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

function checkCodeEditorRuntimeContract() {
  const source = readFile(
    join(root, 'projects/hell/src/lib/features/code-editor/code-editor.runtime.ts'),
  );

  if (source.includes('innerHTML')) {
    failures.push('Code Editor Runtime must build fold gutter markers without innerHTML');
  }
}

function checkExperimentalFeatureContract() {
  const audioSource = readFile(join(root, 'projects/hell/src/lib/composites/audio-player/audio-player.ts'));
  if (!/allowSpeechTranscript\s*=\s*input\(false/.test(audioSource)) {
    failures.push('Audio speech transcript must remain explicitly opt-in while experimental');
  }
  if (!/allowLiveCaptions\s*=\s*input\(false/.test(audioSource)) {
    failures.push('Audio live captions compatibility alias must remain explicitly opt-in');
  }

  const pdfFeatureApi = readFile(join(root, 'projects/hell-pdf-viewer/src/public-api.ts'));
  if (!/HellPdfWorkerSource/.test(pdfFeatureApi)) {
    failures.push('PDF Viewer package entry point must export the public HellPdfWorkerSource worker input type');
  }
}

function checkNativeButtonSelectorContract() {
  const sourceRoot = join(root, 'projects/hell/src/lib');
  const files = walk(sourceRoot).filter(
    (file) =>
      file.endsWith('.ts') &&
      !file.endsWith('.spec.ts') &&
      !file.endsWith('.d.ts') &&
      !file.endsWith('pdf.worker.ts'),
  );

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
  const sourceRoot = join(root, 'projects/hell/src/lib');
  const files = walk(sourceRoot).filter(
    (file) =>
      file.endsWith('.ts') &&
      !file.endsWith('.spec.ts') &&
      !file.endsWith('.d.ts') &&
      !file.endsWith('pdf.worker.ts'),
  );

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

function checkTableUtilityContract() {
  const tableFacade = readFile(join(root, 'projects/hell/src/lib/table/table.ts'));
  if (!tableFacade.includes("../features/table-utilities/table-utilities")) {
    failures.push('Modern @hell-ui/angular/table facade must own the table utilities export');
  }

  const docsRoot = join(root, 'projects/hell-docs/src/app');
  const docsGlobalStyles = readFile(join(root, 'projects/hell-docs/src/styles.css'));
  if (!docsGlobalStyles.includes("@import '@hell-ui/angular/styles/table';")) {
    failures.push('Docs app must load table CSS from the global stylesheet so production routes are styled');
  }
  const routeTableStyleImports = walk(docsRoot)
    .filter((file) => file.endsWith('.ts'))
    .flatMap((file) =>
      moduleImportSpecifiers(file).filter(
        (importHit) => importHit.specifier === '@hell-ui/angular/styles/table',
      ),
    );
  for (const importHit of routeTableStyleImports) {
    failures.push(
      `Docs table routes must not rely on TypeScript side-effect imports for table CSS: ${relPath(
        importHit.file,
      )}:${importHit.line}`,
    );
  }
  const offenders = walk(docsRoot)
    .filter((file) => /\.(?:ts|html|md)$/.test(file))
    .filter((file) => /@hell-ui\/angular\/features\/(?:data-table|table-utilities)\b/.test(readFile(file)))
    .map((file) => file.slice(root.length + 1));
  if (offenders.length) {
    failures.push(`Docs must not reference legacy table feature entrypoints: ${offenders.join(', ')}`);
  }
}

function checkTableLegacyRemovalContract() {
  const legacyEntrypointSpecifiers = [
    '@hell-ui/angular/features/data-table',
    '@hell-ui/angular/features/table-utilities',
  ];
  const legacyStyleSpecifiers = [
    '@hell-ui/angular/styles/features/data-table',
    '@hell-ui/angular/styles/features/table-utilities',
  ];
  const legacyEntrypointFiles = [
    'projects/hell/features/data-table/ng-package.json',
    'projects/hell/features/table-utilities/ng-package.json',
    'projects/hell/src/lib/public-api-feature-data-table.ts',
    'projects/hell/src/lib/public-api-feature-table-utilities.ts',
  ];
  const legacyStyleFiles = [
    'projects/hell/src/lib/styles/features/data-table.css',
    'projects/hell/src/lib/styles/features/table-utilities.css',
    'projects/hell/src/lib/styles/components/data-table.css',
    'projects/hell/src/lib/styles/components/table-utilities.css',
  ];

  const manifestSpecifiers = new Set(entrypointPublicApiFiles().map((entrypoint) => entrypoint.specifier));
  const packageJson = parseJsonWithComments(readFile(join(root, 'projects/hell/package.json')));
  const tsconfig = parseJsonWithComments(readFile(join(root, 'tsconfig.json')));
  const tsconfigPaths = tsconfig.compilerOptions?.paths ?? {};
  const exportsMap = packageJson.exports ?? {};

  for (const specifier of legacyEntrypointSpecifiers) {
    if (manifestSpecifiers.has(specifier)) {
      failures.push(`Legacy table entry point must be absent from the manifest: ${specifier}`);
    }
    if (tsconfigPaths[specifier]) {
      failures.push(`Legacy table entry point must be absent from tsconfig paths: ${specifier}`);
    }
  }

  for (const exportPath of ['./features/data-table', './features/table-utilities']) {
    if (exportsMap[exportPath]) {
      failures.push(`Legacy table package export must be removed: ${exportPath}`);
    }
  }

  for (const exportPath of ['./styles/features/data-table', './styles/features/table-utilities']) {
    if (exportsMap[exportPath]) {
      failures.push(`Legacy table CSS package export must be removed: ${exportPath}`);
    }
  }

  for (const rel of [...legacyEntrypointFiles, ...legacyStyleFiles]) {
    if (existsSync(join(root, rel))) failures.push(`Legacy table alias file must be removed: ${rel}`);
  }

  const importRoots = [
    'projects/hell/src',
    'projects/hell-docs/src/app',
  ];
  const legacyModuleSpecifiers = [...legacyEntrypointSpecifiers, ...legacyStyleSpecifiers];
  const importFiles = importRoots
    .flatMap((rel) => walk(join(root, rel)))
    .filter((file) => file.endsWith('.ts'));
  for (const file of importFiles) {
    for (const hit of moduleSpecifierReferences(file)) {
      const matched = legacyModuleSpecifiers.find(
        (specifier) => hit.specifier === specifier || hit.specifier.startsWith(`${specifier}/`),
      );
      if (!matched) continue;
      failures.push(
        `Legacy table entry/style import ${relPath(file)}:${hit.line} references ${hit.specifier}; use @hell-ui/angular/table, @hell-ui/angular/data-table, or styles/table.`,
      );
    }
  }

  const productionFiles = walk(join(root, 'projects/hell/src'))
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.spec.ts') && !file.endsWith('.d.ts'));
  const legacySymbols = [
    { label: 'HELL_TABLE_DIRECTIVES', pattern: /\bHELL_TABLE_DIRECTIVES\b/ },
    { label: 'HELL_TABLE_UTILITY_DIRECTIVES', pattern: /\bHELL_TABLE_UTILITY_DIRECTIVES\b/ },
    { label: 'selectionSemantics', pattern: /\bselectionSemantics\b/ },
    { label: 'hellTableSortButton', pattern: /\bhellTableSortButton\b|\bHellTableSortButton\b|\bhell-table-sort-button\b/ },
    { label: 'hellTableColumnResizer', pattern: /\bhellTableColumnResizer\b|\bHellTableColumnResizer\b|\bhell-table-column-resizer\b|\bHellTableColumnResizeRuntime\b|\bdata-table-column-resize\b/ },
  ];
  for (const file of productionFiles) {
    const source = readFile(file);
    for (const symbol of legacySymbols) {
      if (symbol.pattern.test(source)) {
        failures.push(`Legacy table API ${symbol.label} must not appear in ${relPath(file)}`);
      }
    }
  }

  const tableHarness = readFile(join(root, 'projects/hell/src/testing/table-harness.ts'));
  if (/\binteractive\?\s*:|\bisInteractive\b/.test(tableHarness)) {
    failures.push('Testing table harness must not expose interactive legacy row aliases');
  }
  if (/HellTableColumnResizerHarness|getColumnResizer|hellTableColumnResizer/.test(tableHarness)) {
    failures.push('Testing table harness must not expose legacy column-resizer APIs');
  }

  const tableSource = readFile(join(root, 'projects/hell/src/lib/features/table-utilities/table-utilities.ts'));
  const rowModule = decoratedClassModules(tableSource).find((module) => module.className === 'HellTableRow');
  if (!rowModule) {
    failures.push('Legacy table removal contract could not inspect HellTableRow');
  } else if (/\breadonly\s+interactive\b|\binteractive\s*=\s*input\b|\bHellTableRow\.interactive\b/.test(rowModule.moduleSource)) {
    failures.push('HellTableRow.interactive legacy input must be removed from table primitives');
  }

  const styleEntrypointSources = [
    'projects/hell/src/lib/styles/hell.css',
    'projects/hell/src/lib/styles/table.css',
  ];
  for (const rel of styleEntrypointSources) {
    const source = readFile(join(root, rel));
    if (/styles\/features\/data-table|\.\/features\/data-table\.css|features\/data-table\.css/.test(source)) {
      failures.push(`Legacy styles/features/data-table reference must be removed from ${rel}`);
    }
  }
}

function checkTableAdapterBoundaryContract() {
  const coreTableBoundaryDirs = [
    'projects/hell/src/lib/features/table-utilities',
    'projects/hell/src/lib/table',
    'projects/hell/src/lib/data-table',
  ];
  const coreTableBoundaryFiles = [
    ...coreTableBoundaryDirs.flatMap((rel) => walk(join(root, rel))),
    join(root, 'projects/hell/src/lib/public-api-table.ts'),
    join(root, 'projects/hell/src/lib/public-api-data-table.ts'),
  ]
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.spec.ts') && !file.endsWith('.d.ts'));
  const adapterDirs = [
    'projects/hell/src/lib/table-tanstack',
    'projects/hell/src/lib/table-virtual',
    'projects/hell/src/lib/table-cdk',
  ];
  const adapterFiles = adapterDirs
    .flatMap((rel) => walk(join(root, rel)))
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.spec.ts') && !file.endsWith('.d.ts'));
  const policies = [
    {
      label: 'TanStack Table',
      matches: (specifier) => specifier.startsWith('@tanstack/angular-table') || specifier.startsWith('@tanstack/table'),
      allowedDir: 'projects/hell/src/lib/table-tanstack',
    },
    {
      label: 'TanStack Virtual',
      matches: (specifier) => specifier.startsWith('@tanstack/virtual'),
      allowedDir: 'projects/hell/src/lib/table-virtual',
    },
    {
      label: 'Angular CDK table adapter',
      matches: (specifier) => specifier.startsWith('@angular/cdk/'),
      allowedDir: 'projects/hell/src/lib/table-cdk',
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
          `Table adapter boundary ${rel}:${hit.line} imports ${hit.specifier} -> ${targetRel}; core table and simple data-table code must not depend on adapter entrypoints.`,
        );
      }
    }
  }
}

function checkNgpStateWriterContract() {
  const adapterRelPath = 'projects/hell/src/lib/primitives/adapters/ngp-state-adapters.ts';
  const adapterPath = join(root, adapterRelPath);
  const adapterSource = readFile(adapterPath);
  const ngpPackage = parseJsonWithComments(readFile(join(root, 'node_modules/ng-primitives/package.json')));
  const workspacePackage = parseJsonWithComments(readFile(join(root, 'package.json')));
  const libraryPackage = parseJsonWithComments(readFile(join(root, 'projects/hell/package.json')));
  const expectedVersion = `ng-primitives@${ngpPackage.version}`;

  if (!adapterSource.includes(`HELL_NGP_STATE_WRITER_VERSION = '${expectedVersion}'`)) {
    failures.push(
      `ng-primitives state writer version must match installed ${expectedVersion}`,
    );
  }

  if (workspacePackage.dependencies?.['ng-primitives'] !== ngpPackage.version) {
    failures.push(
      `workspace ng-primitives dependency must be pinned to ${ngpPackage.version} while the state writer fallback is version-bound`,
    );
  }

  if (libraryPackage.peerDependencies?.['ng-primitives'] !== ngpPackage.version) {
    failures.push(
      `ng-primitives peer dependency must be pinned to ${ngpPackage.version} while the state writer fallback is version-bound`,
    );
  }

  const allowedBridgeFiles = new Set([
    adapterRelPath,
    'projects/hell/src/lib/primitives/adapters/ngp-state-adapters.spec.ts',
    'projects/hell/src/lib/primitives/select/select.ts',
    'projects/hell/src/lib/primitives/combobox/combobox.ts',
    'projects/hell/src/lib/primitives/radio/radio.ts',
  ]);
  const stateWriterTokens = [
    'HELL_NGP_STATE_WRITER_VERSION',
    'HELL_NGP_STATE_WRITER_UPGRADE_PATH',
    'writeSelectStateValue',
    'writeSelectStateDisabled',
    'writeComboboxStateValue',
    'writeComboboxStateDisabled',
    'writeRadioGroupStateValue',
    'writeRadioGroupStateDisabled',
  ];
  const retiredPrivateBridgeTokens = [
    'HELL_NGP_PRIVATE_STATE_BRIDGE_VERSION',
    'writeSelectPrivateValue',
    'writeSelectPrivateDisabled',
    'writeComboboxPrivateValue',
    'writeComboboxPrivateDisabled',
    'writeRadioGroupPrivateValue',
    'writeRadioGroupPrivateDisabled',
  ];
  const indexedStateWritePatterns = [
    {
      token: "state['value'].set(...) or state[\"value\"].set(...)",
      pattern: /\bstate\[['"]value['"]\]\.set\(/,
    },
    {
      token: "state['disabled'].set(...) or state[\"disabled\"].set(...)",
      pattern: /\bstate\[['"]disabled['"]\]\.set\(/,
    },
    {
      token: "state()['value'].set(...) or state()[\"value\"].set(...)",
      pattern: /\b(?:this\.)?[A-Za-z_$][\w$]*\(\)\[['"]value['"]\]\.set\(/,
    },
    {
      token: "state()['disabled'].set(...) or state()[\"disabled\"].set(...)",
      pattern: /\b(?:this\.)?[A-Za-z_$][\w$]*\(\)\[['"]disabled['"]\]\.set\(/,
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
      token: "State<T>['value'].set(...) or State<T>[\"value\"].set(...)",
      pattern: /\b(?:this\.)?[A-Za-z_$][\w$]*(?:\(\))?\[['"]value['"]\]\.set\(/,
    },
    {
      token: "State<T>['disabled'].set(...) or State<T>[\"disabled\"].set(...)",
      pattern: /\b(?:this\.)?[A-Za-z_$][\w$]*(?:\(\))?\[['"]disabled['"]\]\.set\(/,
    },
  ];
  const directPrimitiveStateAccessPattern = /\b(?:this\.)?[A-Za-z_$][\w$]*\.state\b/;
  const guardedFormStateTokens = [
    'NgpSelect',
    'NgpCombobox',
    'NgpRadioGroup',
    'injectSelectState',
    'injectComboboxState',
    'injectRadioGroupState',
    'State<NgpSelect',
    'State<NgpCombobox',
    'State<NgpRadioGroup',
  ];
  const sourceFiles = walk(join(root, 'projects/hell/src/lib')).filter((file) => file.endsWith('.ts'));

  for (const file of sourceFiles) {
    const source = readFile(file);
    const rel = file.slice(root.length + 1);
    const isSpec = rel.endsWith('.spec.ts');
    const isAdapter = rel === adapterRelPath;
    const usesGuardedFormState = guardedFormStateTokens.some((token) => source.includes(token));

    if (!isSpec) {
      for (const { token, pattern } of indexedStateWritePatterns) {
        if (pattern.test(source)) {
          failures.push(`Ad hoc ng-primitives State<T> channel write ${token} is not allowed in ${rel}; use ${adapterRelPath}`);
        }
      }

      if (usesGuardedFormState && !isAdapter) {
        for (const { token, pattern } of directStateChannelWritePatterns) {
          if (pattern.test(source)) {
            failures.push(`Ad hoc ng-primitives ${token} is not allowed in ${rel}; use ${adapterRelPath}`);
          }
        }

        if (directPrimitiveStateAccessPattern.test(source)) {
          failures.push(`Direct ng-primitives primitive .state access is not allowed in ${rel}; use injected State<T> through ${adapterRelPath}`);
        }
      }
    }
    if (retiredPrivateBridgeTokens.some((token) => source.includes(token))) {
      failures.push(`Retired ng-primitives private bridge token is still used in ${rel}`);
    }
    if (/\bngp[A-Za-z0-9_]*\.state\b/.test(source)) {
      failures.push(`Direct ng-primitives instance state access is not allowed in ${rel}; use injected State<T> adapter seam`);
    }
    if (allowedBridgeFiles.has(rel)) continue;
    const usesStateWriter =
      source.includes('ngp-state-adapters') ||
      stateWriterTokens.some((token) => source.includes(token));
    if (usesStateWriter) {
      failures.push(`ng-primitives state writer usage is not approved in ${rel}`);
    }
  }

  const adaptersBarrel = readFile(join(root, 'projects/hell/src/lib/primitives/adapters/adapters.ts'));
  if (/export\s+\*\s+from/.test(adaptersBarrel) || stateWriterTokens.some((token) => adaptersBarrel.includes(token))) {
    failures.push('ng-primitives state writer must not be re-exported through the adapters barrel');
  }

  for (const token of ['writeToggleGroupValue', 'writeToggleGroupDisabled', 'ToggleGroupStateMutation']) {
    if (adapterSource.includes(token)) {
      failures.push(`Toggle group must use public ng-primitives setters, not state-writer token ${token}`);
    }
  }
}

function checkFloatingAdapterContract() {
  const coreApi = readFile(join(root, 'projects/hell/src/lib/public-api-core.ts'));

  if (!coreApi.includes("export * from './core/floating-element'")) {
    failures.push('Core Package Entry Point must export ./core/floating-element');
  }
}

const browserGlobalSeamDocPath = browserGlobalSeamManifest.docPath;
const allowedBrowserGlobalSeams = browserGlobalSeamManifest.allowedSeams;
const browserGlobalNames = new Set(browserGlobalSeamManifest.globalNames);

function checkBrowserGlobalContract() {
  const docPath = join(root, browserGlobalSeamDocPath);
  if (!existsSync(docPath)) {
    failures.push(`Browser Global Contract missing ${browserGlobalSeamDocPath}`);
  } else {
    const docs = readFile(docPath);
    for (const part of [
      'SSR/browser global seams',
      'tools/static-contracts/browser-global-seams.json',
      'pnpm run test:static-contracts',
    ]) {
      if (!docs.includes(part)) failures.push(`Browser Global Contract docs are missing ${part}`);
    }
  }

  const sourceRoot = join(root, 'projects/hell/src/lib');
  const sourceFiles = walk(sourceRoot).filter(
    (file) =>
      file.endsWith('.ts') &&
      !file.endsWith('.spec.ts') &&
      !file.endsWith('.d.ts') &&
      !file.endsWith('pdf.worker.ts'),
  );
  const hits = sourceFiles.flatMap((file) => browserGlobalHits(file));
  const allowedGlobalKeys = new Map();
  for (const seam of allowedBrowserGlobalSeams) {
    for (const global of seam.globals) {
      const key = browserGlobalAllowanceKey(seam.file, global);
      if (allowedGlobalKeys.has(key)) {
        failures.push(`Browser Global Contract duplicate allowlist entry for ${seam.file} ${global}`);
      }
      allowedGlobalKeys.set(key, { id: seam.id, file: seam.file, global });
    }
  }
  const usedAllowedGlobalKeys = new Set();

  for (const hit of hits) {
    const allowanceKey = browserGlobalAllowanceKey(hit.file, hit.global);
    if (allowedGlobalKeys.has(allowanceKey)) {
      usedAllowedGlobalKeys.add(allowanceKey);
      continue;
    }

    failures.push(
      `Browser Global Contract ${hit.file}:${hit.line} uses direct ${hit.global}; move it behind an allowed browser seam or add a documented follow-up slice before allowlisting it`,
    );
  }

  for (const allowance of allowedGlobalKeys.values()) {
    const filePath = join(root, allowance.file);
    if (!existsSync(filePath)) {
      failures.push(`Browser Global Contract allowlist references missing file ${allowance.file}`);
      continue;
    }
    const allowanceKey = browserGlobalAllowanceKey(allowance.file, allowance.global);
    if (usedAllowedGlobalKeys.has(allowanceKey)) continue;

    failures.push(
      `Browser Global Contract allowlist entry ${allowance.id} is stale: expected ${allowance.file} to contain direct ${allowance.global}`,
    );
  }
}

function browserGlobalAllowanceKey(file, global) {
  return `${file}\0${global}`;
}

function browserGlobalHits(file) {
  const source = readFile(file);
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const original = source.split('\n');
  const rel = file.slice(root.length + 1).replaceAll('\\', '/');
  const seen = new Set();
  const hits = [];

  function visit(node) {
    if (ts.isIdentifier(node) && isDirectBrowserGlobalIdentifier(node)) {
      const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
      const key = `${node.text}:${line}`;
      if (!seen.has(key)) {
        seen.add(key);
        hits.push({
          file: rel,
          line,
          global: node.text,
          source: original[line - 1] ?? '',
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return hits;
}

function isDirectBrowserGlobalIdentifier(node) {
  if (!browserGlobalNames.has(node.text)) return false;
  if (isTypeOnlyIdentifier(node)) return false;
  if (isDeclarationIdentifier(node)) return false;
  if (isPropertyNameIdentifier(node)) return false;
  return true;
}

function isTypeOnlyIdentifier(node) {
  for (let current = node.parent; current; current = current.parent) {
    if (ts.isTypeNode(current)) return true;
    if (ts.isExpression(current) || ts.isStatement(current) || ts.isSourceFile(current)) return false;
  }

  return false;
}

function isDeclarationIdentifier(node) {
  const parent = node.parent;
  if (ts.isVariableDeclaration(parent) && parent.name === node) return true;
  if (ts.isParameter(parent) && parent.name === node) return true;
  if (ts.isBindingElement(parent) && parent.name === node) return true;
  if (ts.isFunctionDeclaration(parent) && parent.name === node) return true;
  if (ts.isClassDeclaration(parent) && parent.name === node) return true;
  if (ts.isInterfaceDeclaration(parent) && parent.name === node) return true;
  if (ts.isTypeAliasDeclaration(parent) && parent.name === node) return true;
  if (ts.isImportClause(parent) && parent.name === node) return true;
  if (ts.isNamespaceImport(parent) && parent.name === node) return true;
  if (ts.isImportSpecifier(parent) && parent.name === node) return true;
  if (ts.isImportSpecifier(parent) && parent.propertyName === node) return true;
  if (ts.isExportSpecifier(parent) && parent.name === node) return true;
  if (ts.isExportSpecifier(parent) && parent.propertyName === node) return true;
  return false;
}

function isPropertyNameIdentifier(node) {
  const parent = node.parent;
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) {
    return !(ts.isIdentifier(parent.expression) && parent.expression.text === 'globalThis');
  }
  if (ts.isPropertyAssignment(parent) && parent.name === node) return true;
  if (ts.isPropertyDeclaration(parent) && parent.name === node) return true;
  if (ts.isPropertySignature(parent) && parent.name === node) return true;
  if (ts.isMethodDeclaration(parent) && parent.name === node) return true;
  if (ts.isMethodSignature(parent) && parent.name === node) return true;
  if (ts.isGetAccessor(parent) && parent.name === node) return true;
  if (ts.isSetAccessor(parent) && parent.name === node) return true;
  return false;
}

function checkEntrypointManifestSourceCoverage() {
  for (const group of entrypointSourceGroups()) {
    const manifestEntries = new Set(group.entries);
    const sourceEntries = childDirectories(join(root, group.sourceDir)).filter(
      (entry) => !group.internalDirectories.includes(entry),
    );

    for (const entry of sourceEntries) {
      if (!manifestEntries.has(entry)) {
        failures.push(`Entrypoint Manifest ${group.id} is missing source directory ${group.sourceDir}/${entry}`);
      }
    }

    for (const entry of group.entries) {
      if (!sourceEntries.includes(entry)) {
        failures.push(`Entrypoint Manifest ${group.id} references missing source directory ${group.sourceDir}/${entry}`);
      }
    }
  }
}

function checkGeneratedEntrypointFiles() {
  for (const entrypoint of entrypointPublicApiFiles()) {
    const filePath = join(root, entrypoint.publicApiPath);
    if (!existsSync(filePath)) {
      failures.push(`Entrypoint Manifest public API is missing ${entrypoint.publicApiPath}`);
      continue;
    }

    const expected = renderPublicApiFile(entrypoint);
    if (readFile(filePath) !== expected) {
      failures.push(
        `Entrypoint Manifest public API is stale: ${entrypoint.publicApiPath} (run pnpm run generate:entrypoints)`,
      );
    }
  }

  for (const entrypoint of secondaryPackageEntrypoints()) {
    const filePath = join(root, entrypoint.packagePath);
    if (!existsSync(filePath)) {
      failures.push(`Entrypoint Manifest ng-package is missing ${entrypoint.packagePath}`);
      continue;
    }

    const expected = renderNgPackageFile(entrypoint);
    if (readFile(filePath) !== expected) {
      failures.push(
        `Entrypoint Manifest ng-package is stale: ${entrypoint.packagePath} (run pnpm run generate:entrypoints)`,
      );
    }
  }
}

function externalImportPackages(source) {
  const packages = [];
  const importRegex = /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?['"]([^.'"/][^'"]*)['"]/g;
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
    return join(root, 'projects/hell-docs/src/app/pages/overview/overview.page.ts');
  }

  const route = routePath.replace(/^\//, '');
  return join(root, 'projects/hell-docs/src/app/pages', route, `${basename(route)}.page.ts`);
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

function primitiveDirectories() {
  return childDirectories(join(root, 'projects/hell/src/lib/primitives')).filter(
    (primitive) => primitive !== 'adapters',
  );
}

function compositeDirectories() {
  return childDirectories(join(root, 'projects/hell/src/lib/composites'));
}

function featureDirectories() {
  const internalFeatureDirs = new Set(['assets', 'table-utilities']);
  return childDirectories(join(root, 'projects/hell/src/lib/features')).filter(
    (feature) => !internalFeatureDirs.has(feature),
  );
}

function childDirectories(path) {
  return readdirSync(path)
    .filter((name) => {
      const fullPath = join(path, name);
      return statSync(fullPath).isDirectory();
    })
    .sort();
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
