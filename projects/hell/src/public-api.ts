/*
 * Public API Surface of @hell-ui/angular — Heinrich Element Library
 */

// Core + primitives are intentionally re-exported at the package root.
export * from './lib/public-api-core';
export * from './lib/public-api-primitives';

// Composites and features are available through entry points:
// - hell/composites / @hell-ui/angular/composites
// - hell/features/data-table (legacy), hell/features/table-utilities, hell/features/code-editor, hell/features/pdf-viewer / corresponding @hell-ui/angular/* paths
// Table utilities are preferred; data-table is legacy compatibility.
