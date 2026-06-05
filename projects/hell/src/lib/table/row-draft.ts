import {
  hellTableNormalizeRowKey,
  type HellRowDraftFieldContext,
  type HellRowDraftPatch,
  type HellRowDraftSaveStatus,
  type HellRowDraftValidationErrors,
  type HellRowDraftValue,
  type HellTableCommands,
  type HellTableEditFieldRenderContext,
  type HellTableModelRow,
  type HellTableRowEditorRenderContext,
  type HellTableRowKey,
  type HellTableRowKeyInput,
  type HellTableState,
} from './table-model';
import { signal, type WritableSignal } from '@angular/core';

/** Creates the editable draft shape for a normalized row. */
export type HellRowDraftFactory<
  TData,
  TDraft extends object = HellRowDraftValue<TData>,
> = (row: HellTableModelRow<TData>) => TDraft;

/** Synchronous validation hook for a row draft. */
export type HellRowDraftValidator<
  TData,
  TDraft extends object = HellRowDraftValue<TData>,
> = (
  draft: Readonly<TDraft>,
  row: HellTableModelRow<TData>,
) => HellRowDraftValidationErrors | null | undefined;

/** Async or sync persistence hook for a row draft. */
export type HellRowDraftSaveHandler<
  TData,
  TDraft extends object = HellRowDraftValue<TData>,
> = (draft: Readonly<TDraft>, row: HellTableModelRow<TData>) => Promise<unknown> | unknown;

/** Equality hook used to derive dirty state from baseline and current drafts. */
export type HellRowDraftEquals<TDraft extends object> = (
  current: Readonly<TDraft>,
  baseline: Readonly<TDraft>,
) => boolean;

/** Options for `HellRowDraftController`. */
export interface HellRowDraftControllerOptions<
  TData,
  TDraft extends object = HellRowDraftValue<TData>,
> {
  readonly createDraft?: HellRowDraftFactory<TData, TDraft>;
  readonly validate?: HellRowDraftValidator<TData, TDraft>;
  readonly save?: HellRowDraftSaveHandler<TData, TDraft>;
  readonly equals?: HellRowDraftEquals<TDraft>;
}

/** Snapshot of one row draft's current lifecycle state. */
export interface HellRowDraftSnapshot<
  TData,
  TDraft extends object = HellRowDraftValue<TData>,
> {
  readonly row: HellTableModelRow<TData>;
  readonly draft: TDraft;
  readonly dirty: boolean;
  readonly touched: Readonly<Record<string, boolean>>;
  readonly disabled: boolean;
  readonly validationErrors: HellRowDraftValidationErrors;
  readonly saveStatus: HellRowDraftSaveStatus;
  readonly saving: boolean;
  readonly saveError: unknown | null;
}

interface HellRowDraftEntry<TData, TDraft extends object> {
  row: HellTableModelRow<TData>;
  baseline: TDraft;
  readonly draft: WritableSignal<TDraft>;
  readonly touched: WritableSignal<Readonly<Record<string, boolean>>>;
  readonly disabled: WritableSignal<boolean>;
  readonly validationErrors: WritableSignal<HellRowDraftValidationErrors>;
  readonly saveStatus: WritableSignal<HellRowDraftSaveStatus>;
  readonly saveError: WritableSignal<unknown | null>;
  saveRevision: number;
}

/**
 * Per-row draft lifecycle controller for active-row editors.
 *
 * The table renderer owns DOM and active row state. This controller owns only
 * stable row-key draft isolation, validation state, and save/cancel lifecycle.
 */
export class HellRowDraftController<
  TData,
  TDraft extends object = HellRowDraftValue<TData>,
