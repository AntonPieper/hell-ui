import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

/**
 * Release-blocking API report warning gate.
 *
 * API Extractor writes its analysis warnings into the generated report text
 * (`addToApiReportFile`), so a routine `pnpm run api-report:update` could
 * otherwise bake a new accidental public-contract leak into a committed
 * baseline without anything failing. This gate scans every freshly generated
 * report — in check and update mode alike — and fails the api-report run on:
 *
 * - `ae-forgotten-export`: a public declaration references a declaration the
 *   entry point does not export. Export the symbol deliberately, stop
 *   referencing it from the public declaration, or add one explicit
 *   allowlist entry below with a rationale.
 * - `ae-unresolved-link`: a TSDoc `@link` target does not resolve. Fix the
 *   reference; there is no allowlist for broken links.
 *
 * It also keeps shared cross-entrypoint contracts explicit: every named
 * symbol a public report imports from a guarded `internal/*` sibling entry
 * point must be classified in {@link classifiedInternalContracts}. There is
 * no blanket suppression anywhere in this gate — each tolerated finding is
 * one explicit entry with a rationale, and stale entries fail too.
 */

/**
 * Tolerated `ae-forgotten-export` findings: report specifier -> (symbol ->
 * rationale). Empty today: every module-local renderer, controller, store,
 * registration, and template-helper type either became a deliberate export
 * or is no longer referenced by a public declaration (#212). Add an entry
 * only for a symbol that must stay unexported while a public declaration
 * still references it, and delete the entry once the warning disappears.
 */
const forgottenExportAllowlist = new Map();

/**
 * Expected shared cross-entrypoint contracts: named symbols that public API
 * reports deliberately import from a guarded `internal/*` sibling entry
 * point. Each classification names the report, the internal seam, the exact
 * symbols, and why the contract crosses that seam.
 */
const classifiedInternalContracts = [
  {
    report: '@hell-ui/angular/core',
    from: '@hell-ui/angular/internal/core',
    symbols: [
      'HellFloatingElement',
      'hellInvalidTypedValue',
      'HellPickMultipleValue',
      'HellPickSingleValue',
      'HellPickValue',
      'hellTypedValue',
      'HellTypedValueInvalidParse',
      'HellTypedValueParseResult',
      'HellTypedValueValidParse',
    ],
    reason:
      'core deliberately re-exports the stable value, pick, and floating-element contracts whose definitions live behind the guarded internal/core baseline',
  },
  {
    report: '@hell-ui/angular',
    from: '@hell-ui/angular/internal/core',
    symbols: [
      'HellFloatingElement',
      'hellInvalidTypedValue',
      'HellPickMultipleValue',
      'HellPickSingleValue',
      'HellPickValue',
      'hellTypedValue',
      'HellTypedValueInvalidParse',
      'HellTypedValueParseResult',
      'HellTypedValueValidParse',
    ],
    reason:
      'the root entry point re-exports the core surface, including the stable contracts defined behind the guarded internal/core baseline',
  },
  {
    report: '@hell-ui/angular/dialog',
    from: '@hell-ui/angular/internal/core',
    symbols: ['HellNativeInteractiveDisabledGuard'],
    reason:
      'HellDialogTrigger extends the shared native-interactive disabled-state guard owned by the guarded internal/core baseline',
  },
  {
    report: '@hell-ui/angular/menu',
    from: '@hell-ui/angular/internal/core',
    symbols: ['HellNativeInteractiveDisabledGuard'],
    reason:
      'the menu trigger extends the shared native-interactive disabled-state guard owned by the guarded internal/core baseline',
  },
  {
    report: '@hell-ui/angular/popover',
    from: '@hell-ui/angular/internal/core',
    symbols: ['HellNativeInteractiveDisabledGuard'],
    reason:
      'the popover trigger extends the shared native-interactive disabled-state guard owned by the guarded internal/core baseline',
  },
];

const forgottenExportPattern =
  /\(ae-forgotten-export\) The symbol "([^"]+)" needs to be exported/g;
const unresolvedLinkPattern = /\(ae-unresolved-link\)\s*([^\n]*)/g;
const namedImportPattern = /^import \{ ([^}]+) \} from '([^']+)';$/gm;
const namespaceImportPattern = /^import \* as \S+ from '([^']+)';$/gm;
const internalSpecifierPattern = /^@hell-ui\/angular\/internal\//;

