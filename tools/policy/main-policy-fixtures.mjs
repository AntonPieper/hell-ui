// Fixture-driven tests for the protected-`main` policy seam.
//
// Every fixture is a captured pair: the checked-in policy document and the
// four REST payloads the API returns for it (project settings, protected
// branches, protected tags, labels). The runner asserts what the seam reports
// — a clean parity, or the exact drift — and, for the drift fixtures, that the
// restoration plan derived from the same comparison writes the policy back.
// Nothing here talks to a server.

import {
  collectExpectationFailures,
  jsonEquals,
  mergeFixtureResults,
  runNamedFixtures,
} from '../harness/fixture-harness.mjs';
import {
  mainPolicyRestorePlan,
  readMainPolicy,
  recordedProjectSettings,
  verifyMainPolicy,
} from './main-policy.mjs';

const policyDocument = () => ({
  posture: 'window',
  project: {
    merge_method: 'ff',
    squash_option: 'always',
    squash_commit_template: '%{title} (%{reference})',
    only_allow_merge_if_pipeline_succeeds: true,
    allow_merge_on_skipped_pipeline: false,
    only_allow_merge_if_all_discussions_are_resolved: true,
    ci_allow_fork_pipelines_to_run_in_parent_project: false,
    ci_pipeline_variables_minimum_override_role: 'developer',
  },
  protected_branches: [
    {
      name: 'main',
      push_access_levels: ['maintainer'],
      merge_access_levels: ['maintainer'],
      allow_force_push: false,
    },
  ],
  protected_tags: [{ name: 'v*', create_access_levels: ['maintainer'] }],
  labels: [
    { name: 'no-consumer-change', color: '#c5def5', description: 'No Consumer Change assertion' },
    { name: 'release-preparation', color: '#5319e7', description: 'Release Preparation candidate' },
  ],
});

// The live payloads carry far more keys than the policy records; the extras
// are here so the fixtures prove the seam compares the recorded subset and
// ignores the rest.
const liveProject = () => ({
  id: 1,
  default_branch: 'main',
  merge_method: 'ff',
  squash_option: 'always',
  squash_commit_template: '%{title} (%{reference})',
  merge_commit_template: null,
  only_allow_merge_if_pipeline_succeeds: true,
  allow_merge_on_skipped_pipeline: false,
  only_allow_merge_if_all_discussions_are_resolved: true,
  ci_allow_fork_pipelines_to_run_in_parent_project: false,
  ci_pipeline_variables_minimum_override_role: 'developer',
  remove_source_branch_after_merge: true,
});

const level = (access_level, access_level_description) => ({
  id: 19,
  access_level,
  access_level_description,
  deploy_key_id: null,
});

const liveProtectedBranches = () => [
  {
    id: 19,
    name: 'main',
    push_access_levels: [level(40, 'Maintainers')],
    merge_access_levels: [level(40, 'Maintainers')],
    allow_force_push: false,
  },
];

const liveProtectedTags = () => [
  { id: 2, name: 'v*', create_access_levels: [level(40, 'Maintainers')] },
];

const liveLabels = () => [
  {
    id: 11,
    name: 'no-consumer-change',
    color: '#c5def5',
    description: 'No Consumer Change assertion',
  },
  {
    id: 12,
    name: 'release-preparation',
    color: '#5319e7',
    description: 'Release Preparation candidate',
  },
  { id: 13, name: 'wayfinder:map', color: '#8E44AD', description: 'Unrelated tracker label' },
];

const live = (overrides = {}) => ({
  project: liveProject(),
  protectedBranches: liveProtectedBranches(),
  protectedTags: liveProtectedTags(),
  labels: liveLabels(),
  ...overrides,
});

const withProject = (overrides) => live({ project: { ...liveProject(), ...overrides } });

