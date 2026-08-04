import { describe, expect, it } from 'vitest';

import {
  scanApiReportWarnings,
  scanInternalContractImports,
} from './check-api-report-warnings.mjs';

/**
 * Synthetic report texts, so every release-blocking finding the gate must raise
 * is reachable without a library that actually leaks it. Both scanners take
 * their allowlist and classification as parameters for exactly this reason: the
 * committed entries are the repository's current state, not a test fixture.
 */

const specifier = 'hell-ui/fixture';

describe('scanApiReportWarnings', () => {
  const leakReport = [
    '// Warning: (ae-forgotten-export) The symbol "ModuleLocalLeak" needs to be exported by the entry point fixture.d.ts',
    '// fixture.d.ts:2:1 - (ae-forgotten-export) The symbol "ModuleLocalLeak" needs to be exported by the entry point fixture.d.ts',
  ].join('\n');

  it('fails a repeated forgotten export exactly once, naming the symbol', () => {
    const failures = scanApiReportWarnings({
      specifier,
      reportText: leakReport,
      allowlist: new Map(),
    });

    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/"ModuleLocalLeak"/);
  });

  it('passes an explicitly allowlisted forgotten export', () => {
    const allowlist = new Map([[specifier, new Map([['ModuleLocalLeak', 'fixture rationale']])]]);

    expect(scanApiReportWarnings({ specifier, reportText: leakReport, allowlist })).toEqual([]);
  });

  it('fails an allowlist entry the report no longer warns for', () => {
    const allowlist = new Map([[specifier, new Map([['ModuleLocalLeak', 'fixture rationale']])]]);
    const failures = scanApiReportWarnings({ specifier, reportText: '// clean', allowlist });

    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/stale/);
  });

  it('fails an unresolved link, which has no allowlist', () => {
    const failures = scanApiReportWarnings({
      specifier,
      reportText:
        '// Warning: (ae-unresolved-link) The @link reference could not be resolved: no member "nope"',
      allowlist: new Map(),
    });

    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/ae-unresolved-link/);
  });

  it('fails a repeated setter-only property exactly once, naming category and property', () => {
    const failures = scanApiReportWarnings({
      specifier,
      reportText: [
        '// Warning: (ae-missing-getter) The property "setterOnly" has a setter but no getter.',
        '// fixture.d.ts:9:5 - (ae-missing-getter) The property "setterOnly" has a setter but no getter.',
      ].join('\n'),
      allowlist: new Map(),
    });

    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/ae-missing-getter/);
    expect(failures[0]).toMatch(/"setterOnly"/);
  });
});

describe('scanInternalContractImports', () => {
  const internalImportReport = [
    "import { FixtureContract } from 'hell-ui/internal/fixture';",
    "import { Signal } from '@angular/core';",
    "import { HellPublicSibling } from 'hell-ui/core';",
  ].join('\n');

  const classification = [
    {
      report: specifier,
      from: 'hell-ui/internal/fixture',
      symbols: ['FixtureContract'],
      reason: 'fixture rationale',
    },
  ];

  it('fails an unclassified import from an internal seam', () => {
    expect(
      scanInternalContractImports({
        specifier,
        reportText: internalImportReport,
        classification: [],
      })[0],
    ).toMatch(/unclassified internal contract "FixtureContract"/);
  });

  it('passes a classified contract, and asks nothing of public sibling imports', () => {
    expect(
      scanInternalContractImports({ specifier, reportText: internalImportReport, classification }),
    ).toEqual([]);
  });

  it('fails a classification no import matches', () => {
    expect(
      scanInternalContractImports({ specifier, reportText: '// clean', classification })[0],
    ).toMatch(/stale internal contract classification "FixtureContract"/);
  });

  it('fails a namespace import of an internal seam, which no entry can classify', () => {
    expect(
      scanInternalContractImports({
        specifier,
        reportText: "import * as fixture from 'hell-ui/internal/fixture';",
        classification,
      })[0],
    ).toMatch(/namespace import/);
  });

  it('leaves internal baselines out of scope — they are the guarded seams themselves', () => {
    expect(
      scanInternalContractImports({
        specifier: 'hell-ui/internal/fixture-sibling',
        reportText: internalImportReport,
        classification: [],
      }),
    ).toEqual([]);
  });
});
