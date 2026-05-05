import { hellWithPdfJsGlobal } from './pdf-viewer.adapter';

describe('PDF Adapter globals', () => {
  afterEach(() => {
    delete (globalThis as typeof globalThis & { pdfjsLib?: unknown }).pdfjsLib;
  });

  it('restores a previous pdf.js global after importing the viewer module', async () => {
    const previous = { version: 'previous' };
    const next = { version: 'next' };
    const globalWithPdfJs = globalThis as typeof globalThis & { pdfjsLib?: unknown };
    globalWithPdfJs.pdfjsLib = previous;

    const loaded = await hellWithPdfJsGlobal(next, async () => {
      expect(globalWithPdfJs.pdfjsLib).toBe(next);
      return { viewer: true };
    });

    expect(loaded).toEqual({ viewer: true });
    expect(globalWithPdfJs.pdfjsLib).toBe(previous);
  });

  it('removes the pdf.js global when no previous value existed', async () => {
    const globalWithPdfJs = globalThis as typeof globalThis & { pdfjsLib?: unknown };

    await hellWithPdfJsGlobal({ version: 'next' }, async () => {
      expect(globalWithPdfJs.pdfjsLib).toEqual({ version: 'next' });
      return null;
    });

    expect(Object.hasOwn(globalWithPdfJs, 'pdfjsLib')).toBe(false);
  });
});
