import { computed, signal } from '@angular/core';

/** Parsed text that can be committed. `null` represents an intentional clear. */
export interface HellTypedValueValidParse<TValue> {
  readonly valid: true;
  readonly value: TValue | null;
}

/** Parsed text that should stay as a visible invalid draft. */
export interface HellTypedValueInvalidParse {
  readonly valid: false;
}

/** Adapter parse result used by text-backed typed value inputs. */
export type HellTypedValueParseResult<TValue> =
  | HellTypedValueValidParse<TValue>
  | HellTypedValueInvalidParse;

/**
 * Result from a commit attempt. Failed commits keep the display unchanged and
 * include the reason the caller can use for validation or stale-value handling.
 */
export interface HellTypedValueCommitResult<TOutput> {
  readonly committed: boolean;
  readonly value: TOutput | null;
  readonly reason?: 'invalid' | 'stale' | 'missing-draft';
}

/**
 * Adapter boundary for text inputs that edit a typed external value. It keeps
 * parsing, stable formatting, external equality, and output mapping owned by
 * the concrete date/time component while the state machine owns draft policy.
 */
export interface HellTypedValueInputAdapter<TValue, TExternal, TOutput = TValue | null> {
  readonly external: () => TExternal;
  readonly parseExternal: (external: TExternal) => TValue | null;
  readonly parseText: (text: string) => HellTypedValueParseResult<TValue>;
  readonly format: (value: TValue | null) => string;
  readonly toOutput?: (value: TValue | null) => TOutput | null;
  readonly externalChanged?: (base: TExternal, current: TExternal) => boolean;
}

/** Valid parse helper. `null` is a real value: a clear commit. */
export function hellTypedValue<TValue>(value: TValue | null): HellTypedValueValidParse<TValue> {
  return { valid: true, value };
}

/** Invalid parse helper. Invalid drafts remain visible until caller changes them. */
export function hellInvalidTypedValue(): HellTypedValueInvalidParse {
  return { valid: false };
}

/**
 * Internal transaction state for text inputs that accept typed drafts, expose
 * invalid draft state, commit parsed values on blur/Enter, support nullable
 * clear commits, and drop drafts when external value changes.
 */
export class HellTypedValueInputState<TValue, TExternal, TOutput = TValue | null> {
  private readonly local = signal<{
    readonly base: TExternal;
    readonly value: TValue | null;
  } | null>(null);
  private readonly draft = signal<{ readonly base: TExternal; readonly text: string } | null>(null);

  readonly current = computed<TValue | null>(() => {
    const external = this.adapter.external();
    const local = this.local();
    if (local && !this.externalChanged(local.base, external)) return local.value;
    return this.adapter.parseExternal(external);
  });

  private readonly activeDraft = computed(() => {
    const draft = this.draft();
    if (!draft || this.externalChanged(draft.base, this.adapter.external())) return null;
    return draft;
  });

  readonly invalidDraft = computed(() => {
    const draft = this.activeDraft();
    return draft ? !this.adapter.parseText(draft.text).valid : false;
  });

  readonly display = computed(() => {
    const draft = this.activeDraft();
    if (draft) return draft.text;
    return this.adapter.format(this.current());
  });

  constructor(private readonly adapter: HellTypedValueInputAdapter<TValue, TExternal, TOutput>) {}

  /** Start or replace a user draft anchored to the current external value. */
  writeDraft(text: string): void {
    this.draft.set({ base: this.adapter.external(), text });
  }

  /** Drop the active draft so display returns to the current committed value. */
  clearDraft(): void {
    this.draft.set(null);
  }

  /** Commit the active draft unless the external value changed underneath it. */
  commitDraft(): HellTypedValueCommitResult<TOutput> {
    const draft = this.draft();
    if (!draft) return { committed: false, value: null, reason: 'missing-draft' };
    if (this.externalChanged(draft.base, this.adapter.external())) {
      this.draft.set(null);
      return { committed: false, value: null, reason: 'stale' };
    }
    return this.commitText(draft.text);
  }

  /** Parse and commit arbitrary text, preserving invalid text as a draft. */
  commitText(text: string): HellTypedValueCommitResult<TOutput> {
    const parsed = this.adapter.parseText(text);
    if (!parsed.valid) {
      this.writeDraft(text);
      return { committed: false, value: null, reason: 'invalid' };
    }
    return this.setValue(parsed.value);
  }

  /** Commit a typed value directly, bypassing text parsing and clearing drafts. */
  setValue(value: TValue | null): HellTypedValueCommitResult<TOutput> {
    this.draft.set(null);
    this.local.set({ base: this.adapter.external(), value });
    return { committed: true, value: this.toOutput(value) };
  }

  private toOutput(value: TValue | null): TOutput | null {
    return this.adapter.toOutput?.(value) ?? (value as unknown as TOutput | null);
  }

  private externalChanged(base: TExternal, current: TExternal): boolean {
    return this.adapter.externalChanged?.(base, current) ?? base !== current;
  }
}
