const packageName = '@hell-ui/angular';
const pdfPackageName = '@hell-ui/pdf-viewer';
const libraryRoot = 'projects/hell';
const pdfLibraryRoot = 'projects/hell-pdf-viewer';

export const entrypointManifest = {
  root: {
    id: 'root',
    specifier: packageName,
    publicApiPath: `${libraryRoot}/src/public-api.ts`,
    exports: ['./lib/public-api-core'],
    header: [
      '/*',
      ' * Public API Surface of @hell-ui/angular — Heinrich Element Library',
      ' */',
      '',
      '// The root entry point is intentionally lightweight/core-only.',
    ],
    footer: [
      '// Primitives remain available through @hell-ui/angular/primitives and narrow',
      '// primitive entry points such as @hell-ui/angular/button.',
      '// Composites and optional features are available through entry points:',
      '// - @hell-ui/angular/composites',
      '// - @hell-ui/angular/table (table primitives)',
      '// - @hell-ui/angular/data-table (simple native data table)',
      '// - @hell-ui/angular/table-tanstack (TanStack Table adapter)',
      '// - @hell-ui/angular/table-virtual (TanStack Virtual adapter)',
      '// - @hell-ui/angular/table-cdk (Angular CDK Table skin adapter)',
      '// - @hell-ui/angular/features/code-editor (kept optional CodeMirror entry point),',
      '//   @hell-ui/angular/features/audio-transcript (optional audio transcript provider)',
    ],
  },
  explicit: [
    {
      id: 'core',
      specifier: `${packageName}/core`,
      packageDir: `${libraryRoot}/core`,
      publicApiPath: `${libraryRoot}/src/lib/public-api-core.ts`,
      entryFile: '../src/lib/public-api-core.ts',
      exports: [
        './core/types',
        './core/styleable',
        './core/search',
        './core/labels',
        './core/hotkeys',
        './core/floating-element',
      ],
    },
    {
      id: 'testing',
      specifier: `${packageName}/testing`,
      packageDir: `${libraryRoot}/testing`,
      publicApiPath: `${libraryRoot}/src/testing/public-api.ts`,
      entryFile: '../src/testing/public-api.ts',
      exports: [
        './button-harness',
        './dialog-harness',
        './interactive-harnesses',
        './table-harness',
      ],
    },
    {
      id: 'table',
      specifier: `${packageName}/table`,
      packageDir: `${libraryRoot}/table`,
      publicApiPath: `${libraryRoot}/src/lib/public-api-table.ts`,
      entryFile: '../src/lib/public-api-table.ts',
      exports: ['./table/table'],
      header: [
        '/**',
        ' * @beta Table primitive entry point for semantic table utilities and model helpers.',
        ' */',
      ],
    },
    {
      id: 'data-table',
      specifier: `${packageName}/data-table`,
      packageDir: `${libraryRoot}/data-table`,
      publicApiPath: `${libraryRoot}/src/lib/public-api-data-table.ts`,
      entryFile: '../src/lib/public-api-data-table.ts',
      exports: ['./data-table/data-table'],
      header: [
        '/**',
        ' * @experimental Simple native-table data renderer for HellColumnDef rows.',
        ' */',
      ],
    },
    {
      id: 'table-tanstack',
      specifier: `${packageName}/table-tanstack`,
      packageDir: `${libraryRoot}/table-tanstack`,
      publicApiPath: `${libraryRoot}/src/lib/public-api-table-tanstack.ts`,
      entryFile: '../src/lib/public-api-table-tanstack.ts',
      exports: ['./table-tanstack/table-tanstack'],
      header: [
        '/**',
        ' * @experimental TanStack Table adapter entry point. Keeps TanStack behind this optional peer boundary.',
        ' */',
      ],
    },
    {
      id: 'table-virtual',
      specifier: `${packageName}/table-virtual`,
      packageDir: `${libraryRoot}/table-virtual`,
      publicApiPath: `${libraryRoot}/src/lib/public-api-table-virtual.ts`,
      entryFile: '../src/lib/public-api-table-virtual.ts',
      exports: ['./table-virtual/table-virtual'],
      header: [
        '/**',
        ' * @experimental TanStack Virtual adapter entry point for dynamic Hell row parts.',
        ' */',
      ],
    },
    {
      id: 'table-cdk',
      specifier: `${packageName}/table-cdk`,
      packageDir: `${libraryRoot}/table-cdk`,
      publicApiPath: `${libraryRoot}/src/lib/public-api-table-cdk.ts`,
      entryFile: '../src/lib/public-api-table-cdk.ts',
      exports: ['./table-cdk/table-cdk'],
      header: [
        '/**',
        ' * @experimental Angular CDK Table skin adapter entry point.',
        ' */',
      ],
    },
  ],
  groups: [
    {
      id: 'primitives',
      singular: 'primitive',
      sourceDir: `${libraryRoot}/src/lib/primitives`,
      internalDirectories: ['adapters'],
      aggregate: {
        id: 'primitives',
        specifier: `${packageName}/primitives`,
        packageDir: `${libraryRoot}/primitives`,
        publicApiPath: `${libraryRoot}/src/lib/public-api-primitives.ts`,
        entryFile: '../src/lib/public-api-primitives.ts',
      },
      entryTemplate: {
        specifier: `${packageName}/{slug}`,
        packageDir: `${libraryRoot}/{slug}`,
        publicApiPath: `${libraryRoot}/src/lib/public-api-primitive-{slug}.ts`,
        entryFile: '../src/lib/public-api-primitive-{slug}.ts',
        exportPath: './primitives/{slug}/{slug}',
      },
      entries: [
        'button',
        'card',
        'separator',
        'tag',
        'avatar',
        'input',
        'search',
        'listbox',
        'field',
        'checkbox',
        'switch',
        'radio',
        'toggle',
        'tabs',
        'accordion',
        'dialog',
        'popover',
        'flyout',
        'tooltip',
        'menu',
        'combobox',
        'select',
        'progress',
        'slider',
        'skeleton',
        'breadcrumbs',
        'icon',
        'pagination',
        'date-picker',
      ],
    },
    {
      id: 'composites',
      singular: 'composite',
      sourceDir: `${libraryRoot}/src/lib/composites`,
      internalDirectories: [],
      aggregate: {
        id: 'composites',
        specifier: `${packageName}/composites`,
        packageDir: `${libraryRoot}/composites`,
        publicApiPath: `${libraryRoot}/src/lib/public-api-composites.ts`,
        entryFile: '../src/lib/public-api-composites.ts',
      },
      entryTemplate: {
        specifier: `${packageName}/{slug}`,
        packageDir: `${libraryRoot}/{slug}`,
        publicApiPath: `${libraryRoot}/src/lib/public-api-composite-{slug}.ts`,
        entryFile: '../src/lib/public-api-composite-{slug}.ts',
        exportPath: './composites/{slug}/{slug}',
      },
      entries: [
        'date-input',
        'time-input',
        'avatar-group',
        'dialpad',
        'drop-zone',
        'audio-player',
        'resizable',
        'split-view',
        'app-shell',
        'toast',
        'omnibar',
      ],
    },
    {
      id: 'features',
      singular: 'feature',
      sourceDir: `${libraryRoot}/src/lib/features`,
      internalDirectories: ['assets', 'table-utilities'],
      entryTemplate: {
        specifier: `${packageName}/features/{slug}`,
        packageDir: `${libraryRoot}/features/{slug}`,
        publicApiPath: `${libraryRoot}/src/lib/public-api-feature-{slug}.ts`,
        entryFile: '../../src/lib/public-api-feature-{slug}.ts',
        exportPath: './features/{slug}/{slug}',
      },
      entryOverrides: {
        'audio-transcript': {
          header: [
            '/**',
            ' * @experimental Optional browser transcript provider for @hell-ui/angular/audio-player.',
            ' * Import only where best-effort transcript capture is deliberately enabled.',
            ' */',
          ],
        },
        'code-editor': {
          header: [
            '/**',
            ' * @experimental Kept optional CodeMirror feature entry point. Keep behind lazy/client-only browser boundaries.',
            ' */',
          ],
        },
      },
      entries: ['audio-transcript', 'code-editor'],
    },
  ],
};

