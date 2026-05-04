import { computed, signal } from '@angular/core';

export interface HellTypedValueValidParse<TValue> {
  readonly valid: true;
  readonly value: TValue | null;
}

export interface HellTypedValueInvalidParse {
  readonly valid: false;
}

export type HellTypedValueParseResult<TValue> =
  | HellTypedValueValidParse<TValue>
  | HellTypedValueInvalidParse;

export interface HellTypedValueCommitResult<TOutput> {
  readonly committed: boolean;
  readonly value: TOutput | null;
  readonly reason?: 'invalid' | 'stale' | 'missing-draft';
}

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
  private readonly local = signal<{ readonly base: TExternal; readonly value: TValue | null } | null>(
    null,
  );
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

  writeDraft(text: string): void {
    this.draft.set({ base: this.adapter.external(), text });
  }

  clearDraft(): void {
    this.draft.set(null);
  }

  commitDraft(): HellTypedValueCommitResult<TOutput> {
    const draft = this.draft();
    if (!draft) return { committed: false, value: null, reason: 'missing-draft' };
    if (this.externalChanged(draft.base, this.adapter.external())) {
      this.draft.set(null);
      return { committed: false, value: null, reason: 'stale' };
    }
    return this.commitText(draft.text);
  }

  commitText(text: string): HellTypedValueCommitResult<TOutput> {
    const parsed = this.adapter.parseText(text);
    if (!parsed.valid) {
      this.writeDraft(text);
      return { committed: false, value: null, reason: 'invalid' };
    }
    return this.setValue(parsed.value);
  }

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
