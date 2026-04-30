import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

checkDocsExamples();
checkPackageEntryPoints();
checkStyleEntryPoints();
checkComponentContract();

if (failures.length) {
  console.error('Architecture checks failed:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Architecture checks passed.');

function checkDocsExamples() {
  const catalogPath = join(root, 'projects/hell-docs/src/app/docs-catalog.ts');
  const catalog = readFile(catalogPath);
  const routePaths = new Set(
    [...catalog.matchAll(/routePath:\s*'([^']*)'/g)].map((match) =>
      match[1] ? `/${match[1]}` : '/',
    ),
  );

  const examplesSource = catalog.slice(
    catalog.indexOf('export const HD_DOCS_EXAMPLES'),
    catalog.indexOf('export const HD_DOCS_CODE_USAGES'),
  );
  const examples = [
    ...examplesSource.matchAll(
      /\{\s*title:\s*'([^']+)',\s*path:\s*'([^']+)',\s*section:\s*'[^']+',\s*detail:\s*'([^']+)'/g,
    ),
  ].map((match) => ({
    title: match[1],
    path: match[2],
    detail: match[3],
  }));

  const seen = new Set();
  for (const example of examples) {
    const key = `${example.path}:${example.detail}`;
    if (seen.has(key)) {
      failures.push(`Duplicate Docs Example entry: ${key}`);
    }
    seen.add(key);

    if (!routePaths.has(example.path)) {
      failures.push(`Docs Example "${example.title}" points at missing route ${example.path}`);
    }

    const examplePath = join(root, 'projects/hell-docs/src/app/pages', example.detail);
    if (!existsSync(examplePath)) {
      failures.push(`Docs Example "${example.title}" points at missing file ${example.detail}`);
      continue;
    }

    const pagePath = pagePathForRoute(example.path);
    if (!existsSync(pagePath)) {
      failures.push(`Docs Example "${example.title}" has no page file for ${example.path}`);
      continue;
    }

    const pageSource = readFile(pagePath);
    const exampleSource = readFile(examplePath);
    const stem = basename(example.detail, '.ts');
    const relativeImport = `./examples/${stem}`;
    const selector = exampleSource.match(/selector:\s*'([^']+)'/)?.[1] ?? null;

    if (!pageSource.includes(relativeImport)) {
      failures.push(`Docs Example "${example.title}" is indexed but not imported by its page`);
    }
    if (!pageSource.includes(`${stem}.ts?raw`)) {
      failures.push(
        `Docs Example "${example.title}" is indexed but its raw source is not imported`,
      );
    }
    if (selector && !pageSource.includes(`<${selector}`)) {
      failures.push(`Docs Example "${example.title}" is indexed but not rendered by its page`);
    }
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

  for (const file of files) {
    const source = readFile(file);
    if (!source.includes('extends HellStyleable')) continue;

    const rel = file.slice(root.length + 1);
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
