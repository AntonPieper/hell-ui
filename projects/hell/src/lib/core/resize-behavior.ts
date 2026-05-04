export const HELL_RESIZE_KEY_DELTA = 16;

export type HellResizeOrientation = 'horizontal' | 'vertical';
export type HellResizeKeyIntent = 'decrement' | 'increment' | 'min' | 'max';

/** Start sizes and lower bounds for one two-pane resize transaction. */
export interface HellResizeTransactionOptions {
  readonly startA: number;
  readonly startB: number;
  readonly minA: number;
  readonly minB: number;
  readonly keyDelta?: number;
}

/** Layout-agnostic result shared by pointer, keyboard, and aria consumers. */
export interface HellResizeTransactionResult {
  readonly a: number;
  readonly b: number;
  readonly sum: number;
  readonly ariaValueNow: number;
}

/** Adapter boundary between resize math and concrete DOM/layout storage. */
export interface HellResizeOperationAdapter {
  measure(): number;
  minSize(): number;
  setSize(size: number): void;
  commitSize?(size: number): void;
}

/** Runtime inputs for resizing the pair around one handle. */
export interface HellResizeOperationOptions {
  readonly before: HellResizeOperationAdapter;
  readonly after: HellResizeOperationAdapter;
  readonly orientation: HellResizeOrientation;
  readonly startCoordinate?: number;
  readonly keyDelta?: number;
}

/** Hooks and DOM ownership for pointer/keyboard resize interaction state. */
export interface HellResizeInteractionControllerOptions {
  readonly handle: HTMLElement;
  readonly ownerWindow?: () => Window | null | undefined;
  readonly onActiveChange?: (active: boolean) => void;
  readonly onValueChange?: (result: HellResizeTransactionResult) => void;
  readonly onCommit?: (result: HellResizeTransactionResult) => void;
}

export interface HellResizePair<TItem> {
  readonly before: TItem;
  readonly after: TItem;
}

export interface HellResizePairAdapters {
  readonly before: HellResizeOperationAdapter;
  readonly after: HellResizeOperationAdapter;
}

export interface HellResizeItemAdapter<TItem> {
  measure(item: TItem): number;
  minSize(item: TItem): number;
  setSize(item: TItem, size: number): void;
  commitSize?(item: TItem, size: number): void;
}

export interface HellResizePairOperationOptions<TItem> {
  readonly pair: HellResizePair<TItem>;
  readonly orientation: HellResizeOrientation;
  readonly adapters?: (pair: HellResizePair<TItem>) => HellResizePairAdapters;
  readonly itemAdapter?: (pair: HellResizePair<TItem>) => HellResizeItemAdapter<TItem>;
  readonly startCoordinate?: number;
  readonly keyDelta?: number;
}

export interface HellResizePairInteractionControllerOptions<
  TItem,
> extends HellResizeInteractionControllerOptions {
  readonly orientation: () => HellResizeOrientation;
  readonly pair: () => HellResizePair<TItem> | null;
  readonly adapters?: (pair: HellResizePair<TItem>) => HellResizePairAdapters;
  readonly itemAdapter?: (pair: HellResizePair<TItem>) => HellResizeItemAdapter<TItem>;
  readonly beforeStart?: () => boolean;
  readonly afterStart?: () => void;
  readonly stopPropagation?: boolean;
  readonly keyDelta?: number;
}

/** Clamp pane A so pane B keeps its min size when total space allows. */
export function hellConstrainResizeValue(
  value: number,
  sum: number,
  minA: number,
  minB: number,
): number {
  if (sum <= 0) return 0;

  const minTotal = minA + minB;
  if (minTotal > sum) {
    return Math.max(0, Math.min(sum, value));
  }

  return Math.max(minA, Math.min(sum - minB, value));
}

/**
 * Scale a pane list to a fixed total while preserving min sizes when possible.
 * If mins cannot fit, source proportions win so callers still get a stable sum.
 */
