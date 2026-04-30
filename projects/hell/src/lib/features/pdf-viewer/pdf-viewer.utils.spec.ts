import {
  clampZoomScale,
  getCtrlWheelScaleFactor,
  getNextZoomStep,
  getPreviousZoomStep,
  getZoomLabel,
  getZoomOrigin,
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
