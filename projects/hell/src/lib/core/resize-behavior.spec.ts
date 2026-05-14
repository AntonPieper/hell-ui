import {
  HellResizeInteractionController,
  HellResizeOperation,
  HellResizePairInteractionController,
  HellResizeTransaction,
  hellConstrainResizeValue,
  hellCreateResizePairAdapters,
  hellResizeCoordinate,
  hellFitResizeSizesToTotal,
  hellResizeIntentFromKey,
  hellResizePairAriaValue,
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

  it('computes initial aria-value from pair measurements with min fallback', () => {
    expect(hellResizePairAriaValue(120, 80, 40, 40)).toBe(60);
    expect(hellResizePairAriaValue(0, 0, 40, 40)).toBe(50);
  });

  it('maps keyboard events to resize intents by orientation', () => {
    expect(hellResizeIntentFromKey('ArrowLeft', 'horizontal')).toBe('decrement');
    expect(hellResizeIntentFromKey('ArrowRight', 'horizontal')).toBe('increment');
    expect(hellResizeIntentFromKey('ArrowLeft', 'horizontal', 'rtl')).toBe('increment');
    expect(hellResizeIntentFromKey('ArrowRight', 'horizontal', 'rtl')).toBe('decrement');
    expect(hellResizeIntentFromKey('ArrowUp', 'vertical')).toBe('decrement');
    expect(hellResizeIntentFromKey('ArrowDown', 'vertical')).toBe('increment');
    expect(hellResizeIntentFromKey('Home', 'vertical')).toBe('min');
    expect(hellResizeIntentFromKey('End', 'horizontal')).toBe('max');
    expect(hellResizeIntentFromKey('PageDown', 'horizontal')).toBeNull();
  });

  it('inverts horizontal pointer deltas in RTL', () => {
    const before = createResizeAdapter(100, 40);
    const after = createResizeAdapter(80, 40);
    const operation = new HellResizeOperation({
      before,
      after,
      orientation: 'horizontal',
      direction: 'rtl',
      startCoordinate: 10,
    });

    expect(operation.byPointer({ clientX: 60, clientY: 0 })).toEqual({
      a: 50,
      b: 130,
      sum: 180,
      ariaValueNow: 28,
    });
  });

  it('runs a resize operation through layout adapters', () => {
    const before = createResizeAdapter(100, 40);
    const after = createResizeAdapter(80, 40);
    const operation = new HellResizeOperation({
      before,
      after,
      orientation: 'horizontal',
      startCoordinate: 10,
    });

    expect(operation.canResize).toBe(true);
    expect(operation.byPointer({ clientX: 60, clientY: 0 })).toEqual({
      a: 140,
      b: 40,
      sum: 180,
      ariaValueNow: 78,
    });
    expect(before.size).toBe(140);
    expect(after.size).toBe(40);

    operation.commit();
    expect(before.committed).toBe(140);
    expect(after.committed).toBe(40);
  });

  it('runs pointer resize interaction lifecycle through layout adapters', () => {
    const handle = document.createElement('div');
    document.body.append(handle);
    const before = createResizeAdapter(100, 40);
    const after = createResizeAdapter(80, 40);
    const active: boolean[] = [];
    const values: number[] = [];
    const commits: number[] = [];
    const operation = new HellResizeOperation({
      before,
      after,
      orientation: 'horizontal',
      startCoordinate: 10,
    });
    const interaction = new HellResizeInteractionController({
      handle,
      ownerWindow: () => window,
      onActiveChange: (value) => active.push(value),
      onValueChange: (result) => values.push(result.ariaValueNow),
      onCommit: (result) => commits.push(result.ariaValueNow),
    });

    expect(
      interaction.startPointer(
        new PointerEvent('pointerdown', { button: 0, pointerId: 1 }),
        operation,
      ),
    ).toBe(true);

    window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 60 }));
    window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: 60 }));

    expect(active).toEqual([true, false]);
    expect(values).toEqual([78]);
    expect(commits).toEqual([78]);
    expect(before.committed).toBe(140);
    expect(after.committed).toBe(40);

    interaction.destroy();
    handle.remove();
  });

  it('runs keyboard resize interaction lifecycle through layout adapters', () => {
    const handle = document.createElement('div');
    const before = createResizeAdapter(100, 40);
    const after = createResizeAdapter(80, 40);
    const values: number[] = [];
    const commits: number[] = [];
    const operation = new HellResizeOperation({
      before,
      after,
      orientation: 'horizontal',
    });
    const interaction = new HellResizeInteractionController({
      handle,
      onValueChange: (result) => values.push(result.ariaValueNow),
      onCommit: (result) => commits.push(result.ariaValueNow),
    });

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });

    expect(interaction.applyKey(event, operation)).toBe(true);
    expect(values).toEqual([64]);
    expect(commits).toEqual([64]);
    expect(before.committed).toBe(116);
    expect(after.committed).toBe(64);
  });

  it('creates pair adapters from one item adapter', () => {
    const before = createResizeAdapter(100, 40);
    const after = createResizeAdapter(80, 40);
    const adapters = hellCreateResizePairAdapters(
      { before, after },
      {
        measure: (item) => item.measure(),
        minSize: (item) => item.minSize(),
        setSize: (item, size) => item.setSize(size),
        commitSize: (item, size) => item.commitSize(size),
      },
    );

    expect(adapters.before.measure()).toBe(100);
    expect(adapters.after.minSize()).toBe(40);

    adapters.before.setSize(120);
    adapters.after.commitSize?.(60);

    expect(before.size).toBe(120);
    expect(after.committed).toBe(60);
  });

  it('runs pair resize interaction through caller adapters', () => {
    const handle = document.createElement('div');
    const before = createResizeAdapter(100, 40);
    const after = createResizeAdapter(80, 40);
    const commits: number[] = [];

    const interaction = new HellResizePairInteractionController({
      handle,
      orientation: () => 'horizontal',
      pair: () => ({ before, after }),
      adapters: (pair) => ({ before: pair.before, after: pair.after }),
      onCommit: (result) => commits.push(result.a),
    });

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true });

    expect(interaction.applyKey(event)).toBe(true);
    expect(event.defaultPrevented).toBe(true);
    expect(before.size).toBe(116);
    expect(after.size).toBe(64);
    expect(commits).toEqual([116]);
  });

  it('uses orientation when reading pointer coordinates', () => {
    expect(hellResizeCoordinate({ clientX: 12, clientY: 34 }, 'horizontal')).toBe(12);
    expect(hellResizeCoordinate({ clientX: 12, clientY: 34 }, 'vertical')).toBe(34);
  });
});

function createResizeAdapter(size: number, min: number) {
  return {
    size,
    committed: null as number | null,
    measure() {
      return this.size;
    },
    minSize() {
      return min;
    },
    setSize(next: number) {
      this.size = next;
    },
    commitSize(next: number) {
      this.committed = next;
      this.size = next;
    },
  };
}
