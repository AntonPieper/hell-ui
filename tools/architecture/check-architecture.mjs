import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

import {
  componentEntrypoints,
  entrypointCategories,
  entrypointMetadataFileName,
  entrypointPublicApiFiles,
  libraryRoot,
  secondaryPackageEntrypoints,
  sourcePackageCondition,
  styleBundlePolicies,
} from '../entrypoints/entrypoint-manifest.mjs';
import { readWorkspaceCatalog } from '../build/workspace-versions.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const failures = [];

const allowedDocsLazyRouteCrossImports = [
  {
    from: 'apps/docs/src/app/pages/components/popover/popover.page.ts',
    to: 'apps/docs/src/app/pages/testing/floating-dismissal-harness.page.ts',
    rationale:
      'Popover exposes the query-param-only floating dismissal browser harness; it is deliberately bundled only with the lazy popover route, not the docs shell.',
  },
];

const docsHeavyLazyRoutePolicies = [
  {
    id: 'pdf-viewer-docs',
    label: 'PDF viewer docs examples',
    routePath: '/components/pdf-viewer',
    boundary: 'components/pdf-viewer',
    packageSpecifiers: ['hell-ui/features/pdf-viewer', 'pdfjs-dist'],
    sourceFragments: [
      'hell-ui/features/pdf-viewer/styles.css',
      'hell-ui/pdf-viewer/styles/styles.css',
      'pdfjs/pdf_viewer.css',
    ],
    forbiddenComponentStyleFragments: ['hell-ui/features/pdf-viewer/styles.css'],
  },
  {
    id: 'code-editor-docs',
    label: 'Code editor docs examples',
    routePath: '/components/code-editor',
    boundary: 'components/code-editor',
    packageSpecifiers: ['hell-ui/features/code-editor', '@codemirror/'],
    sourceFragments: ['hell-ui/features/code-editor/styles.css'],
  },
  {
    id: 'audio-player-docs',
    label: 'Audio player docs examples',
    routePath: '/components/audio-player',
    boundary: 'components/audio-player',
    packageSpecifiers: [
      'hell-ui/audio-player',
      'hell-ui/features/audio-transcript',
    ],
    sourceFragments: [],
  },
];

const docsCodePreviewLazyWrapperPath = 'apps/docs/src/app/shared/docs-code-viewer.ts';
const audioTranscriptRuntimeTerms = [
  { label: 'SpeechRecognition', pattern: /\bSpeechRecognition\b|\bwebkitSpeechRecognition\b/ },
  { label: 'captureStream()', pattern: /\bcaptureStream\b/ },
];

// Check Manifest: every custom architecture check registers its lifecycle here.
//
// - kind 'permanent' checks guard durable design invariants and never expire.
// - kind 'migration' checks pin the outcome of one migration and must declare
//   removeAfter: the release that ships the migration. The checker fails
//   itself when a migration check is missing that expiry, and again once the
//   package version moves past it — delete the check and its entry then.
//
// Import-boundary enforcement is not a checker concern (#270): the AST ESLint
// rules in tools/eslint/hell-boundaries.mjs own entrypoint category edges,
// relative cross-entrypoint imports, optional-peer import isolation (including
// table adapter direction), and internal public-api export bans.
//
// Generated-file freshness is not a checker concern either: every file rendered
// from the entrypoint manifest — public-api.ts, ng-package.json, styles.css,
// and the package.json exports map — is byte-pinned by
// tools/entrypoints/generate-entrypoint-manifests.mjs --check. Re-deriving a property of a
// byte-pinned file here would only restate that gate.
//
// The checker keeps the durable concerns no standard tool covers — entrypoint
// sidecar coverage, local package resolution, and optional-peer metadata —
// plus docs and component contracts owned elsewhere.
const architectureCheckManifest = [
  { name: 'docs-examples', kind: 'permanent', owner: '@AntonPieper', run: checkDocsExamples },
  {
    name: 'docs-lazy-route-import-graph',
    kind: 'permanent',
    owner: '@AntonPieper',
    run: checkDocsLazyRouteImportGraphContract,
  },
  {
    name: 'docs-category-navigation',
    kind: 'permanent',
    owner: '@AntonPieper',
    run: checkDocsCategoryNavigationContract,
  },
  {
    name: 'entrypoint-manifest-integrity',
    kind: 'permanent',
    owner: '@AntonPieper',
    run: checkEntrypointManifestIntegrity,
  },
  {
    name: 'package-resolution',
    kind: 'permanent',
    owner: '@AntonPieper',
    run: checkPackageResolution,
  },
  {
    // Browser transcript runtime APIs (not imports) stay inside the optional
    // audio-transcript feature; ESLint boundary rules cannot see globals.
    name: 'audio-transcript-runtime-isolation',
    kind: 'permanent',
    owner: '@AntonPieper',
    run: checkAudioTranscriptRuntimeIsolationContract,
  },
  {
    name: 'optional-peer-isolation',
    kind: 'permanent',
    owner: '@AntonPieper',
    run: checkOptionalPeerIsolationContract,
  },
  {
    // Internal Package Paths stay unmistakably private (#272): the manifest
    // loader already rejects internal-category/internal-prefix mismatches for
    // every tool that loads it, and ESLint bans the TS import edge. This
    // check owns the durable consumer-surface concern no standard tool
    // covers: docs content, templates, stylesheets, JSON fixtures, and e2e
    // sources never reference an internal subpath.
    name: 'internal-entrypoint-privacy',
    kind: 'permanent',
    owner: '@AntonPieper',
    run: checkInternalEntrypointPrivacyContract,
  },
  {
    // The Shared Style Substrate carries Semantic Theme Tokens, palettes, and
    // skin-wide primitives only; a component-specific skin selector belongs in
    // a Theme Adapter Stylesheet under hell-ui/themes/*.css
    // (docs/adr/theme-adapter-stylesheets.md). Style Package Entry Point
    // existence is not checked here: the entrypoint manifest loader rejects a
    // styleBundle that disagrees with the entrypoint's styles.css, and the
    // generated bundle is byte-pinned by
    // tools/entrypoints/generate-entrypoint-manifests.mjs --check.
    name: 'token-substrate-ownership',
    kind: 'permanent',
    owner: '@AntonPieper',
    run: checkTokenSubstrateDoesNotOwnComponentSkins,
  },
  {
    // Heavy surfaces stay out of the Default Style Bundle
    // (docs/adr/0002-public-package-and-stylesheet-surface.md, #312): a Heavy
    // Feature or TanStack table entrypoint must declare styleBundle "opt-in"
    // in its sidecar, so a consumer never pays for that CSS by importing
    // hell-ui/styles.css. This is the metadata decision the generated bundle
    // is rendered from; the rendered file itself is byte-pinned by
    // tools/entrypoints/generate-entrypoint-manifests.mjs --check.
    name: 'heavy-style-opt-in',
    kind: 'permanent',
    owner: '@AntonPieper',
    run: checkHeavyStyleOptIn,
  },
  { name: 'component-contract', kind: 'permanent', owner: '@AntonPieper', run: checkComponentContract },
  {
    // Guards the ADR-decided tooltip vocabulary
    // (docs/adr/tooltip-content-and-surface.md, #238).
    name: 'tooltip-vocabulary-contract',
    kind: 'permanent',
    owner: '@AntonPieper',
    run: checkTooltipVocabularyContract,
  },
  {
    name: 'native-button-selector-contract',
    kind: 'permanent',
    owner: '@AntonPieper',
    run: checkNativeButtonSelectorContract,
  },
  {
    name: 'interactive-trigger-selector-contract',
    kind: 'permanent',
    owner: '@AntonPieper',
    run: checkInteractiveTriggerSelectorContract,
  },
  {
    name: 'ngp-state-writer-contract',
    kind: 'permanent',
    owner: '@AntonPieper',
    run: checkNgpStateWriterContract,
  },
  {
    // Scoped dialog modality (docs/adr/floating-dismissal.md, #359) reaches for
    // one ng-primitives DOM marker because the dialog primitive exposes no
    // focus-trap or aria-hidden configuration. Like the state-writer seam, the
    // reliance is version-bound, so it stays in one file and the recorded
    // version must match the installed package.
    name: 'dialog-scoped-modality-seam',
    kind: 'permanent',
    owner: '@AntonPieper',
    run: checkDialogScopedModalitySeam,
  },
  {
    // Attribute ownership over ng-primitives attrBinding writers
    // (docs/adr/ngp-attribute-ownership.md,
    // docs/architecture/manual-runtime-ownership.md). The seam depends on
    // upstream's render-effect scheduling and host-directive construction
    // order, so — like the other two ng-primitives seams — the recorded
    // version must match the installed package and the helpers may appear
    // only at the reviewed call sites.
    name: 'ngp-attr-ownership-seam',
    kind: 'permanent',
    owner: '@AntonPieper',
    run: checkNgpAttrOwnershipSeam,
  },
  {
    // One Control Value Authority (docs/adr/0001-control-value-authority.md,
    // #277): a control class implements exactly one Angular forms contract
    // family. Angular's migration guidance forbids implementing both a
    // ControlValueAccessor and a Signal Forms control contract on one class;
    // mixing them would reintroduce the dual committed-value authority the
    // ADR removes. This lives in the checker rather than the ESLint boundary
    // plugin because it is a class-contract invariant over TypeScript
    // heritage clauses and decorator providers, not an import-boundary edge.
    name: 'one-forms-contract',
    kind: 'permanent',
    owner: '@AntonPieper',
    run: checkOneFormsContractGuard,
  },
];

