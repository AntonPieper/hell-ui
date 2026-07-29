/**
 * The box one page overview thumbnail is rasterized into, in CSS pixels. The
 * entrypoint stylesheet gives the canvas wrapper exactly this content box, and
 * the pdf.js adapter scales every page to fit inside it, so a landscape page,
 * a portrait page, and a placeholder that has not been painted yet all occupy
 * the same height.
 *
 * Uniform height is what makes the rail's windowing exact: one measured item
 * size describes every page, so the window and the scroll offsets are derived
 * arithmetically instead of measured per page. It also removes the reflow that
 * used to run down the rail as thumbnails painted at their own aspect ratios.
 */
export const PDF_THUMBNAIL_BOX = { width: 120, height: 160 } as const;

/**
 * Pages mounted on either side of the visible window. Three rows of scrolling
 * headroom: enough that a flick reveals painted thumbnails rather than empty
 * boxes, small enough that the mounted count stays a constant handful.
 */
export const PDF_OVERVIEW_OVERSCAN = 3;

/**
 * How many pages the rail mounts before it has measured itself. The rail is
 * only measurable once it has rendered something, so the first pass mounts a
 * fixed batch and the measured window replaces it on the next frame.
 */
export const PDF_OVERVIEW_UNMEASURED_PAGES = 12;

/**
 * Item size assumed until the rail measures a real one: the thumbnail box plus
 * the page label, the button's padding, and the row gap. Only the first frame
 * after the overview opens uses it.
 */
export const PDF_OVERVIEW_ESTIMATED_ITEM_SIZE = 200;

/** One mounted page button: which page it is, and where it sits in the rail. */
interface PdfOverviewItem {
  readonly page: number;
  /** Distance from the top of the rail's scrollable track, in CSS pixels. */
  readonly offset: number;
}

/** The mounted slice of the page overview rail plus the track it scrolls in. */
export interface PdfOverviewWindow {
  readonly items: readonly PdfOverviewItem[];
  /** Height the scroll track must claim so the scrollbar covers every page. */
  readonly totalSize: number;
}

export interface PdfOverviewWindowOptions {
  readonly totalPages: number;
  /** Scroll offset of the rail, already relative to the top of the track. */
  readonly scrollTop: number;
  /** Visible height of the rail; `0` means "not measured yet". */
  readonly viewportHeight: number;
  /** Measured height of one page button including its row gap. */
  readonly itemSize: number;
  /**
   * Pages that stay mounted wherever the window is: the current page, so its
   * `aria-current` never leaves the accessibility tree, and whatever holds
   * focus, so scrolling the rail away from a focused button does not drop
   * focus to the document body.
   */
  readonly pinnedPages?: readonly (number | null)[];
}

const EMPTY_OVERVIEW_WINDOW: PdfOverviewWindow = { items: [], totalSize: 0 };

/**
 * Resolve which page buttons the overview rail should mount for a scroll
 * position. Every page occupies the same `itemSize`, so the window is
 * arithmetic on the scroll offset rather than a measurement of each page.
 */
export function getPdfOverviewWindow(options: PdfOverviewWindowOptions): PdfOverviewWindow {
  const { totalPages, itemSize, viewportHeight } = options;
  if (!Number.isFinite(totalPages) || totalPages <= 0) return EMPTY_OVERVIEW_WINDOW;
  if (!Number.isFinite(itemSize) || itemSize <= 0) return EMPTY_OVERVIEW_WINDOW;

  // Exactly the rows the rail holds; `clampIndex` is what keeps the window
  // inside the document, not slack in the track.
  const totalSize = totalPages * itemSize;
  const measured = Number.isFinite(viewportHeight) && viewportHeight > 0;
  const scrollTop = Number.isFinite(options.scrollTop) ? Math.max(options.scrollTop, 0) : 0;

  const firstIndex = measured
    ? Math.floor(scrollTop / itemSize) - PDF_OVERVIEW_OVERSCAN
    : 0;
  const lastIndex = measured
    ? Math.ceil((scrollTop + viewportHeight) / itemSize) - 1 + PDF_OVERVIEW_OVERSCAN
    : PDF_OVERVIEW_UNMEASURED_PAGES - 1;

  const start = clampIndex(firstIndex, totalPages);
  const end = Math.max(clampIndex(lastIndex, totalPages), start);

  const pages = new Set<number>();
  for (let index = start; index <= end; index++) pages.add(index + 1);
  for (const pinned of options.pinnedPages ?? []) {
    if (pinned == null || !Number.isInteger(pinned)) continue;
    if (pinned < 1 || pinned > totalPages) continue;
    pages.add(pinned);
  }

  const items = [...pages]
    .sort((a, b) => a - b)
    .map((page) => ({ page, offset: (page - 1) * itemSize }));

  return { items, totalSize };
}

function clampIndex(index: number, totalPages: number): number {
  return Math.min(Math.max(index, 0), totalPages - 1);
}

/**
 * Whether two windows mount the same buttons in the same places. A rail emits
 * a scroll event per frame while most of those frames resolve to the identical
 * window, so this keeps change detection off the template until the mounted
 * slice actually moves.
 */
export function isSamePdfOverviewWindow(a: PdfOverviewWindow, b: PdfOverviewWindow): boolean {
  if (a === b) return true;
  if (a.totalSize !== b.totalSize || a.items.length !== b.items.length) return false;
  return a.items.every((item, index) => {
    const other = b.items[index];
    return item.page === other.page && item.offset === other.offset;
  });
}

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

export function isPdfZoomPreset(value: string): value is PdfZoomPreset {
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