// `expect` is `{ failures: [] }` for a clean surface, or
// `{ failures: [substring, ...] }` where every substring must appear in the
// reported failures. `restores` lists the `METHOD path` request lines the
// restoration plan must contain, in order; `manual` lists substrings of the
// drift it reports but refuses to repair.
const readFixtures = [
  {
    name: 'the window-posture document is self-consistent',
    document: policyDocument(),
    expect: { errors: [] },
  },
  {
    name: 'the end-state posture demands the no-one push level',
    document: {
      ...policyDocument(),
      posture: 'end-state',
      protected_branches: [
        {
          name: 'main',
          push_access_levels: ['no-one'],
          merge_access_levels: ['maintainer'],
          allow_force_push: false,
        },
      ],
    },
    expect: { errors: [] },
  },
  {
    name: 'window posture with the cutover push level is rejected before it reaches the API',
    document: {
      ...policyDocument(),
      protected_branches: [
        {
          name: 'main',
          push_access_levels: ['no-one'],
          merge_access_levels: ['maintainer'],
          allow_force_push: false,
        },
      ],
    },
    expect: { errors: ['posture "window"', 'push_access_levels'] },
  },
  {
    name: 'an unknown posture is rejected',
    document: { ...policyDocument(), posture: 'transitional' },
    expect: { errors: ['posture'] },
  },
  {
    name: 'a dropped project setting cannot silently stop being checked',
    document: (() => {
      const document = policyDocument();
      delete document.project.only_allow_merge_if_pipeline_succeeds;
      return document;
    })(),
    expect: { errors: ['only_allow_merge_if_pipeline_succeeds'] },
  },
  {
    name: 'an enforcement-looking field at the root cannot sit in the file unenforced',
    document: { ...policyDocument(), required_approvals: 2 },
    expect: { errors: ['required_approvals', 'nothing compares'] },
  },
  {
    name: 'an unrecorded project setting is rejected rather than compared blindly',
    document: (() => {
      const document = policyDocument();
      document.project.printing_merge_request_link_enabled = true;
      return document;
    })(),
    expect: { errors: ['printing_merge_request_link_enabled'] },
  },
  {
    name: 'an unknown access-level name is rejected',
    document: {
      ...policyDocument(),
      protected_tags: [{ name: 'v*', create_access_levels: ['releaser'] }],
    },
    expect: { errors: ['releaser'] },
  },
  {
    name: 'a level the protected-tags endpoint cannot accept is rejected',
    document: {
      ...policyDocument(),
      protected_tags: [{ name: 'v*', create_access_levels: ['owner'] }],
    },
    expect: { errors: ['owner'] },
  },
  {
    name: 'a project setting outside the values the platform accepts is rejected',
    document: (() => {
      const document = policyDocument();
      document.project.merge_method = 'banana';
      return document;
    })(),
    expect: { errors: ['merge_method', 'banana'] },
  },
  {
    name: 'a nulled boolean setting is rejected rather than compared as a value',
    document: (() => {
      const document = policyDocument();
      document.project.only_allow_merge_if_pipeline_succeeds = null;
      return document;
    })(),
    expect: { errors: ['only_allow_merge_if_pipeline_succeeds', 'true or false'] },
  },
  {
    name: 'an enforcement-looking field on a rule cannot sit in the file unenforced',
    document: {
      ...policyDocument(),
      protected_branches: [
        {
          name: 'main',
          push_access_levels: ['maintainer'],
          merge_access_levels: ['maintainer'],
          allow_force_push: false,
          unprotect_access_levels: ['maintainer'],
        },
      ],
    },
    expect: { errors: ['unprotect_access_levels', 'nothing compares'] },
  },
  {
    name: 'an unenforced field on a label is rejected too',
    document: {
      ...policyDocument(),
      labels: [
        {
          name: 'no-consumer-change',
          color: '#c5def5',
          description: 'No Consumer Change assertion',
          archived: false,
        },
        {
          name: 'release-preparation',
          color: '#5319e7',
          description: 'Release Preparation candidate',
        },
      ],
    },
    expect: { errors: ['archived', 'nothing compares'] },
  },
  {
    name: 'dropping the main branch rule is rejected',
    document: { ...policyDocument(), protected_branches: [] },
    expect: { errors: ['main'] },
  },
  {
    name: 'dropping the v* tag rule is rejected',
    document: { ...policyDocument(), protected_tags: [] },
    expect: { errors: ['v*'] },
  },
  {
    name: 'a force-push-allowing main rule is rejected',
    document: {
      ...policyDocument(),
      protected_branches: [
        {
          name: 'main',
          push_access_levels: ['maintainer'],
          merge_access_levels: ['maintainer'],
          allow_force_push: true,
        },
      ],
    },
    expect: { errors: ['allow_force_push'] },
  },
  {
    name: 'a blank label description is rejected',
    document: {
      ...policyDocument(),
      labels: [
        { name: 'no-consumer-change', color: '#c5def5', description: '  ' },
        {
          name: 'release-preparation',
          color: '#5319e7',
          description: 'Release Preparation candidate',
        },
      ],
    },
    expect: { errors: ['no-consumer-change', 'description'] },
  },
  {
    name: 'both state labels must be recorded',
    document: {
      ...policyDocument(),
      labels: [
        { name: 'no-consumer-change', color: '#c5def5', description: 'No Consumer Change' },
      ],
    },
    expect: { errors: ['release-preparation'] },
  },
  {
    name: 'a duplicate protected-branch rule is rejected',
    document: {
      ...policyDocument(),
      protected_branches: [
        {
          name: 'main',
          push_access_levels: ['maintainer'],
          merge_access_levels: ['maintainer'],
          allow_force_push: false,
        },
        {
          name: 'main',
          push_access_levels: ['developer'],
          merge_access_levels: ['maintainer'],
          allow_force_push: false,
        },
      ],
    },
    expect: { errors: ['main', 'more than once'] },
  },
];

