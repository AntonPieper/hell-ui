#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  blockingDocsBudgetMessages,
  classifyDocsBudget,
  DOCS_BUDGET_POLICY_PATH,
  formatBytes,
  parseBudgetSize,
  readDocsBudgetPolicy,
  validateDocsBudgetPolicy,
} from './docs-budget-policy.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const options = parseArgs(process.argv.slice(2));
const statsPath = resolveFromRoot(options.stats ?? 'dist/hell-docs/stats.json');
const reportPath = resolveFromRoot(options.out ?? 'docs/release/docs-bundle-budget-diagnosis.md');
const angularJsonPath = join(root, 'angular.json');
const budgetPolicyPath = join(root, DOCS_BUDGET_POLICY_PATH);

if (!existsSync(statsPath)) {
  console.error(`Missing ${relative(root, statsPath)}. Run npm run build:docs first.`);
  process.exit(1);
}

const stats = JSON.parse(readFileSync(statsPath, 'utf8'));
const angularJson = JSON.parse(readFileSync(angularJsonPath, 'utf8'));
const outputs = stats.outputs ?? {};
const budgets =
  angularJson.projects?.['hell-docs']?.architect?.build?.configurations?.production?.budgets ?? [];
const budgetPolicyRead = readDocsBudgetPolicy(budgetPolicyPath);
const budgetPolicy = budgetPolicyRead.policy;
const budgetPolicyErrors = [
  ...budgetPolicyRead.errors,
  ...validateDocsBudgetPolicy(budgetPolicy, budgets),
];

const initialFiles = findInitialFiles(outputs);
const initialChunks = rowsForFiles([...initialFiles], outputs)
  .filter((row) => !row.output['ng-component'])
  .sort(byBytes);
const initialTotal = initialChunks.reduce((sum, row) => sum + row.bytes, 0);
const lazyChunks = rowsForFiles(Object.keys(outputs), outputs)
  .filter((row) => row.file.endsWith('.js'))
  .filter((row) => !initialFiles.has(row.file))
  .filter((row) => !row.output['ng-component'])
  .sort(byBytes);
const componentStyles = rowsForFiles(Object.keys(outputs), outputs)
  .filter((row) => row.output['ng-component'])
  .sort(byBytes);

const initialBudget = budgetFor('initial');
const componentStyleBudget = budgetFor('anyComponentStyle');
const budgetStatuses = [
  classifyDocsBudget({ type: 'initial', currentBytes: initialTotal, budget: initialBudget, policy: budgetPolicy }),
  classifyDocsBudget({
    type: 'anyComponentStyle',
    currentBytes: componentStyles[0]?.bytes ?? 0,
    budget: componentStyleBudget,
    policy: budgetPolicy,
  }),
];
const blockingBudgetMessages = [
  ...budgetPolicyErrors,
  ...blockingDocsBudgetMessages(budgetStatuses),
];
const reverseImporters = buildReverseImporters(outputs);

const report = renderReport();
if (!options.summaryOnly) {
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, report);
  console.log(`Wrote ${relative(root, reportPath)}`);
}
printBudgetSummary();

if (options.check && blockingBudgetMessages.length > 0) {
  console.error('Docs budget policy failed:');
  for (const message of blockingBudgetMessages) {
    console.error(`- ${message}`);
  }
  process.exit(1);
}

function parseArgs(args) {
  const parsed = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }
    if (arg === '--check') {
      parsed.check = true;
      continue;
    }
    if (arg === '--summary-only') {
      parsed.summaryOnly = true;
      continue;
    }
    if (arg === '--stats' || arg === '--out') {
      const value = args[index + 1];
      if (!value) {
        console.error(`${arg} requires a value.`);
        printUsage();
        process.exit(1);
      }
      parsed[arg.slice(2)] = value;
      index += 1;
      continue;
    }
    console.error(`Unknown option: ${arg}`);
    printUsage();
    process.exit(1);
  }
  return parsed;
}

function printUsage() {
  console.log(`Usage: node tools/docs-bundle-budget-report.mjs [--check] [--summary-only] [--stats dist/hell-docs/stats.json] [--out docs/release/docs-bundle-budget-diagnosis.md]

Reads Angular's esbuild stats.json for the docs app, classifies accepted budget warnings vs regressions, and writes a bundle-budget diagnosis report unless --summary-only is used.`);
}

function resolveFromRoot(path) {
  return isAbsolute(path) ? path : resolve(root, path);
}

