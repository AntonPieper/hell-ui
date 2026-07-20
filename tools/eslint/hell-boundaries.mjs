/**
 * AST-based ESLint enforcement of @hell-ui/angular entrypoint dependency
 * boundaries (#259). Since #270 these rules are the only import-boundary
 * enforcement; tools/check-architecture.mjs keeps only durable concerns no
 * standard tool covers (entrypoint manifest integrity, package-output
 * integrity, optional-peer metadata, table adapter direction). The rules:
 *
 * - entrypoint-boundaries: which entrypoint categories may import which, and
 *   that cross-entrypoint imports go through the target's Package Entry Point
 *   specifier instead of relative deep imports into another entrypoint's
 *   source directory.
 * - optional-peer-isolation: optional peer dependencies stay inside the one
 *   entrypoint that owns them, and CDK table adapters stay out of the table
 *   surfaces entirely.
 * - no-internal-public-api-exports: generated public-api.ts files of
 *   non-internal entrypoints never export from internal directories or the
 *   named internal core modules.
 *
 * Entrypoint identities, source directories, specifiers, and categories all
 * come from the hell-entrypoint.json manifest sidecars via
 * tools/entrypoint-manifest.mjs — there is no second hand-written entrypoint
 * list. The category matrix below is boundary policy over those manifest
 * categories and is validated against them at load time.
 */
import { existsSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  entrypointCategories,
  entrypointPublicApiFiles,
  packageName,
} from '../entrypoint-manifest.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const entrypoints = entrypointPublicApiFiles();
const entrypointsByDirLength = [...entrypoints].sort(
  (a, b) => b.packageDir.length - a.packageDir.length,
);
const entrypointsBySpecifierLength = [...entrypoints].sort(
  (a, b) => b.specifier.length - a.specifier.length,
);
const publicApiEntrypoints = new Map(
  entrypoints.map((entrypoint) => [entrypoint.publicApiPath, entrypoint]),
);

// Which entrypoint categories may import which. Categories are the manifest's
// vocabulary; the edges are the boundary policy the architecture checks
// enforce today: features are terminal (only a feature's own sources may
// reference it), table primitives never depend on the TanStack adapter
// entrypoints, and nothing imports the root or testing surfaces from library
// code. Extending an edge is a deliberate one-line policy change here.
const allowedCategoryImports = new Map([
  // The generated root public API re-exports core only (Light Root Entry Point).
  [entrypointCategories.ROOT, new Set([entrypointCategories.CORE])],
  [entrypointCategories.CORE, new Set([entrypointCategories.CORE, entrypointCategories.INTERNAL])],
  [
    entrypointCategories.INTERNAL,
    new Set([entrypointCategories.CORE, entrypointCategories.INTERNAL]),
  ],
  [
    entrypointCategories.TESTING,
    new Set([entrypointCategories.CORE, entrypointCategories.INTERNAL]),
  ],
  [
    entrypointCategories.STYLED_PRIMITIVE,
    new Set([
      entrypointCategories.CORE,
      entrypointCategories.INTERNAL,
      entrypointCategories.STYLED_PRIMITIVE,
    ]),
  ],
  [
    entrypointCategories.MIXED_ENTRYPOINT,
    new Set([entrypointCategories.CORE, entrypointCategories.INTERNAL]),
  ],
  [
    entrypointCategories.COMPOSITE,
    new Set([
      entrypointCategories.CORE,
      entrypointCategories.INTERNAL,
      entrypointCategories.STYLED_PRIMITIVE,
      entrypointCategories.MIXED_ENTRYPOINT,
    ]),
  ],
  [
    entrypointCategories.FEATURE,
    new Set([
      entrypointCategories.CORE,
      entrypointCategories.INTERNAL,
      entrypointCategories.STYLED_PRIMITIVE,
      entrypointCategories.MIXED_ENTRYPOINT,
    ]),
  ],
  [
    entrypointCategories.TABLE_PRIMITIVES,
    new Set([entrypointCategories.CORE, entrypointCategories.INTERNAL]),
  ],
  [
    entrypointCategories.TANSTACK_TABLE_SHELL,
    new Set([
      entrypointCategories.CORE,
      entrypointCategories.INTERNAL,
      entrypointCategories.STYLED_PRIMITIVE,
      entrypointCategories.MIXED_ENTRYPOINT,
      entrypointCategories.TABLE_PRIMITIVES,
    ]),
  ],
  [
    entrypointCategories.TANSTACK_TABLE_BODY_STRATEGY,
    new Set([
      entrypointCategories.CORE,
      entrypointCategories.INTERNAL,
      entrypointCategories.TANSTACK_TABLE_SHELL,
    ]),
  ],
]);

