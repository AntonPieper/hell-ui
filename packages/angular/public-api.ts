/*
 * Public API Surface of @hell-ui/angular — Heinrich Element Library
 */

// The root entry point is intentionally lightweight/core-only.
export * from './core/public-api';

// UI modules stay behind narrow import-path entry points such as
// @hell-ui/angular/button, @hell-ui/angular/date-picker, and
// @hell-ui/angular/audio-player.
// Optional features and table surfaces are available through entry points:
// - @hell-ui/angular/table (table primitives)
// - @hell-ui/angular/table-tanstack (Hell-styled TanStack Table shell)
// - @hell-ui/angular/features/code-editor (kept optional CodeMirror entry point),
//   @hell-ui/angular/features/audio-transcript (optional audio transcript provider)
