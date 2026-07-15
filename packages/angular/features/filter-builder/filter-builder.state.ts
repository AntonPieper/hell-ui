/** Domain-neutral field/operator/value expression owned by the consuming app. */
export interface HellFilter<
  TField extends string = string,
  TOperator extends string = string,
  TValue = unknown,
> {
  /** Application field identity. */
  readonly field: TField;
  /** Application operator identity. */
  readonly operator: TOperator;
  /** Application-owned value. */
  readonly value: TValue;
}

/**
 * Application-owned description of one Filter Builder field.
 *
 * The descriptor deliberately has no field-kind discriminator. Its callbacks
 * remain typed to the expression rendered by its projected editor.
 */
export interface HellFilterFieldDescriptor<
  TFilter extends HellFilter = HellFilter,
> {
  /** Stable field identity shared by the descriptor and its expressions. */
  readonly field: TFilter['field'];
  /** Human-readable picker label. */
  readonly label: string;
  /** Whether more than one expression for this field may be created. */
  readonly multiple?: boolean;
  /** Render a complete expression as a token label. */
  display(filter: TFilter): string;
  /** Decide whether a projected editor may commit a complete expression. */
  validate(filter: TFilter): boolean;
}

/** Stable application identity returned for one controlled expression. */
export type HellFilterIdentityValue = string | number;

/**
 * Required application callback used to locate controlled expressions after
 * object recreation or reorder. The returned identity must stay unchanged
 * while an expression is edited.
 */
export type HellFilterIdentity<TFilter extends HellFilter = HellFilter> = (
  filter: TFilter,
) => HellFilterIdentityValue;

/** One internal create/edit transaction. Not exported by the Package Entry Point. */
export interface HellFilterBuilderCommit<TFilter extends HellFilter> {
  readonly mode: 'create' | 'edit';
  readonly descriptor: HellFilterFieldDescriptor<TFilter>;
  readonly filter: TFilter;
  readonly editIdentity?: HellFilterIdentityValue;
}

/** Successful immutable whole-array commit. */
export interface HellFilterBuilderCommitResult<TFilter extends HellFilter> {
  readonly value: readonly TFilter[];
  readonly identity: HellFilterIdentityValue;
}

/** Find one controlled expression by its application identity. */
export function findHellFilterByIdentity<TFilter extends HellFilter>(
  value: readonly TFilter[],
  identity: HellFilterIdentityValue,
  identify: HellFilterIdentity<TFilter>,
): TFilter | null {
  return value.find((filter) => sameHellFilterIdentity(identify(filter), identity)) ?? null;
}

/** Find one controlled expression index by its application identity. */
function findHellFilterIndexByIdentity<TFilter extends HellFilter>(
  value: readonly TFilter[],
  identity: HellFilterIdentityValue,
  identify: HellFilterIdentity<TFilter>,
): number {
  return value.findIndex((filter) => sameHellFilterIdentity(identify(filter), identity));
}

/**
 * Validate and produce the next controlled value without mutating the input.
 * Returns `null` for invalid, duplicate, identity-changing, or stale commits.
 */
export function commitHellFilterBuilderValue<TFilter extends HellFilter>(
  current: readonly TFilter[],
  commit: HellFilterBuilderCommit<TFilter>,
  identify: HellFilterIdentity<TFilter>,
): HellFilterBuilderCommitResult<TFilter> | null {
  const { descriptor, filter } = commit;
  if (filter.field !== descriptor.field || !descriptor.validate(filter)) return null;

  const nextIdentity = identify(filter);
  if (commit.mode === 'create') {
    if (!descriptor.multiple && current.some((entry) => entry.field === descriptor.field)) {
      return null;
    }
    if (findHellFilterIndexByIdentity(current, nextIdentity, identify) !== -1) return null;
    return { value: [...current, filter], identity: nextIdentity };
  }

  const editIdentity = commit.editIdentity;
  if (editIdentity === undefined || !sameHellFilterIdentity(nextIdentity, editIdentity)) {
    return null;
  }
  const editIndex = findHellFilterIndexByIdentity(current, editIdentity, identify);
  if (editIndex === -1) return null;

  const duplicateIndex = current.findIndex(
    (entry, index) => index !== editIndex && sameHellFilterIdentity(identify(entry), nextIdentity),
  );
  if (duplicateIndex !== -1) return null;

  return {
    value: current.map((entry, index) => (index === editIndex ? filter : entry)),
    identity: nextIdentity,
  };
}

/** Remove one controlled expression without relying on its rendered index. */
export function removeHellFilterBuilderValue<TFilter extends HellFilter>(
  current: readonly TFilter[],
  identity: HellFilterIdentityValue,
  identify: HellFilterIdentity<TFilter>,
): readonly TFilter[] | null {
  const index = findHellFilterIndexByIdentity(current, identity, identify);
  if (index === -1) return null;
  return current.filter((_, candidateIndex) => candidateIndex !== index);
}

/** Compare identity values without coercing strings and numbers together. */
export function sameHellFilterIdentity(
  first: HellFilterIdentityValue,
  second: HellFilterIdentityValue,
): boolean {
  return Object.is(first, second);
}
