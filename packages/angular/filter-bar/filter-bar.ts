import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NO_ERRORS_SCHEMA,
  booleanAttribute,
  computed,
  inject,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import type { InjectionToken, Provider } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HELL_CHIP_DIRECTIVES } from '@hell-ui/angular/chip';
import { HELL_COMBOBOX_DIRECTIVES, HellCombobox } from '@hell-ui/angular/combobox';
import {
  hellCreateLabels,
  hellPartStyler,
  hellRankLocalSearch,
  type HellRecipe,
  type HellUi,
  type HellUiInput,
} from '@hell-ui/angular/core';
import { HellPopover, HellPopoverTrigger } from '@hell-ui/angular/popover';

import {
  HELL_FILTER_TEXT_KEY,
  commitHellFilterToken,
  filterHellFilterFields,
  identifyHellFilterToken,
  type HellFilterField,
  type HellFilterFieldBase,
  type HellFilterOption,
  type HellFilterOptionsField,
  type HellFilterSuggestion,
  type HellFilterTextField,
  type HellFilterToken,
  type HellFilterTokenIdentity,
} from './filter-bar.state';

export {
  HELL_FILTER_TEXT_KEY,
  type HellFilterField,
  type HellFilterFieldBase,
  type HellFilterOption,
  type HellFilterOptionsField,
  type HellFilterTextField,
  type HellFilterToken,
};

/** Built-in copy owned by the Filter Bar Label Contract. */
export interface HellFilterBarLabels {
  /** Default accessible name for the picker and token group. */
  readonly input: string;
  /** Clear-all button copy. */
  readonly clearAll: string;
  /** Text-editor commit button copy. */
  readonly apply: string;
  /** Synthetic field label used while editing free text. */
  readonly freeTextField: string;
  /** Free-text suggestion copy. */
  readonly freeText: (query: string) => string;
  /** Free-text token copy. */
  readonly freeTextToken: (value: string) => string;
  /** Accessible edit-trigger label. */
  readonly edit: (token: string) => string;
  /** Polite announcement after a token is added. */
  readonly added: (token: string) => string;
  /** Polite announcement after a token is updated. */
  readonly updated: (token: string) => string;
  /** Polite announcement after a token is removed. */
  readonly removed: (token: string) => string;
  /** Polite announcement after all tokens are cleared. */
  readonly cleared: string;
}

const HELL_FILTER_BAR_LABELS_CONTRACT = hellCreateLabels<HellFilterBarLabels>(
  'HELL_FILTER_BAR_LABELS',
  {
    input: 'Filters',
    clearAll: 'Clear all filters',
    apply: 'Apply filter',
    freeTextField: 'Search',
    freeText: (query) => query ? `Search for “${query}”` : 'Add free-text search',
    freeTextToken: (value) => `Search: ${value}`,
    edit: (token) => `Edit ${token}`,
    added: (token) => `${token} added`,
    updated: (token) => `${token} updated`,
    removed: (token) => `${token} removed`,
    cleared: 'All filters cleared',
  },
);

/** Injection token resolving to the effective Filter Bar labels. */
export const HELL_FILTER_BAR_LABELS: InjectionToken<HellFilterBarLabels> =
  HELL_FILTER_BAR_LABELS_CONTRACT.token;

/** Override any subset of Filter Bar labels for an injector scope. */
export function provideHellFilterBarLabels(overrides: Partial<HellFilterBarLabels>): Provider {
  return HELL_FILTER_BAR_LABELS_CONTRACT.provide(overrides);
}

/** Public parts of `hell-filter-bar`, styleable through its Part Style Map. */
export type HellFilterBarPart =
  | 'root'
  | 'tokens'
  | 'token'
  | 'tokenLabel'
  | 'control'
  | 'prefix'
  | 'input'
  | 'panel'
  | 'option'
  | 'editor'
  | 'clear'
  | 'live';

/** Part Style Map accepted by the Filter Bar `ui` input. */
export type HellFilterBarUi = HellUi<HellFilterBarPart>;

