#!/usr/bin/env node
// The release pipeline's consumer proof (GitLab #50's regression guard): a
// scratch consumer installs the just-published package from this project's
// npm registry the way an internal adopter will — `@hell-ui:registry` routing
// plus the `npm:` alias, strict peers, no compensation — and the install is
// audited afterwards. It fails when the registry's served peer contract and
// the manifest's declared contract disagree, which is exactly the defect
// class the 0.3.0 seed shipped with: registries serving npm abbreviated
// metadata drop `peerDependenciesMeta`, so the manifest declares only
// required peers and this probe holds every future release to that.
//
// One probe, two credentials. Both auth modes reach the registry the same
// way — a bearer token in the scratch consumer's own `.npmrc` — so the same
// script proves a job token inside a pipeline and a personal access token on
// a maintainer's machine, and the local run is the run CI did.
//
// The scratch consumer is composed the way tools/package/check-consumer-fixtures.mjs
// composes a fixture workspace, and for the same reasons:
//
// - **The package manager is pinned** from the root manifest. Without it each
//   host resolves its own pnpm, and pnpm 11 moved `strict-peer-dependencies`
//   and `auto-install-peers` out of `.npmrc` into `pnpm-workspace.yaml`, so an
//   `.npmrc`-only posture silently stops applying. The posture is written to
//   both files, so it cannot no-op either way.
// - **Peer versions come from the lockfile catalog snapshot**, the exact
//   versions the library was tested against, not the catalog's ranges.
// - **The repo's `overrides` ride along** in both places pnpm reads them.
//   Without them a transitive peer chain the repo has already patched
//   resolves to the unpatched version and fails a strict install for a
//   reason that has nothing to do with this package.
//
// On a dry-run tag (`v<version>-dryrun.<n>`) nothing was published, so there
// is nothing to install: the probe verifies the mode and hands over.
//
// Leak-clean: the registry endpoint is composed from CI-provided values or
// handed in whole, never named here, and the token is read from the
// environment, never logged, never written anywhere but the scratch
// consumer's throwaway `.npmrc`.
//
// Environment:
//   HELL_SEED_TOKEN     the bearer token; falls back to CI_JOB_TOKEN
//   HELL_SEED_REGISTRY  the registry endpoint; falls back to being composed
//                       from CI_API_V4_URL + CI_PROJECT_ID
//   HELL_SEED_VERSION   the version to install; defaults to the audited
//                       manifest version, so the probe can only ever prove
//                       the version this tree releases

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readLockCatalogVersions, readWorkspaceOverrides } from '../build/workspace-versions.mjs';
import {
  decideReleaseMode,
  packageRegistryUrl,
  publishedPackageName,
} from './gitlab-release-projection.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const sourceManifestPath = 'packages/angular/package.json';

// Mirrors commonFixtureDependencies in tools/package/check-consumer-fixtures.mjs:
// the peer set every consumer fixture installs. A scratch consumer that skipped
// them would prove routing while dodging the peer contract.
const consumerPeers = Object.freeze([
  '@angular/cdk',
  '@angular/common',
  '@angular/compiler',
  '@angular/core',
  '@angular/forms',
  '@angular/platform-browser',
  '@floating-ui/dom',
  'ng-primitives',
  'rxjs',
  'tslib',
]);

// `typescript` is not a peer of this package — it is a peer of
// `ng-primitives` → `@phenomnomnominal/tsquery`, so a strict-peer install
// demands it no matter what this library declares. Every real Angular consumer
// has it, and tools/package/check-consumer-fixtures.mjs installs it in
// commonFixtureDevDependencies for exactly this reason.
const consumerDevDependencies = Object.freeze(['typescript']);

// The peers a manifest declares optional. The manifest deliberately declares
// none (ADR 0006): optional integrations are undeclared, because installers
// resolve peers from registry metadata and abbreviated metadata cannot say
// "optional". The probe still reads the field so a reintroduction is compared
// against what the registry actually serves rather than assumed away.
export function optionalPeerNames(manifest) {
  return Object.entries(manifest?.peerDependenciesMeta ?? {})
    .filter(([, meta]) => meta?.optional === true)
    .map(([name]) => name)
    .sort();
}

