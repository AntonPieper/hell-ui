const TOAST_STACK_GAP = 12;
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
  maxVisible: number,
  exitSnapshot: ReadonlyMap<number, HellToastStackSnapshot> = new Map(),
): string {
  if (item.removing)
    return exitSnapshot.get(item.id)?.offset ?? hellToastHeightPx(item.id, heights);
  return hellToastLiveOffsetPx(list, item, heights, maxVisible);
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
  return `${heights.get(id) ?? TOAST_FALLBACK_HEIGHT}px`;
}

/** Capture and retain removing-toast positions so exit animations do not jump. */
export function hellToastSnapshotExits(
  list: readonly HellToastStackItem[],
  heights: ReadonlyMap<number, number>,
  maxVisible: number,
  current: ReadonlyMap<number, HellToastStackSnapshot>,
): Map<number, HellToastStackSnapshot> {
  const next = new Map(current);
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!item.removing || next.has(item.id)) continue;
    next.set(item.id, {
      front: list.length - 1 - i,
      offset: hellToastLiveOffsetFromIndex(list, i, heights, maxVisible),
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

function hellToastLiveOffsetPx(
  list: readonly HellToastStackItem[],
  item: HellToastStackItem,
  heights: ReadonlyMap<number, number>,
  maxVisible: number,
): string {
  return hellToastLiveOffsetFromIndex(list, list.indexOf(item), heights, maxVisible);
}

function hellToastLiveOffsetFromIndex(
  list: readonly HellToastStackItem[],
  index: number,
  heights: ReadonlyMap<number, number>,
  maxVisible: number,
): string {
  let acc = 0;
  let counted = 0;
  for (let j = index + 1; j < list.length; j++) {
    if (list[j].removing) continue;
    if (counted >= maxVisible - 1) break;
    acc += (heights.get(list[j].id) ?? TOAST_FALLBACK_HEIGHT) + TOAST_STACK_GAP;
    counted++;
  }
  return `${acc}px`;
}