function findInitialFiles(allOutputs) {
  const initial = new Set();
  const mainFiles = Object.keys(allOutputs).filter((file) => /^main-[A-Z0-9]+\.js$/.test(file));

  for (const main of mainFiles) {
    initial.add(main);
    visitStaticImports(main, initial, allOutputs);
  }

  for (const [file, output] of Object.entries(allOutputs)) {
    if (output.entryPoint === 'angular:styles/global:styles') {
      initial.add(file);
    }
  }

  return initial;
}

function visitStaticImports(file, seen, allOutputs) {
  for (const imported of allOutputs[file]?.imports ?? []) {
    if (imported.kind !== 'import-statement') continue;
    if (!allOutputs[imported.path]) continue;
    if (seen.has(imported.path)) continue;
    seen.add(imported.path);
    visitStaticImports(imported.path, seen, allOutputs);
  }
}

function rowsForFiles(files, allOutputs) {
  return files.map((file) => ({ file, output: allOutputs[file], bytes: allOutputs[file]?.bytes ?? 0 }));
}

function byBytes(a, b) {
  return b.bytes - a.bytes;
}

function budgetFor(type) {
  const budget = budgets.find((candidate) => candidate.type === type);
  if (!budget) return null;
  return {
    ...budget,
    maximumWarningBytes: parseBudgetSize(budget.maximumWarning),
    maximumErrorBytes: parseBudgetSize(budget.maximumError),
  };
}

function buildReverseImporters(allOutputs) {
  const reverse = new Map();
  for (const [from, output] of Object.entries(allOutputs)) {
    for (const imported of output.imports ?? []) {
      if (!allOutputs[imported.path]) continue;
      const importers = reverse.get(imported.path) ?? [];
      importers.push({ from, kind: imported.kind });
      reverse.set(imported.path, importers);
    }
  }
  return reverse;
}

function renderReport() {
  const initialWarningOverage = initialBudget?.maximumWarningBytes
    ? Math.max(0, initialTotal - initialBudget.maximumWarningBytes)
    : 0;
  const componentStyleWarnings = componentStyles.filter(
    (row) =>
      componentStyleBudget?.maximumWarningBytes && row.bytes > componentStyleBudget.maximumWarningBytes,
  );
  const pdfViewerStyleWarnings = componentStyleWarnings.filter((row) =>
    componentStyleOwner(row.output).includes('Pdf Viewer'),
  );

  return `${renderHeader()}

## Budget status

| Budget | Current | Warning | Error | Status |
| --- | ---: | ---: | ---: | --- |
| Initial bundle | ${formatBytes(initialTotal)} | ${formatBudget(initialBudget?.maximumWarningBytes)} | ${formatBudget(initialBudget?.maximumErrorBytes)} | ${renderBudgetStatus(budgetStatusFor('initial'))} |
| Any component style | ${formatBytes(componentStyles[0]?.bytes ?? 0)} largest | ${formatBudget(componentStyleBudget?.maximumWarningBytes)} | ${formatBudget(componentStyleBudget?.maximumErrorBytes)} | ${renderBudgetStatus(budgetStatusFor('anyComponentStyle'))} |

${renderBudgetPolicySection()}

## Largest initial chunks

${renderChunkTable(initialChunks.slice(0, 12), 'initial')}

Initial owner summary: the overage is mostly the docs shell, not a single routed page. The shell eagerly owns Angular runtime/router, global Tailwind + Hell composite CSS, the app-shell/omnibar/menu/select controls used for navigation/search/theme UI, and the top-level Font Awesome icon registry.

## Largest lazy chunks

${renderChunkTable(lazyChunks.slice(0, 12), 'lazy')}

Lazy owner summary: the largest lazy chunks are correctly behind feature/page boundaries. The expensive lazy owners are Code editor (CodeMirror/Lezer), PDF viewer (pdf.js core/viewer/runtime), Table utilities (demo code/raw examples + table utilities), and Audio player (Hell audio runtime).

## Component style budget contributors

${renderComponentStyleTable(componentStyles.slice(0, 8))}

## Root causes and follow-up fixes

| Warning / risk | Root cause from stats | Owner | Follow-up fix |
| --- | --- | --- | --- |
| Initial bundle exceeds 500 kB by ${formatBytes(initialWarningOverage)} | Static imports from \`main\` pull router/runtime plus docs-shell controls; \`styles.css\` globally imports Tailwind and \`@hell-ui/angular/styles/composites\`. Top chunks: ${initialChunks.slice(0, 5).map((row) => `\`${row.file}\``).join(', ')}. | Docs shell / global styles | ${renderInitialBudgetFollowUp()} |
${renderPdfViewerStyleRow(pdfViewerStyleWarnings)}
| PDF lazy weight is large even when initial bundle is protected | \`pdfjs-dist/build/pdf.mjs\`, \`pdfjs-dist/web/pdf_viewer.mjs\`, and \`hell-ui-pdf-viewer.mjs\` are the top PDF lazy inputs. | PDF viewer split package | HELL-031 keeps the docs page lazy/isolated; HELL-053 keeps PDF outside the core package. |
| Code editor lazy chunk is the largest lazy page | CodeMirror and Lezer packages dominate \`code-editor-page\`; this is expected feature weight, not initial shell weight. | Code editor feature | HELL-054 locks CodeMirror as a kept optional entrypoint and prevents leaks into root/composites. |
| Table utilities lazy chunk carries demo/raw source cost | \`data-table-page\` includes live examples plus \`?raw\` source text and table utilities feature code. | Table utilities feature docs | HELL-056 locks table utilities as a kept feature entrypoint; HELL-050 verifies docs examples stay behind lazy routes. |

## Reproduce

~~~bash
npm run build:lib
npm run build:docs
npm run diagnose:docs-bundle
~~~

\`build:docs\` enables Angular's \`statsJson\` option for the production docs app, which writes \`dist/hell-docs/stats.json\`. Local Angular builder schema documents that \`statsJson\` generates a \`stats.json\` file for esbuild analysis; Context7 \`/websites/angular_dev\` confirms \`ng build\` uses the application builder options from \`angular.json\` for app builds.
`;
}

