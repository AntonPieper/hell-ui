import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { collectSourceFiles, digestSourceFiles } from './source-digest.mjs';

/**
 * Provenance for the docs build the E2E harness measures.
 *
 * `playwright.config.ts` reuses an existing server outside CI, and the docs
 * dev server listens on a fixed port. A server left running from another
 * worktree, or from an older build of this one, is therefore served silently to
 * the whole suite — more than one agent has measured a different checkout than
 * the one under test and reported a defect that did not exist.
 *
 * The build publishes this stamp as a static asset so the harness can read,
 * before the first test, exactly which tree produced the pages it is about to
 * assert against.
 */

/** Served from the docs root, so the harness fetches it over the same origin as the pages. */
export const DOCS_BUILD_STAMP_FILE = 'hell-e2e-build.json';

/**
 * Exported so `docs-build-stamp.spec.mjs` builds synthetic stamps at the
 * current format rather than hard-coding a number that drifts.
 */
export const STAMP_VERSION = 1;

/** The Angular application builder writes into `browser/`; older layouts do not. */
function servedDocsRoot(distRoot) {
  const browserRoot = join(distRoot, 'browser');
  return existsSync(browserRoot) ? browserRoot : distRoot;
}

/**
 * Everything the rendered docs are built from: the docs app plus the library,
 * which the docs workspace compiles from source through the `@heinrich/source`
 * condition rather than from `dist`.
 *
 * Deliberately not an extension allowlist. One covered `ts|html|css|json` and
 * missed `install.example.sh`, which the getting started page imports as raw
 * content, the favicon, and the logo copied through `angular.json` assets.
 * Removing it left a second filter excluding the same class of file by a
 * different rule — dot-prefixed names — which hid `.postcssrc.json`, the only
 * registration of `@tailwindcss/postcss`. Emptying it renders the site
 * unstyled while leaving this digest byte-identical.
 *
 * So the rule is inverted: everything counts unless there is a reason it
 * cannot reach a rendered page. Three such reasons exist, and each is about the
 * file rather than its name — specs, the snapshots specs write, which
 * `test:unit` rewrites and which no page imports, and Finder metadata.
 *
 * Over-inclusion costs a rebuild. Under-inclusion accepts a stale build as
 * current, which is the failure this guard exists for.
 */
function docsInputPaths(root) {
  // Finder metadata is the third such reason, and the only one that appears
  // without anybody touching the tree: browsing a directory writes `.DS_Store`,
  // and copying to a non-native filesystem leaves `._*` AppleDouble sidecars.
  // One written between the stamp and the preflight changes the digest and
  // forces a ~90s docs rebuild for a file no page can import. AGENTS.md already
  // names them a repo nuisance. This stays a decision about what these files
  // are, not about the dot that starts their names.
  const finderMetadata = (name) => name === '.DS_Store' || name.startsWith('._');
  const buildable = (name) =>
    !name.endsWith('.spec.ts') && !name.endsWith('.snap') && !finderMetadata(name);
  return [
    join(root, 'pnpm-lock.yaml'),
    join(root, 'tsconfig.base.json'),
    ...collectSourceFiles(join(root, 'apps/docs'), buildable),
    ...collectSourceFiles(join(root, 'packages/angular'), buildable),
  ];
}

function currentCommit(root) {
  try {
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
    const status = execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
    return { commit: commit.trim(), dirty: status.trim().length > 0 };
  } catch {
    // Provenance still works without git; the digest is the authority.
    return { commit: null, dirty: null };
  }
}

/**
 * A stable identifier for a checkout that is not its path.
 *
 * Defence in depth rather than the primary control. `vercel.json` publishes the
 * served docs root wholesale, so anything left there ships with the public
 * site; this stamp is therefore written by the E2E harness immediately before
 * serving, and never by `build:docs`, so no deploy contains it. Should that
 * ever change, a digest still identifies a checkout without disclosing a home
 * directory or worktree name — and it is only a digest of a path, so treat it
 * as an identifier, not a secret.
 *
 * Exported for `docs-build-stamp.spec.mjs`, which needs the identifier of a
 * synthetic root to build a stamp that belongs to it.
 */
export function workspaceId(root) {
  return createHash('sha256').update(root).digest('hex').slice(0, 16);
}

export function writeDocsBuildStamp({ root, distRoot }) {
  const stampPath = join(servedDocsRoot(distRoot), DOCS_BUILD_STAMP_FILE);
  writeFileSync(
    stampPath,
    `${JSON.stringify(
      {
        version: STAMP_VERSION,
        workspaceId: workspaceId(root),
        ...currentCommit(root),
        builtAt: new Date().toISOString(),
        sourcesDigest: digestSourceFiles(root, docsInputPaths(root)),
      },
      null,
      2,
    )}\n`,
  );
  return stampPath;
}

export function computeDocsSourcesDigest(root) {
  return digestSourceFiles(root, docsInputPaths(root));
}

/**
 * Reasons the served docs build cannot stand in for the working tree, phrased
 * so a reader fixes what is being served rather than debugging a component that
 * is not the one under test. An empty array means the harness is measuring this
 * checkout's current build.
 */
export function describeForeignDocsBuild({
  root,
  stamp,
  currentDigest,
  serverAnswersPages = true,
}) {
  if (!stamp) {
    // Playwright treats any answer on the port as "the server is up" and skips
    // the rebuild, so a stale process that errors on every path gets adopted
    // and every test runs against nothing. Name that case separately: it is
    // fixed by killing a process, not by rebuilding.
    return serverAnswersPages
      ? [
          `the docs server did not serve /${DOCS_BUILD_STAMP_FILE}, so the build it is serving cannot be identified. It predates build provenance, or another server is answering on this port. Stop it and let Playwright start its own.`,
        ]
      : [
          `the server on this port is not serving the docs app at all — it answers errors for the app itself and for /${DOCS_BUILD_STAMP_FILE}. That is a stale or broken process holding the port, which Playwright adopts instead of rebuilding. Stop that process and re-run.`,
        ];
  }
  if (stamp.version !== STAMP_VERSION) {
    return [`the served docs build carries an older stamp format; rebuild the docs and retry.`];
  }
  if (stamp.workspaceId !== workspaceId(root)) {
    // The other checkout is identified by digest rather than named: this stamp
    // is published with the docs site, so its path must not be.
    return [
      `the docs server is serving a build from a different checkout (${stamp.workspaceId ?? 'unidentified'}, not ${workspaceId(root)}). Another checkout's dev server is answering on this port; stop it and let Playwright start its own.`,
    ];
  }
  if (stamp.sourcesDigest !== currentDigest) {
    return [
      `the docs server is serving a build made from different sources than the working tree${stamp.commit ? ` (built at ${stamp.commit.slice(0, 12)}${stamp.dirty ? ', dirty' : ''})` : ''}. Outside CI Playwright reuses whatever already holds this port, so rebuilding on its own will not replace what is being served: stop it and let Playwright start its own.`,
    ];
  }
  return [];
}
