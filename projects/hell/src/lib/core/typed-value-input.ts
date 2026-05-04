import { computed, signal } from '@angular/core';

export interface HellTypedValueInputAdapter<TValue, TExternal, TOutput = TValue> {
  readonly external: () => TExternal;
  readonly parseExternal: (external: TExternal) => TValue | null;
  readonly parseText: (text: string) => TValue | null;
  readonly format: (value: TValue | null) => string;
  readonly toOutput?: (value: TValue) => TOutput;
  readonly externalChanged?: (base: TExternal, current: TExternal) => boolean;
}

/**
 * Internal transaction state for text inputs that accept typed drafts, commit
 * parsed values on blur/Enter, and drop drafts when external value changes.
 */
export class HellTypedValueInputState<TValue, TExternal, TOutput = TValue> {
  private readonly local = signal<TValue | null>(null);
  private readonly draft = signal<{ readonly base: TExternal; readonly text: string } | null>(null);

  readonly current = computed<TValue | null>(
    () => this.adapter.parseExternal(this.adapter.external()) ?? this.local(),
  );

  readonly display = computed(() => {
    const draft = this.draft();
    if (draft && !this.externalChanged(draft.base, this.adapter.external())) return draft.text;
    return this.adapter.format(this.current());
  });

  constructor(private readonly adapter: HellTypedValueInputAdapter<TValue, TExternal, TOutput>) {}

  writeDraft(text: string): void {
    this.draft.set({ base: this.adapter.external(), text });
  }

  commitDraft(): TOutput | null {
    const draft = this.draft();
    if (!draft) return null;
    if (this.externalChanged(draft.base, this.adapter.external())) {
      this.draft.set(null);
      return null;
    }
    return this.commitText(draft.text);
  }

  commitText(text: string): TOutput | null {
    this.draft.set(null);
    const parsed = this.adapter.parseText(text);
    if (parsed === null) return null;
    return this.setValue(parsed);
  }

  setValue(value: TValue): TOutput {
    this.draft.set(null);
    this.local.set(value);
    return this.toOutput(value);
  }

  private toOutput(value: TValue): TOutput {
    return this.adapter.toOutput?.(value) ?? (value as unknown as TOutput);
  }

  private externalChanged(base: TExternal, current: TExternal): boolean {
    return this.adapter.externalChanged?.(base, current) ?? base !== current;
  }
}