function renderHeader() {
  return `# Docs bundle budget diagnosis

- Slice: HELL-030 diagnosis; HELL-031 remediation; HELL-032 policy classification
- Source stats: \`${relative(root, statsPath)}\`
- Budget policy: \`${relative(root, budgetPolicyPath)}\`
- Report generator: \`tools/docs-bundle-budget-report.mjs\`
- Scope: diagnosis plus current remediation status; HELL-050 now guards docs route imports, and remaining split/import work stays in HELL-053, HELL-054, and HELL-056.`;
}

function budgetStatusFor(type) {
  return budgetStatuses.find((status) => status.type === type);
}

function renderBudgetStatus(status) {
  if (!status) return 'missing budget status';
  if (status.state === 'accepted') {
    return `accepted warning: ${formatBytes(status.overBytes)} over; accepted ceiling: ${formatBytes(status.acceptedMaximumBytes)}; owner: ${status.acceptedWarning.owner}; follow-up: ${status.acceptedWarning.followUp}`;
  }
  if (status.state === 'regression' && status.severity === 'error') {
    return `regression: ${formatBytes(status.overBytes)} over error budget`;
  }
  if (status.state === 'regression' && status.reason === 'acceptedMaximumExceeded') {
    return `regression: ${formatBytes(status.overBytes)} over accepted warning ceiling ${formatBytes(status.acceptedMaximumBytes)}`;
  }
  if (status.state === 'regression') {
    return `regression: ${formatBytes(status.overBytes)} over warning budget; no accepted warning documented`;
  }
  if (status.state === 'within') return 'within warning budget';
  return 'unknown budget status';
}

function renderBudgetPolicySection() {
  const policyCheck = budgetPolicyErrors.length > 0
    ? `failed — ${budgetPolicyErrors.join('; ')}`
    : 'ok';
  const accepted = budgetStatuses.filter((status) => status.state === 'accepted');
  const regressions = budgetStatuses.filter((status) => status.state === 'regression');

  return `## Budget policy

- Policy source: \`${relative(root, budgetPolicyPath)}\`
- Policy check: ${policyCheck}
- Accepted current warnings: ${accepted.length > 0 ? accepted.map((status) => `${budgetLabel(status.type)} (${status.acceptedWarning.followUp})`).join(', ') : 'none'}
- Regression budget warnings: ${regressions.length > 0 ? regressions.map((status) => `${budgetLabel(status.type)} (${formatBytes(status.overBytes)} over)`).join(', ') : 'none'}`;
}

function renderInitialBudgetFollowUp() {
  const status = budgetStatusFor('initial');
  if (status?.state === 'accepted') {
    return `Accepted by the docs budget policy (${status.acceptedWarning.followUp}); HELL-050 guards future eager imports across docs route boundaries, and any undocumented new warning is a regression.`;
  }
  return 'Undocumented budget warning; fix the eager import/CSS regression or document a narrow accepted warning with owner and follow-up.';
}

