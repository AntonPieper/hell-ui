import {
  hellTableResizeAdapterCanResize,
  hellTableResizeEvent,
  type HellTableResizeAdapter,
  type HellTableResizeItem,
} from './table-resize-adapter';

function item(columnId: string): HellTableResizeItem {
  return {
    columnId,
    measure: () => 100,
    setSize: () => undefined,
  };
}

describe('table resize adapter helpers', () => {
  it('recognizes only adjacent items with stable column ids', () => {
    expect(hellTableResizeAdapterCanResize(null)).toBe(false);
    expect(
      hellTableResizeAdapterCanResize({ before: item('name'), after: item('role') }),
    ).toBe(true);
    expect(
      hellTableResizeAdapterCanResize({ before: item(''), after: item('role') }),
    ).toBe(false);
    expect(
      hellTableResizeAdapterCanResize({ before: item('name'), after: item('') }),
    ).toBe(false);
  });

  it('builds one relative resize event from adapter-owned column ids', () => {
    const adapter: HellTableResizeAdapter = { before: item('name'), after: item('role') };

    expect(hellTableResizeEvent(adapter, 130, 70)).toEqual({
      before: { columnId: 'name', px: 130, share: 0.65 },
      after: { columnId: 'role', px: 70, share: 0.35 },
      totalPx: 200,
    });
  });

  it('keeps zero-total events deterministic', () => {
    const adapter: HellTableResizeAdapter = { before: item('empty-a'), after: item('empty-b') };

    expect(hellTableResizeEvent(adapter, 0, 0)).toEqual({
      before: { columnId: 'empty-a', px: 0, share: 0 },
      after: { columnId: 'empty-b', px: 0, share: 0 },
      totalPx: 0,
    });
  });
});
