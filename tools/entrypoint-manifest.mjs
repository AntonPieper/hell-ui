const packageName = '@hell-ui/angular';
const libraryRoot = 'projects/hell';

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
      '// Composites and features are available through entry points:',
      '// - @hell-ui/angular/composites',
      '// - @hell-ui/angular/features/data-table (legacy), @hell-ui/angular/features/table-utilities,',
      '//   @hell-ui/angular/features/code-editor, @hell-ui/angular/features/pdf-viewer',
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
      internalDirectories: ['assets'],
      entryTemplate: {
        specifier: `${packageName}/features/{slug}`,
        packageDir: `${libraryRoot}/features/{slug}`,
        publicApiPath: `${libraryRoot}/src/lib/public-api-feature-{slug}.ts`,
        entryFile: '../../src/lib/public-api-feature-{slug}.ts',
        exportPath: './features/{slug}/{slug}',
      },
      entryOverrides: {
        'code-editor': {
          header: [
            '/**',
            ' * @experimental CodeMirror feature entry point. Keep behind browser-only/lazy boundaries.',
            ' */',
          ],
        },
        'data-table': {
          header: [
            '/**',
            ' * @deprecated Use `@hell-ui/angular/features/table-utilities` instead.',
            ' */',
          ],
        },
        'pdf-viewer': {
          header: [
            '/**',
            ' * @experimental PDF.js feature entry point. Apps own worker/browser compatibility.',
            ' */',
          ],
          extraExports: ["export type { HellPdfWorkerSource } from './features/pdf-viewer/pdf-viewer.adapter';"],
        },
      },
      entries: [
        'code-editor',
        'data-table',
        'table-utilities',
        'pdf-viewer',
      ],
    },
  ],
};

export function entrypointPublicApiFiles() {
  return [
    entrypointManifest.root,
    ...entrypointManifest.explicit,
    ...aggregateEntrypoints(),
    ...individualEntrypoints(),
  ];
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
