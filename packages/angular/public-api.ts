/*
 * Public API Surface of hell-ui — Heinrich Element Library
 */

// The root entry point is intentionally lightweight/core-only.
export * from './core/public-api';

// UI modules stay behind narrow import-path entry points such as
// hell-ui/button, hell-ui/date-picker, and
// hell-ui/audio-player.
// Optional features and table surfaces are available through entry points:
// - hell-ui/table (table primitives)
// - hell-ui/table-tanstack (Hell-styled TanStack Table shell)
// - hell-ui/features/code-editor (kept optional CodeMirror entry point),
//   hell-ui/features/audio-transcript (optional audio transcript provider)