export const styleEntrypointManifest = [
  styleEntrypoint(packageName, './styles', 'experimental', 'composite', 'kitchen-sink-styles'),
  styleEntrypoint(packageName, './styles/tokens', 'stable', 'primitive', 'primitives-css'),
  styleEntrypoint(packageName, './styles/primitives', 'stable', 'primitive', 'primitives-css'),
  styleEntrypoint(packageName, './styles/composites', 'beta', 'composite', 'composites-css'),
  styleEntrypoint(packageName, './styles/table', 'beta', 'table', 'table'),
  styleEntrypoint(packageName, './styles/features/code-editor', 'experimental', 'code-editor', 'code-editor'),
  styleEntrypoint(packageName, './styles/kitchen-sink', 'experimental', 'composite', 'kitchen-sink-styles'),
  styleEntrypoint(packageName, './styles/components/*', 'beta', 'primitive', 'primitives-css', 'style-pattern'),
  ...componentStyleEntrypoints(
    packageName,
    [
      'overlay',
      'button',
      'card',
      'separator',
      'input',
      'field',
      'checkbox',
      'radio',
      'switch',
      'toggle',
      'tabs',
      'accordion',
      'dialog',
      'popover',
      'flyout',
      'menu',
      'combobox',
      'select',
      'tooltip',
      'avatar',
      'icon',
      'tag',
      'skeleton',
      'progress',
      'slider',
      'breadcrumbs',
      'pagination',
      'date-picker',
    ],
    'stable',
    'primitive',
    'primitives-css',
  ),
  ...componentStyleEntrypoints(
    packageName,
    [
      'avatar-group',
      'date-input',
      'time-input',
      'app-shell',
      'resizable',
      'split-view',
      'audio-player',
      'drop-zone',
      'dialpad',
      'toast',
      'omnibar',
    ],
    'beta',
    'composite',
    'composites-css',
  ),
  ...componentStyleEntrypoints(packageName, ['table', 'table-renderer'], 'beta', 'table', 'table'),
  styleEntrypoint(packageName, './styles/components/code-editor', 'experimental', 'code-editor', 'code-editor'),
  styleEntrypoint(pdfPackageName, './styles', 'experimental', 'pdf-viewer', 'pdf-viewer'),
  styleEntrypoint(pdfPackageName, './styles/pdf-viewer', 'experimental', 'pdf-viewer', 'pdf-viewer'),
  styleEntrypoint(pdfPackageName, './styles/components/pdf-viewer', 'experimental', 'pdf-viewer', 'pdf-viewer'),
];

