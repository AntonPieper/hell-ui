// Negative fixtures for the static workflow trust contracts (ADR 0003).
//
// Each fixture copies the repository's real workflow definitions into a
// temporary directory, applies one adversarial mutation to the privileged
// metadata workflow, and asserts that the trust contracts reject it. This
// keeps the contracts honest: a check that only ever sees compliant workflows
// could silently stop catching violations.

import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectWorkflowTrustContractErrors } from './workflow-trust-contracts.mjs';

const trustedWorkflowPath = join('.github', 'workflows', 'pr-state.yml');

// `mutate` receives the real pr-state.yml text and must return a changed
// document; `needle` must appear in the resulting contract errors.
const fixtures = [
  {
    // The extraction pattern cannot represent literal braces inside an
    // expression, so this format() call yields zero extracted expressions
    // while GitHub would still evaluate the untrusted title. The opaque-string
    // audit must flag it instead of letting it evade the allowlist.
    name: 'an expression hiding literal braces from the audit fails the contract',
    mutate: (text) =>
      text.replace(
        '- name: Decide the pull-request state',
        '- name: Decide the pull-request state\n' +
          '        env:\n' +
          "          LEAKED: ${{ format('{0}', github.event.number) }}",
      ),
    needle: 'cannot fully extract',
  },
  {
    // Anchor for the same audit: a plainly extractable but non-allowlisted
    // expression is rejected through the allowlist path.
    name: 'a non-allowlisted expression fails the contract',
    mutate: (text) =>
      text.replace(
        '- name: Decide the pull-request state',
        '- name: Decide the pull-request state\n' +
          '        env:\n' +
          '          LEAKED: ${{ github.event.pull_request.user.login }}',
      ),
    needle: 'outside the trusted allowlist',
  },
];

export function runWorkflowTrustContractFixtures({ root }) {
  const failures = [];
  for (const fixture of fixtures) {
    for (const failure of runFixture(root, fixture)) {
      failures.push(`workflow trust-contract fixture "${fixture.name}": ${failure}`);
    }
  }
  return { failures, total: fixtures.length };
}

function runFixture(root, fixture) {
  const dir = mkdtempSync(join(tmpdir(), 'hell-workflow-trust-'));
  try {
    mkdirSync(join(dir, '.github'), { recursive: true });
    cpSync(join(root, '.github', 'workflows'), join(dir, '.github', 'workflows'), {
      recursive: true,
    });

    const original = readFileSync(join(root, trustedWorkflowPath), 'utf8');
    const mutated = fixture.mutate(original);
    if (mutated === original) {
      return ['the mutation did not change the workflow; the fixture no longer tests anything.'];
    }
    writeFileSync(join(dir, trustedWorkflowPath), mutated);

    const errors = collectWorkflowTrustContractErrors({ root: dir });
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
