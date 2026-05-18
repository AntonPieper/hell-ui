import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

checkDocsExamples();
checkDocsRootImportContract();
checkDocsCodeEditorIsolationContract();
checkPackageEntryPoints();
checkPackageDependencyContract();
checkStyleEntryPoints();
checkNgClassCustomizationContract();
checkAppShellBreakpointContract();
checkBehaviorSentinelContract();
checkComponentContract();
checkLabelContract();
checkCodeEditorRuntimeContract();
checkExperimentalFeatureContract();
checkFormsContract();
checkDateTimeAdapterContract();
checkSearchContract();
checkHotkeyContract();
checkNativeButtonSelectorContract();
checkInteractiveTriggerSelectorContract();
checkTableUtilityContract();
checkTableSortButtonContract();
checkFloatingRegistrationContract();
checkFloatingAdapterContract();
checkNgpPrivateStateBridgeContract();

if (failures.length) {
  console.error('Architecture checks failed:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Architecture checks passed.');

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
  const classImport = new RegExp(
    `import\\s+\\{[^}]*\\b${escapeRegExp(meta.className)}\\b[^}]*\\}\\s+from\\s+['"]\\.\\/examples\\/${stemPattern}['"]`,
  );
  if (!classImport.test(pageSource)) {
    failures.push(`Docs Example "${example.title}" is indexed but not imported by its page`);
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
  const matchingTabs = exampleTabs.filter(
    (block) => block.includes(`[code]="${codeField}"`) && block.includes(`<${meta.selector}`),
  );
  if (matchingTabs.length !== 1) {
    failures.push(
      `Docs Example "${example.title}" must bind ${codeField} and render <${meta.selector}> in exactly one hd-example-tabs block`,
    );
  }
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

function checkDocsCodeEditorIsolationContract() {
  const sharedFiles = [
    'projects/hell-docs/src/app/shared/code-block.ts',
    'projects/hell-docs/src/app/shared/example-tabs.ts',
    'projects/hell-docs/src/app/shared/code-tools.ts',
  ];

  for (const file of sharedFiles) {
    const path = join(root, file);
    if (!existsSync(path)) {
      failures.push(`Docs architecture check references missing file ${file}`);
      continue;
    }

    const source = readFile(path);
    if (source.includes('@codemirror/') || source.includes('@hell-ui/angular/features/code-editor')) {
      failures.push(
        `Docs shared file ${file} must not import CodeMirror or @hell-ui/angular/features/code-editor`,
      );
    }
  }

  const docsPagesRoot = join(root, 'projects/hell-docs/src/app/pages');
  const docsPages = walk(docsPagesRoot).filter((file) => file.endsWith('.ts'));
  for (const file of docsPages) {
    if (file.includes('/components/code-editor/')) continue;
    if (/\bcode-editor\b/i.test(file)) continue;

    const source = readFile(file);
    if (source.includes('@codemirror/') || source.includes('@hell-ui/angular/features/code-editor')) {
      failures.push(
        `Docs page ${file.replace(root + '/', '')} must keep CodeMirror imports within /components/code-editor`,
      );
    }
  }
}

function checkPackageEntryPoints() {
  const rootApiPath = join(root, 'projects/hell/src/public-api.ts');
  const rootApi = readFile(rootApiPath);
  const secondaryApis = [
    'projects/hell/src/lib/public-api-core.ts',
    'projects/hell/src/lib/public-api-primitives.ts',
  ];

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
    ['projects/hell/src/public-api.ts', rootApi],
    ...secondaryApis.map((api) => [api, readFile(join(root, api))]),
  ]) {
    for (const exportPath of exportPaths(source)) {
      const module = basename(exportPath);
      if (internalCoreExports.has(module)) {
        failures.push(`Package Entry Point ${api} exports internal core module ${module}`);
      }
    }
  }

  const requiredRootApiExports = new Set(['./lib/public-api-core']);
  for (const requiredExport of requiredRootApiExports) {
    if (!rootApi.includes(`'${requiredExport}'`) && !rootApi.includes(`"${requiredExport}"`)) {
      failures.push(`Root Package Entry Point is missing ${requiredExport}`);
    }
  }

  const tsconfig = parseJsonWithComments(readFile(join(root, 'tsconfig.json')));
  const paths = tsconfig.compilerOptions?.paths ?? {};
  const features = featureDirectories();
  const expectedPaths = {
    '@hell-ui/angular': './projects/hell/src/public-api.ts',
    '@hell-ui/angular/core': './projects/hell/src/lib/public-api-core.ts',
    '@hell-ui/angular/primitives': './projects/hell/src/lib/public-api-primitives.ts',
    '@hell-ui/angular/composites': './projects/hell/src/lib/public-api-composites.ts',
    '@hell-ui/angular/testing': './projects/hell/src/testing/public-api.ts',
  };
  for (const primitive of primitiveDirectories()) {
    expectedPaths[`@hell-ui/angular/${primitive}`] =
      `./projects/hell/src/lib/public-api-primitive-${primitive}.ts`;
  }
  for (const composite of compositeDirectories()) {
    expectedPaths[`@hell-ui/angular/${composite}`] =
      `./projects/hell/src/lib/public-api-composite-${composite}.ts`;
  }
  for (const feature of features) {
    expectedPaths[`@hell-ui/angular/features/${feature}`] =
      `./projects/hell/src/lib/public-api-feature-${feature}.ts`;
  }

  for (const [entryPoint, expectedPath] of Object.entries(expectedPaths)) {
    const actual = paths[entryPoint]?.[0];
    if (actual !== expectedPath) {
      failures.push(
        `Package Entry Point ${entryPoint} maps to ${actual ?? 'nothing'}, expected ${expectedPath}`,
      );
    }
  }

  const legacyPaths = Object.keys(paths).filter((entryPoint) => entryPoint.startsWith('hell'));
  if (legacyPaths.length) {
    failures.push(`Package Identity still exposes legacy alias paths in tsconfig.json: ${legacyPaths.join(', ')}`);
  }

  const packagePaths = [
    'projects/hell/core/ng-package.json',
    'projects/hell/primitives/ng-package.json',
    'projects/hell/composites/ng-package.json',
    'projects/hell/testing/ng-package.json',
    ...primitiveDirectories().map((primitive) => `projects/hell/${primitive}/ng-package.json`),
    ...compositeDirectories().map((composite) => `projects/hell/${composite}/ng-package.json`),
    ...features.map((feature) => `projects/hell/features/${feature}/ng-package.json`),
  ];

  for (const packagePath of packagePaths) {
    if (!existsSync(join(root, packagePath))) {
      failures.push(`Package Entry Point is missing ${packagePath}`);
    }
  }

  checkSecondaryEntryPointCompleteness('primitives');
  checkPrimitiveEntryPointCompleteness();
  checkSecondaryEntryPointCompleteness('composites');
  checkCompositeEntryPointCompleteness();
  checkFeatureEntryPointCompleteness();
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
  const librarySource = sourceFiles.map(readFile).join('\n');

  const peerDependencies = packageJson.peerDependencies ?? {};
  const peerDependenciesMeta = packageJson.peerDependenciesMeta ?? {};
  const dependencies = packageJson.dependencies ?? {};
  const importedPackages = new Set(
    sourceFiles.flatMap((file) => externalImportPackages(readFile(file))),
  );

  const lightStackPeers = new Set([
    '@angular/cdk',
    '@angular/common',
    '@angular/core',
    '@angular/forms',
    '@floating-ui/dom',
    '@ng-icons/core',
    'ng-primitives',
    'rxjs',
  ]);
  const iconOnlyPeers = new Set(['@ng-icons/font-awesome']);
  const transitiveOnlyPeers = new Set(['@angular/router']);
  const featureOnlyPeers = new Set([
    '@codemirror/commands',
    '@codemirror/language',
    '@codemirror/state',
    '@codemirror/view',
    '@lezer/highlight',
    'pdfjs-dist',
  ]);
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
      !featureOnlyPeers.has(dependency) &&
      !styleOnlyPeers.has(dependency) &&
      !iconOnlyPeers.has(dependency) &&
      !transitiveOnlyPeers.has(dependency) &&
      peerDependenciesMeta[dependency]?.optional
    ) {
      failures.push(
        `Package dependency contract marks ${dependency} optional but it is not a known feature-only, icon-only, style-only, or transitive-only peer`,
      );
    }
  }

  for (const dependency of lightStackPeers) {
    if (!peerDependencies[dependency]) {
      failures.push(`Package dependency contract is missing required light peer dependency ${dependency}`);
    }
  }

  for (const dependency of featureOnlyPeers) {
    if (!peerDependencies[dependency]) {
      failures.push(`Package dependency contract is missing optional feature peer dependency ${dependency}`);
    }
  }

  for (const dependency of styleOnlyPeers) {
    if (!peerDependencies[dependency]) {
      failures.push(`Package dependency contract is missing optional style peer dependency ${dependency}`);
    }
  }

  for (const dependency of iconOnlyPeers) {
    if (!peerDependencies[dependency]) {
      failures.push(`Package dependency contract is missing optional icon peer dependency ${dependency}`);
    }
  }

  if (peerDependencies['@tanstack/angular-table'] || librarySource.includes('@tanstack/angular-table')) {
    failures.push('Package dependency contract must not declare unused @tanstack/angular-table');
  }

  const workspacePdfJsVersion = workspacePackageJson.dependencies?.['pdfjs-dist'];
  if (peerDependencies['pdfjs-dist'] !== workspacePdfJsVersion) {
    failures.push(
      `Package dependency contract must pin pdfjs-dist peer to workspace version ${workspacePdfJsVersion}`,
    );
  }

  const rootNgPackage = parseJsonWithComments(readFile(join(root, 'projects/hell/ng-package.json')));
  if (JSON.stringify(rootNgPackage.assets ?? []).includes('pdf.worker')) {
    failures.push('Root package assets must not copy pdf.worker.mjs; PDF viewer requires an app-provided worker source');
  }
}

