import {
  commitHellFilterBuilderValue,
  findHellFilterByIdentity,
  removeHellFilterBuilderValue,
  type HellFilter,
  type HellFilterFieldDescriptor,
} from './filter-builder.state';

interface IdentifiedFilter<
  TField extends string,
  TOperator extends string,
  TValue,
> extends HellFilter<TField, TOperator, TValue> {
  readonly id: string;
}

type NameFilter = IdentifiedFilter<'name', 'contains' | 'startsWith', string>;
type StatusFilter = IdentifiedFilter<'status', 'is' | 'isNot', 'active' | 'paused'>;
type DateRangeFilter = IdentifiedFilter<
  'created',
  'between',
  { readonly from: string | null; readonly to: string | null }
>;
type OwnerFilter = IdentifiedFilter<
  'owner',
  'is',
  { readonly id: string; readonly name: string }
>;
type ExampleFilter = NameFilter | StatusFilter | DateRangeFilter | OwnerFilter;

const identify = (filter: ExampleFilter) => filter.id;

const nameField: HellFilterFieldDescriptor<NameFilter> = {
  field: 'name',
  label: 'Name',
  multiple: true,
  display: (filter) => `Name ${filter.operator} ${filter.value}`,
  validate: (filter) => filter.value.trim().length > 0,
};

const statusField: HellFilterFieldDescriptor<StatusFilter> = {
  field: 'status',
  label: 'Status',
  display: (filter) => `Status ${filter.operator} ${filter.value}`,
  validate: (filter) => filter.value === 'active' || filter.value === 'paused',
};

const createdField: HellFilterFieldDescriptor<DateRangeFilter> = {
  field: 'created',
  label: 'Created',
  display: (filter) => `${filter.value.from ?? 'Any'}–${filter.value.to ?? 'Any'}`,
  validate: (filter) => Boolean(filter.value.from || filter.value.to),
};

const ownerField: HellFilterFieldDescriptor<OwnerFilter> = {
  field: 'owner',
  label: 'Owner',
  display: (filter) => `Owner is ${filter.value.name}`,
  validate: (filter) => Boolean(filter.value.id && filter.value.name),
};

