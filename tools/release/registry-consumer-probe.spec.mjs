import { describe, expect, it } from 'vitest';

import {
  auditInstall,
  compareRegistryPeerContract,
  composeConsumerManifest,
  composeConsumerNpmrc,
  composeConsumerWorkspaceYaml,
  optionalPeerNames,
  resolveExportTargets,
} from './registry-consumer-probe.mjs';

const version = '0.4.0';
const packument = (entry) => ({ versions: { [version]: entry } });

describe('optionalPeerNames', () => {
  it('collects only optional: true entries, sorted', () => {
    expect(
      optionalPeerNames({
        peerDependenciesMeta: {
          b: { optional: true },
          a: { optional: true },
          c: { optional: false },
          d: {},
        },
      }),
    ).toEqual(['a', 'b']);
  });

  it('is empty for the manifest this repo ships (no peerDependenciesMeta)', () => {
    expect(optionalPeerNames({})).toEqual([]);
  });
});

describe('compareRegistryPeerContract', () => {
  const declaredPeers = ['@angular/core', 'rxjs'];

  it('accepts a served contract that matches the declared one', () => {
    const result = compareRegistryPeerContract({
      packument: packument({ peerDependencies: { '@angular/core': '^22.0.0', rxjs: '^7.8.0' } }),
      version,
      declaredPeers,
      expectedOptional: [],
    });
    expect(result.failures).toEqual([]);
    expect(result.peerCount).toBe(2);
  });

  it('reports a peer the registry serves but the manifest does not declare', () => {
    const result = compareRegistryPeerContract({
      packument: packument({
        peerDependencies: { '@angular/core': '^22.0.0', rxjs: '^7.8.0', tailwindcss: '^4.0.0' },
      }),
      version,
      declaredPeers,
      expectedOptional: [],
    });
    expect(result.failures.join('\n')).toContain('does not declare: tailwindcss');
    expect(result.missing).toContain('tailwindcss');
  });

  it('reports a declared peer the registry drops', () => {
    const result = compareRegistryPeerContract({
      packument: packument({ peerDependencies: { '@angular/core': '^22.0.0' } }),
      version,
      declaredPeers,
      expectedOptional: [],
    });
    expect(result.failures.join('\n')).toContain('drops declared peer(s): rxjs');
  });

  it('reports optional flags the registry fails to serve', () => {
    const result = compareRegistryPeerContract({
      packument: packument({
        peerDependencies: { '@angular/core': '^22.0.0', rxjs: '^7.8.0', tailwindcss: '^4.0.0' },
      }),
      version,
      declaredPeers: [...declaredPeers, 'tailwindcss'],
      expectedOptional: ['tailwindcss'],
    });
    expect(result.failures.join('\n')).toContain('optional in the published package');
    expect(result.served).toEqual([]);
  });

  it('fails when the registry has no entry for the version', () => {
    const result = compareRegistryPeerContract({
      packument: { versions: {} },
      version,
      declaredPeers,
      expectedOptional: [],
    });
    expect(result.failures).toEqual([`The registry metadata carries no ${version} entry to compare.`]);
  });
});

describe('composeConsumerManifest', () => {
  const base = {
    version,
    peerVersions: { rxjs: '7.8.2' },
    devVersions: { typescript: '6.0.3' },
    packageManager: 'pnpm@11.21.0',
  };

  it('depends on hell-ui through the npm: alias at the audited version', () => {
    const manifest = composeConsumerManifest({ ...base, overrides: {} });
    expect(manifest.dependencies['hell-ui']).toBe(`npm:@hell-ui/angular@${version}`);
    expect(manifest.packageManager).toBe('pnpm@11.21.0');
    expect(manifest.pnpm).toBeUndefined();
  });

  it('carries the repo overrides only when there are any', () => {
    const manifest = composeConsumerManifest({
      ...base,
      overrides: { '@phenomnomnominal/tsquery': '6.2.0' },
    });
    expect(manifest.pnpm.overrides).toEqual({ '@phenomnomnominal/tsquery': '6.2.0' });
  });
});

describe('composeConsumerNpmrc', () => {
  it('routes the scope, binds the token host-relative, and pins the posture', () => {
    const npmrc = composeConsumerNpmrc({
      registryUrl: 'https://example.invalid/api/v4/projects/1/packages/npm/',
      token: 'secret',
    });
    expect(npmrc).toContain('@hell-ui:registry=https://example.invalid/api/v4/projects/1/packages/npm/');
    expect(npmrc).toContain('//example.invalid/api/v4/projects/1/packages/npm/:_authToken=secret');
    expect(npmrc).toContain('strict-peer-dependencies=true');
    expect(npmrc).toContain('auto-install-peers=false');
  });
});

describe('composeConsumerWorkspaceYaml', () => {
  it('writes the pnpm 11 posture and quotes override entries', () => {
    const yaml = composeConsumerWorkspaceYaml({ overrides: { '@scope/pkg': '1.2.3' } });
    expect(yaml).toBe(
      'strictPeerDependencies: true\nautoInstallPeers: false\noverrides:\n  "@scope/pkg": "1.2.3"\n',
    );
  });
});

describe('auditInstall', () => {
  const goodManifest = {
    name: '@hell-ui/angular',
    version,
    exports: { '.': './fesm2022/hell-ui.mjs', './button': './fesm2022/button.mjs' },
  };

  it('passes an install that resolved the published package into the scratch consumer', () => {
    const { failures, exportKeys } = auditInstall({
      installedManifest: goodManifest,
      installedRealPath: '/scratch/node_modules/.pnpm/x/node_modules/@hell-ui/angular',
      scratchRoot: '/scratch',
      version,
    });
    expect(failures).toEqual([]);
    expect(exportKeys).toEqual(['.', './button']);
  });

  it('rejects a wrong package, a wrong version, and a path outside the scratch consumer', () => {
    const { failures } = auditInstall({
      installedManifest: { name: 'hell-ui', version: '0.0.0', exports: {} },
      installedRealPath: '/somewhere/else',
      scratchRoot: '/scratch',
      version,
    });
    expect(failures.join('\n')).toContain('the npm: alias');
    expect(failures.join('\n')).toContain('The installed version');
    expect(failures.join('\n')).toContain('outside the scratch consumer');
    expect(failures.join('\n')).toContain('root entry point');
  });
});

describe('resolveExportTargets', () => {
  it('flattens nested conditions to the files they name', () => {
    expect(
      resolveExportTargets({
        types: './types/button.d.ts',
        default: { import: './fesm2022/button.mjs' },
      }),
    ).toEqual(['./types/button.d.ts', './fesm2022/button.mjs']);
  });
});