/**
 * Scan one generated report's text for release-blocking analysis warnings.
 * Returns human-readable failures; an empty array means the report is clean.
 */
export function scanApiReportWarnings({
  specifier,
  reportText,
  allowlist = forgottenExportAllowlist,
}) {
  const failures = [];
  const allowlisted = allowlist.get(specifier) ?? new Map();
  const seen = new Set();

  for (const match of reportText.matchAll(forgottenExportPattern)) {
    const symbol = match[1];
    if (seen.has(symbol)) continue;
    seen.add(symbol);
    if (allowlisted.has(symbol)) continue;
    failures.push(
      `${specifier}: (ae-forgotten-export) "${symbol}" — export it deliberately from the entry point, ` +
        'stop referencing it from public declarations, or add one allowlist entry with a rationale in ' +
        'tools/check-api-report-warnings.mjs',
    );
  }

  for (const [symbol] of allowlisted) {
    if (seen.has(symbol)) continue;
    failures.push(
      `${specifier}: stale ae-forgotten-export allowlist entry "${symbol}" — the report no longer warns ` +
        'for it; delete the entry from tools/check-api-report-warnings.mjs',
    );
  }

  for (const match of reportText.matchAll(unresolvedLinkPattern)) {
    failures.push(
      `${specifier}: (ae-unresolved-link) ${match[1].trim()} — fix the @link target; broken references are release blocking`,
    );
  }

  return failures;
}

/**
 * Keep internal cross-entrypoint contracts explicit for one public report:
 * every named import from an `internal/*` sibling must be classified, every
 * classification must still match an import, and namespace imports of
 * internal seams are never allowed. Internal entrypoints' own baselines are
 * out of scope — they are the guarded seams themselves.
 */
export function scanInternalContractImports({
  specifier,
  reportText,
  classification = classifiedInternalContracts,
}) {
  if (internalSpecifierPattern.test(specifier)) return [];

  const failures = [];
  const importedByModule = new Map();

  for (const match of reportText.matchAll(namedImportPattern)) {
    const from = match[2];
    if (!internalSpecifierPattern.test(from)) continue;
    const symbols = importedByModule.get(from) ?? new Set();
    for (const symbol of match[1].split(',')) symbols.add(symbol.trim());
    importedByModule.set(from, symbols);
  }

  for (const match of reportText.matchAll(namespaceImportPattern)) {
    if (!internalSpecifierPattern.test(match[1])) continue;
    failures.push(
      `${specifier}: namespace import of '${match[1]}' — internal cross-entrypoint contracts must be ` +
        'named imports classified in tools/check-api-report-warnings.mjs',
    );
  }

  const entries = classification.filter((entry) => entry.report === specifier);
  for (const [from, symbols] of importedByModule) {
    const entry = entries.find((candidate) => candidate.from === from);
    for (const symbol of symbols) {
      if (entry?.symbols.includes(symbol)) continue;
      failures.push(
        `${specifier}: unclassified internal contract "${symbol}" from '${from}' — hide the reference ` +
          'or classify the shared contract with a rationale in tools/check-api-report-warnings.mjs',
      );
    }
  }

  for (const entry of entries) {
    const symbols = importedByModule.get(entry.from) ?? new Set();
    for (const symbol of entry.symbols) {
      if (symbols.has(symbol)) continue;
      failures.push(
        `${specifier}: stale internal contract classification "${symbol}" from '${entry.from}' — the ` +
          'report no longer imports it; delete it from tools/check-api-report-warnings.mjs',
      );
    }
  }

  return failures;
}

/**
 * Validate the classification and allowlist against the actual report
 * specifiers so entries cannot outlive a renamed or retired entry point.
 */
