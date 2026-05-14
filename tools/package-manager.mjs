import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function packageManagerInvocation(args) {
  const npmExecPath = process.env.npm_execpath;

  if (npmExecPath) {
    if (!npmExecPath.toLowerCase().includes('pnpm')) {
      throw new Error('Hell UI workspace commands must be run with pnpm/corepack.');
    }

    return {
      command: process.execPath,
      args: [npmExecPath, ...args],
      shell: false,
    };
  }

  return {
    command: 'pnpm',
    args,
    shell: process.platform === 'win32',
  };
}

export function runPackageManager(args, options = {}) {
  const invocation = packageManagerInvocation(args);
  return spawnSync(invocation.command, invocation.args, {
    shell: invocation.shell,
    stdio: 'inherit',
    ...options,
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  let result;

  try {
    result = runPackageManager(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}
