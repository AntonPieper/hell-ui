import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

checkDocsExamples();
checkPackageEntryPoints();
checkStyleEntryPoints();
checkComponentContract();
checkFloatingRegistrationContract();

if (failures.length) {
  console.error('Architecture checks failed:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Architecture checks passed.');

function checkDocsExamples() {
  const catalogPath = join(root, 'projects/hell-docs/src/app/docs-catalog.ts');
  const catalog = readFile(catalogPath);
  const routePaths = catalogRoutePaths(catalog);
  const examples = catalogExampleSeeds(catalog);
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
}

function catalogRoutePaths(catalog) {
  return new Set(
    [...catalog.matchAll(/routePath:\s*'([^']*)'/g)].map((match) =>
      match[1] ? `/${match[1]}` : '/',
    ),
  );
}

function catalogExampleSeeds(catalog) {
  const routes = [...catalog.matchAll(/routePath:\s*'([^']*)'/g)];
  const examples = [];
  for (let i = 0; i < routes.length; i++) {
    const routePath = routes[i][1];
    const path = routePath ? `/${routePath}` : '/';
    const source = catalog.slice(routes[i].index, routes[i + 1]?.index ?? catalog.length);
    for (const match of source.matchAll(/\{\s*title:\s*'([^']+)',\s*detail:\s*'([^']+)'/g)) {
      if (!match[2].includes('/examples/')) continue;
      examples.push({ title: match[1], detail: match[2], path });
    }
  }
  return examples;
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

function checkPackageEntryPoints() {
  const rootApiPath = join(root, 'projects/hell/src/public-api.ts');
  const rootApi = readFile(rootApiPath);
  const secondaryApis = [
    'projects/hell/src/lib/public-api-core.ts',
    'projects/hell/src/lib/public-api-primitives.ts',
    'projects/hell/src/lib/public-api-composites.ts',
  ];

  if (/export\s+\*\s+from\s+['"]\.\/lib\/features\//.test(rootApi)) {
    failures.push(
      'Light Root Entry Point exports a heavy feature from projects/hell/src/public-api.ts',
    );
  }

  for (const api of secondaryApis) {
    for (const exportPath of exportPaths(readFile(join(root, api)))) {
      const rootExportPath = exportPath.replace('./', './lib/');
      if (!rootApi.includes(`'${rootExportPath}'`) && !rootApi.includes(`"${rootExportPath}"`)) {
        failures.push(`Root Package Entry Point is missing ${rootExportPath} from ${api}`);
      }
    }
  }

  const tsconfig = parseJsonWithComments(readFile(join(root, 'tsconfig.json')));
  const paths = tsconfig.compilerOptions?.paths ?? {};
  const expectedPaths = {
    hell: './projects/hell/src/public-api.ts',
    'hell/core': './projects/hell/src/lib/public-api-core.ts',
    'hell/primitives': './projects/hell/src/lib/public-api-primitives.ts',
    'hell/composites': './projects/hell/src/lib/public-api-composites.ts',
    'hell/features/code-editor': './projects/hell/src/lib/public-api-feature-code-editor.ts',
    'hell/features/data-table': './projects/hell/src/lib/public-api-feature-data-table.ts',
    'hell/features/pdf-viewer': './projects/hell/src/lib/public-api-feature-pdf-viewer.ts',
  };

  for (const [entryPoint, expectedPath] of Object.entries(expectedPaths)) {
    const actual = paths[entryPoint]?.[0];
    if (actual !== expectedPath) {
      failures.push(
        `Package Entry Point ${entryPoint} maps to ${actual ?? 'nothing'}, expected ${expectedPath}`,
      );
    }
  }

  for (const packagePath of [
    'projects/hell/core/ng-package.json',
    'projects/hell/primitives/ng-package.json',
    'projects/hell/composites/ng-package.json',
    'projects/hell/features/code-editor/ng-package.json',
    'projects/hell/features/data-table/ng-package.json',
    'projects/hell/features/pdf-viewer/ng-package.json',
  ]) {
    if (!existsSync(join(root, packagePath))) {
      failures.push(`Package Entry Point is missing ${packagePath}`);
    }
  }

  checkSecondaryEntryPointCompleteness('primitives');
  checkSecondaryEntryPointCompleteness('composites');
  checkFeatureEntryPointCompleteness();
}

function checkStyleEntryPoints() {
  const packageJson = parseJsonWithComments(readFile(join(root, 'projects/hell/package.json')));
  const exportsMap = packageJson.exports ?? {};
  const expectedStyleExports = [
    './styles',
    './styles/tokens',
    './styles/primitives',
    './styles/composites',
    './styles/features/code-editor',
    './styles/features/data-table',
    './styles/features/pdf-viewer',
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
  for (const feature of ['code-editor', 'data-table', 'pdf-viewer']) {
    if (!allStyles.includes(`./features/${feature}.css`)) {
      failures.push(`All-in style entry point is missing Feature CSS import for ${feature}`);
    }
  }

  const featureStyleDir = join(root, 'projects/hell/src/lib/styles/features');
  for (const file of readdirSync(featureStyleDir).filter((name) => name.endsWith('.css'))) {
    const feature = basename(file, '.css');
    const source = readFile(join(featureStyleDir, file));
    if (!source.includes(`../components/${feature}.css`)) {
      failures.push(`Feature style entry point ${file} must import ../components/${feature}.css`);
    }
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
    for (const className of styleableClasses) {
      if (publicStyleableModules.has(className)) {
        failures.push(`Duplicate public HellStyleable Module ${className} in ${rel}`);
      }
      publicStyleableModules.set(className, rel);
    }

    if (!source.includes('!unstyled()')) {
      failures.push(
        `${rel} extends HellStyleable but does not gate default styling with Style Opt-Out`,
      );
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

function exportedStyleableClasses(source) {
  return [
    ...source.matchAll(/export\s+(?:abstract\s+)?class\s+([A-Za-z0-9_]+)(?:<[^>{}]*>)?[\s\S]*?\{/g),
  ]
    .filter((match) => match[0].includes('extends HellStyleable'))
    .map((match) => match[1]);
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

function checkSecondaryEntryPointCompleteness(kind) {
  const apiPath = join(root, `projects/hell/src/lib/public-api-${kind}.ts`);
  const apiSource = readFile(apiPath);
  const apiExports = new Set(exportPaths(apiSource));
  const dir = join(root, `projects/hell/src/lib/${kind}`);
  for (const slug of childDirectories(dir)) {
    const expected = `./${kind}/${slug}/${slug}`;
    if (!apiExports.has(expected)) {
      failures.push(`Package Entry Point hell/${kind} is missing ${expected}`);
    }
  }
}

function checkFeatureEntryPointCompleteness() {
  const featuresDir = join(root, 'projects/hell/src/lib/features');
  for (const feature of childDirectories(featuresDir)) {
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

function pagePathForRoute(routePath) {
  if (routePath === '/') {
    return join(root, 'projects/hell-docs/src/app/pages/overview/overview.page.ts');
  }

  const route = routePath.replace(/^\//, '');
  return join(root, 'projects/hell-docs/src/app/pages', route, `${basename(route)}.page.ts`);
}

function exportPaths(source) {
  return [...source.matchAll(/export\s+\*\s+from\s+['"]([^'"]+)['"]/g)].map((match) => match[1]);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseJsonWithComments(source) {
  return JSON.parse(source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, ''));
}

function readFile(path) {
  return readFileSync(path, 'utf8');
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