export function hellFitResizeSizesToTotal(
  sourceSizes: readonly number[],
  minSizes: readonly number[],
  total: number,
): number[] {
  const count = sourceSizes.length;
  const sourceTotal = sourceSizes.reduce((sum, value) => sum + value, 0);
  const minTotal = minSizes.reduce((sum, value) => sum + value, 0);
  const source = sourceTotal > 0 ? sourceSizes : minSizes;
  const baseTotal = source.reduce((sum, value) => sum + value, 0) || count;

  if (minTotal > total) {
    return source.map((value) => (total * value) / baseTotal);
  }

  const result = new Array<number>(count).fill(0);
  const remaining = new Set(source.map((_, index) => index));
  let remainingTotal = total;
  let remainingSourceTotal = baseTotal;

  while (remaining.size > 0) {
    const scale = remainingSourceTotal > 0 ? remainingTotal / remainingSourceTotal : 1;
    let clamped = false;

    for (const index of Array.from(remaining)) {
      const next = source[index] * scale;
      if (next < minSizes[index]) {
        result[index] = minSizes[index];
        remaining.delete(index);
        remainingTotal -= minSizes[index];
        remainingSourceTotal -= source[index];
        clamped = true;
      }
    }

    if (!clamped) {
      for (const index of remaining) result[index] = source[index] * scale;
      break;
    }
  }

  const resultTotal = result.reduce((sum, value) => sum + value, 0);
  const delta = total - resultTotal;
  if (Math.abs(delta) > 0.01) result[count - 1] += delta;
  return result.map((value) => Math.max(0, value));
}

/** Resize a two-pane pair by delta while preserving total size. */
export function hellResizePairByDelta(
  startA: number,
  startB: number,
  delta: number,
  minA: number,
  minB: number,
): readonly [number, number] {
  const result = new HellResizeTransaction({ startA, startB, minA, minB }).byDelta(delta);
  return [result.a, result.b] as const;
}

/** Pure resize model for one pair; independent from DOM, pointer events, or CSS. */
export class HellResizeTransaction {
  private readonly keyDelta: number;
  readonly sum: number;

  constructor(private readonly options: HellResizeTransactionOptions) {
    this.sum = options.startA + options.startB;
    this.keyDelta = options.keyDelta ?? HELL_RESIZE_KEY_DELTA;
  }

  byDelta(delta: number): HellResizeTransactionResult {
    return this.toResult(this.options.startA + delta);
  }

  byKey(intent: HellResizeKeyIntent): HellResizeTransactionResult {
    switch (intent) {
      case 'increment':
        return this.toResult(this.options.startA + this.keyDelta);
      case 'decrement':
        return this.toResult(this.options.startA - this.keyDelta);
      case 'min':
        return this.toResult(this.options.minA);
      case 'max':
        return this.toResult(this.sum - this.options.minB);
    }
  }

  toResult(valueA: number): HellResizeTransactionResult {
    const a = hellConstrainResizeValue(valueA, this.sum, this.options.minA, this.options.minB);
    const b = this.sum - a;
    return {
      a,
      b,
      sum: this.sum,
      ariaValueNow: this.sum > 0 ? Math.round((a / this.sum) * 100) : 0,
    };
  }
}

/** Applies resize transaction results through caller-provided layout adapters. */
export class HellResizeOperation {
  private readonly transaction: HellResizeTransaction;
  private readonly startCoordinate: number | null;
  private lastResult: HellResizeTransactionResult;

  constructor(private readonly options: HellResizeOperationOptions) {
    this.transaction = new HellResizeTransaction({
      startA: options.before.measure(),
      startB: options.after.measure(),
      minA: options.before.minSize(),
      minB: options.after.minSize(),
      keyDelta: options.keyDelta,
    });
    this.startCoordinate = options.startCoordinate ?? null;
    this.lastResult = this.transaction.byDelta(0);
  }

  get canResize(): boolean {
    return this.transaction.sum > 0;
  }

  get currentResult(): HellResizeTransactionResult {
    return this.lastResult;
  }

  byPointer(point: { clientX: number; clientY: number }): HellResizeTransactionResult {
    const start = this.startCoordinate ?? hellResizeCoordinate(point, this.options.orientation);
    return this.byDelta(hellResizeCoordinate(point, this.options.orientation) - start);
  }

