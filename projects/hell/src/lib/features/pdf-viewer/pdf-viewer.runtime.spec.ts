import { HellPdfRuntime, type HellPdfSource } from './pdf-viewer.runtime';
import type {
  HellPdfPrintSession,
  HellPdfRuntimeAdapter,
  HellPdfRuntimeBundle,
} from './pdf-viewer.adapter';

describe('PDF Runtime', () => {
  it('keeps download and print browser work behind the PDF Adapter seam', async () => {
    const printSession: HellPdfPrintSession = {
      cleanup: vi.fn(),
      print: vi.fn().mockResolvedValue(undefined),
    };
    const adapter: HellPdfRuntimeAdapter = {
      createViewer: vi.fn(async () => null as unknown as HellPdfRuntimeBundle),
      getDocument: vi.fn(),
      download: vi.fn(async () => undefined),
      createPrintSession: vi.fn(async () => printSession),
    };
    const runtime = new HellPdfRuntime(adapter);
    const source: HellPdfSource = 'document.pdf';

    await runtime.download(source, 'report.pdf');
    const session = await runtime.createPrintSession(source);
    await session.print();
    session.cleanup();

    expect(adapter.download).toHaveBeenCalledWith(source, 'report.pdf', undefined);
    expect(adapter.createPrintSession).toHaveBeenCalledWith(source, undefined);
    expect(printSession.print).toHaveBeenCalled();
    expect(printSession.cleanup).toHaveBeenCalled();
  });
});
