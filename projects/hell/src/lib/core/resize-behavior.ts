export const HELL_RESIZE_KEY_DELTA = 16;

export type HellResizeOrientation = 'horizontal' | 'vertical';
export type HellResizeKeyIntent = 'decrement' | 'increment' | 'min' | 'max';

export interface HellResizeTransactionOptions {
  readonly startA: number;
  readonly startB: number;
  readonly minA: number;
  readonly minB: number;
  readonly keyDelta?: number;
}

export interface HellResizeTransactionResult {
  readonly a: number;
  readonly b: number;
  readonly sum: number;
  readonly ariaValueNow: number;
}

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

export function hellResizePairByDelta(
  startA: number,
  startB: number,
  delta: number,
  minA: number,
  minB: number,
): readonly [number, number] {
  const sum = startA + startB;
  const nextA = hellConstrainResizeValue(startA + delta, sum, minA, minB);
  return [nextA, sum - nextA] as const;
}

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
