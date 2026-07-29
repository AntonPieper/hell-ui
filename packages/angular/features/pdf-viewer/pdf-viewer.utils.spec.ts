import {
  PDF_OVERVIEW_OVERSCAN,
  PDF_OVERVIEW_UNMEASURED_PAGES,
  clampZoomScale,
  getCtrlWheelScaleFactor,
  getNextZoomStep,
  getPdfOverviewWindow,
  getPreviousZoomStep,
  getZoomLabel,
  getZoomOrigin,
  isSamePdfOverviewWindow,
  normalizeZoomEventValue,
  normalizeZoomValue,
} from './pdf-viewer.utils';

describe('PDF viewer zoom utilities', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes presets and numeric zoom values for display state', () => {
    expect(normalizeZoomValue('page-width')).toBe('page-width');
    expect(normalizeZoomValue(1.234)).toBe('1.23');
    expect(normalizeZoomValue('1.205')).toBe('1.21');
    expect(normalizeZoomValue('custom-fit')).toBe('custom-fit');

    expect(normalizeZoomEventValue('page-fit', 1.5)).toBe('page-fit');
    expect(normalizeZoomEventValue('', 1.333)).toBe('1.33');
    expect(getZoomLabel('page-actual')).toBe('Actual size');
    expect(getZoomLabel('1.25')).toBe('125%');
  });

  it('walks zoom steps with tolerance and clamps scale bounds', () => {
    expect(clampZoomScale(0.1)).toBe(0.25);
    expect(clampZoomScale(9)).toBe(4);
    expect(getNextZoomStep(1.0005)).toBe(1.15);
    expect(getNextZoomStep(4)).toBe(4);
    expect(getPreviousZoomStep(1.0005)).toBe(0.85);
    expect(getPreviousZoomStep(0.25)).toBe(0.25);
  });

  it('converts wheel delta modes and clamps zoom origins inside the container', () => {
    const lineWheel = new WheelEvent('wheel', {
      deltaY: 2,
      deltaMode: WheelEvent.DOM_DELTA_LINE,
    });
    const pixelWheel = new WheelEvent('wheel', { deltaY: 60 });

    expect(getCtrlWheelScaleFactor(lineWheel)).toBeCloseTo(getCtrlWheelScaleFactor(pixelWheel));

    const container = document.createElement('div');
    vi.spyOn(container, 'offsetLeft', 'get').mockReturnValue(10);
    vi.spyOn(container, 'offsetTop', 'get').mockReturnValue(20);
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      x: 100,
      y: 200,
      width: 300,
      height: 400,
      top: 200,
      right: 400,
      bottom: 600,
      left: 100,
      toJSON: () => ({}),
    });

    expect(getZoomOrigin(container, { clientX: 450, clientY: 150 })).toEqual([310, 20]);
    expect(getZoomOrigin(container, { clientX: Number.NaN, clientY: Number.NaN })).toEqual([
      160, 220,
    ]);
  });
});

describe('PDF page overview window', () => {
  const rail = {
    totalPages: 400,
    viewportHeight: 600,
    itemSize: 200,
  };

  it('mounts a window instead of one button per page', () => {
    const { items, totalSize } = getPdfOverviewWindow({ ...rail, scrollTop: 0 });

    expect(totalSize).toBe(80_000);
    // Three visible rows plus trailing overscan; nowhere near four hundred.
    expect(items.map((item) => item.page)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(items.map((item) => item.offset)).toEqual([0, 200, 400, 600, 800, 1000]);
  });

  it('follows the scroll offset and keeps overscan on both sides', () => {
    const { items } = getPdfOverviewWindow({ ...rail, scrollTop: 20_000 });

    const first = items[0].page;
    const last = items[items.length - 1].page;
    expect(first).toBe(101 - PDF_OVERVIEW_OVERSCAN);
    expect(last).toBe(103 + PDF_OVERVIEW_OVERSCAN);
    expect(items[0].offset).toBe((first - 1) * rail.itemSize);
  });

  it('clamps the window to the document at both ends', () => {
    const atTop = getPdfOverviewWindow({ ...rail, scrollTop: 0 });
    expect(atTop.items[0].page).toBe(1);

    const atEnd = getPdfOverviewWindow({ ...rail, scrollTop: 80_000 });
    expect(atEnd.items[atEnd.items.length - 1].page).toBe(400);
  });

  it('mounts a fixed batch until the rail has been measured', () => {
    const { items } = getPdfOverviewWindow({ ...rail, viewportHeight: 0, scrollTop: 0 });

    expect(items).toHaveLength(PDF_OVERVIEW_UNMEASURED_PAGES);
    expect(items[0].page).toBe(1);
  });

  it('pins the current and focused pages so they survive scrolling away', () => {
    const { items } = getPdfOverviewWindow({
      ...rail,
      scrollTop: 20_000,
      pinnedPages: [1, 400, null, 0, 401, 12.5],
    });

    const pages = items.map((item) => item.page);
    // Sorted, so DOM order still matches the order the rail reads in.
    expect(pages).toEqual([...pages].sort((a, b) => a - b));
    expect(pages).toContain(1);
    expect(pages).toContain(400);
    // Out-of-range and non-integer pins are dropped rather than mounted.
    expect(pages).not.toContain(0);
    expect(pages).not.toContain(401);
    expect(pages.length).toBeLessThan(20);
  });

  it('mounts nothing without a page count or a usable item size', () => {
    expect(getPdfOverviewWindow({ ...rail, totalPages: 0, scrollTop: 0 }).items).toEqual([]);
    expect(getPdfOverviewWindow({ ...rail, itemSize: 0, scrollTop: 0 }).items).toEqual([]);
  });

  it('reports scroll positions that resolve to the same mounted slice as equal', () => {
    const a = getPdfOverviewWindow({ ...rail, scrollTop: 20_010 });
    const b = getPdfOverviewWindow({ ...rail, scrollTop: 20_020 });
    const moved = getPdfOverviewWindow({ ...rail, scrollTop: 20_400 });

    expect(isSamePdfOverviewWindow(a, b)).toBe(true);
    expect(isSamePdfOverviewWindow(a, moved)).toBe(false);
  });
});
