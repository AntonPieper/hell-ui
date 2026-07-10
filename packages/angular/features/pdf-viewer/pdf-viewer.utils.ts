export const PDF_ZOOM_VALUES = ['auto', 'page-actual', 'page-fit', 'page-width'] as const;

export type PdfZoomPreset = (typeof PDF_ZOOM_VALUES)[number];

const PDF_ZOOM_LABELS: Record<PdfZoomPreset, string> = {
  auto: 'Automatic',
  'page-actual': 'Actual size',
  'page-fit': 'Page fit',
  'page-width': 'Page width',
};

const PDF_ZOOM_STEPS = [
  0.25, 0.33, 0.5, 0.67, 0.75, 0.85, 1, 1.15, 1.33, 1.5, 1.75, 2, 2.5, 3, 4,
] as const;

const PDF_REVERSED_ZOOM_STEPS = [...PDF_ZOOM_STEPS].reverse();

export const PDF_ZOOM_OPTIONS = [
  { value: '0.5', label: '50%' },
  { value: '0.75', label: '75%' },
  { value: '1', label: '100%' },
  { value: '1.25', label: '125%' },
  { value: '1.5', label: '150%' },
  { value: '2', label: '200%' },
  { value: '3', label: '300%' },
] as const;

function isPdfZoomPreset(value: string): value is PdfZoomPreset {
  return PDF_ZOOM_VALUES.includes(value as PdfZoomPreset);
}

/** Normalize a user-facing zoom preset or numeric scale into stable select state. */
export function normalizeZoomValue(value: number | string) {
  if (typeof value === 'number') {
    return String(Number(value.toFixed(2)));
  }
  if (isPdfZoomPreset(value)) {
    return value;
  }
  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    return String(Number(numericValue.toFixed(2)));
  }
  return value;
}

/** Prefer pdf.js preset event values, falling back to the numeric scale. */
export function normalizeZoomEventValue(presetValue: unknown, scale: number) {
  if (typeof presetValue === 'string' && presetValue.length > 0) {
    return normalizeZoomValue(presetValue);
  }
  return normalizeZoomValue(scale);
}

export function getZoomLabel(value: string) {
  if (isPdfZoomPreset(value)) {
    return PDF_ZOOM_LABELS[value];
  }
  return `${Math.round(Number(value) * 100)}%`;
}

export function clampZoomScale(scale: number) {
  return Math.min(Math.max(scale, PDF_ZOOM_STEPS[0]), PDF_ZOOM_STEPS[PDF_ZOOM_STEPS.length - 1]);
}

export function getNextZoomStep(scale: number) {
  return PDF_ZOOM_STEPS.find((step) => step > scale + 0.001) ?? scale;
}

export function getPreviousZoomStep(scale: number) {
  return PDF_REVERSED_ZOOM_STEPS.find((step) => step < scale - 0.001) ?? scale;
}

function getWheelDeltaPixels(event: WheelEvent, viewportHeight: number) {
  switch (event.deltaMode) {
    case WheelEvent.DOM_DELTA_LINE:
      return event.deltaY * 30;
    case WheelEvent.DOM_DELTA_PAGE:
      return event.deltaY * viewportHeight;
    default:
      return event.deltaY;
  }
}

/** Convert ctrl/cmd wheel deltas into a smooth exponential zoom multiplier. */
export function getCtrlWheelScaleFactor(event: WheelEvent, viewportHeight = event.view?.innerHeight ?? 0) {
  const pixelDeltaY = getWheelDeltaPixels(event, viewportHeight);
  return Math.exp(-pixelDeltaY * 0.007);
}

/**
 * Return the PDF-space zoom origin for a pointer point, clamped inside the
 * scroll container and offset by the container's positioned origin.
 */
export function getZoomOrigin(
  container: HTMLElement,
  point: { clientX: number; clientY: number },
): [number, number] {
  const rect = container.getBoundingClientRect();
  const localX = Number.isFinite(point.clientX)
    ? Math.min(Math.max(point.clientX - rect.left, 0), rect.width)
    : rect.width / 2;
  const localY = Number.isFinite(point.clientY)
    ? Math.min(Math.max(point.clientY - rect.top, 0), rect.height)
    : rect.height / 2;

  return [container.offsetLeft + localX, container.offsetTop + localY];
}