describe('Filter Builder controlled state', () => {
  it('creates an immutable whole-array value without mutating the controlled input', () => {
    const current: readonly ExampleFilter[] = [
      { id: 'status-1', field: 'status', operator: 'is', value: 'active' },
    ];
    const nextFilter: NameFilter = {
      id: 'name-1',
      field: 'name',
      operator: 'contains',
      value: 'Ada',
    };

    const result = commitHellFilterBuilderValue(current, {
      mode: 'create',
      descriptor: nameField,
      filter: nextFilter,
    }, identify);

    expect(result).toEqual({ value: [...current, nextFilter], identity: 'name-1' });
    expect(result?.value).not.toBe(current);
    expect(current).toEqual([
      { id: 'status-1', field: 'status', operator: 'is', value: 'active' },
    ]);
  });

  it('rejects invalid, mismatched, duplicate, and repeated single-field creates', () => {
    const current: readonly ExampleFilter[] = [
      { id: 'status-1', field: 'status', operator: 'is', value: 'active' },
    ];
    const blank: NameFilter = {
      id: 'name-1',
      field: 'name',
      operator: 'contains',
      value: '   ',
    };
    const duplicateIdentity: NameFilter = { ...blank, id: 'status-1', value: 'Ada' };
    const repeatedStatus: StatusFilter = {
      id: 'status-2',
      field: 'status',
      operator: 'isNot',
      value: 'paused',
    };

    expect(commitHellFilterBuilderValue(current, {
      mode: 'create',
      descriptor: nameField,
      filter: blank,
    }, identify)).toBeNull();
    expect(commitHellFilterBuilderValue(current, {
      mode: 'create',
      descriptor: nameField,
      filter: duplicateIdentity,
    }, identify)).toBeNull();
    expect(commitHellFilterBuilderValue(current, {
      mode: 'create',
      descriptor: statusField,
      filter: repeatedStatus,
    }, identify)).toBeNull();

    const mismatchedDescriptor = nameField as unknown as HellFilterFieldDescriptor<ExampleFilter>;
    expect(commitHellFilterBuilderValue(current, {
      mode: 'create',
      descriptor: mismatchedDescriptor,
      filter: repeatedStatus,
    }, identify)).toBeNull();
    expect(current).toHaveLength(1);
  });

  it('targets an edit by stable identity after controlled recreation and reorder', () => {
    const original: readonly ExampleFilter[] = [
      { id: 'name-1', field: 'name', operator: 'contains', value: 'Ada' },
      { id: 'status-1', field: 'status', operator: 'is', value: 'active' },
    ];
    const editIdentity = identify(original[0]!);
    const recreatedAndReordered: readonly ExampleFilter[] = [
      { ...original[1]! } as StatusFilter,
      { ...original[0]! } as NameFilter,
    ];
    const replacement: NameFilter = {
      id: 'name-1',
      field: 'name',
      operator: 'startsWith',
      value: 'Grace',
    };

    const result = commitHellFilterBuilderValue(recreatedAndReordered, {
      mode: 'edit',
      descriptor: nameField,
      filter: replacement,
      editIdentity,
    }, identify);

    expect(result?.value).toEqual([recreatedAndReordered[0], replacement]);
    expect(recreatedAndReordered).toEqual([
      { id: 'status-1', field: 'status', operator: 'is', value: 'active' },
      { id: 'name-1', field: 'name', operator: 'contains', value: 'Ada' },
    ]);
  });

  it('rejects stale edits and edits that change the application identity', () => {
    const current: readonly ExampleFilter[] = [
      { id: 'name-1', field: 'name', operator: 'contains', value: 'Ada' },
    ];
    const changedIdentity: NameFilter = {
      id: 'name-2',
      field: 'name',
      operator: 'startsWith',
      value: 'Grace',
    };

    expect(commitHellFilterBuilderValue(current, {
      mode: 'edit',
      descriptor: nameField,
      filter: changedIdentity,
      editIdentity: 'name-1',
    }, identify)).toBeNull();
    expect(commitHellFilterBuilderValue([], {
      mode: 'edit',
      descriptor: nameField,
      filter: { ...changedIdentity, id: 'name-1' },
      editIdentity: 'name-1',
    }, identify)).toBeNull();
  });

  it('locates and removes an expression by identity rather than rendered index', () => {
    const current: readonly ExampleFilter[] = [
      { id: 'status-1', field: 'status', operator: 'is', value: 'active' },
      { id: 'name-1', field: 'name', operator: 'contains', value: 'Ada' },
    ];

    expect(findHellFilterByIdentity(current, 'name-1', identify)).toEqual(current[1]);
    expect(removeHellFilterBuilderValue(current, 'status-1', identify)).toEqual([current[1]]);
    expect(removeHellFilterBuilderValue(current, 'missing', identify)).toBeNull();
    expect(current).toHaveLength(2);
  });

  it('supports arbitrary operator and structured value types without kind branches', () => {
    const filter: DateRangeFilter = {
      id: 'created-1',
      field: 'created',
      operator: 'between',
      value: { from: null, to: '2026-07-15' },
    };
    const result = commitHellFilterBuilderValue<ExampleFilter>([], {
      mode: 'create',
      descriptor: createdField,
      filter,
    }, identify);

    expect(result?.value).toEqual([filter]);
    expect(createdField.display(filter)).toBe('Any–2026-07-15');
  });

  it('keeps application-owned entity identity and display metadata inside the recipe', () => {
    const filter: OwnerFilter = {
      id: 'owner-filter-1',
      field: 'owner',
      operator: 'is',
      value: { id: 'owner-42', name: 'Grace Hopper' },
    };
    const result = commitHellFilterBuilderValue<ExampleFilter>([], {
      mode: 'create',
      descriptor: ownerField,
      filter,
    }, identify);

    expect(result?.value).toEqual([filter]);
    expect(ownerField.display(filter)).toBe('Owner is Grace Hopper');
  });
});
