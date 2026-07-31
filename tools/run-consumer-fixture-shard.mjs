// Sharded CI entry for the packed-tarball consumer fixture runner.
//
// GitLab runs this script once per parallel shard (CI_NODE_INDEX of
// CI_NODE_TOTAL). Fixtures are discovered in-job from
// tools/consumer-fixtures/ and dealt round-robin over the shards in sorted
// order, so adding a fixture changes no CI configuration — it lands on some
// shard in the next pipeline. Every fixture runs as its own
// tools/check-consumer-fixtures.mjs invocation wrapped in a collapsible log
// section, and a failing fixture never stops the rest of the shard: the
// summary at the end names every failure.
//
// Outside CI both shard variables are unset and the single implicit shard
// runs everything; --plan prints the shard assignment without running.

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixturesRoot = join(root, 'tools', 'consumer-fixtures');
const runnerPath = join(root, 'tools', 'check-consumer-fixtures.mjs');

const planOnly = process.argv.slice(2).includes('--plan');
const emitSectionMarkers = process.env.GITLAB_CI === 'true';

const shard = readShard();
const fixtures = discoverFixtureNames();
const assigned = shardAssignment(fixtures, shard.total, shard.index);

console.log(
  `[consumer-shard] ${fixtures.length} fixture(s) discovered, running shard ${shard.index}/${shard.total}`,
);
for (let index = 1; index <= shard.total; index += 1) {
  const names = shardAssignment(fixtures, shard.total, index);
  const marker = index === shard.index ? '  <- this shard' : '';
  console.log(
    `[consumer-shard]   shard ${index}/${shard.total}: ${names.join(', ') || '(none)'}${marker}`,
  );
}

if (planOnly) process.exit(0);

// Without a prebuilt tarball every per-fixture runner invocation would
// rebuild and repack the library; in CI the build job's audited artifact is
// the one thing consumers are meant to test.
if (!(process.env.HELL_PACKAGE_CONSUMER_TARBALL ?? '').trim()) {
  fail(
    'HELL_PACKAGE_CONSUMER_TARBALL must point at a packed tarball or a directory holding one. ' +
      'Locally: pnpm run ci:build:lib && pnpm run ci:pack:lib, then set it to artifacts/package.',
  );
}

const failures = [];
for (const name of assigned) {
  openSection(`fixture_${name}`, `consumer fixture ${name}`);
  const result = spawnSync(process.execPath, [runnerPath, name], { cwd: root, stdio: 'inherit' });
  closeSection(`fixture_${name}`);

  if (result.error) {
    failures.push(name);
    console.error(`[consumer-shard] FAILED: ${name} (${result.error.message})`);
  } else if (result.status !== 0) {
    failures.push(name);
    console.error(`[consumer-shard] FAILED: ${name} (exit ${result.status})`);
  } else {
    console.log(`[consumer-shard] ok: ${name}`);
  }
}

if (failures.length) {
  console.error(
    `[consumer-shard] ${failures.length}/${assigned.length} fixture(s) failed: ${failures.join(', ')}`,
  );
  process.exit(1);
}
console.log(
  `[consumer-shard] ok: ${assigned.length ? assigned.join(', ') : '(no fixtures on this shard)'}`,
);

function shardAssignment(names, total, index) {
  return names.filter((_, position) => position % total === index - 1);
}

// GitLab sets both variables on parallel jobs; a single non-parallel run
// (local, or the job with `parallel:` removed) sets neither. Anything in
// between is a misconfiguration, never a default.
function readShard() {
  const rawIndex = process.env.CI_NODE_INDEX;
  const rawTotal = process.env.CI_NODE_TOTAL;
  if (rawIndex === undefined && rawTotal === undefined) return { index: 1, total: 1 };

  const index = parsePositiveInteger('CI_NODE_INDEX', rawIndex);
  const total = parsePositiveInteger('CI_NODE_TOTAL', rawTotal);
  if (index > total) fail(`CI_NODE_INDEX (${index}) exceeds CI_NODE_TOTAL (${total})`);
  return { index, total };
}

function parsePositiveInteger(name, raw) {
  if (raw === undefined) fail(`${name} is unset while its counterpart shard variable is set`);
  if (!/^[1-9]\d*$/.test(raw)) fail(`${name} must be a positive integer, got ${JSON.stringify(raw)}`);
  return Number(raw);
}

function discoverFixtureNames() {
  if (!existsSync(fixturesRoot)) fail(`Fixture root missing: ${fixturesRoot}`);

  const names = [];
  for (const entry of readdirSync(fixturesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (!existsSync(join(fixturesRoot, entry.name, 'fixture.json'))) {
      fail(`Fixture ${entry.name} is missing its fixture.json manifest`);
    }
    // Section names allow [A-Za-z0-9_.-]; a fixture the shard cannot label
    // must fail here, not silently corrupt the job log.
    if (!/^[A-Za-z0-9_.-]+$/.test(entry.name)) {
      fail(`Fixture directory name ${JSON.stringify(entry.name)} cannot label a log section`);
    }
    names.push(entry.name);
  }

  if (!names.length) fail(`No consumer fixtures found under ${fixturesRoot}`);
  return names.sort();
}

function openSection(id, header) {
  if (!emitSectionMarkers) {
    console.log(`[consumer-shard] --- ${header} ---`);
    return;
  }
  console.log(`\x1b[0Ksection_start:${unixTime()}:${id}[collapsed=true]\r\x1b[0K${header}`);
}

function closeSection(id) {
  if (!emitSectionMarkers) return;
  console.log(`\x1b[0Ksection_end:${unixTime()}:${id}\r\x1b[0K`);
}

function unixTime() {
  return Math.floor(Date.now() / 1000);
}

function fail(message) {
  console.error(`[consumer-shard] ${message}`);
  process.exit(1);
}