export function entrypointPublicApiFiles() {
  return [
    entrypointManifest.root,
    ...entrypointManifest.explicit,
    ...aggregateEntrypoints(),
    ...individualEntrypoints(),
  ];
}

export function entrypointPolicyEntries() {
  return [
    ...entrypointPublicApiFiles().map((entrypoint) => ({
      ...entrypoint,
      kind: 'typescript',
      ownerPackage: packageName,
      ...entrypointPolicy(entrypoint),
    })),
    {
      id: 'pdf-viewer',
      specifier: pdfPackageName,
      kind: 'typescript',
      ownerPackage: pdfPackageName,
      publicApiPath: `${pdfLibraryRoot}/src/public-api.ts`,
      packageDir: pdfLibraryRoot,
      tier: 'experimental',
      peerTier: 'pdf-viewer',
      consumerScenario: 'pdf-viewer',
      apiReport: excludedApiReport('experimental split package; API report promotion is explicit policy work'),
    },
  ];
}

export function styleEntrypointPolicyEntries() {
  return styleEntrypointManifest.map((entrypoint) => ({ ...entrypoint }));
}

export function apiReportPolicyEntries() {
  return entrypointPolicyEntries().filter((entrypoint) => entrypoint.apiReport.expectation !== 'covered-by');
}

