/*
 * Public API Surface of @hell-ui/angular — Heinrich Element Library
 */

// The root entry point is intentionally lightweight/core-only.
export * from './lib/public-api-core';

// Primitives remain available through @hell-ui/angular/primitives and narrow
// primitive entry points such as @hell-ui/angular/button.
// Composites and optional features are available through entry points:
// - @hell-ui/angular/composites
// - @hell-ui/angular/table (table primitives)
// - @hell-ui/angular/data-table (simple native data table)
// - @hell-ui/angular/table-tanstack (TanStack Table adapter)
// - @hell-ui/angular/table-virtual (TanStack Virtual adapter)
// - @hell-ui/angular/table-cdk (Angular CDK Table skin adapter)
// - @hell-ui/angular/features/code-editor (kept optional CodeMirror entry point),
//   @hell-ui/angular/features/audio-transcript (optional audio transcript provider)