function main() {
  checkCheckManifest(architectureCheckManifest);
  for (const entry of architectureCheckManifest) entry.run();

  if (failures.length) {
    console.error('Architecture checks failed:\n');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log('Architecture checks passed.');
}

function checkCheckManifest(manifest) {
  const kinds = new Set(['permanent', 'migration']);
  const releasePattern = /^\d+\.\d+\.\d+$/;
  const packageVersion = readJsonFile(join(root, 'packages/angular/package.json')).version;
  const seenNames = new Set();

  for (const entry of manifest) {
    const name = entry.name ?? entry.run?.name ?? '<unnamed>';
    if (!entry.name) failures.push(`Check Manifest entry ${name} is missing a name`);
    if (seenNames.has(name)) failures.push(`Check Manifest has duplicate entry ${name}`);
    seenNames.add(name);

    if (typeof entry.run !== 'function') {
      failures.push(`Check Manifest entry ${name} must reference a check function`);
    }
    if (!kinds.has(entry.kind)) {
      failures.push(`Check Manifest entry ${name} must declare kind "permanent" or "migration"`);
    }
    if (!entry.owner) {
      failures.push(`Check Manifest entry ${name} must declare an owner`);
    }

    if (entry.kind === 'migration') {
      if (!entry.removeAfter) {
        failures.push(
          `Check Manifest migration check ${name} has no removeAfter release; declare the release that retires it or reclassify it as permanent`,
        );
      } else if (!releasePattern.test(entry.removeAfter)) {
        failures.push(
          `Check Manifest migration check ${name} removeAfter must be an x.y.z release; found ${entry.removeAfter}`,
        );
      } else if (compareReleases(releaseCore(packageVersion), entry.removeAfter) > 0) {
        failures.push(
          `Check Manifest migration check ${name} expired after release ${entry.removeAfter} (package version is ${packageVersion}); delete the check and its manifest entry`,
        );
      }
    } else if (entry.removeAfter) {
      failures.push(
        `Check Manifest permanent check ${name} must not declare removeAfter; reclassify it as a migration check if it should expire`,
      );
    }
  }
}

function releaseCore(version) {
  return version.split(/[-+]/)[0];
}

function compareReleases(left, right) {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);
  for (let index = 0; index < 3; index++) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
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

// Entrypoint manifest integrity: the hell-entrypoint.json sidecars stay
// complete and discoverable, and the Light Root Entry Point policy holds over
// the manifest itself. The generated public-api.ts and ng-package.json files
// are byte-pinned by tools/entrypoints/generate-entrypoint-manifests.mjs --check.
function checkEntrypointManifestIntegrity() {
  const publicApiFiles = entrypointPublicApiFiles();
  const rootPublicApi = publicApiFiles.find((entrypoint) => entrypoint.id === 'root');
  const rootApi = readFile(join(root, rootPublicApi.publicApiPath));

  // Light Root Entry Point: the root public API re-exports stable core only.
  const nonCoreRootExports = exportPaths(rootApi).filter(
    (path) => path !== './core/public-api' && !path.startsWith('./core/'),
  );
  if (nonCoreRootExports.length) {
    failures.push(
      `Light Root Entry Point must export core only from packages/angular/public-api.ts; found: ${nonCoreRootExports.join(', ')}`,
    );
  }

  const requiredRootApiExports = new Set(rootPublicApi.exports);
  for (const requiredExport of requiredRootApiExports) {
    if (!rootApi.includes(`'${requiredExport}'`) && !rootApi.includes(`"${requiredExport}"`)) {
      failures.push(`Root Package Entry Point is missing ${requiredExport}`);
    }
  }

  checkEntrypointManifestSourceCoverage();
}

// Package resolution: how the package resolves locally — the @heinrich/source
// resolution contract instead of tsconfig path aliases, and the
// import-path-first Angular workspace layout. The generated exports map itself
// is byte-pinned by tools/entrypoints/generate-entrypoint-manifests.mjs --check.
function checkPackageResolution() {
  const tsconfig = readTsconfigFile(join(root, 'tsconfig.json'));
  if (tsconfig.compilerOptions?.paths) {
    failures.push(
      'Root tsconfig.json must not define Hell package path aliases; package exports with @heinrich/source are the local source-resolution contract',
    );
  }

  const tsconfigBase = readTsconfigFile(join(root, 'tsconfig.base.json'));
  const customConditions = tsconfigBase.compilerOptions?.customConditions ?? [];
  if (!customConditions.includes(sourcePackageCondition)) {
    failures.push(`tsconfig.base.json must include custom condition ${sourcePackageCondition}`);
  }

  const angularWorkspace = readJsonFile(join(root, 'packages/angular/angular.json'));
  const angularSourceRoot = angularWorkspace.projects?.hell?.sourceRoot;
  if (angularSourceRoot !== '.') {
    failures.push(
      `hell-ui Angular project sourceRoot must be "." for import-path-first package layout; found ${angularSourceRoot ?? 'missing'}`,
    );
  }
}

// The transcript runtime terms are browser globals and element methods, not
// module imports, so the ESLint boundary layer cannot see them.
function checkAudioTranscriptRuntimeIsolationContract() {
  const libraryProductionPaths = [
    join(root, 'packages/angular/public-api.ts'),
    ...entrypointPublicApiFiles().map((entrypoint) => join(root, entrypoint.publicApiPath)),
    ...libraryProductionTsFiles(),
  ];

  for (const file of [...new Set(libraryProductionPaths)].sort()) {
    const rel = relPath(file);
    if (isAudioTranscriptFeatureSeamPath(rel)) continue;
    if (!existsSync(file)) continue;

    const source = readFile(file);
    for (const term of audioTranscriptRuntimeTerms) {
      if (term.pattern.test(source)) {
        failures.push(
          `Audio Transcript runtime isolation ${rel} references ${term.label}; ` +
            'browser transcript runtime must stay inside hell-ui/features/audio-transcript.',
        );
      }
    }
  }
}

function isAudioTranscriptFeatureSeamPath(rel) {
  return (
    rel === 'packages/angular/features/audio-transcript/public-api.ts' ||
    rel.includes('/features/audio-transcript/')
  );
}

// Optional-peer isolation at the package-metadata level: which peers exist,
// which are optional and why, and version pinning. The import side of the
// isolation (which sources may import an optional peer) is enforced by
// tools/eslint/hell-boundaries.mjs.
function checkOptionalPeerIsolationContract() {
  const packageJson = readJsonFile(join(root, 'packages/angular/package.json'));
  const catalog = workspaceCatalog();
  const optionalDependencies = Object.keys(packageJson.optionalDependencies ?? {});
  if (optionalDependencies.length) {
    failures.push(
      `Package dependency contract uses optionalDependencies instead of optional peer dependencies: ${optionalDependencies.join(', ')}`,
    );
  }

  const sourceFiles = libraryProductionTsFiles();
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
  // Every peer that must be declared optional, by the consumer class that pays
  // for it. The label spells the class in both messages it appears in
  // ("optional for <label>-only consumers", "missing optional <label> peer
  // dependency"). Order carries different weight in the two loops below: in the
  // per-peer loop it is find() precedence, so a peer listed in two classes is
  // reported under the first one that matches; in the declaration-coverage loop
  // it is the order the failures report in.
  const optionalPeerClasses = [
    {
      label: 'feature',
      peers: new Set([
        '@codemirror/commands',
        '@codemirror/language',
        '@codemirror/state',
        '@codemirror/view',
        '@lezer/highlight',
        'pdfjs-dist',
      ]),
    },
    { label: 'adapter', peers: new Set(['@tanstack/angular-table', '@tanstack/virtual-core']) },
    { label: 'style', peers: new Set(['tailwindcss']) },
    // Icon-backed entry points only; non-icon consumers install without them.
    { label: 'icon', peers: new Set(['@ng-icons/core', '@ng-icons/font-awesome']) },
    { label: 'transitive', peers: new Set(['@angular/router']) },
  ];
  // Declaration coverage, light stack first: every peer of every class must be
  // declared, required or optional as its class says.
  const declaredPeerClasses = [
    { requirement: 'required', label: 'light', peers: lightStackPeers },
    ...optionalPeerClasses.map((peerClass) => ({ requirement: 'optional', ...peerClass })),
  ];

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

    const missedOptionalClass = optionalPeerClasses.find(
      (peerClass) =>
        peerClass.peers.has(dependency) && peerDependenciesMeta[dependency]?.optional !== true,
    );
    if (missedOptionalClass) {
      failures.push(
        `Package dependency contract must keep ${dependency} optional for ${missedOptionalClass.label}-only consumers`,
      );
    }
  }

  for (const dependency of Object.keys(peerDependenciesMeta)) {
    if (!peerDependencies[dependency]) {
      failures.push(
        `Package dependency contract has peerDependenciesMeta for undeclared ${dependency}`,
      );
    } else if (
      !optionalPeerClasses.some((peerClass) => peerClass.peers.has(dependency)) &&
      peerDependenciesMeta[dependency]?.optional
    ) {
      failures.push(
        `Package dependency contract marks ${dependency} optional but it is not a known feature-only, adapter-only, icon-only, style-only, or transitive-only peer`,
      );
    }
  }

  for (const { requirement, label, peers } of declaredPeerClasses) {
    for (const dependency of peers) {
      if (!peerDependencies[dependency]) {
        failures.push(
          `Package dependency contract is missing ${requirement} ${label} peer dependency ${dependency}`,
        );
      }
    }
  }

  if (peerDependencies['pdfjs-dist'] !== catalog['pdfjs-dist']) {
    failures.push(
      `Package dependency contract must pin the optional pdfjs-dist peer to workspace catalog version ${catalog['pdfjs-dist']}`,
    );
  }
}