assertCategoryMatrixMatchesManifestCategories();

function assertCategoryMatrixMatchesManifestCategories() {
  const knownCategories = new Set(Object.values(entrypointCategories));
  for (const category of knownCategories) {
    if (!allowedCategoryImports.has(category)) {
      throw new Error(
        `hell-boundaries: entrypoint category "${category}" from the entrypoint manifest has no import-boundary row`,
      );
    }
  }
  for (const [category, targets] of allowedCategoryImports) {
    if (!knownCategories.has(category)) {
      throw new Error(
        `hell-boundaries: import-boundary row "${category}" is not an entrypoint manifest category`,
      );
    }
    for (const target of targets) {
      if (!knownCategories.has(target)) {
        throw new Error(
          `hell-boundaries: import-boundary target "${target}" under "${category}" is not an entrypoint manifest category`,
        );
      }
    }
  }
}

// Optional-peer isolation edges: each optional peer dependency belongs to
// exactly one entrypoint, resolved through the manifest so a renamed or
// deleted entrypoint fails loudly here instead of silently skipping the edge.
const isolatedOptionalPeers = [
  {
    packagePrefixes: ['@codemirror/', '@lezer/'],
    owner: requireEntrypoint(`${packageName}/features/code-editor`),
  },
  {
    packagePrefixes: ['pdfjs-dist'],
    owner: requireEntrypoint(`${packageName}/features/pdf-viewer`),
  },
  {
    packagePrefixes: ['@tanstack/angular-table', '@tanstack/table'],
    owner: requireEntrypoint(`${packageName}/table-tanstack`),
  },
  {
    packagePrefixes: ['@tanstack/virtual'],
    owner: requireEntrypoint(`${packageName}/table-tanstack/virtual`),
  },
];

// Hell renders TanStack-owned table behavior with its own Table Primitives;
// a CDK table adapter inside the table surfaces would be a second engine
// (docs/adr/tanstack-table-shell.md).
const forbiddenZonePackages = [
  {
    packagePrefixes: ['@angular/cdk/'],
    zones: [
      requireEntrypoint(`${packageName}/table`),
      requireEntrypoint(`${packageName}/table-tanstack`),
    ],
    reason: 'table surfaces must not adopt a CDK table adapter',
  },
];

// Named internal core modules that public APIs must never re-export even from
// non-internal directories (mirrors the architecture checker's list).
const internalCoreModuleNames = new Set([
  'floating-dismissal',
  'floating-scope',
  'resize-behavior',
]);

const internalDirectoryNames = new Set(['internal', 'adapters', 'ng-primitives']);

function requireEntrypoint(specifier) {
  const entrypoint = entrypoints.find((candidate) => candidate.specifier === specifier);
  if (!entrypoint) {
    throw new Error(`hell-boundaries: entrypoint manifest has no entry point ${specifier}`);
  }
  return entrypoint;
}

function repoPath(filename) {
  return relative(root, filename).split(sep).join('/');
}

function entrypointForFile(rel) {
  return (
    entrypointsByDirLength.find(
      (entrypoint) => rel === entrypoint.packageDir || rel.startsWith(`${entrypoint.packageDir}/`),
    ) ?? null
  );
}

