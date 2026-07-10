const TOAST_STACK_GAP = 12;
const TOAST_STACK_PEEK = 14;
const TOAST_FALLBACK_HEIGHT = 64;

/** Minimal stack item shape used by the internal toast layout runtime. */
export interface HellToastStackItem {
  readonly id: number;
  readonly removing: boolean;
}

/** Frozen position data captured when an exiting toast starts animating out. */
export interface HellToastStackSnapshot {
  readonly front: number;
  readonly offset: string;
}

type HellToastStackAnchor = 'top' | 'bottom';

export interface HellToastStackViewport {
  readonly anchor: HellToastStackAnchor;
  readonly scrollTop: number;
  readonly viewportHeight: number;
  readonly stackHeight: number;
}

/** Count visible, non-removing toasts in front of an item in the stack. */
export function hellToastFrontDistance(
  list: readonly HellToastStackItem[],
  item: HellToastStackItem,
  exitSnapshot: ReadonlyMap<number, HellToastStackSnapshot> = new Map(),
): number {
  if (item.removing) return exitSnapshot.get(item.id)?.front ?? 0;
  let n = 0;
  for (let j = list.indexOf(item) + 1; j < list.length; j++) {
    if (!list[j].removing) n++;
  }
  return n;
}

/** CSS pixel offset from the stack front, preserving exit snapshots while removing. */
export function hellToastOffsetPx(
  list: readonly HellToastStackItem[],
  item: HellToastStackItem,
  heights: ReadonlyMap<number, number>,
  exitSnapshot: ReadonlyMap<number, HellToastStackSnapshot> = new Map(),
): string {
  if (item.removing)
    return exitSnapshot.get(item.id)?.offset ?? hellToastHeightPx(item.id, heights);
  return `${hellToastOffsetValuePx(list, item, heights)}px`;
}

/** Number of visible positions by which an item exceeds `maxVisible`. */
export function hellToastOverflow(
  list: readonly HellToastStackItem[],
  item: HellToastStackItem,
  maxVisible: number,
  exitSnapshot: ReadonlyMap<number, HellToastStackSnapshot> = new Map(),
): number {
  return Math.max(0, hellToastFrontDistance(list, item, exitSnapshot) - (maxVisible - 1));
}

/** Measured toast height in CSS pixels, falling back before measurement exists. */
export function hellToastHeightPx(id: number, heights: ReadonlyMap<number, number>): string {
  return `${hellToastHeightValuePx(id, heights)}px`;
}

function hellToastHeightValuePx(id: number, heights: ReadonlyMap<number, number>): number {
  return heights.get(id) ?? TOAST_FALLBACK_HEIGHT;
}

function hellToastOffsetValuePx(
  list: readonly HellToastStackItem[],
  item: HellToastStackItem,
  heights: ReadonlyMap<number, number>,
  exitSnapshot: ReadonlyMap<number, HellToastStackSnapshot> = new Map(),
): number {
  if (item.removing) {
    const snapshotOffset = exitSnapshot.get(item.id)?.offset;
    return snapshotOffset
      ? Number.parseFloat(snapshotOffset)
      : hellToastHeightValuePx(item.id, heights);
  }
  return hellToastLiveOffsetFromIndex(list, list.indexOf(item), heights);
}

export function hellToastStackHeightPx(
  list: readonly HellToastStackItem[],
  heights: ReadonlyMap<number, number>,
): string {
  return `${hellToastStackHeightValuePx(list, heights)}px`;
}

export function hellToastStackHeightValuePx(
  list: readonly HellToastStackItem[],
  heights: ReadonlyMap<number, number>,
): number {
  let total = 0;
  let liveCount = 0;
  for (const item of list) {
    if (item.removing) continue;
    if (liveCount > 0) total += TOAST_STACK_GAP;
    total += hellToastHeightValuePx(item.id, heights);
    liveCount++;
  }
  return Math.max(TOAST_FALLBACK_HEIGHT, total);
}

export function hellToastScrollEdgeProgress(
  list: readonly HellToastStackItem[],
  item: HellToastStackItem,
  heights: ReadonlyMap<number, number>,
  viewport: HellToastStackViewport,
  exitSnapshot: ReadonlyMap<number, HellToastStackSnapshot> = new Map(),
): number {
  if (viewport.viewportHeight <= 0 || viewport.stackHeight <= viewport.viewportHeight) return 0;

  const height = hellToastHeightValuePx(item.id, heights);
  const offset = hellToastOffsetValuePx(list, item, heights, exitSnapshot);
  const top = viewport.anchor === 'bottom' ? viewport.stackHeight - height - offset : offset;
  const bottom = top + height;
  const viewportTop = viewport.scrollTop;
  const viewportBottom = viewportTop + viewport.viewportHeight;
  const edgeOverflow = Math.max(viewportTop - top, bottom - viewportBottom, 0);

  return Math.min(3, edgeOverflow / TOAST_STACK_PEEK);
}

export function hellToastScrollEdgeOpacity(progress: number): number {
  if (progress <= 0) return 1;
  return Math.max(0, 1 - progress * 0.8);
}

/** Capture and retain removing-toast positions so exit animations do not jump. */
export function hellToastSnapshotExits(
  list: readonly HellToastStackItem[],
  heights: ReadonlyMap<number, number>,
  current: ReadonlyMap<number, HellToastStackSnapshot>,
): Map<number, HellToastStackSnapshot> {
  const next = new Map(current);
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!item.removing || next.has(item.id)) continue;
    next.set(item.id, {
      front: list.length - 1 - i,
      offset: `${hellToastLiveOffsetFromIndex(list, i, heights)}px`,
    });
  }
  for (const id of [...next.keys()]) {
    if (!list.some((item) => item.id === id)) next.delete(id);
  }
  return next;
}

export function hellToastStackSnapshotsEqual(
  a: ReadonlyMap<number, HellToastStackSnapshot>,
  b: ReadonlyMap<number, HellToastStackSnapshot>,
): boolean {
  if (a.size !== b.size) return false;
  for (const [id, snapshot] of a) {
    const other = b.get(id);
    if (!other || other.front !== snapshot.front || other.offset !== snapshot.offset) return false;
  }
  return true;
}

function hellToastLiveOffsetFromIndex(
  list: readonly HellToastStackItem[],
  index: number,
  heights: ReadonlyMap<number, number>,
): number {
  let acc = 0;
  for (let j = index + 1; j < list.length; j++) {
    if (list[j].removing) continue;
    acc += (heights.get(list[j].id) ?? TOAST_FALLBACK_HEIGHT) + TOAST_STACK_GAP;
  }
  return acc;
}