const verifyFixtures = [
  {
    name: 'the bootstrapped project matches the window-posture policy',
    live: live(),
    expect: { failures: [] },
  },
  // Every recorded project setting runs through the same value comparison and
  // the same PUT restore, whichever setting it is, so these two stand in for
  // the recorded list.
  {
    name: 'a relaxed merge method is drift, and restoration writes it back',
    live: withProject({ merge_method: 'merge' }),
    expect: { failures: ['merge_method', '"merge"', '"ff"'] },
    restores: ['PUT projects/7'],
  },
  {
    name: 'dropping the pipeline-succeeds gate is drift',
    live: withProject({ only_allow_merge_if_pipeline_succeeds: false }),
    expect: { failures: ['only_allow_merge_if_pipeline_succeeds'] },
    restores: ['PUT projects/7'],
  },
  {
    name: 'a deleted protected-branch rule is drift, and restoration recreates it',
    live: live({ protectedBranches: [] }),
    expect: { failures: ['main', 'no protected-branch rule'] },
    restores: ['POST projects/7/protected_branches'],
  },
  {
    name: 'a widened push level is drift, and restoration replaces the rule',
    live: live({
      protectedBranches: [
        {
          ...liveProtectedBranches()[0],
          push_access_levels: [level(30, 'Developers + Maintainers')],
        },
      ],
    }),
    expect: { failures: ['push_access_levels', 'developer', 'maintainer'] },
    restores: ['DELETE projects/7/protected_branches/main', 'POST projects/7/protected_branches'],
  },
  {
    name: 'an added user exception on the merge level is drift',
    live: live({
      protectedBranches: [
        {
          ...liveProtectedBranches()[0],
          merge_access_levels: [
            level(40, 'Maintainers'),
            { id: 20, access_level: 30, user_id: 7, deploy_key_id: null },
          ],
        },
      ],
    }),
    expect: { failures: ['merge_access_levels', 'user:7'] },
    restores: ['DELETE projects/7/protected_branches/main', 'POST projects/7/protected_branches'],
  },
  {
    name: 'force push turned on is repaired in place — main is never left unprotected',
    live: live({
      protectedBranches: [{ ...liveProtectedBranches()[0], allow_force_push: true }],
    }),
    expect: { failures: ['allow_force_push'] },
    restores: ['PATCH projects/7/protected_branches/main'],
  },
  {
    name: 'force push plus an access-level change still needs the replacement',
    live: live({
      protectedBranches: [
        {
          ...liveProtectedBranches()[0],
          push_access_levels: [level(30, 'Developers + Maintainers')],
          allow_force_push: true,
        },
      ],
    }),
    expect: { failures: ['allow_force_push', 'push_access_levels'] },
    restores: ['DELETE projects/7/protected_branches/main', 'POST projects/7/protected_branches'],
  },
  {
    name: 'an access-level surface the policy does not record reads as drift',
    live: live({
      protectedBranches: [
        { ...liveProtectedBranches()[0], unprotect_access_levels: [level(30, 'Developers')] },
      ],
    }),
    expect: { failures: ['unprotect_access_levels', 'cannot vouch for'] },
    restores: ['DELETE projects/7/protected_branches/main', 'POST projects/7/protected_branches'],
  },
  {
    name: 'an archived state label cannot carry the assertion, so it is drift',
    live: live({
      labels: liveLabels().map((label) =>
        label.name === 'release-preparation' ? { ...label, archived: true } : label,
      ),
    }),
    expect: { failures: ['release-preparation', 'archived'] },
    restores: ['PUT projects/7/labels/release-preparation'],
  },
  {
    name: 'an unrecorded protected-branch rule is drift, but restoration refuses to delete it',
    live: live({
      protectedBranches: [
        ...liveProtectedBranches(),
        {
          id: 21,
          name: 'release/*',
          push_access_levels: [level(30, 'Developers + Maintainers')],
          merge_access_levels: [level(30, 'Developers + Maintainers')],
          allow_force_push: false,
        },
      ],
    }),
    expect: { failures: ['release/*', 'not recorded'] },
    restores: [],
    manual: ['release/*'],
  },
  {
    name: 'an unrecorded rule is left alone even while other surfaces are repaired',
    live: {
      ...withProject({ merge_method: 'merge' }),
      protectedTags: [
        ...liveProtectedTags(),
        { id: 22, name: 'archive/*', create_access_levels: [level(30, 'Developers')] },
      ],
    },
    expect: { failures: ['merge_method', 'archive/*'] },
    restores: ['PUT projects/7'],
    manual: ['archive/*'],
  },
  {
    name: 'a second rule under a recorded name never hides behind the first',
    live: live({
      protectedBranches: [
        ...liveProtectedBranches(),
        {
          id: 20,
          name: 'main',
          push_access_levels: [level(30, 'Developers + Maintainers')],
          merge_access_levels: [level(30, 'Developers + Maintainers')],
          allow_force_push: true,
        },
      ],
    }),
    expect: { failures: ['main', 'ambiguous', '2 rules'] },
    restores: [],
    manual: ['main'],
  },
  {
    name: 'a deleted v* tag rule is drift — CE deletes it silently, so this is the audit trail',
    live: live({ protectedTags: [] }),
    expect: { failures: ['v*', 'no protected-tag rule'] },
    restores: ['POST projects/7/protected_tags'],
  },
  {
    name: 'a lowered tag create level is drift',
    live: live({
      protectedTags: [{ ...liveProtectedTags()[0], create_access_levels: [level(30, 'Developers')] }],
    }),
    expect: { failures: ['create_access_levels', 'developer'] },
    restores: ['DELETE projects/7/protected_tags/v*', 'POST projects/7/protected_tags'],
  },
  {
    name: 'a missing state label is drift, and restoration creates it',
    live: live({ labels: liveLabels().filter((label) => label.name !== 'release-preparation') }),
    expect: { failures: ['release-preparation', 'missing'] },
    restores: ['POST projects/7/labels'],
  },
  {
    name: 'a rewritten label description is drift, and restoration updates in place',
    live: live({
      labels: liveLabels().map((label) =>
        label.name === 'no-consumer-change' ? { ...label, description: 'whatever' } : label,
      ),
    }),
    expect: { failures: ['no-consumer-change', 'description'] },
    restores: ['PUT projects/7/labels/no-consumer-change'],
  },
  {
    name: 'an inherited group label does not stand in for the project label',
    live: live({
      labels: liveLabels().map((label) =>
        label.name === 'no-consumer-change' ? { ...label, is_project_label: false } : label,
      ),
    }),
    expect: { failures: ['no-consumer-change', 'group label'] },
    restores: ['PUT projects/7/labels/no-consumer-change'],
  },
  {
    name: 'a recoloured label is drift',
    live: live({
      labels: liveLabels().map((label) =>
        label.name === 'release-preparation' ? { ...label, color: '#ff0000' } : label,
      ),
    }),
    expect: { failures: ['release-preparation', 'color'] },
    restores: ['PUT projects/7/labels/release-preparation'],
  },
  {
    name: 'labels outside the policy are left alone',
    live: live({
      labels: [...liveLabels(), { id: 99, name: 'needs-triage', color: '#ededed', description: 'x' }],
    }),
    expect: { failures: [] },
  },
  {
    name: 'several surfaces drifting at once report and restore every one',
    live: {
      ...withProject({ merge_method: 'merge' }),
      protectedTags: [],
      labels: liveLabels().filter((label) => label.name !== 'no-consumer-change'),
    },
    expect: { failures: ['merge_method', 'v*', 'no-consumer-change'] },
    restores: [
      'PUT projects/7',
      'POST projects/7/protected_tags',
      'POST projects/7/labels',
    ],
  },
];