function entrypointForSpecifier(specifier) {
  return (
    entrypointsBySpecifierLength.find(
      (entrypoint) =>
        specifier === entrypoint.specifier || specifier.startsWith(`${entrypoint.specifier}/`),
    ) ?? null
  );
}

function isInsideEntrypoint(rel, entrypoint) {
  return rel === entrypoint.packageDir || rel.startsWith(`${entrypoint.packageDir}/`);
}

function isHellSpecifier(specifier) {
  return specifier === packageName || specifier.startsWith(`${packageName}/`);
}

function resolveRelativeModuleFile(rel, specifier) {
  const withoutQuery = specifier.replace(/[?#].*$/, '');
  const basePath = resolve(root, dirname(rel), withoutQuery);
  const candidates = [basePath, `${basePath}.ts`, `${basePath}.tsx`, join(basePath, 'index.ts')];
  const target = candidates.find(
    (candidate) => existsSync(candidate) && statSync(candidate).isFile(),
  );
  return target ? repoPath(target) : null;
}

function moduleSpecifierListeners(check) {
  return {
    ImportDeclaration(node) {
      check(node.source);
    },
    ExportNamedDeclaration(node) {
      if (node.source) check(node.source);
    },
    ExportAllDeclaration(node) {
      check(node.source);
    },
    ImportExpression(node) {
      if (node.source.type === 'Literal' && typeof node.source.value === 'string') {
        check(node.source);
      }
    },
  };
}

const entrypointBoundariesRule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce which entrypoint categories may import which, using the hell-entrypoint.json manifest as the source of truth',
    },
    schema: [],
    messages: {
      forbiddenCategoryEdge:
        '{{targetSpecifier}} ({{targetCategory}}) may not be imported from the {{sourceId}} entry point ({{sourceCategory}}); allowed target categories: {{allowed}}.',
      unknownEntrypoint:
        '{{specifier}} does not match any Package Entry Point in the entrypoint manifest; import a declared entry point specifier.',
      relativeCrossEntrypoint:
        'Relative import {{specifier}} reaches into the {{targetId}} entry point source directory from {{sourceId}}; cross-entrypoint imports must use the public specifier {{targetSpecifier}}.',
    },
  },
  create(context) {
    const rel = repoPath(context.physicalFilename ?? context.filename);
    const source = entrypointForFile(rel);
    if (!source) return {};

    // Generated public-api.ts files are rendered from the manifest and pinned
    // byte-for-byte by check-architecture; their manifest-declared relative
    // exports (e.g. the root's ./core/public-api) are not deep imports.
    const isGeneratedPublicApi = publicApiEntrypoints.has(rel);

    return moduleSpecifierListeners((specifierNode) => {
      const specifier = specifierNode.value;
      if (typeof specifier !== 'string') return;

      if (specifier.startsWith('.')) {
        if (isGeneratedPublicApi) return;
        const targetRel = resolveRelativeModuleFile(rel, specifier);
        if (!targetRel) return;
        const target = entrypointForFile(targetRel);
        if (!target || target.id === source.id) return;
        context.report({
          node: specifierNode,
          messageId: 'relativeCrossEntrypoint',
          data: {
            specifier,
            sourceId: source.id,
            targetId: target.id,
            targetSpecifier: target.specifier,
          },
        });
        return;
      }

      if (!isHellSpecifier(specifier)) return;
      const target = entrypointForSpecifier(specifier);
      if (!target) {
        context.report({ node: specifierNode, messageId: 'unknownEntrypoint', data: { specifier } });
        return;
      }
      if (target.id === source.id) return;

      const allowed = allowedCategoryImports.get(source.category);
      if (allowed.has(target.category)) return;
      context.report({
        node: specifierNode,
        messageId: 'forbiddenCategoryEdge',
        data: {
          targetSpecifier: target.specifier,
          targetCategory: target.category,
          sourceId: source.id,
          sourceCategory: source.category,
          allowed: [...allowed].join(', ') || '(none)',
        },
      });
    });
  },
};

