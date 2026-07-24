import eslint from '@eslint/js';
import angular from 'angular-eslint';
import tseslint from 'typescript-eslint';

import hellBoundaries from './tools/eslint/hell-boundaries.mjs';

export default tseslint.config(
  {
    ignores: [
      '**/.angular/**',
      '.claude/**',
      'coverage/**',
      'dist/**',
      'node_modules/**',
      'test-results/**',
    ],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/component-selector': 'off',
      '@angular-eslint/directive-selector': 'off',
      '@angular-eslint/no-input-rename': 'off',
      '@angular-eslint/no-output-native': 'off',
      '@angular-eslint/use-lifecycle-interface': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
  {
    files: ['packages/angular/**/*.ts', 'apps/docs/src/**/*.ts'],
    ignores: ['packages/angular/**/*.spec.ts', 'apps/docs/src/**/*.spec.ts'],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Angular ElementRef, DebugElement, and several wrapped primitive APIs
      // intentionally expose `any`. Keep the type-aware correctness preset,
      // but do not turn those framework seams into repo-wide casting churn.
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      // Promise-returning adapter implementations may intentionally use async
      // to normalize synchronous browser failures into their Promise contract.
      '@typescript-eslint/require-await': 'off',
    },
  },
  {
    // Library production code: style customization goes through the Part
    // Style Map (never NgClass), host bindings use decorator host metadata,
    // and browser globals stay behind injected seams (justified inline
    // disables mark the few SSR-guarded escape hatches).
    files: ['packages/angular/**/*.ts'],
    ignores: ['packages/angular/**/*.spec.ts', 'packages/angular/test-setup.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@angular/common',
              importNames: ['NgClass'],
              message: 'Style customization must use the Part Style Map, data attributes, and CSS vars instead of NgClass.',
            },
            {
              name: '@angular/core',
              importNames: ['HostBinding', 'HostListener'],
              message: 'Use the `host` metadata object in the component/directive decorator instead of @HostBinding/@HostListener.',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        ...[
          'document',
          'window',
          'ResizeObserver',
          'IntersectionObserver',
          'MutationObserver',
          'requestAnimationFrame',
          'cancelAnimationFrame',
        ].map((name) => ({
          name,
          message: `Access ${name} through an injected seam (DOCUMENT, ownerDocument, defaultView) so SSR and portalled DOM stay correct; add a justified eslint-disable for deliberate typeof guards.`,
        })),
      ],
    },
  },
  {
    // Entrypoint dependency boundaries (#259, #270): category import edges,
    // internal-directory access, and optional-peer isolation. Entrypoint
    // identities and categories derive from the hell-entrypoint.json manifest
    // sidecars (tools/entrypoint-manifest.mjs); these AST rules are the only
    // import-boundary enforcement — the architecture checker keeps only
    // durable manifest, package-output, peer-metadata, and table-direction
    // concerns.
    files: ['packages/angular/**/*.ts'],
    ignores: ['packages/angular/**/*.spec.ts', 'packages/angular/test-setup.ts'],
    plugins: { 'hell-boundaries': hellBoundaries },
    rules: {
      'hell-boundaries/entrypoint-boundaries': 'error',
      'hell-boundaries/optional-peer-isolation': 'error',
      'hell-boundaries/no-internal-public-api-exports': 'error',
    },
  },
  {
    // Docs demonstrate narrow import-path entry points (Light Root Entry
    // Point): the root specifier stays out of docs app code. Replaces the
    // architecture checker's regex docs-root-import check (#270). Internal
    // Package Paths (#272) stay out of consumer documentation and examples:
    // hell-ui/internal/* is implementation linkage with no support promise.
    files: ['apps/docs/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'hell-ui',
              message:
                'Docs must demonstrate narrow import-path entry points; import hell-ui/<entrypoint> instead of the root entry point.',
            },
          ],
          patterns: [
            {
              group: ['hell-ui/internal', 'hell-ui/internal/*'],
              message:
                'hell-ui/internal/* is an Internal Package Path with no consumer support promise; docs and examples must use supported Package Entry Points only.',
            },
          ],
        },
      ],
    },
  },
  {
    // Consumer-facing verification surfaces (#272): checked-in consumer
    // fixtures and e2e specs stand in for real adopters, so they may never
    // name an Internal Package Path — a supported contract is promoted to a
    // named non-internal Package Entry Point instead.
    files: ['tools/consumer-fixtures/**/*.ts', 'e2e/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['hell-ui/internal', 'hell-ui/internal/*'],
              message:
                'hell-ui/internal/* is an Internal Package Path with no consumer support promise; consumer fixtures and e2e specs must use supported Package Entry Points only.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {
      '@angular-eslint/template/elements-content': 'off',
      '@angular-eslint/template/interactive-supports-focus': 'error',
      '@angular-eslint/template/label-has-associated-control': 'error',
    },
  },
);
