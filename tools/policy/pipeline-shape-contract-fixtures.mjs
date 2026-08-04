// Negative fixtures for the pipeline-shape contract (GitLab migration).
//
// Each fixture is one adversarial mutation of a named CI definition that the
// contract must reject; runMutatedTreeFixture replays it against a copy of the
// repository's real GitLab CI definitions. This keeps the contract honest: a
// check that only ever sees the compliant pipeline could silently stop
// catching the shrink it exists to prevent.

import { join } from 'node:path';
import { runMutatedTreeFixture, runNamedFixtures } from '../harness/fixture-harness.mjs';
import { collectPipelineShapeContractErrors } from './pipeline-shape-contracts.mjs';

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
  {
    // Dropping the release include removes the entire publish machinery
    // while every other tag-pipeline job still looks right.
    name: 'a dropped release include removes the publish machinery',
    file: '.gitlab-ci.yml',
    mutate: (text) => text.replace('  - local: .gitlab/ci/release.yml\n', ''),
    needle: 'required job "release:publish"',
  },
  {
    // Removing when: manual turns the last abort point into an ordinary
    // auto-running job — the publish would need no human decision at all.
    name: 'an auto-running approval gate fails instead of publishing unattended',
    file: '.gitlab/ci/release.yml',
    mutate: (text) => text.replace('      when: manual\n', ''),
    needle: 'last abort point',
  },
  {
    // With allow_failure: true an unplayed manual job counts as
    // skipped-success, so the publish behind it would run unattended.
    name: 'an allow_failure approval gate stops blocking and goes red',
    file: '.gitlab/ci/release.yml',
    mutate: (text) => text.replace('  allow_failure: false\n', '  allow_failure: true\n'),
    needle: 'run unattended',
  },
  {
    // A publish job missing one gating needs edge publishes before the
    // pipeline proved that job — the publish-last order is the contract.
    name: 'a publish job missing the browser-tier needs edge',
    file: '.gitlab/ci/release.yml',
    mutate: (text) => text.replace('    - e2e:full\n', ''),
    needle: 'Job "release:publish" must need exactly',
  },
  {
    // A release job whose rule answers another pipeline source is reachable
    // outside a real tag push.
    name: 'a release job leaking outside tag pipelines',
    file: '.gitlab/ci/release.yml',
    mutate: (text) =>
      text.replace(
        'release:gate:\n  extends: .node-job\n  stage: test\n  timeout: 15 minutes\n  rules:\n    - if: $CI_PIPELINE_SOURCE == "push" && $CI_COMMIT_TAG =~ /^v\\d/\n',
        'release:gate:\n  extends: .node-job\n  stage: test\n  timeout: 15 minutes\n  rules:\n    - if: $CI_PIPELINE_SOURCE == "push" && $CI_COMMIT_BRANCH == "main"\n',
      ),
    needle: 'Release job "release:gate"',
  },
  {
    // An interruptible publish can be auto-cancelled mid-upload by a
    // pipeline racing on the same ref.
    name: 'an interruptible publish job can be killed mid-write',
    file: '.gitlab/ci/release.yml',
    mutate: (text) =>
      text.replace(
        '  interruptible: false\n  resource_group: release\n',
        '  resource_group: release\n',
      ),
    needle: 'interruptible: false',
  },
  {
    // Without the shared resource group, two release pipelines interleave
    // their registry writes and release creations.
    name: 'a publish job losing its cross-pipeline serialization',
    file: '.gitlab/ci/release.yml',
    mutate: (text) =>
      text.replace('  interruptible: false\n  resource_group: release\n', '  interruptible: false\n'),
    needle: 'resource_group: release',
  },
  {
    // Dropping the sweep include removes the daily audit while every
    // scheduled pipeline still gets created — an empty sweep pipeline that
    // proves nothing, silently.
    name: 'a dropped sweep include removes the daily audit job',
    file: '.gitlab-ci.yml',
    mutate: (text) => text.replace('  - local: .gitlab/ci/sweep.yml\n', ''),
    needle: 'required job "policy-sweep"',
  },
  {
    // Dropping the PIPELINE_KIND condition from the default placement makes
    // the whole test set instantiate next to the sweep — the cheap daily
    // audit becomes a full test run nobody sized the schedule for.
    name: 'the test set leaking into the policy sweep',
    file: '.gitlab/ci/base.yml',
    mutate: (text) =>
      text.replace(
        '    - if: $CI_PIPELINE_SOURCE == "schedule" && $PIPELINE_KIND == "default"\n',
        '    - if: $CI_PIPELINE_SOURCE == "schedule"\n',
      ),
    needle: 'must not instantiate in scheduled policy-sweep pipelines',
  },
  {
    // A sweep rule answering another pipeline source would gate merge
    // requests on a read token that only protected refs carry.
    name: 'a sweep job leaking into merge-request pipelines',
    file: '.gitlab/ci/sweep.yml',
    mutate: (text) =>
      text.replace(
        '    - if: $CI_PIPELINE_SOURCE == "schedule" && $PIPELINE_KIND == "policy-sweep"\n',
        '    - if: $CI_PIPELINE_SOURCE == "schedule" && $PIPELINE_KIND == "policy-sweep"\n    - if: $CI_PIPELINE_SOURCE == "merge_request_event"\n',
      ),
    needle: 'Job "policy-sweep" must not instantiate in merge-request pipelines',
  },
  {
    // An allow_failure sweep is a daily audit whose red verdict cannot be
    // seen anywhere — the same silent shrink as not running it.
    name: 'an allow_failure sweep stops auditing and goes red',
    file: '.gitlab/ci/sweep.yml',
    mutate: (text) =>
      text.replace(
        'policy-sweep:\n  extends: .node-job\n',
        'policy-sweep:\n  extends: .node-job\n  allow_failure: true\n',
      ),
    needle: 'Job "policy-sweep" must stay gating',
  },
];

export function runPipelineShapeContractFixtures({ root }) {
  return runNamedFixtures(
    fixtures,
    (fixture) =>
      runMutatedTreeFixture({
        root,
        copy: ['.gitlab-ci.yml', join('.gitlab', 'ci')],
        tmpPrefix: 'hell-pipeline-shape-',
        path: fixture.file,
        mutate: fixture.mutate,
        collectErrors: collectPipelineShapeContractErrors,
        needle: fixture.needle,
      }),
    'pipeline-shape fixture',
  );
}
