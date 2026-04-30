import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';

const reports = ['test-results', 'coverage'];

for (const path of reports) {
  rmSync(path, { force: true, recursive: true });
}

mkdirSync('test-results', { recursive: true });

const tasks = [
  {
    name: 'unit tests',
    command: 'pnpm',
    args: ['exec', 'ng', 'test', 'hell', '--watch=false', '--runner-config', 'vitest.ci.config.ts'],
  },
  {
    name: 'architecture contract',
    command: 'pnpm',
    args: ['test:architecture'],
  },
];

let failed = false;

for (const task of tasks) {
  console.log(`\n[ci] ${task.name}`);
  const result = spawnSync(task.command, task.args, {
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });

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