// Internal Package Paths are excluded from consumer documentation, examples,
// checked-in consumer fixtures, and e2e sources (#272,
// docs/adr/0002-public-package-and-stylesheet-surface.md). ESLint rejects the
// TypeScript import edge; this text-level guard also covers inline templates,
// external templates, stylesheets (`@import 'hell-ui/internal/...'`), JSON
// fixture manifests, and docs prose, so no consumer-facing surface can
// present an internal subpath as a supported contract.
function checkInternalEntrypointPrivacyContract() {
  const consumerSurfaces = [
    { label: 'Consumer docs', dir: 'apps/docs/src' },
    { label: 'Consumer fixture', dir: 'tools/consumer-fixtures' },
    { label: 'E2e source', dir: 'e2e' },
  ];
  const internalReferencePattern = /hell-ui\/internal/;
  const scannedExtensions = /\.(?:ts|mts|html|css|scss|json|md)$/;

  for (const surface of consumerSurfaces) {
    const surfaceRoot = join(root, surface.dir);
    if (!existsSync(surfaceRoot)) {
      failures.push(`Internal Package Path privacy surface is missing: ${surface.dir}`);
      continue;
    }

    for (const file of walk(surfaceRoot)) {
      const rel = relPath(file);
      if (!scannedExtensions.test(file)) continue;

      const source = readFile(file);
      if (!internalReferencePattern.test(source)) continue;

      const lineNumber =
        source.split('\n').findIndex((line) => internalReferencePattern.test(line)) + 1;
      failures.push(
        `${surface.label} ${rel}:${lineNumber} references hell-ui/internal; Internal Package Paths carry no consumer support promise — use a supported Package Entry Point, or promote the contract to a named non-internal entry point first`,
      );
    }
  }
}