function printBudgetSummary() {
  console.log('Docs budget summary:');
  for (const status of budgetStatuses) {
    console.log(`- ${budgetLabel(status.type)}: ${renderBudgetStatus(status)}`);
  }
  if (budgetPolicyErrors.length > 0) {
    console.log(`- Policy check: failed (${budgetPolicyErrors.length} issue${budgetPolicyErrors.length === 1 ? '' : 's'})`);
  } else {
    console.log('- Policy check: ok');
  }
  const regressionCount = budgetStatuses.filter((status) => status.state === 'regression').length;
  const acceptedCount = budgetStatuses.filter((status) => status.state === 'accepted').length;
  console.log(`- Classification totals: ${acceptedCount} accepted warning${acceptedCount === 1 ? '' : 's'}, ${regressionCount} regression${regressionCount === 1 ? '' : 's'}`);
}

function budgetLabel(type) {
  if (type === 'initial') return 'Initial bundle';
  if (type === 'anyComponentStyle') return 'Any component style';
  return type;
}

function renderPdfViewerStyleRow(pdfViewerStyleWarnings) {
  if (pdfViewerStyleWarnings.length > 0) {
    return `| \`pdf-viewer.page.ts\` component style exceeds 4 kB | \`pdf-viewer.page.ts\` inline component style imports the PDF viewer stylesheet; stats emits ${pdfViewerStyleWarnings.map((row) => `\`${row.file}\` at ${formatBytes(row.bytes)}`).join(', ')}. | PDF viewer docs page | HELL-031 reduces the PDF docs style cost, moves it behind a documented lazy/global boundary, or records an intentional budget raise. |`;
  }

  return '| PDF viewer docs style is isolated from component-style budget | No pdf-viewer component style chunk exceeds the 4 kB warning budget; the docs page serves `@hell-ui/pdf-viewer/styles` as a copied lazy asset instead of an Angular component style. | PDF viewer docs page | HELL-031 keeps the lazy boundary; docs budget policy keeps component-style warnings unaccepted unless explicitly documented. |';
}

function renderChunkTable(rows, mode) {
  const header = '| Rank | Chunk | Size | Owner | Largest inputs |\n| ---: | --- | ---: | --- | --- |';
  const body = rows
    .map((row, index) => {
      const owner = mode === 'initial' ? initialOwner(row) : lazyOwner(row.file, row.output);
      return `| ${index + 1} | \`${row.file}\` | ${formatBytes(row.bytes)} | ${owner} | ${formatInputs(row.output, 3)} |`;
    })
    .join('\n');
  return `${header}\n${body}`;
}

function renderComponentStyleTable(rows) {
  const warningBytes = componentStyleBudget?.maximumWarningBytes ?? Infinity;
  const header = '| Rank | Style chunk | Size | Owner | Status |\n| ---: | --- | ---: | --- | --- |';
  const body = rows
    .map((row, index) => {
      const owner = componentStyleOwner(row.output);
      const status = row.bytes > warningBytes ? `over by ${formatBytes(row.bytes - warningBytes)}` : 'within warning';
      return `| ${index + 1} | \`${row.file}\` | ${formatBytes(row.bytes)} | ${owner} | ${status} |`;
    })
    .join('\n');
  return `${header}\n${body}`;
}

function initialOwner(row) {
  if (row.output.entryPoint === 'angular:styles/global:styles') return 'Docs global stylesheet (`styles.css`)';

  const inputPaths = Object.keys(row.output.inputs ?? {});
  if (row.file.startsWith('main-')) return 'Docs app shell bootstrap';
  if (inputPaths.some((path) => path.includes('@angular/router'))) return 'Docs router shell';
  if (inputPaths.some((path) => path.includes('@ng-icons/font-awesome'))) return 'Docs app icon registry';
  if (inputPaths.some((path) => path.includes('hell-ui-angular-omnibar'))) return 'Docs search / omnibar shell';
  if (inputPaths.some((path) => path.includes('hell-ui-angular-select'))) return 'Docs theme filter select shell';
  if (inputPaths.some((path) => path.includes('hell-ui-angular-menu'))) return 'Docs menu shell';
  if (inputPaths.some((path) => path.includes('hell-ui-angular-app-shell'))) return 'Docs app-shell layout';
  if (inputPaths.some((path) => path.includes('hell-ui-angular-toast'))) return 'Docs toast host';
  if (inputPaths.some((path) => path.includes('docs-catalog.ts'))) return 'Docs catalog/navigation metadata';
  if (inputPaths.some((path) => path.includes('@floating-ui') || path.includes('ng-primitives') || path.includes('@angular/forms') || path.includes('@angular/cdk'))) {
    return 'Docs shell primitive dependencies';
  }
  if (inputPaths.some((path) => path.includes('@angular/core'))) return 'Angular runtime baseline';
  return 'Shared initial dependency';
}