export function secondaryPackageEntrypoints() {
  return [
    ...entrypointManifest.explicit,
    ...aggregateEntrypoints(),
    ...individualEntrypoints(),
  ].map((entrypoint) => ({
    ...entrypoint,
    packagePath: `${entrypoint.packageDir}/ng-package.json`,
  }));
}

export function entrypointTsconfigPaths() {
  return entrypointPublicApiFiles().map((entrypoint) => ({
    specifier: entrypoint.specifier,
    path: `./${entrypoint.publicApiPath}`,
  }));
}

export function entrypointSourceGroups() {
  return entrypointManifest.groups.map((group) => ({
    id: group.id,
    sourceDir: group.sourceDir,
    internalDirectories: [...group.internalDirectories],
    entries: [...group.entries],
  }));
}

export function renderPublicApiFile(entrypoint) {
  const lines = [];
  if (entrypoint.header?.length) {
    lines.push(...entrypoint.header);
  }
  lines.push(...entrypoint.exports.map((exportPath) => `export * from '${exportPath}';`));
  if (entrypoint.extraExports?.length) {
    lines.push(...entrypoint.extraExports);
  }
  if (entrypoint.footer?.length) {
    lines.push('', ...entrypoint.footer);
  }
  return `${lines.join('\n')}\n`;
}

export function renderNgPackageFile(entrypoint) {
  return `${JSON.stringify({ lib: { entryFile: entrypoint.entryFile } }, null, 2)}\n`;
}

function aggregateEntrypoints() {
  return entrypointManifest.groups
    .filter((group) => group.aggregate)
    .map((group) => ({
      ...group.aggregate,
      exports: group.entries.map((slug) => interpolate(group.entryTemplate.exportPath, slug)),
    }));
}

function individualEntrypoints() {
  return entrypointManifest.groups.flatMap((group) =>
    group.entries.map((slug) => {
      const override = group.entryOverrides?.[slug] ?? {};
      return {
        id: `${group.singular}:${slug}`,
        slug,
        group: group.id,
        specifier: interpolate(group.entryTemplate.specifier, slug),
        packageDir: interpolate(group.entryTemplate.packageDir, slug),
        publicApiPath: interpolate(group.entryTemplate.publicApiPath, slug),
        entryFile: interpolate(group.entryTemplate.entryFile, slug),
        exports: override.exports ?? [interpolate(group.entryTemplate.exportPath, slug)],
        header: override.header,
        footer: override.footer,
        extraExports: override.extraExports,
      };
    }),
  );
}

function interpolate(template, slug) {
  return template.replaceAll('{slug}', slug);
}