function checkHeavyStyleOptIn() {
  const heavyCategories = new Set([
    entrypointCategories.FEATURE,
    entrypointCategories.TANSTACK_TABLE_SHELL,
    entrypointCategories.TANSTACK_TABLE_BODY_STRATEGY,
  ]);
  for (const entrypoint of entrypointPublicApiFiles()) {
    if (
      heavyCategories.has(entrypoint.category) &&
      entrypoint.styleBundle === styleBundlePolicies.DEFAULT
    ) {
      failures.push(
        `Default Style Bundle must not include heavy/optional surface ${entrypoint.specifier}; declare styleBundle "opt-in" in ${entrypoint.metadataPath}`,
      );
    }
  }
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
      `${tokensPath} must not contain component-specific skin selector "${selector.replace(/\s+/g, ' ')}"; move it to hell-ui/themes/*.css`,
    );
  }
}

function checkComponentContract() {
  const productionFiles = libraryProductionTsFiles();
  const classIndex = partStyleClassIndex(productionFiles);
  const files = productionFiles.filter((file) => !relPath(file).includes('/core/'));
  const publicStyleableModules = new Map();

  for (const file of files) {
    for (const module of decoratedClassModulesForFile(file)) {
      const styleInfo = partStyleInfoForClass(module, classIndex);
      if (!styleInfo) continue;

      const { className } = module;
      if (publicStyleableModules.has(className)) {
        failures.push(`Duplicate public styled Module ${className} in ${relPath(file)}`);
      }
      publicStyleableModules.set(className, file);

      checkPartStylePipeline(module, styleInfo);
      checkPartSlotUnionContract(module, styleInfo);
    }
  }
}