// Compares the peer contract the registry serves against the one the package
// declares. pnpm resolves peers from registry metadata, not from the tarball
// it downloads, so any served-versus-declared discrepancy — an extra peer, a
// missing peer, a dropped optional flag — lands on every adopter and no audit
// of the tarball can see it.
export function compareRegistryPeerContract({ packument, version, declaredPeers, expectedOptional }) {
  const entry = packument?.versions?.[version];
  if (!entry) {
    return {
      failures: [`The registry metadata carries no ${version} entry to compare.`],
      missing: [],
      served: null,
      peerCount: null,
    };
  }
  const findings = [];
  const servedPeers = Object.keys(entry.peerDependencies ?? {}).sort();
  const declared = [...declaredPeers].sort();
  const extraServed = servedPeers.filter((name) => !declared.includes(name));
  const missingServed = declared.filter((name) => !servedPeers.includes(name));
  if (extraServed.length > 0) {
    findings.push(
      `The registry serves peer(s) the manifest does not declare: ${extraServed.join(', ')}. ` +
        'Every installer reading the registry will demand them from every consumer.',
    );
  }
  if (missingServed.length > 0) {
    findings.push(
      `The registry drops declared peer(s): ${missingServed.join(', ')}. Installers cannot ` +
        'check the versions consumers provide for them.',
    );
  }
  const served = optionalPeerNames(entry);
  const missing = expectedOptional.filter((name) => !served.includes(name));
  if (missing.length > 0) {
    findings.push(
      `The registry serves ${served.length} of ${expectedOptional.length} optional peers for ` +
        `${publishedPackageName}@${version}. ${missing.join(', ')} ` +
        `${missing.length === 1 ? 'is' : 'are'} optional in the published package but not in ` +
        'the metadata pnpm resolves peers from, so a strict-peer install demands ' +
        `${missing.length === 1 ? 'it' : 'them'} anyway.`,
    );
  }
  return {
    failures: findings,
    missing: [...extraServed, ...missingServed, ...missing],
    served,
    peerCount: servedPeers.length,
  };
}

// The scratch consumer's manifest. The library is depended on under its
// unscoped specifier via the `npm:` alias, exactly as ADR §4 has adopters do
// it, so every `hell-ui` import in an existing consumer keeps resolving.
export function composeConsumerManifest({
  version,
  peerVersions,
  devVersions,
  packageManager,
  overrides,
}) {
  const manifest = {
    name: 'hell-seed-scratch-consumer',
    private: true,
    version: '0.0.0',
    packageManager,
    dependencies: {
      'hell-ui': `npm:${publishedPackageName}@${version}`,
      ...peerVersions,
    },
    devDependencies: { ...devVersions },
  };
  if (Object.keys(overrides).length > 0) manifest.pnpm = { overrides };
  return manifest;
}

// The scratch consumer's `.npmrc`: scope routing, the credential for that one
// endpoint host-relative so no protocol is written, and the strict peer
// posture for any pnpm that still reads it from here.
export function composeConsumerNpmrc({ registryUrl, token }) {
  return [
    `${publishedPackageName.split('/')[0]}:registry=${registryUrl}`,
    `${String(registryUrl).replace(/^https?:/, '')}:_authToken=${token}`,
    'strict-peer-dependencies=true',
    'auto-install-peers=false',
    '',
  ].join('\n');
}

