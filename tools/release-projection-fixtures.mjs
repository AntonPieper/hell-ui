// Fixture-driven policy tests for Release Projection publication (ADR 0003).
//
// Every fixture feeds captured metadata — registry job results, tagged
// artifacts, and GitHub release objects — into the pure policy in
// tools/release-projection.mjs and asserts the explicit pass/fail decision.
// Nothing here talks to GitHub or publishes anything; the release workflow's
// thin jobs consume exactly these functions at publish time.

import {
  chooseProjectionAction,
  classifyPrereleaseVersion,
  evaluateRegistryBarrier,
  normalizeGithubRelease,
  planReleaseProjection,
  verifyReleaseProjection,
} from './release-projection.mjs';

const commit = 'a'.repeat(40);
const otherCommit = 'b'.repeat(40);
const notes = '## [0.3.0] - 2026-07-27\n\n### Fixed\n\n- Fixed toast exit ordering.\n';

const fixtures = [
  { name: 'prerelease classification follows the release-stage policy', run: fixturePrereleaseClassification },
  { name: 'successful required registries open the barrier', run: fixtureBarrierOpensOnSuccess },
  { name: 'a skipped, cancelled, or failed required registry blocks', run: fixtureBarrierBlocksOnRequiredOutcomes },
  { name: 'a disabled optional registry never blocks', run: fixtureBarrierIgnoresDisabledRegistries },
  { name: 'enabling npmjs makes it a blocking required registry', run: fixtureBarrierGatesEnabledNpmjs },
  { name: 'future private registries join the same barrier', run: fixtureBarrierCoversPrivateRegistries },
  { name: 'the barrier rejects malformed or incomplete registry lists', run: fixtureBarrierRejectsMalformedInput },
  { name: 'the plan derives the exact projection from tagged artifacts', run: fixturePlanDerivesProjection },
  { name: 'the plan rejects tag, version, and notes disagreements', run: fixturePlanRejectsDisagreements },
  { name: 'a first run creates and a rerun adopts exactly one release', run: fixtureChoosesCreateOrAdopt },
  { name: 'draft verification accepts an exact draft prerelease', run: fixtureVerifiesExactDraft },
  { name: 'draft verification rejects every metadata mismatch', run: fixtureRejectsMetadataMismatches },
  { name: 'draft verification requires the immutable-releases policy', run: fixtureRequiresImmutabilityPolicy },
  { name: 'a rerun accepts only an exact existing release', run: fixtureRerunRequiresExactRelease },
  { name: 'published verification requires a published immutable release', run: fixtureVerifiesPublishedState },
  { name: 'github api releases normalize into policy metadata', run: fixtureNormalizesGithubReleases },
];

export function runReleaseProjectionFixtures() {
  const failures = [];
  for (const fixture of fixtures) {
    const context = { fail: (message) => failures.push(`release-projection fixture "${fixture.name}": ${message}`) };
    try {
      fixture.run(context);
    } catch (error) {
      context.fail(error instanceof Error ? error.message : String(error));
    }
  }
  return { failures, total: fixtures.length };
}

function registries({ githubPackages = 'success', npmjsRequired = true, npmjs = 'success', extra = [] } = {}) {
  return [
    { name: 'GitHub Packages', required: true, result: githubPackages },
    { name: 'npmjs', required: npmjsRequired, result: npmjs },
    ...extra,
  ];
}

function expectedProjection(overrides = {}) {
  return {
    tagName: 'v0.3.0',
    title: 'v0.3.0',
    commit,
    body: notes,
    prerelease: true,
    ...overrides,
  };
}

function releaseProjection(overrides = {}) {
  return {
    id: 100,
    tagName: 'v0.3.0',
    title: 'v0.3.0',
    body: notes,
    draft: true,
    prerelease: true,
    immutable: false,
    assetNames: [],
    ...overrides,
  };
}

function verify(overrides = {}) {
  return verifyReleaseProjection({
    expected: expectedProjection(),
    release: releaseProjection(),
    tagCommit: commit,
    phase: 'projection',
    immutableReleasesPolicy: { enabled: true },
    ...overrides,
  });
}

function expectPass(context, { failures }, label) {
  for (const failure of failures) context.fail(`${label} unexpectedly failed: ${failure}`);
}

function expectFailure(context, { failures }, needle, label) {
  if (!failures.some((failure) => failure.includes(needle))) {
    context.fail(`${label} must fail mentioning "${needle}"; got: ${failures.join(' | ') || '(pass)'}`);
  }
}

function fixturePrereleaseClassification(context) {
  const cases = [
    ['0.2.1', true],
    ['0.10.0', true],
    ['0.3.0-beta.1', true],
    ['1.0.0-rc.1', true],
    ['2.1.0-next.4', true],
    ['1.0.0', false],
    ['2.3.4', false],
  ];
  for (const [version, prerelease] of cases) {
    if (classifyPrereleaseVersion(version) !== prerelease) {
      context.fail(`${version} must classify as prerelease=${prerelease}.`);
    }
  }
  let threw = false;
  try {
    classifyPrereleaseVersion('not-a-version');
  } catch {
    threw = true;
  }
  if (!threw) context.fail('an invalid version must not classify silently.');
}

