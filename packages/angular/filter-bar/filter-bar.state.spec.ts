import {
  HELL_FILTER_TEXT_KEY,
  commitHellFilterToken,
  filterHellFilterFields,
  identifyHellFilterToken,
  sameHellFilterValue,
  type HellFilterField,
  type HellFilterToken,
} from './filter-bar.state';

const FIELDS: readonly HellFilterField[] = [
  { key: 'name', label: 'Name', kind: 'text' },
  {
    key: 'status',
    label: 'Status',
    kind: 'options',
    options: [
      { value: 'open', label: 'Open' },
      { value: 'closed', label: 'Closed' },
    ],
  },
  {
    key: 'tag',
    label: 'Tag',
    kind: 'options',
    multiple: true,
    options: [
      { value: 'urgent', label: 'Urgent' },
      { value: 'review', label: 'Needs review' },
    ],
  },
];

describe('Filter Bar state contract', () => {
  it('always exposes a visible free-text row and removes applied single-use fields', () => {
    const active: readonly HellFilterToken[] = [
      { key: 'status', operator: 'eq', value: 'open' },
    ];

    const rows = filterHellFilterFields(FIELDS, active, 'sta');

    expect(rows.map((row) => row.kind === 'field' ? row.field.key : row.kind)).toEqual([
      'freeText',
    ]);

    const allRows = filterHellFilterFields(FIELDS, active, '');
    expect(allRows.map((row) => row.kind === 'field' ? row.field.key : row.kind)).toEqual([
      'name',
      'tag',
      'freeText',
    ]);
  });

  it('keeps the reserved free-text key out of consumer-declared field rows', () => {
    const rows = filterHellFilterFields(
      [...FIELDS, { key: HELL_FILTER_TEXT_KEY, label: 'Invalid', kind: 'text' }],
      [],
      '',
    );

    expect(rows.some((row) => row.kind === 'field' && row.field.key === HELL_FILTER_TEXT_KEY))
      .toBe(false);
  });

  it('serializes commits without mutating controlled input state', () => {
    const current: readonly HellFilterToken[] = [
      { key: HELL_FILTER_TEXT_KEY, operator: 'eq', value: 'urgent' },
    ];

    const next = commitHellFilterToken(current, {
      key: 'status',
      value: 'open',
      multiple: false,
    });

    expect(next).toEqual([
      { key: HELL_FILTER_TEXT_KEY, operator: 'eq', value: 'urgent' },
      { key: 'status', operator: 'eq', value: 'open' },
    ]);
    expect(current).toEqual([{ key: HELL_FILTER_TEXT_KEY, operator: 'eq', value: 'urgent' }]);
  });

  it('replaces single-use fields and appends multi-use fields', () => {
    const current: readonly HellFilterToken[] = [
      { key: 'status', operator: 'eq', value: 'open' },
      { key: 'tag', operator: 'eq', value: 'urgent' },
    ];

    expect(
      commitHellFilterToken(current, { key: 'status', value: 'closed', multiple: false }),
    ).toEqual([
      { key: 'tag', operator: 'eq', value: 'urgent' },
      { key: 'status', operator: 'eq', value: 'closed' },
    ]);
    expect(commitHellFilterToken(current, { key: 'tag', value: 'review', multiple: true })).toEqual([
      ...current,
      { key: 'tag', operator: 'eq', value: 'review' },
    ]);
  });

  it('replaces the identified token after the controlled value is reordered', () => {
    const original: readonly HellFilterToken[] = [
      { key: 'tag', operator: 'eq', value: 'urgent' },
      { key: 'tag', operator: 'eq', value: 'review' },
    ];
    const editIdentity = identifyHellFilterToken(original, 0);
    const reordered = [original[1], original[0]];

    expect(
      commitHellFilterToken(reordered, {
        key: 'tag',
        value: 'approved',
        multiple: true,
        editIdentity: editIdentity!,
      }),
    ).toEqual([
      { key: 'tag', operator: 'eq', value: 'review' },
      { key: 'tag', operator: 'eq', value: 'approved' },
    ]);
    expect(reordered).toEqual([original[1], original[0]]);
  });

  it('does not recreate an edited token removed from the controlled value', () => {
    const original: readonly HellFilterToken[] = [
      { key: 'status', operator: 'eq', value: 'open' },
      { key: 'tag', operator: 'eq', value: 'urgent' },
    ];
    const editIdentity = identifyHellFilterToken(original, 1);
    const current = [original[0]];

    const next = commitHellFilterToken(current, {
      key: 'tag',
      value: 'approved',
      multiple: true,
      editIdentity: editIdentity!,
    });

    expect(next).toEqual(current);
    expect(next).not.toBe(current);
    expect(current).toEqual([original[0]]);
  });

  it('uses the occurrence to distinguish duplicate controlled token values', () => {
    const duplicate: HellFilterToken = { key: 'tag', operator: 'eq', value: 'urgent' };
    const original: readonly HellFilterToken[] = [
      duplicate,
      { key: 'status', operator: 'eq', value: 'open' },
      { ...duplicate },
    ];
    const editIdentity = identifyHellFilterToken(original, 2);
    const reordered = [original[1], original[0], original[2]];

    expect(editIdentity?.occurrence).toBe(1);
    expect(
      commitHellFilterToken(reordered, {
        key: 'tag',
        value: 'approved',
        multiple: true,
        editIdentity: editIdentity!,
      }),
    ).toEqual([
      { key: 'status', operator: 'eq', value: 'open' },
      { key: 'tag', operator: 'eq', value: 'urgent' },
      { key: 'tag', operator: 'eq', value: 'approved' },
    ]);
  });

  it('keeps the reserved free-text token singleton for explicit commits', () => {
    const current: readonly HellFilterToken[] = [
      { key: HELL_FILTER_TEXT_KEY, operator: 'eq', value: 'old query' },
      { key: 'status', operator: 'eq', value: 'open' },
      { key: HELL_FILTER_TEXT_KEY, operator: 'eq', value: 'stale query' },
    ];

    const next = commitHellFilterToken(current, {
      key: HELL_FILTER_TEXT_KEY,
      value: 'new query',
      multiple: true,
    });

    expect(next).toEqual([
      { key: 'status', operator: 'eq', value: 'open' },
      { key: HELL_FILTER_TEXT_KEY, operator: 'eq', value: 'new query' },
    ]);
    expect(current).toEqual([
      { key: HELL_FILTER_TEXT_KEY, operator: 'eq', value: 'old query' },
      { key: 'status', operator: 'eq', value: 'open' },
      { key: HELL_FILTER_TEXT_KEY, operator: 'eq', value: 'stale query' },
    ]);
  });

  it('commits serializable entity and open date-range values without mutating input', () => {
    const current: readonly HellFilterToken[] = [
      {
        key: 'assignee',
        operator: 'eq',
        value: { kind: 'entity', id: 'person-1', label: 'Ada Lovelace' },
      },
    ];

    const next = commitHellFilterToken(current, {
      key: 'created',
      value: { kind: 'dateRange', from: '2026-07-01', to: null },
      multiple: false,
    });

    expect(next).toEqual([
      ...current,
      {
        key: 'created',
        operator: 'eq',
        value: { kind: 'dateRange', from: '2026-07-01', to: null },
      },
    ]);
    expect(JSON.parse(JSON.stringify(next))).toEqual(next);
    expect(current).toHaveLength(1);
  });

  it('deduplicates structured values by stable entity id and date endpoints', () => {
    const entity = { kind: 'entity' as const, id: 'person-1', label: 'Ada Lovelace' };
    const current: readonly HellFilterToken[] = [
      { key: 'assignee', operator: 'eq', value: entity },
      {
        key: 'created',
        operator: 'eq',
        value: { kind: 'dateRange', from: null, to: '2026-07-31' },
      },
    ];

    expect(
      commitHellFilterToken(current, {
        key: 'assignee',
        value: { ...entity },
        multiple: true,
      }),
    ).toEqual(current);
    expect(
      commitHellFilterToken(current, {
        key: 'created',
        value: { kind: 'dateRange', from: null, to: '2026-07-31' },
        multiple: true,
      }),
    ).toEqual(current);
    expect(sameHellFilterValue(entity, { ...entity })).toBe(true);
    expect(sameHellFilterValue(entity, { ...entity, label: 'Ada Byron' })).toBe(true);
  });

  it('keeps structured edit identities stable across controlled object recreation and reorder', () => {
    const original: readonly HellFilterToken[] = [
      {
        key: 'created',
        operator: 'eq',
        value: { kind: 'dateRange', from: '2026-07-01', to: '2026-07-10' },
      },
      {
        key: 'assignee',
        operator: 'eq',
        value: { kind: 'entity', id: 'person-1', label: 'Ada Lovelace' },
      },
    ];
    const identity = identifyHellFilterToken(original, 1);
    const current: readonly HellFilterToken[] = [
      { ...original[1]!, value: { ...(original[1]!.value as object) } } as HellFilterToken,
      { ...original[0]!, value: { ...(original[0]!.value as object) } } as HellFilterToken,
    ];

    expect(
      commitHellFilterToken(current, {
        key: 'assignee',
        value: { kind: 'entity', id: 'person-2', label: 'Grace Hopper' },
        multiple: true,
        editIdentity: identity!,
      }),
    ).toEqual([
      {
        key: 'assignee',
        operator: 'eq',
        value: { kind: 'entity', id: 'person-2', label: 'Grace Hopper' },
      },
      current[1],
    ]);
  });

  it('retains an entity edit identity when controlled display metadata changes', () => {
    const original: readonly HellFilterToken[] = [
      {
        key: 'owner',
        operator: 'eq',
        value: { kind: 'entity', id: 'person-1', label: 'Ada Lovelace' },
      },
    ];
    const identity = identifyHellFilterToken(original, 0);
    const relabelled: readonly HellFilterToken[] = [
      {
        key: 'owner',
        operator: 'eq',
        value: { kind: 'entity', id: 'person-1', label: 'Ada Byron' },
      },
    ];

    expect(
      commitHellFilterToken(relabelled, {
        key: 'owner',
        value: { kind: 'entity', id: 'person-2', label: 'Grace Hopper' },
        multiple: false,
        editIdentity: identity!,
      }),
    ).toEqual([
      {
        key: 'owner',
        operator: 'eq',
        value: { kind: 'entity', id: 'person-2', label: 'Grace Hopper' },
      },
    ]);
  });
});