const optionalPeerIsolationRule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Keep optional peer dependencies inside the one entrypoint that owns them, per the entrypoint manifest',
    },
    schema: [],
    messages: {
      outsideOwner:
        '{{specifier}} may only be imported inside the {{ownerSpecifier}} entry point ({{ownerDir}}).',
      forbiddenZone:
        '{{specifier}} may not be imported inside the {{zoneId}} entry point; {{reason}}.',
    },
  },
  create(context) {
    const rel = repoPath(context.physicalFilename ?? context.filename);

    return moduleSpecifierListeners((specifierNode) => {
      const specifier = specifierNode.value;
      if (typeof specifier !== 'string' || specifier.startsWith('.')) return;

      for (const isolation of isolatedOptionalPeers) {
        if (!isolation.packagePrefixes.some((prefix) => specifier.startsWith(prefix))) continue;
        if (isInsideEntrypoint(rel, isolation.owner)) continue;
        context.report({
          node: specifierNode,
          messageId: 'outsideOwner',
          data: {
            specifier,
            ownerSpecifier: isolation.owner.specifier,
            ownerDir: isolation.owner.packageDir,
          },
        });
      }

      for (const zonePolicy of forbiddenZonePackages) {
        if (!zonePolicy.packagePrefixes.some((prefix) => specifier.startsWith(prefix))) continue;
        const zone = zonePolicy.zones.find((candidate) => isInsideEntrypoint(rel, candidate));
        if (!zone) continue;
        context.report({
          node: specifierNode,
          messageId: 'forbiddenZone',
          data: { specifier, zoneId: zone.id, reason: zonePolicy.reason },
        });
      }
    });
  },
};

const noInternalPublicApiExportsRule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Public API files of non-internal entrypoints must not export from internal directories or named internal core modules',
    },
    schema: [],
    messages: {
      internalDirectoryExport:
        'Public API {{publicApiPath}} exports {{exportPath}} from internal directory "{{internalSegment}}".',
      internalModuleExport:
        'Public API {{publicApiPath}} exports internal core module "{{moduleName}}".',
    },
  },
  create(context) {
    const rel = repoPath(context.physicalFilename ?? context.filename);
    const entrypoint = publicApiEntrypoints.get(rel);
    if (!entrypoint || entrypoint.category === entrypointCategories.INTERNAL) return {};

    const checkExportSource = (specifierNode) => {
      const exportPath = specifierNode.value;
      if (typeof exportPath !== 'string') return;

      const resolved = exportPath.startsWith('.')
        ? join(dirname(rel), exportPath).split(sep).join('/')
        : exportPath;
      const segments = resolved.split('/').filter(Boolean);

      const internalSegment = segments.find((segment) => internalDirectoryNames.has(segment));
      if (internalSegment) {
        context.report({
          node: specifierNode,
          messageId: 'internalDirectoryExport',
          data: { publicApiPath: rel, exportPath, internalSegment },
        });
        return;
      }

      const moduleName = segments[segments.length - 1];
      if (internalCoreModuleNames.has(moduleName)) {
        context.report({
          node: specifierNode,
          messageId: 'internalModuleExport',
          data: { publicApiPath: rel, moduleName },
        });
      }
    };

    return {
      ExportNamedDeclaration(node) {
        if (node.source) checkExportSource(node.source);
      },
      ExportAllDeclaration(node) {
        checkExportSource(node.source);
      },
    };
  },
};

export default {
  meta: { name: 'hell-boundaries' },
  rules: {
    'entrypoint-boundaries': entrypointBoundariesRule,
    'optional-peer-isolation': optionalPeerIsolationRule,
    'no-internal-public-api-exports': noInternalPublicApiExportsRule,
  },
};