const HELL_FILTER_BAR_RECIPE = {
  root: 'relative flex w-full min-w-0 flex-wrap items-center gap-hell-2',
  tokens: 'contents',
  token: '',
  tokenLabel: 'border-0 bg-transparent p-0 font-[inherit] text-inherit outline-none',
  control:
    'relative flex min-h-hell-control-md min-w-[180px] flex-1 items-center gap-hell-2 rounded-hell-md border border-solid border-hell-border bg-hell-surface-elevated px-hell-3 text-[13px] text-hell-foreground focus-within:border-hell-border-focus focus-within:shadow-[0_0_0_3px_var(--color-hell-focus-ring)]',
  prefix: 'shrink-0 rounded-hell-sm bg-hell-surface-muted px-hell-2 py-hell-1 text-xs font-medium',
  input:
    'h-hell-control-md min-w-[120px] flex-1 border-0 bg-transparent p-0 font-[inherit] text-[13px] text-hell-foreground outline-none placeholder:text-hell-foreground-muted',
  panel:
    'z-[var(--hell-z-popover,60)] max-h-[280px] shadow-hell-lg',
  option: 'data-[active]:bg-hell-surface-muted',
  editor: 'relative flex min-w-[220px] items-center gap-hell-2',
  clear: '',
  live: 'sr-only',
} satisfies HellRecipe<HellFilterBarPart>;

interface HellFilterEditorState {
  readonly mode: 'create' | 'edit';
  readonly field: HellFilterField;
  readonly tokenIdentity: HellFilterTokenIdentity | null;
  readonly query: string;
}

let nextFilterBarId = 0;

/**
 * Keyboard-first controlled token filter for declared text and options fields.
 *
 * The Filter Bar owns interaction state only. Consumers own the serializable
 * `value` array and round-trip `valueChange`; the component never fetches,
 * persists, or mutates the supplied array. Field suggestions always carry a
 * highlighted visible outcome, including the free-text row, so Enter cannot
 * silently reinterpret a field name. A shared per-kind editor state is mounted
 * at the input for create and in a Popover anchored to a token for edit.
 */
