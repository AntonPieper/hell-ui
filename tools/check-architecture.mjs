import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

checkDocsExamples();
checkPackageEntryPoints();

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
