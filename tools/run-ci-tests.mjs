import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { runPackageManager } from './package-manager.mjs';

const reports = ['test-results', 'coverage'];

for (const path of reports) {
  rmSync(path, { force: true, recursive: true });
}

mkdirSync('test-results', { recursive: true });

const tasks = [
  {
    name: 'unit tests',
    args: ['exec', '--', 'ng', 'test', 'hell', '--watch=false', '--runner-config', 'vitest.ci.config.ts'],
  },
  {
    name: 'architecture contract',
    args: ['run', 'test:architecture'],
  },
  {
    name: 'lint',
    args: ['run', 'lint'],
  },
  {
    name: 'browser e2e',
    args: ['run', 'e2e'],
  },
  {
    name: 'package consumer',
    args: ['run', 'test:package-consumer'],
  },
  {
    name: 'CI contract',
    args: ['run', 'test:ci-contract'],
  },
];

let failed = false;

for (const task of tasks) {
  console.log(`\n[ci] ${task.name}`);
  const result = runPackageManager(task.args);

  if (result.error) {
    console.error(`[ci] ${task.name} failed to start: ${result.error.message}`);
    failed = true;
    continue;
  }

  if (result.status !== 0) {
    failed = true;
  }
}

const summary = spawnSync('node', ['tools/ci-summary.mjs'], {
  shell: process.platform === 'win32',
  stdio: 'inherit',
});

if (!failed && summary.status !== 0) {
  failed = true;
}

process.exit(failed ? 1 : 0);