// The same posture and overrides where pnpm 11 reads them. Written for every
// pnpm version: the pinned one reads this file, and one that ignores it still
// gets the posture from `.npmrc` rather than silently falling back to its
// defaults. Deliberately carries no compensation for registry metadata: a
// `packageExtensions` block here would make this probe pass while
// pre-patching the thing under test, and the green run would describe a
// consumer no adopter is.
export function composeConsumerWorkspaceYaml({ overrides }) {
  const lines = ['strictPeerDependencies: true', 'autoInstallPeers: false'];
  if (Object.keys(overrides).length > 0) {
    lines.push('overrides:');
    for (const [name, version] of Object.entries(overrides)) {
      lines.push(`  ${JSON.stringify(name)}: ${JSON.stringify(version)}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

// Audits what the install actually produced. The alias is proven by the
// directory and the manifest disagreeing on purpose: `node_modules/hell-ui`
// must carry the published scoped name at the audited version. A path outside
// the scratch consumer would mean the specifier resolved to a checkout instead
// of the registry, which is the one way this probe could pass while proving
// nothing.
export function auditInstall({ installedManifest, installedRealPath, scratchRoot, version }) {
  const failures = [];
  if (installedManifest?.name !== publishedPackageName) {
    failures.push(
      `node_modules/hell-ui is ${JSON.stringify(installedManifest?.name ?? null)}; the npm: alias ` +
        `must have resolved ${publishedPackageName}.`,
    );
  }
  if (installedManifest?.version !== version) {
    failures.push(
      `The installed version is ${JSON.stringify(installedManifest?.version ?? null)}; the probe ` +
        `installs ${version}.`,
    );
  }
  if (!installedRealPath.startsWith(scratchRoot)) {
    failures.push(
      `node_modules/hell-ui resolves to ${installedRealPath}, outside the scratch consumer; it ` +
        'must come from the project registry, not a local checkout.',
    );
  }
  const exportKeys = Object.keys(installedManifest?.exports ?? {});
  if (!exportKeys.includes('.')) {
    failures.push('The installed package must export its root entry point ".".');
  }
  if (exportKeys.length < 2) {
    failures.push(
      `The installed package exports ${exportKeys.length} entry point(s); the published tarball ` +
        'carries the root entry plus its secondary entry points.',
    );
  }
  return { failures, exportKeys };
}

// Resolves one export condition to the files it names, so the probe proves the
// entry points ship rather than merely that the manifest names them.
export function resolveExportTargets(exportEntry) {
  const targets = [];
  const walk = (value) => {
    if (typeof value === 'string') targets.push(value);
    else if (value && typeof value === 'object') for (const nested of Object.values(value)) walk(nested);
  };
  walk(exportEntry);
  return targets;
}

function report(label, failures) {
  if (failures.length === 0) return false;
  console.error(`${label} failed:`);
  for (const failure of failures) console.error(`- ${failure}`);
  return true;
}

async function main() {
  const sourceManifest = JSON.parse(readFileSync(join(root, sourceManifestPath), 'utf8'));

  // In a tag pipeline the mode decision is the projection's, not this
  // probe's: a dry-run tag published nothing, so there is nothing to prove.
  if (process.env.CI_COMMIT_TAG) {
    const decision = decideReleaseMode({
      tagName: process.env.CI_COMMIT_TAG,
      manifestVersion: sourceManifest.version,
    });
    if (report('Release mode', decision.failures)) return 1;
    if (decision.mode === 'dry-run') {
      console.log(
        `Dry-run tag ${process.env.CI_COMMIT_TAG}: publish stopped before the upload, so there ` +
          'is no publication for a consumer to install. Nothing to verify.',
      );
      return 0;
    }
  }

  const token = process.env.HELL_SEED_TOKEN ?? process.env.CI_JOB_TOKEN;
  if (!token) {
    console.error('Missing credential: set HELL_SEED_TOKEN (or run inside a job for CI_JOB_TOKEN).');
    return 2;
  }
  let registryUrl = process.env.HELL_SEED_REGISTRY;
  if (!registryUrl) {
    if (!process.env.CI_API_V4_URL || !process.env.CI_PROJECT_ID) {
      console.error(
        'Missing registry endpoint: set HELL_SEED_REGISTRY, or run where CI_API_V4_URL and ' +
          'CI_PROJECT_ID are provided.',
      );
      return 2;
    }
    registryUrl = packageRegistryUrl(process.env.CI_API_V4_URL, process.env.CI_PROJECT_ID);
  }

  const version = process.env.HELL_SEED_VERSION ?? sourceManifest.version;
  const rootManifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const packageManager = rootManifest.packageManager;
  if (typeof packageManager !== 'string' || !packageManager.startsWith('pnpm@')) {
    console.error(
      'The root manifest must pin a pnpm packageManager for the scratch consumer to inherit; ' +
        `found ${JSON.stringify(packageManager ?? null)}.`,
    );
    return 1;
  }

  const catalog = readLockCatalogVersions();
  const overrides = readWorkspaceOverrides();
  const missingPeers = [...consumerPeers, ...consumerDevDependencies]
    .filter((name) => !catalog[name])
    .map((name) => `${name} is not in the lockfile catalog snapshot.`);
  if (report('Catalog peers', missingPeers)) return 1;
  const peerVersions = Object.fromEntries(consumerPeers.map((name) => [name, catalog[name]]));
  const devVersions = Object.fromEntries(consumerDevDependencies.map((name) => [name, catalog[name]]));

  // What the registry tells pnpm about this package's peers, read before the
  // install so a mismatch explains the install rather than being guessed at.
  const expectedOptional = optionalPeerNames(sourceManifest);
  const declaredPeers = Object.keys(sourceManifest.peerDependencies ?? {});
  const response = await fetch(`${registryUrl}${publishedPackageName.replaceAll('/', '%2F')}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status !== 200) {
    console.error(
      `The project npm registry answered HTTP ${response.status} to an authenticated metadata ` +
        'read; the token or the endpoint is wrong.',
    );
    return 1;
  }
  const contract = compareRegistryPeerContract({
    packument: await response.json(),
    version,
    declaredPeers,
    expectedOptional,
  });
  console.log(
    `Registry peer contract for ${publishedPackageName}@${version}: ` +
      `${contract.peerCount ?? '?'} peer(s) served, ${declaredPeers.length} declared in ` +
      `${sourceManifestPath}, ${expectedOptional.length} declared optional.`,
  );
  for (const finding of contract.failures) console.log(`  FINDING: ${finding}`);
  if (contract.missing.length > 0) {
    console.log(
      '  The install below is the adopter experience as it stands, uncompensated: if it fails, ' +
        'that failure is the finding rather than a fault in this probe.',
    );
  }

  const scratchRoot = realpathSync(mkdtempSync(join(tmpdir(), 'hell-seed-consumer-')));
  writeFileSync(
    join(scratchRoot, 'package.json'),
    `${JSON.stringify(composeConsumerManifest({ version, peerVersions, devVersions, packageManager, overrides }), null, 2)}\n`,
  );
  writeFileSync(join(scratchRoot, '.npmrc'), composeConsumerNpmrc({ registryUrl, token }));
  writeFileSync(join(scratchRoot, 'pnpm-workspace.yaml'), composeConsumerWorkspaceYaml({ overrides }));

  console.log(
    `Scratch consumer in ${scratchRoot}: ${publishedPackageName}@${version} routed by ` +
      `${publishedPackageName.split('/')[0]}:registry and depended on as ` +
      `"hell-ui": "npm:${publishedPackageName}@${version}", under ${packageManager} with strict ` +
      `peers, ${consumerPeers.length} pinned peer(s) and ${Object.keys(overrides).length} override(s).`,
  );

  try {
    execFileSync('pnpm', ['install', '--strict-peer-dependencies', '--ignore-scripts'], {
      cwd: scratchRoot,
      stdio: 'inherit',
    });
  } catch {
    report('Scratch consumer install', [
      'The scratch consumer could not install from the project registry.',
      ...contract.failures,
    ]);
    return 1;
  }

  const installedDir = join(scratchRoot, 'node_modules', 'hell-ui');
  if (!existsSync(installedDir)) {
    console.error('node_modules/hell-ui is absent after a successful install.');
    return 1;
  }
  const installedManifest = JSON.parse(readFileSync(join(installedDir, 'package.json'), 'utf8'));
  const audit = auditInstall({
    installedManifest,
    installedRealPath: realpathSync(installedDir),
    scratchRoot,
    version,
  });

  const missingTargets = [];
  for (const key of audit.exportKeys) {
    for (const target of resolveExportTargets(installedManifest.exports[key])) {
      if (!target.startsWith('./')) continue;
      if (!existsSync(join(installedDir, target))) {
        missingTargets.push(`Missing file for export ${key} -> ${target}.`);
      }
    }
  }

  if (report('Scratch consumer', [...audit.failures, ...missingTargets, ...contract.failures])) return 1;

  console.log(
    `Consumer install ok: the npm: alias resolved hell-ui to ${installedManifest.name}@` +
      `${installedManifest.version} from the project registry under ${packageManager}, strict ` +
      `peers satisfied with only the ${consumerPeers.length} required peers installed, and all ` +
      `${audit.exportKeys.length} exported entry points resolve to shipped files.`,
  );
  return 0;
}

if (
  process.argv[1] &&
  realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))
) {
  process.exit(await main());
}