function fixtureBarrierOpensOnSuccess(context) {
  expectPass(context, evaluateRegistryBarrier(registries()), 'all required registries succeeded');
  expectPass(
    context,
    evaluateRegistryBarrier(registries({ npmjsRequired: false, npmjs: 'skipped' })),
    'github packages alone succeeded',
  );
}

function fixtureBarrierBlocksOnRequiredOutcomes(context) {
  for (const result of ['skipped', 'cancelled', 'failure']) {
    expectFailure(
      context,
      evaluateRegistryBarrier(registries({ githubPackages: result })),
      `Required Registry GitHub Packages was ${result}`,
      `github packages ${result}`,
    );
  }
}

function fixtureBarrierIgnoresDisabledRegistries(context) {
  for (const result of ['skipped', 'cancelled', 'failure']) {
    expectPass(
      context,
      evaluateRegistryBarrier(registries({ npmjsRequired: false, npmjs: result })),
      `disabled npmjs ${result}`,
    );
  }
  expectPass(
    context,
    evaluateRegistryBarrier(
      registries({ extra: [{ name: 'corp-internal', required: false, result: 'skipped' }] }),
    ),
    'a disabled future private registry',
  );
}

function fixtureBarrierGatesEnabledNpmjs(context) {
  expectPass(context, evaluateRegistryBarrier(registries({ npmjs: 'success' })), 'enabled npmjs success');
  for (const result of ['skipped', 'cancelled', 'failure']) {
    expectFailure(
      context,
      evaluateRegistryBarrier(registries({ npmjs: result })),
      `Required Registry npmjs was ${result}`,
      `enabled npmjs ${result}`,
    );
  }
}

function fixtureBarrierCoversPrivateRegistries(context) {
  const withPrivate = (result) =>
    registries({ extra: [{ name: 'corp-internal', required: true, result }] });
  expectPass(context, evaluateRegistryBarrier(withPrivate('success')), 'a required private registry success');
  expectFailure(
    context,
    evaluateRegistryBarrier(withPrivate('failure')),
    'Required Registry corp-internal was failure',
    'a required private registry failure',
  );
}

function fixtureBarrierRejectsMalformedInput(context) {
  expectFailure(context, evaluateRegistryBarrier([]), 'nonempty JSON array', 'an empty registry list');
  expectFailure(context, evaluateRegistryBarrier('nope'), 'nonempty JSON array', 'a non-array registry list');
  expectFailure(
    context,
    evaluateRegistryBarrier([{ name: 'GitHub Packages', required: 'yes', result: 'success' }]),
    'Malformed registry result entry',
    'a malformed entry',
  );
  expectFailure(
    context,
    evaluateRegistryBarrier([{ name: 'npmjs', required: true, result: 'success' }]),
    'GitHub Packages must always be listed as a Required Registry',
    'a registry list without github packages',
  );
}

function fixturePlanDerivesProjection(context) {
  const plan = planReleaseProjection({
    tagName: 'v0.3.0',
    commit,
    manifestVersion: '0.3.0',
    notesBody: notes,
  });
  expectPass(context, plan, 'planning from agreeing tagged artifacts');
  if (!plan.expected) return;
  const mismatches = Object.entries(expectedProjection()).filter(
    ([key, value]) => plan.expected[key] !== value,
  );
  if (mismatches.length > 0) {
    context.fail(`the plan must derive the exact projection; mismatched ${mismatches.map(([key]) => key).join(', ')}.`);
  }

  const stable = planReleaseProjection({
    tagName: 'v1.2.3',
    commit,
    manifestVersion: '1.2.3',
    notesBody: '## [1.2.3] - 2026-07-27\n\n### Fixed\n\n- Fixed a stable-era bug.\n',
  });
  expectPass(context, stable, 'planning a stable release');
  if (stable.expected?.prerelease !== false) {
    context.fail('a suffix-free version at major >= 1 must plan as a stable release.');
  }
}

function fixturePlanRejectsDisagreements(context) {
  const base = { tagName: 'v0.3.0', commit, manifestVersion: '0.3.0', notesBody: notes };
  expectFailure(
    context,
    planReleaseProjection({ ...base, tagName: 'v0.4.0' }),
    'must match the audited package version',
    'a tag that disagrees with the manifest',
  );
  expectFailure(
    context,
    planReleaseProjection({ ...base, manifestVersion: 'not-a-version' }),
    'must be valid SemVer',
    'an invalid manifest version',
  );
  expectFailure(
    context,
    planReleaseProjection({ ...base, commit: 'HEAD' }),
    'one full commit SHA',
    'a symbolic release commit',
  );
  expectFailure(
    context,
    planReleaseProjection({ ...base, notesBody: null }),
    'must carry the tagged Released Version Notes',
    'missing Released Version Notes',
  );
  expectFailure(
    context,
    planReleaseProjection({ ...base, notesBody: '## [0.2.9] - 2026-07-27\n\n- Wrong record.\n' }),
    'must start with `## [0.3.0] - YYYY-MM-DD`',
    'a notes record for another version',
  );
}