export function runMainPolicyFixtures() {
  return mergeFixtureResults(
    runNamedFixtures(readFixtures, runReadFixture, 'main-policy document fixture'),
    runNamedFixtures(verifyFixtures, runVerifyFixture, 'main-policy parity fixture'),
  );
}

// This suite writes its own dialect rather than taking the harness default:
// the seam reports rejections as "errors" when it reads the document and as
// "failures" when it compares against a live project, and each fixture names
// the surface it is about, so the noun follows.
const policyDialect = (what) => ({
  pass: (reported) => `expected no ${what}s; got: ${reported.join(' | ')}`,
  none: (expected) => `expected ${what}s mentioning ${expected.join(', ')}; got none.`,
  missing: (needle, reported) =>
    `expected a ${what} mentioning "${needle}"; got: ${reported.join(' | ')}`,
  extra: (reported) => `reported an unexpected ${what}: ${reported}`,
});

const documentDialect = policyDialect('error');
const parityDialect = policyDialect('failure');

function runReadFixture(fixture) {
  const { policy, errors } = readMainPolicy(JSON.stringify(fixture.document));
  const failures = collectExpectationFailures(errors, fixture.expect.errors, documentDialect);
  if (fixture.expect.errors.length === 0 && policy === null) {
    failures.push('expected a parsed policy; got null.');
  }
  if (fixture.expect.errors.length > 0 && policy !== null) {
    failures.push('expected a rejected document; got a parsed policy.');
  }
  return failures;
}

