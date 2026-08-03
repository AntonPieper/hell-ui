// Negative fixtures for the pipeline-shape contract (GitLab migration).
//
// Each fixture copies the repository's real GitLab CI definitions into a
// temporary directory, applies one adversarial mutation, and asserts that the
// contract rejects it. This keeps the contract honest: a check that only ever
// sees the compliant pipeline could silently stop catching the shrink it
// exists to prevent.

import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectPipelineShapeContractErrors } from './pipeline-shape-contracts.mjs';

// `mutate` receives the named file's real text and must return a changed
// document; `needle` must appear in the resulting contract errors.
const fixtures = [
  {
    // The include list is the roster's supply line: dropping one line removes
    // every job the file defines without touching any job definition.
    name: 'a dropped include removes the unit job',
    file: '.gitlab-ci.yml',
    mutate: (text) => text.replace('  - local: .gitlab/ci/unit.yml\n', ''),
    needle: 'required job "unit"',
  },
  {
    // A rename is the quietest removal: the file keeps its size and shape
    // while the merge gate loses its browser tier.
    name: 'a renamed e2e:pr job leaves merge requests without a browser tier',
    file: '.gitlab/ci/e2e.yml',
    mutate: (text) => text.replace('\ne2e:pr:\n', '\ne2e:pr-quarantine:\n'),
    needle: 'required job "e2e:pr"',
  },
  {
    // The shared runner takes tagged jobs only, so an untagged job never
    // schedules — a pipeline that quietly waits instead of testing.
    name: 'a missing docker tag on the shared node template',
    file: '.gitlab/ci/base.yml',
    mutate: (text) => text.replace('  tags:\n    - docker\n', ''),
    needle: 'effective tags',
  },
  {
    // Widening the push rule admits plain branch pushes, breaking the
    // five-source topology's "no pipeline without an MR" guarantee.
    name: 'a widened push rule breaks the five-source topology',
    file: '.gitlab-ci.yml',
    mutate: (text) =>
      text.replace(
        '    - if: $CI_PIPELINE_SOURCE == "push" && $CI_COMMIT_BRANCH == "main"\n',
        '    - if: $CI_PIPELINE_SOURCE == "push"\n',
      ),
    needle: 'five-source topology',
  },
  {
    // Cross-wiring a tier rule makes two tier jobs instantiate in one
    // pipeline (and none in another) — the single-browser-job design breaks.
    name: 'a cross-wired schedule rule selects two tiers at once',
    file: '.gitlab/ci/e2e.yml',
    mutate: (text) =>
      text.replace(
        '- if: $CI_PIPELINE_SOURCE == "schedule" && $PIPELINE_KIND == "default" && $E2E_TIER == "main"',
        '- if: $CI_PIPELINE_SOURCE == "schedule" && $PIPELINE_KIND == "default" && $E2E_TIER == "pr"',
      ),
    needle: 'exactly one E2E tier job',
  },
  {
    // A tier job whose HELL_E2E_TIER variable disagrees with its rules runs
    // the wrong suite while the pipeline looks right from the outside.
    name: 'a tier job selecting a different tier than its name',
    file: '.gitlab/ci/e2e.yml',
    mutate: (text) => text.replace('    HELL_E2E_TIER: pr\n', '    HELL_E2E_TIER: main\n'),
    needle: 'HELL_E2E_TIER',
  },
  {
    // `!=` is deliberately outside the expression subset. The contract must
    // refuse to evaluate it rather than guess at GitLab's semantics.
    name: 'an out-of-subset expression fails instead of being half-interpreted',
    file: '.gitlab/ci/mr-contract.yml',
    mutate: (text) =>
      text.replace(
        '    - if: $CI_PIPELINE_SOURCE == "merge_request_event"\n',
        '    - if: $CI_PIPELINE_SOURCE != "push"\n',
      ),
    needle: 'outside the minimal subset',
  },
  {
    // Sharding a tier job multiplies Playwright workers on the one shared
    // 8-core host; the single-job design is a measured decision.
    name: 'a sharded tier job breaks the one-job-per-tier design',
    file: '.gitlab/ci/e2e.yml',
    mutate: (text) => text.replace('\ne2e:pr:\n  extends: .e2e-tier\n', '\ne2e:pr:\n  extends: .e2e-tier\n  parallel: 4\n'),
    needle: 'unsharded',
  },
  {
    // A rule reading a variable the evaluator has no runtime semantics for
    // (job-level scoping, instance settings) must fail, not evaluate as
    // unset-and-hope.
    name: 'a rule reading an unknown variable fails instead of guessing its scope',
    file: '.gitlab/ci/e2e.yml',
    mutate: (text) =>
      text.replace(
        '- if: ($CI_PIPELINE_SOURCE == "web" || $CI_PIPELINE_SOURCE == "api") && $E2E_TIER == "pr"',
        '- if: ($CI_PIPELINE_SOURCE == "web" || $CI_PIPELINE_SOURCE == "api") && $E2E_TIER_OVERRIDE == "pr"',
      ),
    needle: 'reads $E2E_TIER_OVERRIDE',
  },
  {
    // when: manual would leave the job instantiated but never running
    // unattended — a required gate that quietly waits. Outside the subset
    // until a contract decision admits it.
    name: 'a required job flipped to manual fails instead of counting as present',
    file: '.gitlab/ci/unit.yml',
    mutate: (text) =>
      text.replace(
        'unit:\n  extends: .node-job\n  stage: test\n',
        'unit:\n  extends: .node-job\n  stage: test\n  rules:\n    - if: $CI_PIPELINE_SOURCE == "merge_request_event"\n      when: manual\n',
      ),
    needle: 'when: "manual"',
  },
  {
    // A required job that cannot fail the pipeline is the same silent
    // shrink as a missing one.
    name: 'a required job with allow_failure stops gating and goes red',
    file: '.gitlab/ci/unit.yml',
    mutate: (text) =>
      text.replace(
        'unit:\n  extends: .node-job\n  stage: test\n',
        'unit:\n  extends: .node-job\n  stage: test\n  allow_failure: true\n',
      ),
    needle: 'must stay gating',
  },
];

export function runPipelineShapeContractFixtures({ root }) {
  const failures = [];
  for (const fixture of fixtures) {
    for (const failure of runFixture(root, fixture)) {
      failures.push(`pipeline-shape fixture "${fixture.name}": ${failure}`);
    }
  }
  return { failures, total: fixtures.length };
}

function runFixture(root, fixture) {
  const dir = mkdtempSync(join(tmpdir(), 'hell-pipeline-shape-'));
  try {
    mkdirSync(join(dir, '.gitlab'), { recursive: true });
    cpSync(join(root, '.gitlab-ci.yml'), join(dir, '.gitlab-ci.yml'));
    cpSync(join(root, '.gitlab', 'ci'), join(dir, '.gitlab', 'ci'), { recursive: true });

    const original = readFileSync(join(root, fixture.file), 'utf8');
    const mutated = fixture.mutate(original);
    if (mutated === original) {
      return ['the mutation did not change the file; the fixture no longer tests anything.'];
    }
    writeFileSync(join(dir, fixture.file), mutated);

    const errors = collectPipelineShapeContractErrors({ root: dir });
    if (!errors.some((error) => error.includes(fixture.needle))) {
      return [
        `expected a contract error mentioning "${fixture.needle}"; got: ` +
          `${errors.join(' | ') || '(no errors)'}`,
      ];
    }
    return [];
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
}