@Component({
  selector: 'hell-filter-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    HellButton,
    ...HELL_CHIP_DIRECTIVES,
    ...HELL_COMBOBOX_DIRECTIVES,
    HellPopover,
    HellPopoverTrigger,
  ],
  // The composed Combobox and Popover host-directive bindings live in sibling
  // Package Entry Points. ng-packagr's partial template checker cannot see
  // those forwarded inputs across the entry-point boundary; consumer builds
  // still type-check them from the packaged metadata.
  schemas: [NO_ERRORS_SCHEMA],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-has-filters]': 'value().length ? "" : null',
    '[attr.data-editing]': 'editor() ? editor()!.mode : null',
  },
  template: `
    <div
      hellChipSet
      data-slot="tokens"
      [ui]="part('tokens')"
      [attr.aria-label]="effectiveAriaLabel()"
      tabindex="-1"
      (keydown)="onTokenSetKeydown($event)"
    >
      @for (token of value(); track tokenTrack(token, $index)) {
        <span
          hellChip
          size="sm"
          data-slot="token"
          [ui]="part('token')"
          [label]="tokenLabel(token)"
          [disabled]="disabled()"
          [attr.data-key]="token.key"
          [attr.data-hell-filter-token-id]="tokenTrack(token, $index)"
          (remove)="removeToken($index)"
        >
          <button
            #editTrigger="hellPopoverTrigger"
            type="button"
            tabindex="-1"
            data-slot="tokenLabel"
            data-hell-filter-token-edit
            [class]="part('tokenLabel')"
            [attr.aria-label]="labels.edit(tokenLabel(token))"
            [hellPopoverTrigger]="editPopover"
            [disabled]="disabled()"
            [closeOnEscape]="false"
            (pointerdown)="beginEdit($index)"
            (click)="beginEdit($index)"
            (openChange)="onEditOpenChange($any($event), $index)"
          >
            <span>{{ tokenLabel(token) }}</span>
          </button>
          <button hellChipRemove></button>
        </span>

        <ng-template #editPopover>
          <div
            hellPopover
            data-hell-filter-editor-popover
            [attr.aria-label]="labels.edit(tokenLabel(token))"
          >
            <ng-container
              *ngTemplateOutlet="valueEditor; context: { $implicit: editTrigger }"
            />
          </div>
        </ng-template>
      }
    </div>

    @if (editor()?.mode === 'create') {
      <div data-slot="control" [class]="part('control')">
        <ng-container *ngTemplateOutlet="valueEditor" />
      </div>
    } @else {
      <div
        hellCombobox
        data-slot="control"
        [ui]="part('control')"
        [value]="null"
        [options]="suggestions()"
        [wrapNavigation]="false"
        [disabled]="disabled()"
        (valueChange)="activateSuggestion($any($event))"
        (openChange)="onPickerOpenChange($any($event))"
      >
        <input
          #pickerInput
          hellComboboxInput
          data-slot="input"
          [ui]="part('input')"
          type="search"
          autocomplete="off"
          spellcheck="false"
          [attr.aria-label]="effectiveAriaLabel()"
          [attr.placeholder]="placeholder()"
          [value]="query()"
          [disabled]="disabled()"
          (input)="onPickerInput($event)"
          (keydown)="onPickerKeydown($event)"
        />
        <div
          *hellComboboxPortal
          hellComboboxDropdown
          data-slot="panel"
          [ui]="part('panel')"
          [attr.aria-label]="effectiveAriaLabel()"
        >
          @for (suggestion of suggestions(); track suggestionTrack(suggestion, $index)) {
            <div
              hellComboboxOption
              data-slot="option"
              data-hell-filter-suggestion
              [value]="suggestion"
              [ui]="part('option')"
            >
              @if (suggestion.kind === 'field') {
                {{ suggestion.field.label }}
              } @else {
                {{ labels.freeText(suggestion.value) }}
              }
            </div>
          }
        </div>
      </div>
    }

    @if (value().length) {
      <button
        hellButton
        type="button"
        variant="ghost"
        size="sm"
        data-slot="clear"
        [ui]="part('clear')"
        [disabled]="disabled()"
        (click)="clearAll()"
      >
        {{ labels.clearAll }}
      </button>
    }

    <div data-slot="live" [class]="part('live')" aria-live="polite" aria-atomic="true">
      {{ liveMessage() }}
    </div>

    <ng-template #valueEditor let-popoverTrigger>
      @if (editor(); as state) {
        @if (state.field.kind === 'text') {
          <div
            data-slot="editor"
            [class]="part('editor')"
            [attr.data-mode]="state.mode"
            [attr.data-field]="state.field.key"
            [attr.data-hell-filter-bar-owner]="instanceId"
            (focusout)="onEditorFocusOut($event)"
          >
            <span data-slot="prefix" [class]="part('prefix')">{{ state.field.label }}:</span>
            <input
              data-slot="input"
              data-hell-filter-editor-input
              [class]="part('input')"
              type="search"
              autocomplete="off"
              spellcheck="false"
              [attr.aria-label]="state.field.label"
              [value]="state.query"
              [disabled]="disabled()"
              (input)="onEditorInput($event)"
              (keydown)="onEditorKeydown($event, popoverTrigger)"
              (keydown.escape)="onEditorEscape($event, popoverTrigger)"
            />
            <button
              hellButton
              type="button"
              variant="soft"
              size="sm"
              [disabled]="disabled() || !state.query.trim()"
              (click)="commitEditor(undefined, popoverTrigger)"
              (keydown.escape)="onEditorEscape($event, popoverTrigger)"
            >
              {{ labels.apply }}
            </button>
          </div>
        } @else {
          <div
            #editorCombobox="hellCombobox"
            hellCombobox
            data-slot="editor"
            [ui]="part('editor')"
            [value]="null"
            [options]="editorOptions()"
            [wrapNavigation]="false"
            [disabled]="disabled()"
            [attr.data-mode]="state.mode"
            [attr.data-field]="state.field.key"
            [attr.data-hell-filter-bar-owner]="instanceId"
            (valueChange)="onEditorSelection($any($event), popoverTrigger)"
            (openChange)="onEditorOpenChange($any($event), popoverTrigger)"
            (focusout)="onEditorFocusOut($event, editorCombobox)"
          >
            <span data-slot="prefix" [class]="part('prefix')">{{ state.field.label }}:</span>
            <input
              #editorInput
              hellComboboxInput
              data-slot="input"
              data-hell-filter-editor-input
              [ui]="part('input')"
              type="search"
              autocomplete="off"
              spellcheck="false"
              [attr.aria-label]="state.field.label"
              [value]="state.query"
              [disabled]="disabled()"
              (focus)="onOptionsEditorFocus(editorInput)"
              (input)="onEditorInput($event)"
              (keydown)="onEditorKeydown($event, popoverTrigger)"
              (keydown.escape)="onEditorEscape($event, popoverTrigger)"
            />
            <div
              *hellComboboxPortal
              hellComboboxDropdown
              data-slot="panel"
              data-hell-filter-editor-options
              [ui]="part('panel')"
              [attr.aria-label]="state.field.label"
            >
              @for (option of editorOptions(); track option.value) {
                <div
                  hellComboboxOption
                  data-slot="option"
                  data-hell-filter-editor-option
                  [value]="option"
                  [disabled]="disabled() || option.disabled"
                  [ui]="part('option')"
                >
                  {{ option.label }}
                </div>
              }
            </div>
          </div>
        }
      }
    </ng-template>
  `,
})
export class HellFilterBar {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellFilterBarPart>>(undefined, { alias: 'ui' });

