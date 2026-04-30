import {
  HellResizeTransaction,
  hellConstrainResizeValue,
  hellFitResizeSizesToTotal,
  hellResizeIntentFromKey,
  hellResizePairByDelta,
} from './resize-behavior';

describe('Resize Behavior', () => {
  it('constrains a pair value to the available min sizes', () => {
    expect(hellConstrainResizeValue(20, 200, 40, 50)).toBe(40);
    expect(hellConstrainResizeValue(180, 200, 40, 50)).toBe(150);
    expect(hellConstrainResizeValue(90, 200, 40, 50)).toBe(90);
  });

  it('falls back to the total range when min sizes exceed the available sum', () => {
    expect(hellConstrainResizeValue(-10, 80, 60, 60)).toBe(0);
    expect(hellConstrainResizeValue(120, 80, 60, 60)).toBe(80);
    expect(hellConstrainResizeValue(42, 80, 60, 60)).toBe(42);
  });

  it('resizes a pair by delta while preserving the total width', () => {
    expect(hellResizePairByDelta(100, 80, 200, 40, 40)).toEqual([140, 40]);
    expect(hellResizePairByDelta(100, 80, -200, 40, 40)).toEqual([40, 140]);
  });

  it('fits panes to a total while preserving minimum sizes when possible', () => {
    const result = hellFitResizeSizesToTotal([50, 150, 100], [80, 40, 40], 260);

    expect(result[0]).toBe(80);
    expect(result[1]).toBeCloseTo(108);
    expect(result[2]).toBeCloseTo(72);
    expect(result.reduce((sum, value) => sum + value, 0)).toBeCloseTo(260);
  });

  it('compresses proportionally when minimum sizes cannot fit', () => {
    const result = hellFitResizeSizesToTotal([80, 120], [100, 100], 150);

    expect(result[0]).toBeCloseTo(60);
    expect(result[1]).toBeCloseTo(90);
    expect(result.reduce((sum, value) => sum + value, 0)).toBeCloseTo(150);
  });

  it('models a resize transaction with deltas, key intents, and aria value', () => {
    const transaction = new HellResizeTransaction({
      startA: 100,
      startB: 80,
      minA: 40,
      minB: 40,
    });

    expect(transaction.byDelta(200)).toEqual({ a: 140, b: 40, sum: 180, ariaValueNow: 78 });
    expect(transaction.byKey('decrement')).toEqual({ a: 84, b: 96, sum: 180, ariaValueNow: 47 });
    expect(transaction.byKey('min')).toEqual({ a: 40, b: 140, sum: 180, ariaValueNow: 22 });
    expect(transaction.byKey('max')).toEqual({ a: 140, b: 40, sum: 180, ariaValueNow: 78 });
  });

  it('maps keyboard events to resize intents by orientation', () => {
    expect(hellResizeIntentFromKey('ArrowLeft', 'horizontal')).toBe('decrement');
    expect(hellResizeIntentFromKey('ArrowRight', 'horizontal')).toBe('increment');
    expect(hellResizeIntentFromKey('ArrowUp', 'vertical')).toBe('decrement');
    expect(hellResizeIntentFromKey('ArrowDown', 'vertical')).toBe('increment');
    expect(hellResizeIntentFromKey('Home', 'vertical')).toBe('min');
    expect(hellResizeIntentFromKey('End', 'horizontal')).toBe('max');
    expect(hellResizeIntentFromKey('PageDown', 'horizontal')).toBeNull();
  });
});