  byDelta(delta: number): HellResizeTransactionResult {
    return this.apply(this.transaction.byDelta(delta));
  }

  byKey(key: string): HellResizeTransactionResult | null {
    const intent = hellResizeIntentFromKey(key, this.options.orientation);
    return intent ? this.apply(this.transaction.byKey(intent)) : null;
  }

  commit(result: HellResizeTransactionResult = this.lastResult): void {
    if (this.options.before.commitSize) this.options.before.commitSize(result.a);
    else this.options.before.setSize(result.a);

    if (this.options.after.commitSize) this.options.after.commitSize(result.b);
    else this.options.after.setSize(result.b);
  }

  private apply(result: HellResizeTransactionResult): HellResizeTransactionResult {
    this.lastResult = result;
    this.options.before.setSize(result.a);
    this.options.after.setSize(result.b);
    return result;
  }
}

export function hellCreateResizePairAdapters<TItem>(
  pair: HellResizePair<TItem>,
  adapter: HellResizeItemAdapter<TItem>,
): HellResizePairAdapters {
  return {
    before: {
      measure: () => adapter.measure(pair.before),
      minSize: () => adapter.minSize(pair.before),
      setSize: (size) => adapter.setSize(pair.before, size),
      commitSize: adapter.commitSize
        ? (size) => adapter.commitSize?.(pair.before, size)
        : undefined,
    },
    after: {
      measure: () => adapter.measure(pair.after),
      minSize: () => adapter.minSize(pair.after),
      setSize: (size) => adapter.setSize(pair.after, size),
      commitSize: adapter.commitSize ? (size) => adapter.commitSize?.(pair.after, size) : undefined,
    },
  };
}

/** Build one pair resize operation from caller-owned layout adapters. */
export function hellCreateResizePairOperation<TItem>(
  options: HellResizePairOperationOptions<TItem>,
): HellResizeOperation {
  const adapters = hellResolveResizePairAdapters(options);
  return new HellResizeOperation({
    before: adapters.before,
    after: adapters.after,
    orientation: options.orientation,
    startCoordinate: options.startCoordinate,
    keyDelta: options.keyDelta,
  });
}

function hellResolveResizePairAdapters<TItem>(
  options: HellResizePairOperationOptions<TItem>,
): HellResizePairAdapters {
  if (options.adapters) return options.adapters(options.pair);
  if (options.itemAdapter) {
    return hellCreateResizePairAdapters(options.pair, options.itemAdapter(options.pair));
  }
  throw new Error('Resize pair interaction requires adapters or an itemAdapter.');
}

/** Owns pointer/keyboard resize flow while callers provide pair lookup and layout adapters. */
export class HellResizePairInteractionController<TItem> {
  private readonly interaction: HellResizeInteractionController;

  constructor(private readonly options: HellResizePairInteractionControllerOptions<TItem>) {
    this.interaction = new HellResizeInteractionController(options);
  }

  startPointer(event: PointerEvent): boolean {
    if (event.button !== 0) return false;
    if (this.options.stopPropagation) event.stopPropagation();
    const orientation = this.options.orientation();
    const operation = this.operationFor(orientation, hellResizeCoordinate(event, orientation));
    if (!operation) return false;
    const started = this.interaction.startPointer(event, operation);
    if (started) this.options.afterStart?.();
    return started;
  }

  applyKey(event: KeyboardEvent): boolean {
    const orientation = this.options.orientation();
    if (!hellResizeIntentFromKey(event.key, orientation)) return false;
    if (this.options.stopPropagation) event.stopPropagation();
    const operation = this.operationFor(orientation);
    if (!operation) return false;
    const applied = this.interaction.applyKey(event, operation);
    if (applied) this.options.afterStart?.();
    return applied;
  }

  destroy(): void {
    this.interaction.destroy();
  }

  private operationFor(
    orientation: HellResizeOrientation,
    startCoordinate?: number,
  ): HellResizeOperation | null {
    if (this.options.beforeStart?.() === false) return null;
    const pair = this.options.pair();
    if (!pair) return null;

    const operation = hellCreateResizePairOperation({
      pair,
      orientation,
      adapters: this.options.adapters,
      itemAdapter: this.options.itemAdapter,
      startCoordinate,
      keyDelta: this.options.keyDelta,
    });
    return operation.canResize ? operation : null;
  }
}

