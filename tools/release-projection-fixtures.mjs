// Fixture-driven policy tests for Release Projection publication (ADR 0003).
//
// Every fixture feeds captured metadata — registry job results, tagged
// artifacts, and GitHub release objects — into the pure policy in
// tools/release-projection.mjs and asserts the explicit pass/fail decision.
// Nothing here talks to GitHub or publishes anything; the release workflow's
// thin jobs consume exactly these functions at publish time.
//
// The post-publication half is proven the same way: drift fixtures feed
// captured live releases back through the same projection the draft is built
// from, so exact releases stay clean while body drift, metadata drift,
// unexpected assets, missing tagged notes, and repair-shaped options fail
// with visible evidence — and the immutability policy gate refuses anything
// but affirmative evidence.

import {
  chooseProjectionAction,
  classifyPrereleaseVersion,
  evaluateImmutabilityPolicy,
  evaluateRegistryBarrier,
  normalizeGithubRelease,
  planReleaseProjection,
  releaseTagVersion,
  verifyReleaseDrift,
  verifyReleaseProjection,
} from './release-projection.mjs';

const commit = 'a'.repeat(40);
const otherCommit = 'b'.repeat(40);
// One Released Version Notes record shape for every fixture, so the drafting
// and drift halves are proven against the same bytes.
const record = (version) => `## [${version}] - 2026-07-27\n\n### Fixed\n\n- Fixed toast exit ordering.\n`;
const notes = record('0.3.0');

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
  { name: 'an exact published release reports no projection drift', run: fixtureExactReleaseHasNoDrift },
  { name: 'drift detection reuses the drafted projection byte-for-byte', run: fixtureDriftSharesTheProjection },
  { name: 'body drift fails with first-difference evidence', run: fixtureBodyDrift },
  { name: 'release metadata drift fails visibly', run: fixtureMetadataDrift },
  { name: 'a release retargeted at another commit drifts', run: fixtureTargetDrift },
  { name: 'unexpected custom assets fail the drift check', run: fixtureUnexpectedAssets },
  { name: 'a missing or unprojectable tagged record fails the drift check', run: fixtureMissingTaggedRecord },
  { name: 'automatic repair requests are rejected', run: fixtureRepairRequestsRejected },
  { name: 'a published release outside the immutable policy drifts', run: fixtureDriftRequiresImmutability },
  { name: 'the publication gate refuses anything but an enabled policy', run: fixtureImmutabilityPolicyGate },
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

// ---------------------------------------------------------------------------
// Post-publication drift. The release objects below are captured GitHub REST
// payloads, as the API returns them for a release the publication path
// created; the tagged record is the exact `.changes/<version>.md` bytes at
// the release tag.
// ---------------------------------------------------------------------------

function publishedRelease(version, overrides = {}) {
  return {
    id: 200,
    tag_name: `v${version}`,
    name: `v${version}`,
    // The draft job posts the tagged commit SHA and GitHub returns what it
    // was sent, so a projection this repository created names that commit.
    target_commitish: commit,
    body: record(version),
    draft: false,
    prerelease: classifyPrereleaseVersion(version),
    immutable: true,
    assets: [],
    ...overrides,
  };
}

function drift(release, options = {}) {
  const version = releaseTagVersion(release.tag_name);
  return verifyReleaseDrift({
    release,
    taggedRecord: version === null ? null : record(version),
    recordCommit: commit,
    tagCommit: commit,
    ...options,
  });
}

function fixtureExactReleaseHasNoDrift(context) {
  expectPass(context, drift(publishedRelease('0.3.0')), 'an exact 0.3.0 release');
  expectPass(context, drift(publishedRelease('0.3.0-beta.1')), 'an exact 0.3.0-beta.1 release');
  expectPass(context, drift(publishedRelease('1.2.0')), 'an exact stable 1.2.0 release');
}

// Draft creation and drift detection must never be two implementations that
// happen to agree: the drift check verifies against the very projection the
// draft job plans from the same tagged bytes.
function fixtureDriftSharesTheProjection(context) {
  const { expected } = planReleaseProjection({
    tagName: 'v0.3.0',
    commit,
    manifestVersion: '0.3.0',
    notesBody: record('0.3.0'),
  });
  if (expected === null) {
    context.fail('the drafted projection must plan from the tagged record.');
    return;
  }
  if (expected.body !== record('0.3.0')) {
    context.fail('the projection body must be the tagged record bytes exactly.');
  }
  expectPass(
    context,
    drift(publishedRelease('0.3.0', { body: expected.body, name: expected.title })),
    'a release carrying exactly the drafted projection',
  );
  expectFailure(
    context,
    drift(publishedRelease('0.3.0', { body: expected.body.replace(/\n$/, '') })),
    'byte-for-byte',
    'a release whose body lost the tagged trailing newline',
  );
  expectFailure(
    context,
    drift(publishedRelease('0.3.0'), { tagCommit: otherCommit }),
    'not the audited release commit',
    'a tag that no longer resolves to the commit the record was read from',
  );
}

function fixtureBodyDrift(context) {
  const edited = drift(
    publishedRelease('0.3.0', {
      body: '## [0.3.0] - 2026-07-27\n\n### Fixed\n\n- Fixed toast exit ordering, honest!\n',
    }),
  );
  expectFailure(context, edited, 'byte-for-byte', 'an edited body');
  expectFailure(context, edited, 'first difference at line 5', 'an edited body');

  // A web-UI edit that "restores" the text with CRLF line endings is still
  // drift; exact restoration means exact tagged bytes.
  expectFailure(
    context,
    drift(publishedRelease('0.3.0', { body: record('0.3.0').replaceAll('\n', '\r\n') })),
    'byte-for-byte',
    'a CRLF-normalized body',
  );
  expectFailure(context, drift(publishedRelease('0.3.0', { body: null })), 'byte-for-byte', 'an emptied body');
}

