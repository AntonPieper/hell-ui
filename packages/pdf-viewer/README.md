# @hell-ui/pdf-viewer

Experimental Angular PDF viewer package for Hell UI. This package owns the PDF viewer component, PDF viewer CSS, and the exact `pdfjs-dist@5.6.205` peer so the core `@hell-ui/angular` package stays free of pdf.js metadata.

## Install

```bash
pnpm add @hell-ui/angular @hell-ui/pdf-viewer pdfjs-dist@5.6.205 @ng-icons/font-awesome tailwindcss
```

A normal Hell UI Angular app also needs the light `@hell-ui/angular` peer stack: `@angular/common`, `@angular/core`, `@angular/forms`, `@angular/cdk`, `@floating-ui/dom`, `@ng-icons/core`, `ng-primitives`, and `rxjs`.

## Use

```ts
import { HellPdfViewer, type HellPdfWorkerSource } from '@hell-ui/pdf-viewer';
```

```html
<hell-pdf-viewer [src]="'/document.pdf'" [worker]="pdfWorker" />
```

```ts
protected readonly pdfWorker: HellPdfWorkerSource = '/assets/pdf.worker.mjs';
```

## Styles

```css
@import "tailwindcss";
@import "@hell-ui/angular/styles/tokens";
@import "@hell-ui/pdf-viewer/styles";
@import "pdfjs-dist/web/pdf_viewer.css";
```

`@hell-ui/pdf-viewer/styles` contains Hell's toolbar/container styling. `pdfjs-dist/web/pdf_viewer.css` contains pdf.js page rendering styles; load both only where the viewer is active.

## Worker ownership

This package does **not** bundle or publish a pdf.js worker asset. Copy a worker from the matching `pdfjs-dist@5.6.205` install into your app assets or create one with your bundler, then pass that URL or `Worker` instance to the required `worker` input.

Angular app asset example:

```json
{
  "glob": "pdf.worker.mjs",
  "input": "node_modules/pdfjs-dist/build",
  "output": "assets"
}
```

The worker version must match `pdfjs-dist@5.6.205`.

## Status

`@hell-ui/pdf-viewer` is experimental and browser-only. Keep it behind lazy/client-only app boundaries, handle the `error` output, and provide a fallback download/open action for critical workflows.
