// Isolated repository fixtures for Change Fragment authoring (ADR 0003).
//
// Every fixture copies the repository's real .changie.yaml and .changes
// skeleton into a fresh temporary Git repository, drives the real Changie
// binary exactly as `pnpm change` would, and asserts the objective validator's
// verdict. Fixtures prove authoring behavior only: nothing batches, merges,
// commits, tags, pushes, or publishes.

import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'yaml';
import {
  collectUnreleasedFragmentErrors,
  listUnreleasedFragments,
} from './change-fragments.mjs';

const changieTimeoutMs = 30_000;
const promptConfirm = '\r';

const fixtures = [
  { name: 'authoring writes one pending fragment', run: fixtureAuthorsOnePendingFragment },
  { name: 'breaking prompts for migration', run: fixtureBreakingPromptsForMigration },
  { name: 'several fragments in one change', run: fixtureSeveralFragmentsInOneChange },
  { name: 'changie rejects unknown kinds', run: fixtureChangieRejectsUnknownKinds },
  { name: 'validator rejects malformed fragments', run: fixtureValidatorRejectsMalformedFragments },
  { name: 'validator accepts multiline prose', run: fixtureValidatorAcceptsMultilineProse },
];

export function runChangeFragmentFixtures({ root }) {
  const binary = resolveChangieBinary(root);
  if (!existsSync(binary)) {
    return {
      failures: [`Missing Changie binary at ${binary}; run pnpm install first.`],
      total: fixtures.length,
    };
  }

  const failures = [];
  for (const fixture of fixtures) {
    for (const failure of runFixture(root, binary, fixture)) {
      failures.push(`change-fragment fixture "${fixture.name}": ${failure}`);
    }
  }

  return { failures, total: fixtures.length };
}

function runFixture(root, binary, fixture) {
  const workspace = mkdtempSync(join(tmpdir(), 'hell-change-fragment-'));
  try {
    const context = createFixtureContext(root, binary, workspace);
    fixture.run(context);
    return context.failures;
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  } finally {
    rmSync(workspace, { force: true, recursive: true });
  }
}

function createFixtureContext(root, binary, workspace) {
  const unreleasedDir = join(workspace, '.changes', 'unreleased');
  copyFileSync(join(root, '.changie.yaml'), join(workspace, '.changie.yaml'));
  mkdirSync(unreleasedDir, { recursive: true });
  copyFileSync(join(root, '.changes', 'header.tpl.md'), join(workspace, '.changes', 'header.tpl.md'));
  writeFileSync(join(unreleasedDir, '.gitkeep'), '');

  const failures = [];
  const context = {
    workspace,
    unreleasedDir,
    failures,
    fail: (message) => failures.push(message),
    changie: (args, options = {}) =>
      spawnSync(binary, args, {
        cwd: workspace,
        encoding: 'utf8',
        env: { ...process.env, TERM: process.env.TERM ?? 'xterm-256color' },
        input: options.input ?? '',
        killSignal: 'SIGKILL',
        timeout: changieTimeoutMs,
      }),
    git: (args) => spawnSync('git', args, { cwd: workspace, encoding: 'utf8' }),
    writeFragment: (name, content) => writeFileSync(join(unreleasedDir, name), content),
    readFragment: (name) => parse(readFileSync(join(unreleasedDir, name), 'utf8')),
    validatorErrors: () => collectUnreleasedFragmentErrors(unreleasedDir),
    pendingFragments: () => listUnreleasedFragments(unreleasedDir),
  };

  const init = context.git(['init', '--quiet']);
  if (init.status !== 0) throw new Error(`git init failed: ${init.stderr}`);
  gitOrThrow(context, ['add', '--all']);
  gitOrThrow(context, [
    '-c',
    'user.name=hell-fixture',
    '-c',
    'user.email=fixture@example.invalid',
    '-c',
    'commit.gpgsign=false',
    'commit',
    '--quiet',
    '--message',
    'baseline',
  ]);

  return context;
}