/** Owns pointer capture/listeners and keyboard commit semantics for one handle. */
export class HellResizeInteractionController {
  private pointerId: number | null = null;
  private operation: HellResizeOperation | null = null;
  private cleanupPointerListeners: (() => void) | null = null;
  private active = false;

  constructor(private readonly options: HellResizeInteractionControllerOptions) {}

  startPointer(event: PointerEvent, operation: HellResizeOperation): boolean {
    if (event.button !== 0 || !operation.canResize) return false;

    event.preventDefault();
    this.cancelPointer();
    this.pointerId = event.pointerId;
    this.operation = operation;
    this.setActive(true);

    try {
      this.options.handle.setPointerCapture?.(event.pointerId);
    } catch {
      /* pointer capture is best-effort in tests and older browsers */
    }

    const win = this.window();
    const move = (nextEvent: PointerEvent) => this.applyPointer(nextEvent);
    const end = (nextEvent: PointerEvent) => this.finishPointer(nextEvent);
    const opts: AddEventListenerOptions = { passive: false };
    win?.addEventListener('pointermove', move, opts);
    win?.addEventListener('pointerup', end, opts);
    win?.addEventListener('pointercancel', end, opts);
    this.cleanupPointerListeners = () => {
      win?.removeEventListener('pointermove', move);
      win?.removeEventListener('pointerup', end);
      win?.removeEventListener('pointercancel', end);
    };

    return true;
  }

  applyKey(event: KeyboardEvent, operation: HellResizeOperation): boolean {
    if (!operation.canResize) return false;
    const result = operation.byKey(event.key);
    if (!result) return false;

    event.preventDefault();
    operation.commit(result);
    this.options.onValueChange?.(result);
    this.options.onCommit?.(result);
    return true;
  }

  destroy(): void {
    this.cancelPointer();
  }

  private applyPointer(event: PointerEvent): void {
    if (!this.operation || event.pointerId !== this.pointerId) return;

    event.preventDefault();
    const result = this.operation.byPointer(event);
    this.options.onValueChange?.(result);
  }

  private finishPointer(event?: PointerEvent): void {
    if (!this.operation) return;
    if (event && event.pointerId !== this.pointerId) return;

    event?.preventDefault();
    const operation = this.operation;
    operation.commit();
    this.options.onCommit?.(operation.currentResult);
    this.cancelPointer();
  }

  private cancelPointer(): void {
    if (this.pointerId !== null) {
      try {
        this.options.handle.releasePointerCapture?.(this.pointerId);
      } catch {
        /* pointer capture is best-effort in tests and older browsers */
      }
    }

    this.cleanupPointerListeners?.();
    this.cleanupPointerListeners = null;
    this.pointerId = null;
    this.operation = null;
    this.setActive(false);
  }

  private setActive(active: boolean): void {
    if (this.active === active) return;
    this.active = active;
    this.options.onActiveChange?.(active);
  }

  private window(): Window | null {
    const provided = this.options.ownerWindow?.();
    if (provided) return provided;
    return this.options.handle.ownerDocument.defaultView;
  }
}

/** Map keyboard keys to resize intent for current orientation. */
export function hellResizeIntentFromKey(
  key: string,
  orientation: HellResizeOrientation,
): HellResizeKeyIntent | null {
  const horizontal = orientation === 'horizontal';
  if (key === (horizontal ? 'ArrowLeft' : 'ArrowUp')) return 'decrement';
  if (key === (horizontal ? 'ArrowRight' : 'ArrowDown')) return 'increment';
  if (key === 'Home') return 'min';
  if (key === 'End') return 'max';
  return null;
}

/** Read the coordinate that matters for the active resize orientation. */
export function hellResizeCoordinate(
  point: { clientX: number; clientY: number },
  orientation: HellResizeOrientation,
): number {
  return orientation === 'horizontal' ? point.clientX : point.clientY;
}
