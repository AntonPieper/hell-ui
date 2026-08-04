// Sharded CI entry for the packed-tarball consumer fixture runner.
//
// This file is shard arithmetic and nothing else. GitLab runs it once per
// parallel shard (CI_NODE_INDEX of CI_NODE_TOTAL); the fixtures come from the
// runner's own discovery and are dealt round-robin over the shards in sorted
// order, so adding a fixture changes no CI configuration — it lands on some
// shard in the next pipeline. Every run prints the full shard assignment
// first, so a log shows what this shard owns and where the other fixtures
// went.
//
// The runner is imported, not re-spawned: one shard builds nothing, audits the
// packed tarball once, and runs its fixtures as a batch — each in its own
// collapsible log section, continuing past failures, with a summary naming
// every failure. Outside CI both shard variables are unset and the single
// implicit shard runs everything.

import {
  discoverFixtureNames,
  reportRunnerError,
  runConsumerFixtures,
} from './check-consumer-fixtures.mjs';

try {
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

  const failures = await runConsumerFixtures({ names: assigned, batch: true });
  if (failures.length) process.exit(1);
} catch (error) {
  reportRunnerError(error);
  process.exit(1);
}

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

function fail(message) {
  console.error(`[consumer-shard] ${message}`);
  process.exit(1);
}