> {
  private readonly entries = new Map<HellTableRowKey, HellRowDraftEntry<TData, TDraft>>();
  private readonly createDraft: HellRowDraftFactory<TData, TDraft>;
  private readonly validateDraft?: HellRowDraftValidator<TData, TDraft>;
  private readonly saveDraft?: HellRowDraftSaveHandler<TData, TDraft>;
  private readonly equals: HellRowDraftEquals<TDraft>;

  constructor(options: HellRowDraftControllerOptions<TData, TDraft> = {}) {
    this.createDraft = options.createDraft ?? defaultDraftFactory<TData, TDraft>;
    this.validateDraft = options.validate;
    this.saveDraft = options.save;
    this.equals = options.equals ?? shallowDraftEquals;
  }

  /** Whether the controller currently tracks a draft for the row key. */
  has(row: HellTableRowKeyInput<TData>): boolean {
    return this.entries.has(rowKeyFromInput(row));
  }

  /** Tracked row keys, useful for diagnostics and tests. */
  keys(): readonly HellTableRowKey[] {
    return [...this.entries.keys()];
  }

  /** Current immutable snapshot for a row, creating its draft if needed. */
  snapshot(row: HellTableModelRow<TData>): HellRowDraftSnapshot<TData, TDraft> {
    const entry = this.ensure(row);
    const draft = entry.draft();
    const saveStatus = entry.saveStatus();
    return {
      row: entry.row,
      draft,
      dirty: !this.equals(draft, entry.baseline),
      touched: entry.touched(),
      disabled: this.disabled(row),
      validationErrors: entry.validationErrors(),
      saveStatus,
      saving: saveStatus === 'saving',
      saveError: entry.saveError(),
    };
  }

  /** Current draft for a row. */
  draft(row: HellTableModelRow<TData>): TDraft {
    return this.ensure(row).draft();
  }

  /** Whether the current draft differs from the saved/cancel baseline. */
  dirty(row: HellTableModelRow<TData>): boolean {
    const entry = this.ensure(row);
    return !this.equals(entry.draft(), entry.baseline);
  }

  /** Whether any field, or one named field, has been touched. */
  touched(row: HellTableModelRow<TData>, fieldName?: string): boolean {
    const touched = this.ensure(row).touched();
    return fieldName === undefined ? Object.values(touched).some(Boolean) : touched[fieldName] === true;
  }

  /** Row disabled state. Saving rows are disabled until the save settles. */
  disabled(row: HellTableModelRow<TData>): boolean {
    const entry = this.ensure(row);
    return entry.disabled() || entry.saveStatus() === 'saving';
  }

  /** Explicitly marks a row draft disabled/enabled. */
  setDisabled(row: HellTableModelRow<TData>, disabled: boolean): void {
    this.ensure(row).disabled.set(disabled);
  }

  /** Current validation errors for the row. */
  validationErrors(row: HellTableModelRow<TData>): HellRowDraftValidationErrors {
    return this.ensure(row).validationErrors();
  }

  /** Save status for the row. */
  saveStatus(row: HellTableModelRow<TData>): HellRowDraftSaveStatus {
    return this.ensure(row).saveStatus();
  }

  /** Last save error for the row, if any. */
  saveError(row: HellTableModelRow<TData>): unknown | null {
    return this.ensure(row).saveError();
  }

  /** Replaces or functionally updates the draft. */
  patch(row: HellTableModelRow<TData>, patch: HellRowDraftPatch<TDraft>): void {
    const entry = this.ensure(row);
    entry.saveRevision += 1;
    entry.draft.update((current) => applyDraftPatch(current, patch));
    entry.saveStatus.set('idle');
    entry.saveError.set(null);
  }

  /** Marks a row field as touched/untouched. */
  touch(row: HellTableModelRow<TData>, fieldName: string, touched = true): void {
    const entry = this.ensure(row);
    entry.touched.update((current) => ({ ...current, [fieldName]: touched }));
  }

  /** Sets validation errors without running the configured validator. */
  setValidationErrors(
    row: HellTableModelRow<TData>,
    errors: HellRowDraftValidationErrors | null | undefined,
  ): void {
    this.ensure(row).validationErrors.set(normalizeValidationErrors(errors));
  }

  /** Runs the configured validator and stores normalized field errors. */
  validate(row: HellTableModelRow<TData>): boolean {
    const entry = this.ensure(row);
    const errors = normalizeValidationErrors(this.validateDraft?.(entry.draft(), entry.row));
    entry.validationErrors.set(errors);
    return !Object.values(errors).some((fieldErrors) => fieldErrors.length > 0);
  }

  /** Rolls the current draft back to the row's baseline and clears transient lifecycle state. */
  cancel(row: HellTableModelRow<TData>): void {
    const entry = this.ensure(row);
    entry.saveRevision += 1;
    entry.draft.set(cloneDraft(entry.baseline));
    entry.touched.set({});
    entry.validationErrors.set({});
    entry.saveStatus.set('idle');
    entry.saveError.set(null);
  }

  /** Resets the row baseline to either the current row data or a supplied draft. */
  reset(row: HellTableModelRow<TData>, draft: TDraft = this.createDraft(row)): void {
    const entry = this.ensure(row);
    const baseline = cloneDraft(draft);
    entry.saveRevision += 1;
    entry.row = row;
    entry.baseline = baseline;
    entry.draft.set(cloneDraft(baseline));
    entry.touched.set({});
    entry.validationErrors.set({});
    entry.saveStatus.set('idle');
    entry.saveError.set(null);
  }

  /** Commits the draft through validation and the optional async save hook. */
  async save(row: HellTableModelRow<TData>): Promise<boolean> {
    const entry = this.ensure(row);
    if (!this.validate(row)) {
      entry.saveStatus.set('error');
      entry.saveError.set(null);
      return false;
    }

    const revision = ++entry.saveRevision;
    const draftAtSave = cloneDraft(entry.draft());
    entry.saveStatus.set('saving');
    entry.saveError.set(null);

    try {
      await this.saveDraft?.(draftAtSave, entry.row);
      if (revision !== entry.saveRevision) return false;
      const baseline = cloneDraft(draftAtSave);
      entry.baseline = baseline;
      entry.draft.set(cloneDraft(baseline));
      entry.touched.set({});
      entry.validationErrors.set({});
      entry.saveStatus.set('saved');
      entry.saveError.set(null);
      return true;
    } catch (error) {
      if (revision === entry.saveRevision) {
        entry.saveStatus.set('error');
        entry.saveError.set(error);
      }
      return false;
    }
  }

  /** Creates a field context snapshot and mutation helpers for one row field. */
  field<TValue = unknown>(
    row: HellTableModelRow<TData>,
    name: string,
  ): HellRowDraftFieldContext<TData, TDraft, TValue> {
    const entry = this.ensure(row);
    const draft = entry.draft();
    const baseline = entry.baseline;
    const record = draft as Record<string, TValue | undefined>;
    const baselineRecord = baseline as Record<string, TValue | undefined>;
    const value = record[name];
    return {
      name,
      row: entry.row,
      draft,
      value,
      dirty: !Object.is(value, baselineRecord[name]),
      touched: entry.touched()[name] === true,
      disabled: this.disabled(entry.row),
      errors: entry.validationErrors()[name] ?? [],
      patch: (next) => this.patchField(entry.row, name, next),
      set: (next) => this.patchField(entry.row, name, next),
      touch: (nextTouched = true) => this.touch(entry.row, name, nextTouched),
      reset: () => this.resetField(entry.row, name),
    };
  }

  /** Full row-editor template context for the simple table and adapter renderers. */
  editorContext(
    row: HellTableModelRow<TData>,
    state: HellTableState,
    commands: HellTableCommands<TData>,
    overrides: Partial<Pick<HellTableRowEditorRenderContext<TData, TDraft>, 'commit' | 'cancel'>> = {},
  ): HellTableRowEditorRenderContext<TData, TDraft> {
    const snapshot = this.snapshot(row);
    return {
      row: snapshot.row,
      state,
      commands,
      draft: snapshot.draft,
      dirty: snapshot.dirty,
      touched: snapshot.touched,
      disabled: snapshot.disabled,
      validationErrors: snapshot.validationErrors,
      saveStatus: snapshot.saveStatus,
      saving: snapshot.saving,
      saveError: snapshot.saveError,
      field: <TValue = unknown>(name: string) => this.field<TValue>(snapshot.row, name),
      patch: (patch) => this.patch(snapshot.row, patch),
      reset: () => this.reset(snapshot.row),
      commit: overrides.commit ?? (() => this.save(snapshot.row)),
      cancel: overrides.cancel ?? (() => this.cancel(snapshot.row)),
    };
  }

  /** Full field-template context for a named row editor field. */
  editFieldContext<TValue = unknown>(
    row: HellTableModelRow<TData>,
    fieldId: string,
    state: HellTableState,
    commands: HellTableCommands<TData>,
  ): HellTableEditFieldRenderContext<TData, TValue, TDraft> {
    const context = this.editorContext(row, state, commands);
    const fieldContext = context.field<TValue>(fieldId);
    return {
      ...context,
      fieldId,
      fieldContext,
      value: fieldContext.value,
    };
  }

  /** Removes drafts whose row keys no longer exist in the supplied rows. */
  cleanupRows(rows: readonly HellTableModelRow<TData>[]): void {
    const activeKeys = new Set(rows.map((row) => row.key));
    for (const key of this.entries.keys()) {
      if (!activeKeys.has(key)) this.entries.delete(key);
    }
  }

  /** Removes one draft entry. */
  clear(row: HellTableRowKeyInput<TData>): void {
    this.entries.delete(rowKeyFromInput(row));
  }

  private ensure(row: HellTableModelRow<TData>): HellRowDraftEntry<TData, TDraft> {
    const existing = this.entries.get(row.key);
    if (existing) {
      existing.row = row;
      return existing;
    }

    const baseline = cloneDraft(this.createDraft(row));
    const entry: HellRowDraftEntry<TData, TDraft> = {
      row,
      baseline,
      draft: signal(cloneDraft(baseline)),
      touched: signal({}),
      disabled: signal(false),
      validationErrors: signal({}),
      saveStatus: signal('idle'),
      saveError: signal(null),
      saveRevision: 0,
    };
    this.entries.set(row.key, entry);
    return entry;
  }

  private patchField<TValue>(row: HellTableModelRow<TData>, name: string, value: TValue): void {
    this.patch(row, { [name]: value } as Partial<TDraft>);
  }

  private resetField(row: HellTableModelRow<TData>, name: string): void {
    const entry = this.ensure(row);
    const baselineRecord = entry.baseline as Record<string, unknown>;
    this.patch(row, { [name]: baselineRecord[name] } as Partial<TDraft>);
    entry.touched.update((current) => ({ ...current, [name]: false }));
    entry.validationErrors.update((current) => {
      const next = { ...current };
      delete next[name];
      return next;
    });
  }
}

