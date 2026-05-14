import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function packageManagerInvocation(args) {
  const npmExecPath = process.env.npm_execpath;

  if (npmExecPath) {
    return {
      command: process.execPath,
      args: [npmExecPath, ...args],
      shell: false,
    };
  }

  return {
    command: 'npm',
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
  const result = runPackageManager(process.argv.slice(2));

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}