  /** Merged classes for one public part. */
  protected readonly part = hellPartStyler<HellFilterBarPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_FILTER_BAR_RECIPE,
  });

  /** Declared text/options fields. Keys must be stable; `$text` is reserved. */
  readonly fields = input.required<readonly HellFilterField[]>();
  /** Complete controlled, serializable token value. */
  readonly value = input<readonly HellFilterToken[]>([]);
  /** Disables editing, removal, and clear-all. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Placeholder for the field/free-text picker. */
  readonly placeholder = input('Add filter or search');
  /** Accessible name; defaults to the Label Contract's `input` value. */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  /**
   * Opt into debounced live free text. When set, typing replaces the reserved
   * `$text` token through `valueChange` after this many milliseconds.
   */
  readonly freeTextDebounceMs = input<number | null, unknown>(null, {
    transform: (value) => (value == null || value === '' ? null : numberAttribute(value)),
  });

  /** Emits the whole next controlled value on commit/removal/clear. */
  readonly valueChange = output<readonly HellFilterToken[]>();

  protected readonly labels = inject(HELL_FILTER_BAR_LABELS);
  protected readonly query = signal('');
  protected readonly pickerOpen = signal(false);
  protected readonly editorOpen = signal(false);
  protected readonly editor = signal<HellFilterEditorState | null>(null);
  protected readonly liveMessage = signal('');

  private readonly host: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);
  private liveTimer: ReturnType<typeof setTimeout> | null = null;
  private suppressEditorClose = false;
  protected readonly instanceId = ++nextFilterBarId;

  protected readonly effectiveAriaLabel = computed(() => this.ariaLabel() ?? this.labels.input);
  protected readonly suggestions = computed(() => [
    ...filterHellFilterFields(this.fields(), this.value(), this.query()),
  ]);
  protected readonly editorOptions = computed(() => {
    const state = this.editor();
    if (!state || state.field.kind !== 'options') return [];
    return hellRankLocalSearch(state.field.options, {
      query: state.query,
      fields: [
        { weight: 2, get: (option) => option.label },
        { weight: 1, get: (option) => option.value },
      ],
    }).map(({ item }) => item);
  });
  constructor() {
    this.destroyRef.onDestroy(() => this.clearLiveTimer());
  }

  protected onPickerInput(event: Event): void {
    if (this.disabled()) return;
    const next = (event.target as HTMLInputElement).value;
    const accelerator = this.colonAccelerator(next);
    if (accelerator) {
      this.beginCreate(accelerator.field, accelerator.query);
      return;
    }

    this.query.set(next);
    this.syncComboboxLayer(event.target as HTMLInputElement, next, this.pickerOpen());
    this.scheduleLiveFreeText(next);
  }

  protected onPickerOpenChange(open: boolean): void {
    this.pickerOpen.set(open);
  }

  protected onPickerKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;

    if (event.key === 'ArrowLeft' && !this.query() && this.value().length) {
      event.preventDefault();
      event.stopPropagation();
      this.focusLastToken();
      return;
    }

    if (event.key === 'Tab' && this.pickerOpen()) {
      event.preventDefault();
      this.dispatchComboboxKey(event.currentTarget as HTMLInputElement, 'Enter');
      return;
    }

    if ((event.key === 'Enter' || event.key === 'Tab') && !this.pickerOpen()) {
      const value = this.query().trim();
      if (value) {
        this.commitFreeText(value);
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }

    if (event.key === 'Escape') {
      // The delegated combobox consumes the open-popup layer. Only a closed
      // picker with text owns this Escape; an empty/no-layer Escape bubbles.
      const input = event.currentTarget as HTMLInputElement | null;
      if (this.pickerOpen() || input?.getAttribute('aria-expanded') === 'true') return;
      if (this.query()) {
        this.query.set('');
        this.scheduleLiveFreeText('');
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }

    if (event.key === 'Backspace' && !this.query() && this.value().length) {
      this.removeToken(this.value().length - 1);
      event.preventDefault();
    }
  }

  protected activateSuggestion(suggestion: HellFilterSuggestion | null): void {
    if (!suggestion) return;
    if (suggestion.kind === 'field') this.beginCreate(suggestion.field, '');
    else if (suggestion.value) this.commitFreeText(suggestion.value);
  }

  protected beginEdit(index: number): void {
    if (this.disabled()) return;
    const token = this.value()[index];
    if (!token) return;
    const tokenIdentity = identifyHellFilterToken(this.value(), index);
    if (!tokenIdentity) return;
    const field = token.key === HELL_FILTER_TEXT_KEY
      ? this.freeTextEditorField()
      : this.fields().find((candidate) => candidate.key === token.key);
    if (!field) return;
    this.pickerOpen.set(false);
    this.editorOpen.set(false);
    this.editor.set({ mode: 'edit', field, tokenIdentity, query: token.value });
  }

  protected onEditOpenChange(open: boolean, index: number): void {
    if (open) {
      this.beginEdit(index);
      queueMicrotask(() => this.focusEditor('edit'));
      return;
    }
    const state = this.editor();
    const closingIdentity = identifyHellFilterToken(this.value(), index);
    if (
      state?.mode === 'edit' &&
      closingIdentity &&
      this.sameIdentity(state.tokenIdentity, closingIdentity)
    ) {
      this.editor.set(null);
    }
  }

  protected onTokenSetKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    const target = event.target instanceof HTMLElement ? event.target : null;
    const token = target?.closest<HTMLElement>('[data-slot="token"]');
    if (!token) return;

    if (event.key === 'ArrowRight' && this.isLastToken(token)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      queueMicrotask(() => this.focusPicker());
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      queueMicrotask(() => this.focusPicker());
      return;
    }

    if (this.isPrintableTokenKey(event)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      queueMicrotask(() => this.focusPickerWithText(event.key));
      return;
    }

    if (event.key !== 'Enter' && event.key !== ' ') return;
    const edit = token?.querySelector<HTMLButtonElement>('[data-hell-filter-token-edit]');
    if (!edit) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    edit.click();
  }

  protected onEditorInput(event: Event): void {
    if (this.disabled()) return;
    const current = this.editor();
    if (!current) return;
    const input = event.target as HTMLInputElement;
    this.editor.set({ ...current, query: input.value });
    if (current.field.kind === 'options' && input.value && !this.editorOpen()) {
      this.dispatchComboboxKey(input, 'ArrowDown');
    }
  }

  protected onEditorKeydown(
    event: KeyboardEvent,
    trigger?: HellPopoverTrigger,
  ): void {
    const state = this.editor();
    if (!state) return;

    if (this.disabled()) return;

    if (state.field.kind === 'options' && event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      this.dispatchComboboxKey(event.currentTarget as HTMLInputElement, 'Enter');
      return;
    }

    if (event.key === 'Backspace' && !state.query && state.mode === 'create') {
      event.preventDefault();
      this.cancelEditor();
      return;
    }

    if (event.key === 'Enter' && state.field.kind === 'text') {
      this.commitEditor(undefined, trigger);
      event.preventDefault();
    }
  }

  protected onEditorSelection(
    selection: HellFilterOption | null,
    trigger?: HellPopoverTrigger,
  ): void {
    if (!selection) return;
    this.commitEditor(selection, trigger);
  }

  protected onOptionsEditorFocus(input: HTMLInputElement): void {
    if (this.disabled() || this.editor()?.field.kind !== 'options') return;
    this.dispatchComboboxKey(input, 'ArrowDown');
  }

  protected onEditorEscape(event: Event, trigger?: HellPopoverTrigger): void {
    event.preventDefault();
    event.stopPropagation();
    this.cancelEditor(trigger);
  }

  protected onEditorFocusOut(event: FocusEvent, combobox?: HellCombobox): void {
    const state = this.editor();
    if (state?.mode !== 'create') return;
    const relatedTarget = event.relatedTarget;
    const outside = combobox
      ? combobox.isOutsideControl(relatedTarget)
      : !(relatedTarget instanceof Node) ||
        !(event.currentTarget as HTMLElement).contains(relatedTarget);
    if (outside) this.cancelEditor(undefined, false);
  }

  protected onEditorOpenChange(open: boolean, trigger?: HellPopoverTrigger): void {
    this.editorOpen.set(open);
    if (open) return;
    if (this.suppressEditorClose) {
      this.suppressEditorClose = false;
      return;
    }
    if (this.editor()?.field.kind === 'options') this.cancelEditor(trigger, false);
  }

  protected commitEditor(option?: HellFilterOption, trigger?: HellPopoverTrigger): void {
    if (this.disabled()) return;
    const state = this.editor();
    if (!state) return;
    if (state.field.kind === 'options' && (!option || option.disabled)) return;
    const committed = state.field.kind === 'options' ? option!.value : state.query.trim();
    if (state.field.kind === 'text' && !committed) return;

    const current = this.value();
    const editIndex = state.tokenIdentity
      ? current.findIndex((_, index) =>
          this.sameIdentity(identifyHellFilterToken(current, index), state.tokenIdentity))
      : -1;
    const next = commitHellFilterToken(current, {
      key: state.field.key,
      value: committed,
      multiple: state.field.multiple ?? false,
      editIdentity: state.tokenIdentity ?? undefined,
    });
    const nextEditIndex = editIndex < 0
      ? -1
      : state.field.key === HELL_FILTER_TEXT_KEY
        ? current.slice(0, editIndex).filter((token) => token.key !== HELL_FILTER_TEXT_KEY).length
        : editIndex;
    const nextTokenIdentity = nextEditIndex < 0
      ? null
      : identifyHellFilterToken(next, nextEditIndex);
    const label = this.tokenLabel({
      key: state.field.key,
      operator: 'eq',
      value: committed,
    });
    const changed = this.emitIfChanged(next);
    if (changed) {
      this.liveMessage.set(
        state.mode === 'edit' ? this.labels.updated(label) : this.labels.added(label),
      );
    }

    if (state.mode === 'create' && state.field.kind === 'options' && state.field.multiple) {
      this.suppressEditorClose = true;
      this.editor.set({ ...state, query: '' });
      queueMicrotask(() => this.focusEditor('create'));
      return;
    }

    this.editorOpen.set(false);
    this.editor.set(null);
    if (trigger) {
      void trigger.hide('keyboard').then(() => {
        setTimeout(() => {
          if (!nextTokenIdentity || !this.focusToken(nextTokenIdentity)) this.focusPicker();
        }, 0);
      });
    } else {
      queueMicrotask(() => this.focusPicker());
    }
  }

  protected removeToken(index: number): void {
    if (this.disabled()) return;
    const token = this.value()[index];
    if (!token) return;
    const next = this.value().filter((_, tokenIndex) => tokenIndex !== index);
    this.valueChange.emit(next);
    this.liveMessage.set(this.labels.removed(this.tokenLabel(token)));
    // Chip Set restores focus after the removed chip leaves the DOM. When that
    // was the final token, move on to the adjacent picker one task later so its
    // more useful continuation target wins that teardown ordering.
    if (!next.length) setTimeout(() => this.focusPicker(), 0);
  }

  protected clearAll(): void {
    if (this.disabled() || !this.value().length) return;
    this.valueChange.emit([]);
    this.liveMessage.set(this.labels.cleared);
    queueMicrotask(() => this.focusPicker());
  }

  protected tokenLabel(token: HellFilterToken): string {
    if (token.key === HELL_FILTER_TEXT_KEY) return this.labels.freeTextToken(token.value);
    const field = this.fields().find((candidate) => candidate.key === token.key);
    if (!field) return `${token.key}: ${token.value}`;
    if (field.kind === 'options') {
      const option = field.options.find((candidate) => candidate.value === token.value);
      return `${field.label}: ${option?.label ?? token.value}`;
    }
    return `${field.label}: ${token.value}`;
  }

  protected tokenTrack(token: HellFilterToken, index: number): string {
    const identity = identifyHellFilterToken(this.value(), index);
    return identity ? `${identity.fingerprint}:${identity.occurrence}` : `${token.key}:${index}`;
  }

  protected suggestionTrack(suggestion: HellFilterSuggestion, index: number): string {
    return suggestion.kind === 'field' ? `field:${suggestion.field.key}` : `free:${index}`;
  }

  private beginCreate(field: HellFilterField, query: string): void {
    this.clearLiveTimer();
    this.query.set('');
    this.pickerOpen.set(false);
    this.editorOpen.set(false);
    this.editor.set({ mode: 'create', field, tokenIdentity: null, query });
    setTimeout(() => {
      const document = this.host.ownerDocument;
      const activeElement = document.activeElement;
      if (activeElement && activeElement !== document.body && !this.host.contains(activeElement)) {
        this.cancelEditor(undefined, false);
        return;
      }
      this.focusEditor('create');
    }, 0);
  }

  private cancelEditor(trigger?: HellPopoverTrigger, restoreFocus = true): void {
    const state = this.editor();
    if (!state) return;
    this.editorOpen.set(false);
    this.editor.set(null);
    if (state.mode === 'edit' && trigger) {
      const identity = state.tokenIdentity;
      void trigger.hide(restoreFocus ? 'keyboard' : 'mouse').then(() => {
        if (restoreFocus && identity) {
          setTimeout(() => {
            if (!this.focusToken(identity)) this.focusPicker();
          }, 0);
        }
      });
    } else if (restoreFocus) {
      queueMicrotask(() => this.focusPicker());
    }
  }

  private commitFreeText(value: string): void {
    const previous = this.value().find((token) => token.key === HELL_FILTER_TEXT_KEY);
    const next = commitHellFilterToken(this.value(), {
      key: HELL_FILTER_TEXT_KEY,
      value,
      multiple: false,
    });
    if (this.emitIfChanged(next)) {
      const label = this.labels.freeTextToken(value);
      this.liveMessage.set(previous ? this.labels.updated(label) : this.labels.added(label));
    }
    this.query.set('');
    this.pickerOpen.set(false);
  }

  private scheduleLiveFreeText(query: string): void {
    this.clearLiveTimer();
    const delay = this.freeTextDebounceMs();
    if (delay === null) return;
    this.liveTimer = setTimeout(() => {
      this.liveTimer = null;
      const trimmed = query.trim();
      const previous = this.value().find((token) => token.key === HELL_FILTER_TEXT_KEY);
      const withoutText = this.value().filter((token) => token.key !== HELL_FILTER_TEXT_KEY);
      const next = trimmed
        ? [...withoutText, { key: HELL_FILTER_TEXT_KEY, operator: 'eq' as const, value: trimmed }]
        : withoutText;
      if (!this.emitIfChanged(next)) return;
      if (trimmed) {
        const label = this.labels.freeTextToken(trimmed);
        this.liveMessage.set(previous ? this.labels.updated(label) : this.labels.added(label));
      } else if (previous) {
        this.liveMessage.set(this.labels.removed(this.tokenLabel(previous)));
      }
    }, Math.max(0, delay));
  }

  private clearLiveTimer(): void {
    if (this.liveTimer === null) return;
    clearTimeout(this.liveTimer);
    this.liveTimer = null;
  }

  private emitIfChanged(next: readonly HellFilterToken[]): boolean {
    if (this.sameValue(this.value(), next)) return false;
    this.valueChange.emit(next);
    return true;
  }

  private sameValue(a: readonly HellFilterToken[], b: readonly HellFilterToken[]): boolean {
    return a.length === b.length && a.every((token, index) => {
      const other = b[index];
      return token.key === other?.key && token.operator === other.operator && token.value === other.value;
    });
  }

  private colonAccelerator(value: string): { field: HellFilterField; query: string } | null {
    const colon = value.indexOf(':');
    if (colon < 1) return null;
    const prefix = value.slice(0, colon).trim().toLocaleLowerCase();
    const field = this.fields().find((candidate) => {
      if (candidate.key === HELL_FILTER_TEXT_KEY) return false;
      if (!candidate.multiple && this.value().some((token) => token.key === candidate.key)) return false;
      return candidate.key.toLocaleLowerCase() === prefix || candidate.label.toLocaleLowerCase() === prefix;
    });
    return field ? { field, query: value.slice(colon + 1).trimStart() } : null;
  }

  private focusPicker(): void {
    this.host.querySelector<HTMLInputElement>('[data-slot="control"] > [data-slot="input"]')?.focus();
  }

  private focusEditor(mode: 'create' | 'edit'): void {
    const root = mode === 'create' ? this.host : this.host.ownerDocument.body;
    root.querySelector<HTMLInputElement>(
      `[data-slot="editor"][data-mode="${mode}"][data-hell-filter-bar-owner="${this.instanceId}"] [data-hell-filter-editor-input]`,
    )?.focus();
  }

  private focusLastToken(): void {
    const tokens = this.host.querySelectorAll<HTMLElement>('[data-slot="token"]');
    tokens.item(tokens.length - 1)?.focus();
  }

  private focusPickerWithText(text: string): void {
    const input = this.host.querySelector<HTMLInputElement>(
      '[data-slot="control"] > [data-slot="input"]',
    );
    if (!input) return;
    input.focus();
    input.value = text;
    const InputEventCtor = input.ownerDocument.defaultView?.InputEvent;
    const event = InputEventCtor
      ? new InputEventCtor('input', { bubbles: true, data: text, inputType: 'insertText' })
      : new Event('input', { bubbles: true });
    input.dispatchEvent(event);
  }

  private focusToken(identity: HellFilterTokenIdentity): boolean {
    for (const token of this.host.querySelectorAll<HTMLElement>('[data-slot="token"]')) {
      if (token.getAttribute('data-hell-filter-token-id') === `${identity.fingerprint}:${identity.occurrence}`) {
        token.focus();
        return true;
      }
    }
    return false;
  }

  private isLastToken(token: HTMLElement): boolean {
    const tokens = Array.from(this.host.querySelectorAll<HTMLElement>('[data-slot="token"]'));
    return tokens.at(-1) === token;
  }

  private isPrintableTokenKey(event: KeyboardEvent): boolean {
    return (
      event.key.length === 1 &&
      event.key !== ' ' &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.isComposing
    );
  }

  private syncComboboxLayer(input: HTMLInputElement, value: string, open: boolean): void {
    if (value && !open) {
      this.dispatchComboboxKey(input, 'ArrowDown');
    } else if (!value && open) {
      this.dispatchComboboxKey(input, 'Escape');
    }
  }

  private dispatchComboboxKey(input: HTMLInputElement, key: string): void {
    input.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true }));
  }

  private sameIdentity(
    first: HellFilterTokenIdentity | null,
    second: HellFilterTokenIdentity | null,
  ): boolean {
    return Boolean(
      first &&
      second &&
      first.fingerprint === second.fingerprint &&
      first.occurrence === second.occurrence,
    );
  }

  private freeTextEditorField(): HellFilterTextField {
    return {
      key: HELL_FILTER_TEXT_KEY,
      label: this.labels.freeTextField,
      kind: 'text',
      multiple: false,
    };
  }
}