function gitOrThrow(context, args) {
  const result = context.git(args);
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr || result.stdout}`);
  }
  return result;
}

function expectChangieSuccess(context, result, label) {
  if (result.error) {
    context.fail(`${label} failed to run: ${result.error.message}`);
    return false;
  }
  if (result.signal) {
    context.fail(`${label} was killed by ${result.signal}; the command must never block on a hidden prompt.`);
    return false;
  }
  if (result.status !== 0) {
    context.fail(`${label} exited with ${result.status}: ${result.stderr || result.stdout}`);
    return false;
  }
  return true;
}

function expectNoValidatorErrors(context, label) {
  for (const error of context.validatorErrors()) {
    context.fail(`${label}: objective validator unexpectedly rejected: ${error}`);
  }
}

function fixtureAuthorsOnePendingFragment(context) {
  const baselineHead = gitOrThrow(context, ['rev-parse', 'HEAD']).stdout.trim();
  const result = context.changie(['new', '-k', 'Added', '-b', 'Added the example entry point.']);
  if (!expectChangieSuccess(context, result, 'changie new -k Added')) return;

  const fragments = context.pendingFragments();
  if (fragments.length !== 1 || !fragments[0].startsWith('Added-')) {
    context.fail(`expected exactly one pending Added fragment; found ${fragments.join(', ') || '(none)'}`);
    return;
  }
  expectNoValidatorErrors(context, 'valid Added fragment');

  const changesEntries = readdirSync(join(context.workspace, '.changes')).sort();
  if (changesEntries.join(',') !== 'header.tpl.md,unreleased') {
    context.fail(`authoring must not batch a version file; .changes contains ${changesEntries.join(', ')}`);
  }
  if (existsSync(join(context.workspace, 'CHANGELOG.md'))) {
    context.fail('authoring must not merge or write a changelog.');
  }

  const status = gitOrThrow(context, ['status', '--porcelain']).stdout.trim().split('\n').filter(Boolean);
  const expected = `?? .changes/unreleased/${fragments[0]}`;
  if (status.length !== 1 || status[0] !== expected) {
    context.fail(`authoring must only add one pending fragment; git status reported: ${status.join(' | ') || '(clean)'}`);
  }
  const head = gitOrThrow(context, ['rev-parse', 'HEAD']).stdout.trim();
  if (head !== baselineHead) {
    context.fail('authoring must not create a commit.');
  }
}

function fixtureBreakingPromptsForMigration(context) {
  const migration = 'Rename hellWidget to hellGadget in consumer templates.';
  const result = context.changie(['new', '-k', 'Breaking', '-b', 'Renamed the widget input.'], {
    input: `${migration}${promptConfirm}`,
  });
  if (!expectChangieSuccess(context, result, 'changie new -k Breaking')) return;

  const fragments = context.pendingFragments();
  if (fragments.length !== 1 || !fragments[0].startsWith('Breaking-')) {
    context.fail(`expected exactly one pending Breaking fragment; found ${fragments.join(', ') || '(none)'}`);
    return;
  }

  const fragment = context.readFragment(fragments[0]);
  if (fragment?.custom?.migration !== migration) {
    context.fail(
      `Breaking authoring must record the migration prompt answer; found ${JSON.stringify(fragment?.custom?.migration)}`,
    );
  }
  expectNoValidatorErrors(context, 'valid Breaking fragment');
}

function fixtureSeveralFragmentsInOneChange(context) {
  const commands = [
    { args: ['new', '-k', 'Added', '-b', 'Added the pagination control.'] },
    { args: ['new', '-k', 'Fixed', '-b', 'Fixed toast exit ordering.'] },
    {
      args: ['new', '-k', 'Breaking', '-b', 'Removed the deprecated tuple alias.'],
      input: `Import the HELL_ALERT_IMPORTS tuple instead.${promptConfirm}`,
    },
  ];
  for (const command of commands) {
    const result = context.changie(command.args, { input: command.input });
    if (!expectChangieSuccess(context, result, `changie ${command.args.join(' ')}`)) return;
  }

  const fragments = context.pendingFragments();
  if (fragments.length !== 3) {
    context.fail(`expected three pending fragments in one change; found ${fragments.join(', ') || '(none)'}`);
    return;
  }
  for (const prefix of ['Added-', 'Breaking-', 'Fixed-']) {
    if (!fragments.some((name) => name.startsWith(prefix))) {
      context.fail(`expected a pending ${prefix}* fragment; found ${fragments.join(', ')}`);
    }
  }
  expectNoValidatorErrors(context, 'several valid fragments');
}

function fixtureChangieRejectsUnknownKinds(context) {
  for (const kind of ['Removed', 'Deprecated']) {
    const result = context.changie(['new', '-k', kind, '-b', 'Not an allowed kind.']);
    if (result.signal) {
      context.fail(`changie new -k ${kind} was killed by ${result.signal} instead of failing fast.`);
      continue;
    }
    if (result.status === 0) {
      context.fail(`changie new -k ${kind} must be rejected; the schema has exactly five kinds.`);
    }
    if (!`${result.stderr}${result.stdout}`.includes('invalid kind')) {
      context.fail(`changie new -k ${kind} should report an invalid kind; got: ${result.stderr}`);
    }
  }

  const fragments = context.pendingFragments();
  if (fragments.length !== 0) {
    context.fail(`rejected kinds must not write fragments; found ${fragments.join(', ')}`);
  }
}

function fixtureValidatorRejectsMalformedFragments(context) {
  context.writeFragment(
    'Removed-20260101-000000.yaml',
    'kind: Removed\nbody: Removed an input.\ntime: 2026-01-01T00:00:00.000Z\n',
  );
  context.writeFragment(
    'Added-20260101-000001.yaml',
    'kind: Added\nbody: "   "\ntime: 2026-01-01T00:00:01.000Z\n',
  );
  context.writeFragment(
    'Breaking-20260101-000002.yaml',
    'kind: Breaking\nbody: Removed the legacy alias.\ntime: 2026-01-01T00:00:02.000Z\n',
  );
  context.writeFragment(
    'Breaking-20260101-000003.yaml',
    'kind: Breaking\nbody: Renamed the part map.\ntime: 2026-01-01T00:00:03.000Z\ncustom:\n  migration: "   "\n',
  );
  context.writeFragment('Fixed-20260101-000004.yaml', 'kind: [Fixed\nbody: "unclosed flow\n');

  const errors = context.validatorErrors();
  const expectations = [
    { file: 'Removed-20260101-000000.yaml', needle: 'unknown kind "Removed"' },
    { file: 'Added-20260101-000001.yaml', needle: 'nonblank consumer-facing body' },
    { file: 'Breaking-20260101-000002.yaml', needle: 'custom.migration' },
    { file: 'Breaking-20260101-000003.yaml', needle: 'custom.migration' },
    { file: 'Fixed-20260101-000004.yaml', needle: 'must be valid YAML' },
  ];
  for (const expectation of expectations) {
    const matched = errors.some(
      (error) => error.includes(expectation.file) && error.includes(expectation.needle),
    );
    if (!matched) {
      context.fail(
        `expected the validator to reject ${expectation.file} (${expectation.needle}); got: ${errors.join(' | ') || '(no errors)'}`,
      );
    }
  }
  if (errors.length !== expectations.length) {
    context.fail(
      `expected exactly ${expectations.length} validator errors; got ${errors.length}: ${errors.join(' | ')}`,
    );
  }
}

function fixtureValidatorAcceptsMultilineProse(context) {
  const multilineBody = 'Reworked toast stacking.\nExisting placements keep their behavior.';
  const result = context.changie(['new', '-k', 'Changed', '-b', multilineBody]);
  if (!expectChangieSuccess(context, result, 'changie new with a multiline body')) return;

  const fragments = context.pendingFragments();
  const changed = fragments.find((name) => name.startsWith('Changed-'));
  if (!changed) {
    context.fail(`expected a pending Changed fragment; found ${fragments.join(', ') || '(none)'}`);
    return;
  }
  if (context.readFragment(changed)?.body !== multilineBody) {
    context.fail('changie must preserve multiline prose in the fragment body.');
  }

  context.writeFragment(
    'Breaking-20260101-000010.yaml',
    [
      'kind: Breaking',
      'body: |-',
      '  Split the picker value types.',
      '  Single and multiple modes now use distinct generics.',
      'time: 2026-01-01T00:00:10.000Z',
      'custom:',
      '  migration: |-',
      '    Replace HellPickerValue with HellPickSingleValue or',
      '    HellPickMultipleValue to match the configured mode.',
      '',
    ].join('\n'),
  );
  expectNoValidatorErrors(context, 'multiline prose');
}

function resolveChangieBinary(root) {
  const extension = process.platform === 'win32' ? '.exe' : '';
  return join(
    root,
    'node_modules',
    'changie',
    'npm',
    'dist',
    `${process.platform}-${process.arch}${extension}`,
  );
}
