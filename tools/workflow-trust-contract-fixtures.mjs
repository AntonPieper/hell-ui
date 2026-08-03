// Negative fixtures for the static workflow trust contracts (ADR 0003).
//
// Each fixture copies the repository's real workflow definitions into a
// temporary directory, applies one adversarial mutation to the privileged
// metadata workflow, and asserts that the trust contracts reject it. This
// keeps the contracts honest: a check that only ever sees compliant workflows
// could silently stop catching violations.

import { join } from 'node:path';
import { runMutatedTreeFixture, runNamedFixtures } from './fixture-harness.mjs';
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
  return runNamedFixtures(
    fixtures,
    (fixture) =>
      runMutatedTreeFixture({
        root,
        copy: [join('.github', 'workflows')],
        tmpPrefix: 'hell-workflow-trust-',
        path: trustedWorkflowPath,
        mutate: fixture.mutate,
        collectErrors: collectWorkflowTrustContractErrors,
        needle: fixture.needle,
        subject: 'workflow',
      }),
    'workflow trust-contract fixture',
  );
}