export function validateWarningGateConfiguration(reportSpecifiers) {
  const failures = [];
  const specifiers = new Set(reportSpecifiers);

  for (const specifier of forgottenExportAllowlist.keys()) {
    if (specifiers.has(specifier)) continue;
    failures.push(
      `forgotten-export allowlist names unknown report specifier '${specifier}' in tools/check-api-report-warnings.mjs`,
    );
  }

  for (const entry of classifiedInternalContracts) {
    if (!specifiers.has(entry.report)) {
      failures.push(
        `internal contract classification names unknown report specifier '${entry.report}' in tools/check-api-report-warnings.mjs`,
      );
    }
    if (internalSpecifierPattern.test(entry.report)) {
      failures.push(
        `internal contract classification for '${entry.report}' targets an internal baseline; classify only public reports`,
      );
    }
    if (!internalSpecifierPattern.test(entry.from)) {
      failures.push(
        `internal contract classification for '${entry.report}' names non-internal source '${entry.from}'; public sibling imports need no classification`,
      );
    }
    if (!entry.symbols?.length || !entry.reason) {
      failures.push(
        `internal contract classification for '${entry.report}' from '${entry.from}' must name its symbols and a reason`,
      );
    }
  }

  return failures;
}

/** Self-check with synthetic report texts; runs before the real gate. */
export function checkApiReportWarningGateFixture() {
  const specifier = '@hell-ui/angular/fixture';
  const leakReport = [
    '// Warning: (ae-forgotten-export) The symbol "ModuleLocalLeak" needs to be exported by the entry point fixture.d.ts',
    '// fixture.d.ts:2:1 - (ae-forgotten-export) The symbol "ModuleLocalLeak" needs to be exported by the entry point fixture.d.ts',
  ].join('\n');

  const leakFailures = scanApiReportWarnings({
    specifier,
    reportText: leakReport,
    allowlist: new Map(),
  });
  assert.equal(leakFailures.length, 1, 'a repeated forgotten export must fail exactly once');
  assert.match(leakFailures[0], /"ModuleLocalLeak"/, 'the failure must name the leaked symbol');

  const allowlist = new Map([[specifier, new Map([['ModuleLocalLeak', 'fixture rationale']])]]);
  assert.deepEqual(
    scanApiReportWarnings({ specifier, reportText: leakReport, allowlist }),
    [],
    'an explicitly allowlisted forgotten export must pass',
  );
  const staleFailures = scanApiReportWarnings({ specifier, reportText: '// clean', allowlist });
  assert.equal(staleFailures.length, 1, 'an unused allowlist entry must fail as stale');
  assert.match(staleFailures[0], /stale/, 'the stale failure must say so');

  const linkFailures = scanApiReportWarnings({
    specifier,
    reportText:
      '// Warning: (ae-unresolved-link) The @link reference could not be resolved: no member "nope"',
    allowlist: new Map(),
  });
  assert.equal(linkFailures.length, 1, 'an unresolved link must fail');
  assert.match(linkFailures[0], /ae-unresolved-link/, 'the failure must name the category');

  const internalImportReport = [
    "import { FixtureContract } from '@hell-ui/angular/internal/fixture';",
    "import { Signal } from '@angular/core';",
    "import { HellPublicSibling } from '@hell-ui/angular/core';",
  ].join('\n');
  assert.match(
    scanInternalContractImports({
      specifier,
      reportText: internalImportReport,
      classification: [],
    })[0],
    /unclassified internal contract "FixtureContract"/,
    'an unclassified internal import must fail',
  );
  const classification = [
    {
      report: specifier,
      from: '@hell-ui/angular/internal/fixture',
      symbols: ['FixtureContract'],
      reason: 'fixture rationale',
    },
  ];
  assert.deepEqual(
    scanInternalContractImports({ specifier, reportText: internalImportReport, classification }),
    [],
    'a classified internal contract must pass, and public sibling imports need no classification',
  );
  assert.match(
    scanInternalContractImports({ specifier, reportText: '// clean', classification })[0],
    /stale internal contract classification "FixtureContract"/,
    'a classification without a matching import must fail as stale',
  );
  assert.match(
    scanInternalContractImports({
      specifier,
      reportText: "import * as fixture from '@hell-ui/angular/internal/fixture';",
      classification,
    })[0],
    /namespace import/,
    'a namespace import of an internal seam must fail',
  );
  assert.deepEqual(
    scanInternalContractImports({
      specifier: '@hell-ui/angular/internal/fixture-sibling',
      reportText: internalImportReport,
      classification: [],
    }),
    [],
    'internal baselines themselves are out of scope',
  );

  console.log('[api-report] warning gate fixture passed.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  checkApiReportWarningGateFixture();
}