function lazyOwner(file, output) {
  const directOwner = ownerForEntryPoint(output.entryPoint);
  if (directOwner) return directOwner;

  const owners = traceOwners(file);
  if (owners.length > 0) return owners.slice(0, 3).join('<br>');

  const inputOwner = ownerFromInputs(output);
  return inputOwner ?? 'Shared lazy dependency';
}

function traceOwners(file) {
  const owners = new Set();
  const queue = [file];
  const seen = new Set(queue);

  while (queue.length > 0 && owners.size < 6) {
    const current = queue.shift();
    const importers = reverseImporters.get(current) ?? [];
    for (const importer of importers) {
      const output = outputs[importer.from];
      const owner = ownerForEntryPoint(output?.entryPoint);
      if (owner) {
        owners.add(owner);
        continue;
      }
      if (!seen.has(importer.from)) {
        seen.add(importer.from);
        queue.push(importer.from);
      }
    }
  }

  return [...owners];
}

function ownerForEntryPoint(entryPoint) {
  if (!entryPoint) return null;
  if (entryPoint === 'projects/hell-docs/src/main.ts') return 'Docs app shell bootstrap';
  if (entryPoint === 'projects/hell-docs/src/app/docs-search-index.ts') return 'Docs search index (loaded on search open)';
  if (entryPoint.includes('pdfjs-dist/')) return 'PDF viewer feature (`pdfjs-dist`)';
  if (entryPoint.includes('hell-ui-angular-features-pdf-viewer')) return 'PDF viewer feature entrypoint';
  if (entryPoint.includes('hell-ui-angular-features-code-editor')) return 'Code editor feature entrypoint';
  if (entryPoint.includes('hell-ui-angular-features-audio-transcript')) return 'Audio transcript feature entrypoint';
  if (entryPoint.includes('hell-ui-angular-table')) return 'Table primitives entrypoint';
  if (entryPoint.includes('hell-ui-angular-audio-player')) return 'Audio player composite entrypoint';

  const componentPageMatch = entryPoint.match(
    /^projects\/hell-docs\/src\/app\/pages\/components\/([^/]+)\//,
  );
  if (componentPageMatch) {
    const slug = componentPageMatch[1];
    if (slug === 'data-table') return 'Table utilities docs page (`/components/data-table`)';
    return `${titleFromSlug(slug)} docs page (\`/components/${slug}\`)`;
  }

  const guidePageMatch = entryPoint.match(/^projects\/hell-docs\/src\/app\/pages\/([^/]+)\//);
  if (guidePageMatch) {
    const slug = guidePageMatch[1];
    return `${titleFromSlug(slug)} guide page`;
  }

  return null;
}

function ownerFromInputs(output) {
  const paths = Object.keys(output.inputs ?? {});
  if (paths.some((path) => path.includes('pdfjs-dist'))) return 'PDF viewer feature';
  if (paths.some((path) => path.includes('@codemirror') || path.includes('@lezer'))) {
    return 'Code editor feature';
  }
  if (paths.some((path) => path.includes('hell-ui-angular-table'))) {
    return 'Table primitives';
  }
  if (paths.some((path) => path.includes('hell-ui-angular-audio-player'))) {
    return 'Audio player composite';
  }
  return null;
}

function componentStyleOwner(output) {
  const input = Object.keys(output.inputs ?? {}).find((path) => path.includes('/projects/hell-docs/'));
  if (!input) return 'Component style';
  const normalized = input.replace(/^angular:styles\/component:css;[^;]+;/, '');
  const relativePath = normalized.includes('/projects/hell-docs/')
    ? `projects/hell-docs/${normalized.split('/projects/hell-docs/')[1]}`
    : normalized;
  const owner = ownerForEntryPoint(relativePath);
  return owner ?? `\`${relativePath}\``;
}

function formatInputs(output, count) {
  const inputs = Object.entries(output.inputs ?? {})
    .map(([path, value]) => ({ path, bytes: value.bytesInOutput ?? value.bytes ?? 0 }))
    .sort(byBytes)
    .slice(0, count);
  if (inputs.length === 0) return '—';
  return inputs.map((input) => `${shortInput(input.path)} (${formatBytes(input.bytes)})`).join('<br>');
}

function shortInput(path) {
  const normalized = path.replace(/^angular:styles\/component:css;[^;]+;/, '');
  if (normalized.startsWith('/')) return `\`${relative(root, normalized)}\``;
  return `\`${normalized}\``;
}

function titleFromSlug(slug) {
  return slug
    .split('-')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function formatBudget(bytes) {
  return typeof bytes === 'number' ? formatBytes(bytes) : 'not configured';
}

