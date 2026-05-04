import {
  HellTableColumnResizeRuntime,
  type HellTableColumnResizeColumn,
} from './data-table-column-resize.runtime';

class FakeColumn implements HellTableColumnResizeColumn {
  constructor(private readonly id: string | null) {}

  columnKey(): string | null {
    return this.id;
  }
}

describe('HellTableColumnResizeRuntime', () => {
  it('stores live widths by column id', () => {
    const runtime = new HellTableColumnResizeRuntime<FakeColumn>();

    expect(runtime.widthFor(null)).toBeNull();
    expect(runtime.widthFor('name')).toBeNull();

    runtime.setWidth('name', 144);

    expect(runtime.widthFor('name')).toBe(144);
  });

  it('builds one relative resize event for adjacent columns', () => {
    const runtime = new HellTableColumnResizeRuntime<FakeColumn>();
    const event = runtime.transactionEvent(
      { before: new FakeColumn('name'), after: new FakeColumn('role') },
      130,
      70,
    );

    expect(event).toEqual({
      before: { columnId: 'name', px: 130, share: 0.65 },
      after: { columnId: 'role', px: 70, share: 0.35 },
      totalPx: 200,
    });
  });

  it('does not emit without stable column ids', () => {
    const runtime = new HellTableColumnResizeRuntime<FakeColumn>();

    expect(
      runtime.transactionEvent(
        { before: new FakeColumn(null), after: new FakeColumn('role') },
        1,
        1,
      ),
    ).toBeNull();
    expect(
      runtime.transactionEvent(
        { before: new FakeColumn('name'), after: new FakeColumn(null) },
        1,
        1,
      ),
    ).toBeNull();
  });

  it('keeps zero-total events deterministic', () => {
    const runtime = new HellTableColumnResizeRuntime<FakeColumn>();

    expect(
      runtime.transactionEvent(
        { before: new FakeColumn('empty-a'), after: new FakeColumn('empty-b') },
        0,
        0,
      ),
    ).toEqual({
      before: { columnId: 'empty-a', px: 0, share: 0 },
      after: { columnId: 'empty-b', px: 0, share: 0 },
      totalPx: 0,
    });
  });
});