function entrypointPolicy(entrypoint) {
  if (entrypoint.id === 'root') {
    return {
      tier: 'stable',
      peerTier: 'core',
      consumerScenario: 'root-core',
      apiReport: requiredApiReport('hell-ui-angular.api.md'),
    };
  }

  switch (entrypoint.id) {
    case 'core':
      return {
        tier: 'stable',
        peerTier: 'core',
        consumerScenario: 'core',
        apiReport: requiredApiReport('hell-ui-angular-core.api.md'),
      };
    case 'testing':
      return {
        tier: 'stable',
        peerTier: 'core',
        consumerScenario: 'testing',
        apiReport: requiredApiReport('hell-ui-angular-testing.api.md'),
      };
    case 'table':
      return {
        tier: 'beta',
        peerTier: 'table',
        consumerScenario: 'table',
        apiReport: excludedApiReport('HELL-114 owns promoted-beta API report coverage for table'),
      };
    case 'data-table':
      return {
        tier: 'experimental',
        peerTier: 'table',
        consumerScenario: 'data-table',
        apiReport: excludedApiReport('experimental simple data-table entrypoint'),
      };
    case 'table-tanstack':
      return {
        tier: 'experimental',
        peerTier: 'table-tanstack',
        consumerScenario: 'table-tanstack',
        apiReport: excludedApiReport('experimental TanStack adapter entrypoint'),
      };
    case 'table-virtual':
      return {
        tier: 'experimental',
        peerTier: 'table-virtual',
        consumerScenario: 'table-virtual',
        apiReport: excludedApiReport('experimental TanStack Virtual adapter entrypoint'),
      };
    case 'table-cdk':
      return {
        tier: 'experimental',
        peerTier: 'table-cdk',
        consumerScenario: 'table-cdk',
        apiReport: excludedApiReport('experimental CDK table skin entrypoint'),
      };
    case 'primitives':
      return {
        tier: 'stable',
        peerTier: 'primitive',
        consumerScenario: 'primitives-css',
        apiReport: requiredApiReport('hell-ui-angular-primitives.api.md'),
      };
    case 'composites':
      return {
        tier: 'beta',
        peerTier: 'composite',
        consumerScenario: 'composites-css',
        apiReport: excludedApiReport('HELL-114 owns promoted-beta API report coverage for composites'),
      };
    default:
      break;
  }

  if (entrypoint.group === 'primitives') {
    return {
      tier: 'stable',
      peerTier: 'primitive',
      consumerScenario: entrypoint.slug === 'button' ? 'button-unstyled' : 'primitives-css',
      apiReport: coveredApiReport('@hell-ui/angular/primitives'),
    };
  }

  if (entrypoint.group === 'composites') {
    const scenarioBySlug = {
      'app-shell': 'app-shell',
      'audio-player': 'audio-player',
    };
    return {
      tier: 'beta',
      peerTier: 'composite',
      consumerScenario: scenarioBySlug[entrypoint.slug] ?? 'composites-css',
      apiReport: excludedApiReport('HELL-114 owns promoted-beta API report coverage for composites'),
    };
  }

  if (entrypoint.group === 'features') {
    if (entrypoint.slug === 'audio-transcript') {
      return {
        tier: 'experimental',
        peerTier: 'audio-transcript',
        consumerScenario: 'audio-transcript',
        apiReport: excludedApiReport('experimental browser speech transcript provider'),
      };
    }
    if (entrypoint.slug === 'code-editor') {
      return {
        tier: 'experimental',
        peerTier: 'code-editor',
        consumerScenario: 'code-editor',
        apiReport: excludedApiReport('experimental CodeMirror feature entrypoint'),
      };
    }
  }

  return {
    tier: 'unclassified',
    peerTier: 'core',
    consumerScenario: 'root-core',
    apiReport: excludedApiReport(`unclassified entrypoint ${entrypoint.specifier}`),
  };
}

function componentStyleEntrypoints(ownerPackage, slugs, tier, peerTier, consumerScenario) {
  return slugs.map((slug) =>
    styleEntrypoint(ownerPackage, `./styles/components/${slug}`, tier, peerTier, consumerScenario),
  );
}

function styleEntrypoint(ownerPackage, exportPath, tier, peerTier, consumerScenario, kind = 'style') {
  return {
    id: `${ownerPackage}:${exportPath}`,
    specifier: `${ownerPackage}/${exportPath.replace(/^\.\//, '')}`,
    kind,
    ownerPackage,
    exportPath,
    tier,
    peerTier,
    consumerScenario,
    apiReport: { expectation: 'not-applicable' },
  };
}

function requiredApiReport(reportFileName) {
  return { expectation: 'required', reportFileName };
}

function coveredApiReport(coveredBy) {
  return { expectation: 'covered-by', coveredBy };
}

function excludedApiReport(reason) {
  return { expectation: 'excluded', reason };
}