// The index holds the same cached records the loop above walks: a module record
// already names the file it came from, so the owner of an inherited part type is
// reachable without a second copy carrying its own path and source.
function partStyleClassIndex(files) {
  const index = new Map();
  for (const file of files) {
    for (const module of decoratedClassModulesForFile(file)) {
      index.set(module.className, module);
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
    file: module.file,
  };
}

function checkPartStylePipeline(module, styleInfo) {
  if (styleInfo.ownerClassName !== module.className) return;

  const { className, moduleSource } = module;
  const rel = relPath(module.file);
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

function checkPartSlotUnionContract(module, styleInfo) {
  const partNames = literalUnionMembers(readFile(styleInfo.file), styleInfo.partType);
  if (!partNames.length) {
    failures.push(`${relPath(styleInfo.file)} must export literal union ${styleInfo.partType}`);
    return;
  }

  const rel = relPath(module.file);
  const templateSource = partStyleTemplateSource(module);
  if (hasDynamicDataSlot(templateSource)) {
    failures.push(
      `${rel} ${module.className} must not compute data-slot dynamically; it must match public parts`,
    );
  }

  const literalSlots = literalDataSlots(templateSource);
  const renderedSlots = literalSlots;
  for (const slot of renderedSlots) {
    if (!partNames.includes(slot)) {
      failures.push(
        `${rel} ${module.className} renders data-slot="${slot}" outside ${styleInfo.partType}`,
      );
    }
  }
  for (const part of partNames) {
    if (!renderedSlots.includes(part)) {
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

function literalUnionMembers(source, typeName, depth = 0) {
  const match = new RegExp(`export\\s+type\\s+${typeName}\\s*=([\\s\\S]*?);`).exec(source);
  if (!match) return [];

  // Deliberately shared part families may alias another exported literal
  // union (e.g. HellDateRangePickerPart = HellDatePickerPart); resolve one
  // level so the data-slot contract still validates against the members.
  const aliasTarget = /^\s*([A-Za-z0-9_]+)\s*$/.exec(match[1])?.[1];
  if (aliasTarget && depth < 2) return literalUnionMembers(source, aliasTarget, depth + 1);

  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map((candidate) => candidate[1]);
}

function hasDynamicDataSlot(source) {
  return (
    /\[\s*(?:attr\.)?data-slot\s*\]\s*(?:=|['"]\s*:)/.test(source) ||
    /\bbind-(?:attr\.)?data-slot\s*=/.test(source) ||
    /\bdata-slot\s*=\s*['"][^'"]*\{\{/.test(source)
  );
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

function partStyleTemplateSource(module) {
  const { file, moduleSource } = module;
  const templateUrl = /templateUrl\s*:\s*['"]([^'"]+)['"]/.exec(moduleSource)?.[1];
  if (templateUrl) {
    const templatePath = join(dirname(file), templateUrl);
    if (existsSync(templatePath)) return `${moduleSource}\n${readFile(templatePath)}`;
  }

  const templateRef = /template\s*:\s*([A-Za-z0-9_]+)/.exec(moduleSource)?.[1];
  if (!templateRef) return moduleSource;

  const pattern = new RegExp(`const\\s+${escapeRegExp(templateRef)}\\s*=\\s*\`([\\s\\S]*?)\`;`);
  const template = pattern.exec(readFile(file))?.[1];
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

function checkTooltipVocabularyContract() {
  const tooltipEntrypoint = entrypointPublicApiFiles().find(
    (entrypoint) => entrypoint.specifier === 'hell-ui/tooltip',
  );
  if (!tooltipEntrypoint) {
    failures.push('Entrypoint metadata is missing hell-ui/tooltip');
  } else if (tooltipEntrypoint.category !== entrypointCategories.MIXED_ENTRYPOINT) {
    failures.push(
      'hell-ui/tooltip must stay classified as a Mixed Entry Point: ' +
        'its string convenience surface and consumer-authored surface share one Interaction State Machine (#238)',
    );
  }

  const rel = 'packages/angular/tooltip/tooltip.ts';
  const source = readFile(join(root, rel));
  const requiredFragments = [
    "selector: '[hellTooltip]'",
    "exportAs: 'hellTooltip'",
    'export class HellTooltip ',
    'string | TemplateRef<unknown> | null | undefined',
    'useTextContent: signal(false)',
    'hoverableContent: signal(true)',
    "selector: '[hellTooltipSurface]'",
    'export class HellTooltipSurface ',
  ];

  for (const fragment of requiredFragments) {
    if (!source.includes(fragment)) {
      failures.push(`${rel} canonical Tooltip vocabulary is missing ${fragment}`);
    }
  }
}

function checkNativeButtonSelectorContract() {
  for (const file of libraryProductionTsFiles()) {
    const rel = relPath(file);
    for (const module of decoratedClassModulesForFile(file)) {
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
  // hellTooltip is intentionally absent: Tooltip attaches to any host without
  // adding focusability or mutating the host (#240).
  const nativeInteractiveTriggers = new Set([
    'hellDialogTrigger',
    'hellPopoverTrigger',
    'hellMenuTrigger',
    'hellFlyoutTrigger',
  ]);

  for (const file of libraryProductionTsFiles()) {
    const rel = relPath(file);
    for (const module of decoratedClassModulesForFile(file)) {
      const selector = /selector:\s*['"]([^'"]+)['"]/.exec(module.moduleSource)?.[1];
      if (!selector) continue;
      const trigger = [...nativeInteractiveTriggers].find((name) => selector.includes(`[${name}]`));
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

function checkNgpStateWriterContract() {
  const adapterRelPath = 'packages/angular/internal/ng-primitives/ngp-state-adapters.ts';
  const adapterPath = join(root, adapterRelPath);
  const adapterSource = readFile(adapterPath);
  const ngpPackage = readJsonFile(
    join(root, 'packages/angular/node_modules/ng-primitives/package.json'),
  );
  const catalog = workspaceCatalog();
  const libraryPackage = readJsonFile(join(root, 'packages/angular/package.json'));
  const expectedVersion = `ng-primitives@${ngpPackage.version}`;

  if (!adapterSource.includes(`HELL_NGP_STATE_WRITER_VERSION = '${expectedVersion}'`)) {
    failures.push(`ng-primitives state writer version must match installed ${expectedVersion}`);
  }

  if (catalog['ng-primitives'] !== ngpPackage.version) {
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
  ]);
  // Radio-group and roving-focus writers retired with ng-primitives 0.128:
  // radio uses the public `setValue(value, { emit: false })`/`setDisabled`
  // pair and roving focus the non-focusing `setTabStop(id)` directly.
  const stateWriterTokens = [
    'HELL_NGP_STATE_WRITER_VERSION',
    'HELL_NGP_STATE_WRITER_UPGRADE_PATH',
    'writeComboboxStateValue',
    'writeComboboxStateDisabled',
  ];
  // Both write tables below are the same three State<T> channels crossed with
  // the receiver shapes a write can take, so they are built from one channel
  // list and one receiver per shape instead of twelve hand-written literals.
  //
  // `(?!this\b)` keeps the receiver an actual state holder: a bare
  // `this.value.set(...)` is the component writing its own `value`
  // ModelSignal (the Control Value Authority), not an ng-primitives
  // State<T> channel — the channel container would have to be `this`
  // itself. `this.<holder>.value.set(...)` and `<holder>().value.set(...)`
  // still match.
  const stateChannels = ['value', 'disabled', 'activeItem'];
  const stateIdentifierReceiver = '\\bstate';
  const calledHolderReceiver = '\\b(?:this\\.)?[A-Za-z_$][\\w$]*\\(\\)';
  const holderReceiver = '\\b(?:this\\.)?[A-Za-z_$][\\w$]*(?:\\(\\))?';
  const nonThisHolderReceiver = '\\b(?:this\\.)?(?!this\\b)[A-Za-z_$][\\w$]*(?:\\(\\))?';
  const indexedWrites = (receiver, label) =>
    stateChannels.map((channel) => ({
      token: `${label}['${channel}'].set(...) or ${label}["${channel}"].set(...)`,
      pattern: new RegExp(`${receiver}\\[['"]${channel}['"]\\]\\.set\\(`),
    }));
  const dottedWrites = (receiver, label) =>
    stateChannels.map((channel) => ({
      token: `${label}.${channel}.set(...)`,
      pattern: new RegExp(`${receiver}\\.${channel}\\.set\\(`),
    }));

  // The two tables are not interchangeable even though the direct table's
  // indexed rows accept everything the indexed table accepts (they differ only
  // by the optional `(?:\(\))?`): the indexed table runs on every non-spec
  // source, while the direct table only runs on sources that touch guarded form
  // state, and each reports its own message. Collapsing them would stop
  // reporting an `state['value'].set(...)` write in a file that never mentions
  // the guarded primitives.
  const indexedStateWritePatterns = [
    ...indexedWrites(stateIdentifierReceiver, 'state'),
    ...indexedWrites(calledHolderReceiver, 'state()'),
  ];
  const directStateChannelWritePatterns = [
    ...dottedWrites(nonThisHolderReceiver, 'State<T>'),
    ...indexedWrites(holderReceiver, 'State<T>'),
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
    const rel = relPath(file);
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

// Scoped dialog modality seam (docs/adr/floating-dismissal.md, #359).
// `NgpDialog` applies its focus trap as a host directive with no exposed input
// and hides page content from assistive technology unconditionally, so the
// scoped dialog owns those two decisions by writing ng-primitives' own
// focus-trap escape marker. That reliance is version-bound: keep it in one
// file, and keep the recorded version matching the installed package.
// Attribute-ownership seam over ng-primitives' imperative attrBinding writers.
// The helpers only work while three version-bound assumptions hold — upstream
// binds the contested attributes from render effects, effects run in
// registration order, and each call site reads the upstream writer's own
// trigger signals — so the seam carries a version constant that must match the
// installed package (forcing a re-probe on every bump), the form-control
// helper must keep sharing upstream's `controlStatus()` trigger, and the
// helpers may appear only at the reviewed call sites below. A new call site is
// a new claim about upstream scheduling: review it against the installed
// bundle before adding it here.
/**
 * The seam-source half of the ngp-attr-ownership check, over the seam's text
 * and the installed ng-primitives version. Exported so the tools spec can
 * mutation-test it: every assertion here is a wake-together or version
 * invariant whose silent loss would let the wrong writer win in production
 * while all behavior tests still pass on the happy path.
 */
export function ngpAttrOwnershipSeamFailures(seamSource, expectedVersion, seamRelPath) {
  const seamFailures = [];

  if (!seamSource.includes(`HELL_NGP_ATTR_OWNERSHIP_VERSION = '${expectedVersion}'`)) {
    seamFailures.push(
      `ngp attr-ownership seam version must match installed ${expectedVersion}; re-probe the attrBinding scheduling assumptions in ${seamRelPath} before moving the pin`,
    );
  }

  // The form-control helper is only correct while it re-runs whenever
  // upstream's aria-invalid writer does, and controlStatus() is the mirror of
  // that shared trigger. Dropping the import silently breaks the lockstep
  // guarantee.
  if (!/import\s*\{[^}]*\bcontrolStatus\b[^}]*\}\s*from\s*'ng-primitives\/utils'/.test(seamSource)) {
    seamFailures.push(
      `${seamRelPath} must keep reading controlStatus from ng-primitives/utils — it is the mirrored trigger that keeps hellOwnsControlAriaInvalid in lockstep with upstream's aria-invalid writer`,
    );
  }

  // The import alone proves nothing: the wake-together guarantee lives in the
  // ownership callback actually READING the status signal, so a flush that
  // re-runs upstream's writer also re-runs this one. Assert the binding and
  // the read inside the hellOwnsNgpAttribute callback, not just the import.
  const helperStart = seamSource.indexOf('function hellOwnsControlAriaInvalid');
  const helperSource = helperStart === -1 ? '' : seamSource.slice(helperStart);
  if (helperStart === -1) {
    seamFailures.push(
      `${seamRelPath} must define hellOwnsControlAriaInvalid; the aria-invalid ownership contract moved or was deleted without retiring this check`,
    );
  } else {
    if (!/const\s+status\s*=\s*controlStatus\(\)/.test(helperSource)) {
      seamFailures.push(
        `hellOwnsControlAriaInvalid in ${seamRelPath} must bind the mirrored trigger with \`const status = controlStatus()\``,
      );
    }
    const callback = /hellOwnsNgpAttribute\(\s*\(\)\s*=>\s*\{([\s\S]*?)\}\s*\)/.exec(helperSource);
    if (!callback) {
      seamFailures.push(
        `hellOwnsControlAriaInvalid in ${seamRelPath} must register its write through a hellOwnsNgpAttribute(() => { ... }) callback`,
      );
    } else if (!/\bstatus\s*\(\s*\)/.test(callback[1])) {
      seamFailures.push(
        `hellOwnsControlAriaInvalid's ownership callback in ${seamRelPath} must read status() — without that read the effect is not dirtied by upstream-only status flushes and the wake-together guarantee is silently gone`,
      );
    }
  }

  return seamFailures;
}

function checkNgpAttrOwnershipSeam() {
  const seamRelPath = 'packages/angular/internal/ng-primitives/ngp-attr-ownership.ts';
  const seamSource = readFile(join(root, seamRelPath));
  const ngpPackage = readJsonFile(
    join(root, 'packages/angular/node_modules/ng-primitives/package.json'),
  );
  const expectedVersion = `ng-primitives@${ngpPackage.version}`;

  failures.push(...ngpAttrOwnershipSeamFailures(seamSource, expectedVersion, seamRelPath));

  const allowedOwnershipFiles = new Set([
    seamRelPath,
    'packages/angular/internal/ng-primitives/public-api.ts',
    // aria-invalid without a touched gate (NgpInput-family hosts).
    'packages/angular/input/input.ts',
    'packages/angular/select/select.ts',
    'packages/angular/date-input/date-input.ts',
    'packages/angular/time-input/time-input.ts',
    'packages/angular/number-input/number-input.ts',
    // aria-disabled absent on enabled radio items.
    'packages/angular/radio/radio.ts',
    // aria-modal="false" on scoped dialogs.
    'packages/angular/dialog/dialog.ts',
  ]);
  const ownershipTokens = [
    'HELL_NGP_ATTR_OWNERSHIP_VERSION',
    'hellOwnsNgpAttribute',
    'hellOwnsControlAriaInvalid',
  ];

  for (const file of libraryPackageFiles().filter((f) => f.endsWith('.ts'))) {
    const rel = relPath(file);
    if (allowedOwnershipFiles.has(rel)) continue;
    const source = readFile(file);
    if (ownershipTokens.some((token) => source.includes(token))) {
      failures.push(
        `ngp attr-ownership usage is not approved in ${rel}; the seam's call sites are reviewed per upstream version — see ${seamRelPath}`,
      );
    }
  }
}

function checkDialogScopedModalitySeam() {
  const seamRelPath = 'packages/angular/dialog/dialog-scope.ts';
  const seamSource = readFile(join(root, seamRelPath));
  const ngpPackage = readJsonFile(
    join(root, 'packages/angular/node_modules/ng-primitives/package.json'),
  );
  const expectedVersion = `ng-primitives@${ngpPackage.version}`;

  if (!seamSource.includes(`HELL_DIALOG_SCOPED_MODALITY_VERSION = '${expectedVersion}'`)) {
    failures.push(
      `scoped dialog modality seam version must match installed ${expectedVersion}; recheck the ng-primitives focus-trap escape marker before moving the pin`,
    );
  }

  // Bare substring, not a quoted literal: a double-quoted or templated copy is
  // the same coupling. Specs read the marker to assert the rendered contract;
  // production sources must not, so only one module can ever write it.
  const marker = 'data-focus-trap';
  // Ownership means the constant still carries the marker — a comment that
  // merely mentions it is not the seam.
  const seamDeclaration = new RegExp(
    `HELL_NGP_FOCUS_TRAP_ESCAPE_ATTRIBUTE\\s*=\\s*['"\`]${escapeRegExp(marker)}['"\`]`,
  );
  if (!seamDeclaration.test(seamSource)) {
    failures.push(
      `${seamRelPath} must own the ng-primitives focus-trap escape marker "${marker}" through HELL_NGP_FOCUS_TRAP_ESCAPE_ATTRIBUTE; the seam moved or was deleted without retiring this check`,
    );
  }

  const productionSources = walk(join(root, libraryRoot)).filter(
    (file) => file.endsWith('.ts') && !file.endsWith('.spec.ts'),
  );
  for (const path of productionSources) {
    const rel = relPath(path);
    if (rel === seamRelPath || !readFile(path).includes(marker)) continue;
    failures.push(
      `ng-primitives focus-trap escape marker is only owned by ${seamRelPath}; found in ${rel}`,
    );
  }
}

// One Control Value Authority guard (docs/adr/0001-control-value-authority.md,
// #282/#291): the migration program retired the legacy ControlValueAccessor
// contract family from Hell sources entirely. Library code must not reference
// ControlValueAccessor or register NG_VALUE_ACCESSOR — native styled controls
// stay platform-owned without any Hell forms contract, and delegated
// ng-primitives seams synchronize through the guarded state adapter, so no
// exemption list is needed. A class that implements a Signal Forms
// custom-control contract (FormValueControl / FormCheckboxControl) is the one
// Control Value Authority for its control: it must implement exactly one of
// the two contracts, must not declare the accessor's callback registration
// methods structurally, and must not declare an explicit valueChange /
// checkedChange member next to the model's implicit change output — that pair
// is how a parallel committed-value authority would reappear.
function checkOneFormsContractGuard() {
  const signalFormsContracts = new Set(['FormValueControl', 'FormCheckboxControl']);
  const accessorMethodNames = new Set(['writeValue', 'registerOnChange', 'registerOnTouched']);
  const parallelChangeOutputs = new Set(['valueChange', 'checkedChange']);
  const sourceFiles = libraryPackageFiles().filter(
    (file) => file.endsWith('.ts') && !file.endsWith('.spec.ts'),
  );

  for (const file of sourceFiles) {
    const source = readFile(file);
    const rel = relPath(file);

    if (source.includes('NG_VALUE_ACCESSOR')) {
      failures.push(
        `${rel}: references the retired NG_VALUE_ACCESSOR provider token; Hell controls expose one Signal Forms contract instead of a legacy value accessor (docs/adr/0001-control-value-authority.md)`,
      );
    }

    const referencesLegacyContract = source.includes('ControlValueAccessor');
    const referencesSignalFormsContract =
      source.includes('FormValueControl') || source.includes('FormCheckboxControl');
    if (!referencesLegacyContract && !referencesSignalFormsContract) continue;

    const sourceFile = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );

    const heritageTypeName = (expression) => {
      if (ts.isIdentifier(expression)) return expression.text;
      if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
      return null;
    };

    if (referencesLegacyContract) {
      const importsLegacyContract = /import[^;]*\bControlValueAccessor\b[^;]*from/s.test(source);
      if (importsLegacyContract) {
        failures.push(
          `${rel}: imports the retired ControlValueAccessor contract; Hell controls expose one Signal Forms contract instead of a legacy value accessor (docs/adr/0001-control-value-authority.md)`,
        );
      }
    }

    const visit = (node) => {
      if (ts.isClassDeclaration(node)) {
        const className = node.name?.text ?? '<anonymous class>';
        const implementedNames = (node.heritageClauses ?? [])
          .filter((clause) => clause.token === ts.SyntaxKind.ImplementsKeyword)
          .flatMap((clause) => clause.types.map((type) => heritageTypeName(type.expression)))
          .filter(Boolean);
        const implementedSignalFormsContracts = implementedNames.filter((name) =>
          signalFormsContracts.has(name),
        );
        const signalFormsContract = implementedSignalFormsContracts[0];

        if (implementedNames.includes('ControlValueAccessor')) {
          failures.push(
            signalFormsContract
              ? `${rel}: class ${className} implements both ${signalFormsContract} and ControlValueAccessor; a control keeps exactly one Angular forms contract family (docs/adr/0001-control-value-authority.md)`
              : `${rel}: class ${className} implements the retired ControlValueAccessor contract; expose one value/checked ModelSignal with a Signal Forms contract instead (docs/adr/0001-control-value-authority.md)`,
          );
        }

        if (implementedSignalFormsContracts.length > 1) {
          failures.push(
            `${rel}: class ${className} implements ${implementedSignalFormsContracts.join(' and ')}; a control keeps exactly one Control Value Authority (docs/adr/0001-control-value-authority.md)`,
          );
        }

        if (signalFormsContract) {
          const accessorMethods = node.members.filter(
            (member) =>
              ts.isMethodDeclaration(member) &&
              ts.isIdentifier(member.name) &&
              accessorMethodNames.has(member.name.text),
          );
          for (const method of accessorMethods) {
            failures.push(
              `${rel}: class ${className} implements ${signalFormsContract} but still declares ControlValueAccessor method ${method.name.getText(sourceFile)} (docs/adr/0001-control-value-authority.md)`,
            );
          }

          const parallelChangeMembers = node.members.filter(
            (member) =>
              (ts.isPropertyDeclaration(member) || ts.isMethodDeclaration(member)) &&
              ts.isIdentifier(member.name) &&
              parallelChangeOutputs.has(member.name.text),
          );
          for (const member of parallelChangeMembers) {
            failures.push(
              `${rel}: class ${className} implements ${signalFormsContract} but declares an explicit ${member.name.getText(sourceFile)} member; the model's implicit change output is the only commit channel (docs/adr/0001-control-value-authority.md)`,
            );
          }
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }
}

// Sidecar coverage runs the discovery backwards: the manifest loader can only
// describe the sidecars it found, so every shipped Package Entry Point (one
// ng-package.json per APF subpath) must have a discoverable sidecar next to it.
// Nothing else here needs asserting — package directories, metadata paths, and
// categories all come from the loader, which throws on a bad one.
function checkEntrypointManifestSourceCoverage() {
  const discoveredMetadataPaths = new Set(
    entrypointPublicApiFiles().map((entrypoint) => entrypoint.metadataPath),
  );

  const packageMetadataPaths = walk(join(root, libraryRoot))
    .filter((path) => basename(path) === 'ng-package.json')
    .map((path) => `${relPath(dirname(path))}/${entrypointMetadataFileName}`);
  for (const metadataPath of packageMetadataPaths) {
    if (!existsSync(join(root, metadataPath))) {
      failures.push(`Package Entry Point is missing entrypoint metadata ${metadataPath}`);
    } else if (!discoveredMetadataPaths.has(metadataPath)) {
      failures.push(`Entrypoint Metadata is not discoverable: ${metadataPath}`);
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

// Repo read layer.
//
// One path spelling: every reader here takes an absolute path, because `walk`
// produces absolute paths. A repo-relative string is a presentation concern —
// failure messages and repo-relative pattern tests derive one explicitly with
// relPath() — so no function body has to track which spelling it holds.
//
// Reads are memoized for the life of the process: one directory listing per
// directory, one read per file, one decorated-class scan per file, one library
// file list per run. The checks sweep the same trees over and over
// (packages/angular whole and per entrypoint, apps/docs/src at three depths),
// and the checker never writes, so a cached read is the same snapshot the check
// would have taken itself. Parsed JSON is deliberately not cached: handing two
// checks the same mutable object would let one corrupt the other's view, and the
// cost this layer exists to remove is the file I/O.
//
// Everything cached here is shared with every later caller, so everything cached
// here is frozen — the class-scan records too, not just the listings holding
// them, since their fields are all strings.
const walkedDirectories = new Map();
const fileContents = new Map();
const fileClassModules = new Map();
let workspaceCatalogSnapshot;
let libraryPackageFileList;
let libraryProductionTsFileList;

// Plain JSON: package.json, angular.json, and installed package manifests are
// strict JSON, so nothing may quietly strip content from them.
function readJsonFile(path) {
  return JSON.parse(readFile(path));
}

// The pnpm catalog is a YAML parse of a file outside every walked tree, and two
// checks pin versions against it. It is a flat string map, so freezing it once
// makes the shared snapshot as immutable as a cached file's contents.
function workspaceCatalog() {
  workspaceCatalogSnapshot ??= Object.freeze(readWorkspaceCatalog());
  return workspaceCatalogSnapshot;
}

// tsconfig files are the one JSONC surface the checker reads, so the
// comment-stripping scanner exists for them alone.
function readTsconfigFile(path) {
  return parseJsonc(readFile(path));
}

// JSONC to JSON, character by character. Comment openers inside string values
// (`"./features/*/styles.css"`) and escaped quotes (`"\\"`) must survive, which
// is what the string/escape states below track. Taking the source rather than a
// path keeps the state machine independent of the filesystem, and
// `check-architecture.spec.mjs` pins these states from there — which is why the
// checks run behind the entry guard at the foot of this file rather than on
// import: a spec that reached this parser by loading the module would run every
// architecture check, and exit the process on the first failure.
export function parseJsonc(source) {
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

      if (char === '\\') {
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
  let contents = fileContents.get(path);
  if (contents === undefined) {
    contents = readFileSync(path, 'utf8');
    fileContents.set(path, contents);
  }
  return contents;
}

// Repo-source walk with lstat semantics: Dirent classifies a symlink as
// neither file nor directory, so installed-dependency trees reachable through
// pnpm's symlink farm (packages/angular/node_modules/*) are never followed.
// Installed dependencies are not repo sources, and reading them turns any
// text sweep into a scan of thousands of published .d.ts files.
//
// The cache is per directory, so it pays off across nesting too: once one check
// has walked packages/angular/dialog, the next walk of packages/angular reuses
// that listing instead of re-reading it. A caller that needs to reorder or
// extend a listing makes its own array; one that forgets fails loudly on the
// frozen result.
function walk(path) {
  let files = walkedDirectories.get(path);
  if (!files) {
    const out = [];
    for (const dirent of readdirSync(path, { withFileTypes: true })) {
      if (dirent.name === 'node_modules') continue;
      const fullPath = join(path, dirent.name);
      if (dirent.isDirectory()) out.push(...walk(fullPath));
      else if (dirent.isFile()) out.push(fullPath);
    }
    files = Object.freeze(out);
    walkedDirectories.set(path, files);
  }
  return files;
}

// Four checks scan the same production sources for decorated classes, so the
// scan is cached per file alongside the file's contents. decoratedClassModules
// stays pure over a source string; this is the file-backed reader over it, and
// it is what stamps each record with the file it came from so a check can
// resolve a template or name the file without a second path spelling.
function decoratedClassModulesForFile(file) {
  let modules = fileClassModules.get(file);
  if (!modules) {
    modules = Object.freeze(
      decoratedClassModules(readFile(file)).map((module) => Object.freeze({ ...module, file })),
    );
    fileClassModules.set(file, modules);
  }
  return modules;
}

// The two library file lists the checks share: every shipped package file, and
// the production TypeScript subset of it.
function libraryPackageFiles() {
  libraryPackageFileList ??= collectLibraryPackageFiles();
  return libraryPackageFileList;
}

function collectLibraryPackageFiles() {
  const files = [join(root, 'packages/angular/public-api.ts')];
  for (const dir of new Set(
    secondaryPackageEntrypoints().map((entrypoint) => entrypoint.packageDir),
  )) {
    const fullDir = join(root, dir);
    if (existsSync(fullDir)) files.push(...walk(fullDir));
  }
  return Object.freeze([...new Set(files)]);
}

function libraryProductionTsFiles() {
  libraryProductionTsFileList ??= Object.freeze(
    libraryPackageFiles().filter(
      (file) => file.endsWith('.ts') && !file.endsWith('.spec.ts') && !file.endsWith('.d.ts'),
    ),
  );
  return libraryProductionTsFileList;
}

// Running the checks is what `node tools/architecture/check-architecture.mjs` does, not what
// importing this module does; `parseJsonc` above is imported by its spec.
//
// Both sides are resolved through symlinks before comparing. `import.meta.url`
// is always the real path, while `process.argv[1]` is whatever spelling invoked
// the script — so an absolute invocation through a symlinked path compares two
// different strings and silently skips the checks rather than failing. Nothing
// invokes it that way today; a gate that can quietly do nothing is worth one
// line to close.
if (
  process.argv[1] &&
  realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))
) {
  main();
}