function checkStyleEntryPoints() {
  const packageJson = parseJsonWithComments(readFile(join(root, 'projects/hell/package.json')));
  const exportsMap = packageJson.exports ?? {};
  const features = featureDirectories();
  const expectedStyleExports = [
    './styles',
    './styles/tokens',
    './styles/primitives',
    './styles/composites',
    ...features.map((feature) => `./styles/features/${feature}`),
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

  const allStyles = readFile(join(root, 'projects/hell/src/lib/styles/hell.css'));
  const legacyStyleAliasFeatures = new Set(['data-table']);
  for (const feature of features) {
    if (legacyStyleAliasFeatures.has(feature)) continue;
    if (!allStyles.includes(`./features/${feature}.css`)) {
      failures.push(`All-in style entry point is missing Feature CSS import for ${feature}`);
    }
  }

  const featureStyleDir = join(root, 'projects/hell/src/lib/styles/features');
  for (const file of readdirSync(featureStyleDir).filter((name) => name.endsWith('.css'))) {
    const feature = basename(file, '.css');
    const source = readFile(join(featureStyleDir, file));
    const expectedImport = `../components/${feature}.css`;
    if (feature === 'data-table') {
      if (!source.includes(expectedImport)) {
        failures.push(`Feature style entry point ${file} must import ${expectedImport} as legacy alias`);
      }
      continue;
    }

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

function checkBehaviorSentinelContract() {
  const sourceRoot = join(root, 'projects/hell/src/lib');
  const files = walk(sourceRoot).filter(
    (file) =>
      file.endsWith('.ts') &&
      !file.endsWith('.spec.ts') &&
      !file.endsWith('.d.ts') &&
      !file.endsWith('pdf.worker.ts'),
  );
  const styleSelectorPatterns = [
    /\.classList\.contains\(\s*['"]hell-/,
    /\.closest\(\s*['"]\.hell-/,
    /\.matches\(\s*['"]\.hell-/,
    /\.querySelector(?:All)?\(\s*['"]\.hell-/,
  ];

  for (const file of files) {
    const source = readFile(file);
    if (!styleSelectorPatterns.some((pattern) => pattern.test(source))) continue;

    failures.push(
      `${file.slice(root.length + 1)} uses .hell-* style classes as behavior sentinels; use data attributes or element refs`,
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

      if (!moduleSource.includes('!unstyled()')) {
        failures.push(
          `${rel} ${className} extends HellStyleable but does not gate default styling with Style Opt-Out`,
        );
      }
    }

    for (const booleanInput of source.matchAll(
      /readonly\s+([A-Za-z0-9_]+)\s*=\s*input\(\s*(true|false)\s*,\s*\{[^}]*booleanAttribute/g,
    )) {
      const name = booleanInput[1];
      if (/preset/i.test(name)) {
        failures.push(
          `${rel} exposes boolean input "${name}" as a preset instead of a Customization Surface`,
        );
      }
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

  const spinnerSource = readFile(join(root, 'projects/hell/src/lib/primitives/skeleton/skeleton.ts'));
  if (!spinnerSource.includes('HELL_LABELS') || spinnerSource.includes("'aria-label': 'Loading'")) {
    failures.push('HellSpinner must read its default aria-label from the Label Contract');
  }

  const paginationSource = readFile(
    join(root, 'projects/hell/src/lib/primitives/pagination/pagination.ts'),
  );
  for (const hardcoded of ['aria-label="First page"', 'aria-label="Previous page"', "'Page ' + p"]) {
    if (paginationSource.includes(hardcoded)) {
      failures.push('HellPaginationStrip must read built-in labels from the Label Contract');
    }
  }

  const labelConsumers = [
    ['projects/hell/src/lib/composites/app-shell/app-shell.ts', ['Expand sidebar', 'Collapse sidebar']],
    ['projects/hell/src/lib/composites/audio-player/audio-player.ts', ['Show live captions', 'Copy transcript', '>Live<', '>Paused<']],
    ['projects/hell/src/lib/primitives/breadcrumbs/breadcrumbs.ts', ['Show hidden navigation']],
    ['projects/hell/src/lib/composites/date-input/date-input.ts', ['Choose date']],
    ['projects/hell/src/lib/composites/resizable/resizable.ts', ['Resize panels']],
    ['projects/hell/src/lib/composites/time-input/time-input.ts', ['Choose time', 'Subtract 5 minutes']],
    ['projects/hell/src/lib/composites/toast/toast.ts', ['aria-label="Notifications"', 'aria-label="Dismiss"']],
    ['projects/hell/src/lib/features/table-utilities/table-utilities.ts', ['Resize column']],
    ['projects/hell/src/lib/features/pdf-viewer/pdf-viewer.html', ['Find in document', 'Zoom level']],
    ['projects/hell/src/lib/primitives/date-picker/date-picker.ts', ['Previous year', 'Previous month']],
  ];

  for (const [file, hardcodedLabels] of labelConsumers) {
    const source = readFile(join(root, file));
    if (!source.includes('labels.')) {
      failures.push(`${file} must consume the Label Contract for built-in text`);
    }
    for (const label of hardcodedLabels) {
      if (source.includes(label)) {
        failures.push(`${file} hardcodes "${label}" instead of using the Label Contract`);
      }
    }
  }
}

function exportedStyleableClasses(source) {
  const styleableBases = new Set(
    [...source.matchAll(/(?:abstract\s+)?class\s+([A-Za-z0-9_]+)[^{]*extends\s+(?:HellStyleable|HellNativeInteractiveDisabledGuard)\b/g)].map(
      (match) => match[1],
    ),
  );

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

  if (!source.includes('createElementNS')) {
    failures.push('Code Editor Runtime must create SVG fold markers through DOM APIs');
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
  if (!audioSource.includes('@experimental Browser speech transcripts')) {
    failures.push('HellAudioPlayer must mark browser speech transcript experimental in its public JSDoc');
  }

  const audioDocs = readFile(
    join(root, 'projects/hell-docs/src/app/pages/components/audio-player/audio-player.page.ts'),
  );
  if (!/speech transcript is experimental/i.test(audioDocs) || !/default <code>false<\/code>/.test(audioDocs)) {
    failures.push('Audio Player docs must disclose experimental opt-in speech transcript');
  }

  const pdfSource = readFile(join(root, 'projects/hell/src/lib/features/pdf-viewer/pdf-viewer.ts'));
  if (!pdfSource.includes('@experimental This feature wraps pdf.js')) {
    failures.push('HellPdfViewer must mark the pdf.js wrapper experimental in its public JSDoc');
  }

  const pdfFeatureApi = readFile(join(root, 'projects/hell/src/lib/public-api-feature-pdf-viewer.ts'));
  if (!/HellPdfWorkerSource/.test(pdfFeatureApi)) {
    failures.push('PDF Viewer feature entry point must export the public HellPdfWorkerSource worker input type');
  }

  const pdfDocs = readFile(
    join(root, 'projects/hell-docs/src/app/pages/components/pdf-viewer/pdf-viewer.page.ts'),
  );
  if (!/PDF viewer is experimental/.test(pdfDocs)) {
    failures.push('PDF Viewer docs must disclose experimental status');
  }
  if (!/worker[^.]*Hell does not copy\s+a worker into the package tarball/s.test(pdfDocs)) {
    failures.push('PDF Viewer docs must disclose that apps provide the pdf.js worker source');
  }
}

function checkFormsContract() {
  const cvaModules = [
    ['projects/hell/src/lib/primitives/checkbox/checkbox.ts', 'HellCheckbox'],
    ['projects/hell/src/lib/primitives/switch/switch.ts', 'HellSwitch'],
    ['projects/hell/src/lib/primitives/radio/radio.ts', 'HellRadioGroup'],
    ['projects/hell/src/lib/primitives/select/select.ts', 'HellSelect'],
    ['projects/hell/src/lib/primitives/combobox/combobox.ts', 'HellCombobox'],
    ['projects/hell/src/lib/primitives/slider/slider.ts', 'HellSlider'],
    ['projects/hell/src/lib/primitives/toggle/toggle.ts', 'HellToggleGroup'],
    ['projects/hell/src/lib/composites/date-input/date-input.ts', 'HellDateInput'],
    ['projects/hell/src/lib/composites/time-input/time-input.ts', 'HellTimeInput'],
    ['projects/hell/src/lib/features/code-editor/code-editor.ts', 'HellCodeEditor'],
  ];

  for (const [file, className] of cvaModules) {
    const source = readFile(join(root, file));
    const classDecl = new RegExp(`class\\s+${className}\\b[^{]*implements[^{]*ControlValueAccessor`).test(source);
    if (!classDecl || !source.includes('NG_VALUE_ACCESSOR')) {
      failures.push(`${file} ${className} must implement ControlValueAccessor`);
    }
  }
}

function checkDateTimeAdapterContract() {
  const checks = [
    {
      sourcePath: 'projects/hell/src/lib/composites/date-input/date-input.ts',
      docsPath: 'projects/hell-docs/src/app/pages/components/date-input/date-input.page.ts',
      tokens: ['HELL_DATE_INPUT_ADAPTER', 'provideHellDateInputAdapter', 'HellDateInputAdapter'],
    },
    {
      sourcePath: 'projects/hell/src/lib/composites/time-input/time-input.ts',
      docsPath: 'projects/hell-docs/src/app/pages/components/time-input/time-input.page.ts',
      tokens: ['HELL_TIME_INPUT_ADAPTER', 'provideHellTimeInputAdapter', 'HellTimeInputAdapter'],
    },
  ];

  for (const check of checks) {
    const source = readFile(join(root, check.sourcePath));
    const docs = readFile(join(root, check.docsPath));
    for (const token of check.tokens) {
      if (!source.includes(token)) failures.push(`${check.sourcePath} must expose ${token}`);
      if (!docs.includes(token)) failures.push(`${check.docsPath} must document ${token}`);
    }
  }
}

function checkSearchContract() {
  const source = readFile(join(root, 'projects/hell/src/lib/core/search.ts'));
  for (const symbol of ['HELL_SEARCH_RANKER', 'provideHellSearchRanker', 'hellRankLocalSearch']) {
    if (!source.includes(symbol)) failures.push(`Search Core is missing ${symbol}`);
  }

  const docs = readFile(
    join(root, 'projects/hell-docs/src/app/pages/components/omnibar/omnibar.page.ts'),
  );
  if (!docs.includes('provideHellSearchRanker') || !docs.includes('Fuse.js')) {
    failures.push('Omnibar docs must direct serious search through a ranker Adapter or async source');
  }
}

function checkHotkeyContract() {
  const hotkeySource = readFile(join(root, 'projects/hell/src/lib/core/hotkeys.ts'));
  if (!hotkeySource.includes('HellGlobalKeydownService')) {
    failures.push('Core must provide a shared global keydown listener service');
  }
  if (!hotkeySource.includes('HellGlobalPointerdownService')) {
    failures.push('Core must provide a shared global pointer listener service');
  }

  const omnibarSource = readFile(join(root, 'projects/hell/src/lib/composites/omnibar/omnibar.ts'));
  if (omnibarSource.includes('document.addEventListener')) {
    failures.push('HellOmnibar must register global hotkeys through HellGlobalKeydownService');
  }

  const pdfSource = readFile(join(root, 'projects/hell/src/lib/features/pdf-viewer/pdf-viewer.ts'));
  if (pdfSource.includes('window:keydown') || pdfSource.includes('window:pointerdown')) {
    failures.push('HellPdfViewer must register global shortcuts through shared listener services');
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
  const source = readFile(join(root, 'projects/hell/src/lib/features/table-utilities/table-utilities.ts'));
  if (!source.includes('HELL_TABLE_UTILITIES_DIRECTIVES')) {
    failures.push('Table utilities feature must expose HELL_TABLE_UTILITIES_DIRECTIVES as its preferred import');
  }
  if (!source.includes('HELL_TABLE_UTILITY_DIRECTIVES')) {
    failures.push('Table utilities feature must preserve HELL_TABLE_UTILITY_DIRECTIVES compatibility alias');
  }
  if (!source.includes('HELL_TABLE_DIRECTIVES')) {
    failures.push('Table utilities feature must preserve HELL_TABLE_DIRECTIVES compatibility alias');
  }

  const docs = readFile(
    join(root, 'projects/hell-docs/src/app/pages/components/data-table/data-table.page.ts'),
  );
  for (const text of ['Table utilities', 'not a', 'batteries-included data grid', 'TanStack Table']) {
    if (!docs.includes(text)) {
      failures.push('Table docs must present the feature as table utilities, not a full data table');
      break;
    }
  }
}

function checkTableSortButtonContract() {
  const tableSourcePath = join(root, 'projects/hell/src/lib/features/table-utilities/table-utilities.ts');
  const tableSource = readFile(tableSourcePath);
  const headerModule = decoratedClassModules(tableSource).find(
    (module) => module.className === 'HellTableHeaderCell',
  );

  if (!headerModule) {
    failures.push('Table utilities must declare HellTableHeaderCell');
    return;
  }

  if (headerModule.moduleSource.includes('[attr.tabindex]')) {
    failures.push('HellTableHeaderCell must not make the <th> focusable for sorting');
  }

  if (/(?:'|\")\(keydown\.|(?:'|\")\(click\)/.test(headerModule.moduleSource)) {
    failures.push('HellTableHeaderCell must delegate sort activation to button[hellTableSortButton]');
  }

  if (!/export\s+class\s+HellTableSortButton\b/.test(tableSource)) {
    failures.push('Table utilities must expose button[hellTableSortButton] for sortable headers');
  }

  const docsRoot = join(root, 'projects/hell-docs/src/app/pages/components/data-table');
  const docsFiles = walk(docsRoot).filter((file) => file.endsWith('.ts'));
  for (const file of docsFiles) {
    const source = readFile(file);
    for (const match of source.matchAll(/<th\b(?=[^>]*\bhellTableHeaderCell\b)(?=[^>]*\bsortable\b)[^>]*>[\s\S]*?<\/th>/g)) {
      if (!match[0].includes('hellTableSortButton')) {
        failures.push(
          `${file.slice(root.length + 1)} has a sortable table header without button[hellTableSortButton]`,
        );
      }
    }
  }
}

function checkFloatingRegistrationContract() {
  const floatingSurfaces = [
    {
      file: 'projects/hell/src/lib/primitives/popover/popover.ts',
      className: 'HellPopover',
      registration: /hellRegisterFloatingHost\(\);/,
    },
    {
      file: 'projects/hell/src/lib/primitives/tooltip/tooltip.ts',
      className: 'HellTooltip',
      registration: /hellRegisterFloatingHost\(\);/,
    },
    {
      file: 'projects/hell/src/lib/primitives/menu/menu.ts',
      className: 'HellMenu',
      registration: /hellRegisterFloatingHost\(\);/,
    },
    {
      file: 'projects/hell/src/lib/primitives/select/select.ts',
      className: 'HellSelectDropdown',
      registration: /hellRegisterFloatingHost\(\);/,
    },
    {
      file: 'projects/hell/src/lib/primitives/combobox/combobox.ts',
      className: 'HellComboboxDropdown',
      registration: /hellRegisterFloatingHost\(\);/,
    },
    {
      file: 'projects/hell/src/lib/primitives/flyout/flyout.ts',
      className: 'HellFlyout',
      registration: /new\s+HellFloatingInteractionController[\s\S]*?scope:\s*this\.floatingScope/,
    },
  ];

  for (const surface of floatingSurfaces) {
    const source = readFile(join(root, surface.file));
    const classBody = source.match(
      new RegExp(
        `export\\s+class\\s+${surface.className}\\b[\\s\\S]*?(?=\\nexport\\s+class|\\nexport\\s+const|$)`,
      ),
    )?.[0];
    if (!classBody || !surface.registration.test(classBody)) {
      failures.push(
        `${surface.file} ${surface.className} must register its Floating Interaction surface with the nearest Floating Scope`,
      );
    }
  }
}

function checkNgpPrivateStateBridgeContract() {
  const adapterRelPath = 'projects/hell/src/lib/primitives/adapters/ngp-state-adapters.ts';
  const adapterPath = join(root, adapterRelPath);
  const adapterSource = readFile(adapterPath);
  const ngpPackage = parseJsonWithComments(readFile(join(root, 'node_modules/ng-primitives/package.json')));
  const libraryPackage = parseJsonWithComments(readFile(join(root, 'projects/hell/package.json')));
  const expectedVersion = `ng-primitives@${ngpPackage.version}`;

  if (!adapterSource.includes(`HELL_NGP_STATE_WRITER_VERSION = '${expectedVersion}'`)) {
    failures.push(
      `ng-primitives state writer version must match installed ${expectedVersion}`,
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
  const sourceFiles = walk(join(root, 'projects/hell/src/lib')).filter((file) => file.endsWith('.ts'));

  for (const file of sourceFiles) {
    const source = readFile(file);
    const rel = file.slice(root.length + 1);
    if (retiredPrivateBridgeTokens.some((token) => source.includes(token))) {
      failures.push(`Retired ng-primitives private bridge token is still used in ${rel}`);
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

function checkSecondaryEntryPointCompleteness(kind) {
  const apiPath = join(root, `projects/hell/src/lib/public-api-${kind}.ts`);
  const apiSource = readFile(apiPath);
  const apiExports = new Set(exportPaths(apiSource));
  const dir = join(root, `projects/hell/src/lib/${kind}`);
  const internalDirectories = {
    primitives: new Set(['adapters']),
  };
  for (const slug of childDirectories(dir)) {
    if (internalDirectories[kind]?.has(slug)) continue;

    const expected = `./${kind}/${slug}/${slug}`;
    if (!apiExports.has(expected)) {
      failures.push(`Package Entry Point @hell-ui/angular/${kind} is missing ${expected}`);
    }
  }
}

function checkPrimitiveEntryPointCompleteness() {
  for (const primitive of primitiveDirectories()) {
    const packagePath = join(root, `projects/hell/${primitive}/ng-package.json`);
    if (!existsSync(packagePath)) {
      failures.push(`Primitive Package Entry Point is missing projects/hell/${primitive}/ng-package.json`);
      continue;
    }

    const ngPackage = parseJsonWithComments(readFile(packagePath));
    const expectedEntryFile = `../src/lib/public-api-primitive-${primitive}.ts`;
    if (ngPackage.lib?.entryFile !== expectedEntryFile) {
      failures.push(
        `Primitive Package Entry Point ${primitive} entryFile is ${ngPackage.lib?.entryFile ?? 'missing'}, expected ${expectedEntryFile}`,
      );
    }

    const apiPath = join(root, `projects/hell/src/lib/public-api-primitive-${primitive}.ts`);
    const expectedExport = `./primitives/${primitive}/${primitive}`;
    if (!existsSync(apiPath)) {
      failures.push(`Primitive Package Entry Point is missing projects/hell/src/lib/public-api-primitive-${primitive}.ts`);
    } else if (!exportPaths(readFile(apiPath)).includes(expectedExport)) {
      failures.push(`Primitive Package Entry Point ${primitive} must export ${expectedExport}`);
    }
  }
}

function checkCompositeEntryPointCompleteness() {
  for (const composite of compositeDirectories()) {
    const packagePath = join(root, `projects/hell/${composite}/ng-package.json`);
    if (!existsSync(packagePath)) {
      failures.push(`Composite Package Entry Point is missing projects/hell/${composite}/ng-package.json`);
      continue;
    }

    const ngPackage = parseJsonWithComments(readFile(packagePath));
    const expectedEntryFile = `../src/lib/public-api-composite-${composite}.ts`;
    if (ngPackage.lib?.entryFile !== expectedEntryFile) {
      failures.push(
        `Composite Package Entry Point ${composite} entryFile is ${ngPackage.lib?.entryFile ?? 'missing'}, expected ${expectedEntryFile}`,
      );
    }

    const apiPath = join(root, `projects/hell/src/lib/public-api-composite-${composite}.ts`);
    const expectedExport = `./composites/${composite}/${composite}`;
    if (!existsSync(apiPath)) {
      failures.push(`Composite Package Entry Point is missing projects/hell/src/lib/public-api-composite-${composite}.ts`);
    } else if (!exportPaths(readFile(apiPath)).includes(expectedExport)) {
      failures.push(`Composite Package Entry Point ${composite} must export ${expectedExport}`);
    }
  }
}

function checkFeatureEntryPointCompleteness() {
  for (const feature of featureDirectories()) {
    const apiPath = join(root, `projects/hell/src/lib/public-api-feature-${feature}.ts`);
    if (!existsSync(apiPath)) {
      failures.push(
        `Feature Package Entry Point is missing projects/hell/src/lib/public-api-feature-${feature}.ts`,
      );
      continue;
    }
    const expected = `./features/${feature}/${feature}`;
    if (!exportPaths(readFile(apiPath)).includes(expected)) {
      failures.push(`Feature Package Entry Point ${feature} must export ${expected}`);
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
  const internalFeatureDirs = new Set(['assets']);
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
