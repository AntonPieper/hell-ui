/**
 * @experimental Optional pdf.js feature entry point. Apps own worker/browser compatibility; keep behind lazy/client-only browser boundaries.
 */
export * from './pdf-viewer';
export * from './pdf-viewer-labels';
export type { HellPdfWorkerSource } from './pdf-viewer.adapter';