function runVerifyFixture(fixture) {
  const { policy, errors } = readMainPolicy(JSON.stringify(policyDocument()));
  if (errors.length > 0) {
    return [`the fixture policy document must be valid; got: ${errors.join(' | ')}`];
  }

  const { failures: reported, evidence } = verifyMainPolicy({ policy, live: fixture.live });
  const failures = collectExpectationFailures(reported, fixture.expect.failures, parityDialect);

  // A green run's evidence has to name the value it actually compared.
  // Evidence that summarises from memory is how a check comes to assert a
  // posture nobody enforces any more, while still printing "ok".
  if (fixture.expect.failures.length === 0) {
    for (const key of recordedProjectSettings) {
      const claim = `${key} is ${JSON.stringify(policy.project[key])}`;
      if (!evidence.some((line) => line.includes(claim))) {
        failures.push(`expected the evidence to state "${claim}"; got: ${evidence.join(' | ')}`);
      }
    }
  }

  const plan = mainPolicyRestorePlan({
    policy,
    live: fixture.live,
    projectPath: 'projects/7',
  });
  const lines = plan.requests.map((request) => `${request.method} ${request.path}`);
  const expectedRestores = fixture.restores ?? [];
  if (!jsonEquals(lines, expectedRestores)) {
    failures.push(
      `expected the restoration plan to be [${expectedRestores.join(', ')}]; got [${lines.join(', ')}].`,
    );
  }

  const expectedManual = fixture.manual ?? [];
  if (plan.manual.length !== expectedManual.length) {
    failures.push(
      `expected ${expectedManual.length} drifts left for a human; got ${plan.manual.length}: ` +
        `${plan.manual.join(' | ')}`,
    );
  }
  for (const needle of expectedManual) {
    if (!plan.manual.some((entry) => entry.includes(needle))) {
      failures.push(`expected a left-alone drift mentioning "${needle}"; got: ${plan.manual.join(' | ')}`);
    }
  }
  return failures;
}