function rowKeyFromInput<TData>(row: HellTableRowKeyInput<TData>): HellTableRowKey {
  return typeof row === 'object' ? row.key : hellTableNormalizeRowKey(row);
}

function defaultDraftFactory<TData, TDraft extends object>(
  row: HellTableModelRow<TData>,
): TDraft {
  if (row.original !== null && typeof row.original === 'object') {
    return { ...(row.original as Record<string, unknown>) } as TDraft;
  }
  return { value: row.original } as TDraft;
}

function applyDraftPatch<TDraft extends object>(
  current: TDraft,
  patch: HellRowDraftPatch<TDraft>,
): TDraft {
  if (typeof patch === 'function') return cloneDraft(patch(current));
  return { ...current, ...patch };
}

function cloneDraft<TDraft extends object>(draft: TDraft): TDraft {
  return { ...draft };
}

function normalizeValidationErrors(
  errors: HellRowDraftValidationErrors | null | undefined,
): HellRowDraftValidationErrors {
  if (!errors) return {};
  const normalized: Record<string, readonly string[]> = {};
  for (const [field, fieldErrors] of Object.entries(errors)) {
    normalized[field] = Array.isArray(fieldErrors) ? fieldErrors.filter(Boolean) : [];
  }
  return normalized;
}

function shallowDraftEquals<TDraft extends object>(
  current: Readonly<TDraft>,
  baseline: Readonly<TDraft>,
): boolean {
  const currentRecord = current as Record<string, unknown>;
  const baselineRecord = baseline as Record<string, unknown>;
  const keys = new Set([...Object.keys(currentRecord), ...Object.keys(baselineRecord)]);
  for (const key of keys) {
    if (!Object.is(currentRecord[key], baselineRecord[key])) return false;
  }
  return true;
}
