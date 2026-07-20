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
    // Entrypoint dependency boundaries (#259): category import edges,
    // internal-directory access, and optional-peer isolation. Entrypoint
    // identities and categories derive from the hell-entrypoint.json manifest
    // sidecars (tools/entrypoint-manifest.mjs); these AST rules run alongside
    // the architecture checker's source-text checks.
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
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {
      '@angular-eslint/template/elements-content': 'off',
      '@angular-eslint/template/interactive-supports-focus': 'error',
      '@angular-eslint/template/label-has-associated-control': 'error',
    },
  },
);