function fixtureChoosesCreateOrAdopt(context) {
  const none = chooseProjectionAction([]);
  expectPass(context, none, 'deciding without an existing release');
  if (none.action !== 'create') context.fail('no existing release must decide create.');

  const one = chooseProjectionAction([{ id: 7, tag_name: 'v0.3.0', draft: true, prerelease: true }]);
  expectPass(context, one, 'deciding with one existing release');
  if (one.action !== 'adopt' || one.release?.id !== 7) {
    context.fail('one existing release must be adopted for exact verification, never recreated.');
  }

  expectFailure(
    context,
    chooseProjectionAction([{ id: 1 }, { id: 2 }]),
    'exactly one release',
    'two releases for one tag',
  );
  expectFailure(context, chooseProjectionAction(null), 'must be a JSON array', 'a malformed existing list');
}

function fixtureVerifiesExactDraft(context) {
  expectPass(context, verify(), 'verifying an exact draft prerelease');
}

function fixtureRejectsMetadataMismatches(context) {
  expectFailure(
    context,
    verify({ release: releaseProjection({ tagName: 'v0.4.0' }) }),
    'The release tag is v0.4.0',
    'a mismatched tag',
  );
  expectFailure(
    context,
    verify({ release: releaseProjection({ title: 'Hell UI 0.3.0' }) }),
    'The release title is',
    'a mismatched title',
  );
  expectFailure(
    context,
    verify({ tagCommit: otherCommit }),
    'not the audited release commit',
    'a tag pointing at another commit',
  );
  expectFailure(
    context,
    verify({ release: releaseProjection({ body: `${notes}\nEdited by hand.\n` }) }),
    'byte-for-byte',
    'an edited body',
  );
  expectFailure(
    context,
    verify({ release: releaseProjection({ prerelease: false }) }),
    'GitHub prerelease until an explicit stable Release Stage Promotion',
    'a 0.x release published as stable',
  );
  expectFailure(
    context,
    verify({ release: releaseProjection({ assetNames: ['hell-ui-0.3.0.tgz'] }) }),
    'no custom assets',
    'an unexpected custom asset',
  );
}

function fixtureRequiresImmutabilityPolicy(context) {
  expectFailure(
    context,
    verify({ immutableReleasesPolicy: { enabled: false } }),
    'immutable-releases policy is disabled',
    'a disabled immutability policy',
  );
  expectFailure(
    context,
    verify({ immutableReleasesPolicy: null }),
    'Could not read',
    'an unreadable immutability policy',
  );
}

function fixtureRerunRequiresExactRelease(context) {
  expectPass(
    context,
    verify({ release: releaseProjection({ draft: false, immutable: true }) }),
    'a rerun over an exact published release',
  );
  const mismatch = verify({
    release: releaseProjection({ draft: false, immutable: true, body: `${notes}\nDrifted.\n` }),
  });
  expectFailure(context, mismatch, 'never edits an existing release', 'a rerun over a drifted release');
}

function fixtureVerifiesPublishedState(context) {
  expectPass(
    context,
    verify({ phase: 'published', release: releaseProjection({ draft: false, immutable: true }) }),
    'verifying the published immutable release',
  );
  expectFailure(
    context,
    verify({ phase: 'published' }),
    'still a draft',
    'a projection left as a draft',
  );
  expectFailure(
    context,
    verify({ phase: 'published', release: releaseProjection({ draft: false, immutable: false }) }),
    'not immutable',
    'a mutable published release',
  );
  expectFailure(context, verify({ phase: 'release' }), 'Unknown verification phase', 'an unknown phase');
}

function fixtureNormalizesGithubReleases(context) {
  const normalized = normalizeGithubRelease({
    id: 42,
    tag_name: 'v0.3.0',
    name: 'v0.3.0',
    body: notes,
    draft: false,
    prerelease: true,
    immutable: true,
    assets: [{ name: 'stray.tgz' }, {}],
  });
  const expected = {
    id: 42,
    tagName: 'v0.3.0',
    title: 'v0.3.0',
    body: notes,
    draft: false,
    prerelease: true,
    immutable: true,
  };
  for (const [key, value] of Object.entries(expected)) {
    if (normalized[key] !== value) context.fail(`normalization must map ${key}; got ${normalized[key]}.`);
  }
  if (normalized.assetNames.join('|') !== 'stray.tgz|(unnamed asset)') {
    context.fail(`normalization must list asset names; got ${normalized.assetNames.join('|')}.`);
  }

  const bare = normalizeGithubRelease({ id: 9, tag_name: 'v0.3.0' });
  if (bare.draft !== false || bare.prerelease !== false || bare.immutable !== false || bare.assetNames.length !== 0) {
    context.fail('normalization must default missing flags to false and assets to none.');
  }
}