function fixtureMetadataDrift(context) {
  expectFailure(
    context,
    drift(publishedRelease('0.3.0', { name: 'Hell UI 0.3.0 (big one)' })),
    'The release title is',
    'a retitled release',
  );
  expectFailure(
    context,
    drift(publishedRelease('0.3.0', { draft: true })),
    'still a draft',
    'a release turned back into a draft',
  );
  expectFailure(
    context,
    drift(publishedRelease('0.3.0', { prerelease: false })),
    'GitHub prerelease until an explicit stable Release Stage Promotion',
    'a 0.x release reclassified as stable',
  );
  expectFailure(
    context,
    drift(publishedRelease('1.2.0', { prerelease: true })),
    'must be a stable release',
    'a stable release reclassified as a prerelease',
  );
}

// The release's stored target is the one field that exists only on a live
// release, so it is the one comparison drift adds on top of the published
// verification. A concrete commit that disagrees with the tagged record's
// commit is drift; a branch-name target — what releases created outside this
// path carry — is tolerated so they do not report drift forever.
function fixtureTargetDrift(context) {
  expectFailure(
    context,
    drift(publishedRelease('0.3.0', { target_commitish: otherCommit })),
    'Release target drifted',
    'a release retargeted at another commit',
  );
  expectFailure(
    context,
    drift(publishedRelease('0.3.0', { target_commitish: otherCommit.toUpperCase() })),
    'Release target drifted',
    'a release retargeted at another commit in upper case',
  );
  for (const tolerated of ['main', 'attacker-branch', undefined, null, 12345]) {
    expectPass(
      context,
      drift(publishedRelease('0.3.0', { target_commitish: tolerated })),
      `a release targeting ${JSON.stringify(tolerated ?? null)}`,
    );
  }
  expectPass(
    context,
    drift(publishedRelease('0.3.0', { target_commitish: commit.toUpperCase() })),
    'a release targeting the tagged commit in upper case',
  );
}

function fixtureUnexpectedAssets(context) {
  const errors = drift(
    publishedRelease('0.3.0', { assets: [{ name: 'hell-ui-0.3.0.tgz' }, { name: 'checksums.txt' }] }),
  );
  expectFailure(context, errors, 'no custom assets', 'a release with custom assets');
  expectFailure(context, errors, 'hell-ui-0.3.0.tgz', 'a release with custom assets');
}

function fixtureMissingTaggedRecord(context) {
  const missing = verifyReleaseDrift({
    release: publishedRelease('0.3.0'),
    taggedRecord: null,
    recordCommit: commit,
    tagCommit: commit,
  });
  expectFailure(context, missing, 'carries no Released Version Notes record', 'a tag without a record');
  expectFailure(context, missing, '.changes/0.3.0.md', 'a tag without a record');

  // The tag is validated before it can name a record path, so a tag outside
  // the v<SemVer> shape never reaches the filesystem.
  for (const tagName of ['release-0.3.0', 'v0.3', 'v../../etc/passwd', null]) {
    expectFailure(
      context,
      drift(publishedRelease('0.3.0', { tag_name: tagName })),
      'not a v-prefixed SemVer release tag',
      `a ${JSON.stringify(tagName)} release tag`,
    );
    if (releaseTagVersion(tagName) !== null) {
      context.fail(`${JSON.stringify(tagName)} must not resolve to a Released Version Notes path.`);
    }
  }
  if (releaseTagVersion('v0.3.0') !== '0.3.0') {
    context.fail('a v-prefixed SemVer tag must resolve to its version.');
  }
}

function fixtureRepairRequestsRejected(context) {
  const repair = drift(publishedRelease('0.3.0'), { repair: true });
  expectFailure(context, repair, 'Unsupported release drift option', 'a repair request');
  expectFailure(context, repair, 'never repairs, edits, or republishes', 'a repair request');

  const autoFix = drift(publishedRelease('0.3.0', { body: 'drifted' }), { autoRepair: 'restore-from-tag' });
  expectFailure(context, autoFix, 'Unsupported release drift option', 'an auto-repair request');
}

function fixtureDriftRequiresImmutability(context) {
  expectFailure(
    context,
    drift(publishedRelease('0.3.0', { immutable: false })),
    'not immutable',
    'a mutable published release',
  );

  const unreported = publishedRelease('0.3.0');
  delete unreported.immutable;
  expectFailure(context, drift(unreported), 'not immutable', 'a release without immutability evidence');
}

// The gate that runs before any registry publishes reads the same decision
// draft verification does, so publication and verification cannot disagree
// about what an enabled policy looks like.
function fixtureImmutabilityPolicyGate(context) {
  expectPass(context, evaluateImmutabilityPolicy({ enabled: true, enforced_by_owner: false }), 'an enabled policy');
  expectFailure(context, evaluateImmutabilityPolicy({ enabled: false }), 'is disabled', 'a disabled policy');
  expectFailure(context, evaluateImmutabilityPolicy({}), 'Could not read', 'a policy without evidence');
  expectFailure(context, evaluateImmutabilityPolicy(null), 'Could not read', 'an unreadable policy');
  expectFailure(
    context,
    evaluateImmutabilityPolicy({ enabled: 'true' }),
    'Could not read',
    'a non-boolean policy value',
  );
  expectFailure(
    context,
    verify({ immutableReleasesPolicy: { enabled: 'true' } }),
    'Could not read',
    'draft verification over a non-boolean policy value',
  );
}
