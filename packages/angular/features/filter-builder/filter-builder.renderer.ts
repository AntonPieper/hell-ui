/** Package-local rendering and interaction runtime for `HellFilterBuilder`. */
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  NO_ERRORS_SCHEMA,
  TemplateRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { HellButton } from 'hell-ui/button';
import { HELL_CHIP_IMPORTS } from 'hell-ui/chip';
import { HELL_COMBOBOX_IMPORTS } from 'hell-ui/combobox';
import { HELL_CONTROL_GROUP_IMPORTS } from 'hell-ui/control-group';
import {
  hellPartStyler,
  hellRankLocalSearch,
  type HellRecipe,
  type HellUiInput,
} from 'hell-ui/core';
import {
  HELL_FLOATING_SCOPE,
  HellFloatingScopeRegistry,
} from 'hell-ui/internal/core';
import { HellPopover, HellPopoverTrigger } from 'hell-ui/popover';

import {
  HELL_FILTER_BUILDER_LABELS,
  HellFilterBuilderEditor,
  HellFilterBuilderEditorRegistry,
  hellFilterBuilderEditorTemplate,
  type HellFilterBuilderEditorContext,
} from './filter-builder.contracts';
import {
  commitHellFilterBuilderValue,
  findHellFilterByIdentity,
  removeHellFilterBuilderValue,
  sameHellFilterIdentity,
  type HellFilter,
  type HellFilterFieldDescriptor,
  type HellFilterIdentity,
  type HellFilterIdentityValue,
} from './filter-builder.state';

/** Durable public parts of `hell-filter-builder`. */
export type HellFilterBuilderPart =
  | 'root'
  | 'tokens'
  | 'token'
  | 'tokenLabel'
  | 'control'
  | 'panel'
  | 'fieldOption'
  | 'editor'
  | 'clear'
  | 'live';

const HELL_FILTER_BUILDER_RECIPE = {
  root: 'relative flex w-full min-w-0 items-start gap-hell-2',
  tokens: 'flex min-w-0 flex-1 flex-wrap items-center gap-hell-2',
  token: '',
  tokenLabel: 'border-0 bg-transparent p-0 font-[family-name:inherit] text-inherit outline-none',
  control: 'min-w-[180px] flex-1',
  panel: 'z-[var(--hell-z-popover,60)] max-h-[280px] shadow-hell-lg',
  fieldOption: 'data-[active]:bg-hell-surface-muted',
  editor: 'relative min-w-[240px] flex-1',
  clear: '',
  live: 'sr-only',
} satisfies HellRecipe<HellFilterBuilderPart>;

const HELL_FILTER_BUILDER_PICKER_UI =
  'h-auto min-h-0 flex-1 rounded-none border-0 bg-transparent ps-hell-3 shadow-none data-focus:border-transparent data-focus:shadow-none';

interface HellFilterBuilderEditorState<TFilter extends HellFilter> {
  readonly mode: 'create' | 'edit';
  readonly field: TFilter['field'];
  readonly identity: HellFilterIdentityValue | null;
  readonly trigger: HellPopoverTrigger | null;
  readonly session: number;
}

let nextFilterBuilderId = 0;

/** Component-local Floating Scope adapter; intentionally absent from the public class. */
class HellFilterBuilderFloatingScope extends HellFloatingScopeRegistry {}

function createHellFilterBuilderFloatingScope(): HellFilterBuilderFloatingScope {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  return new HellFilterBuilderFloatingScope(() => host);
}

/** Package-local renderer and interaction state machine for `HellFilterBuilder`. */
@Component({
  selector: 'hell-filter-builder-renderer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    HellButton,
    ...HELL_CHIP_IMPORTS,
    ...HELL_COMBOBOX_IMPORTS,
    ...HELL_CONTROL_GROUP_IMPORTS,
    HellPopover,
    HellPopoverTrigger,
  ],
  providers: [
    {
      provide: HellFilterBuilderFloatingScope,
      useFactory: createHellFilterBuilderFloatingScope,
    },
    { provide: HELL_FLOATING_SCOPE, useExisting: HellFilterBuilderFloatingScope },
  ],
  // Composed Combobox and Popover bindings come from sibling entry points.
  // Packaged consumer templates still type-check against their metadata.
  schemas: [NO_ERRORS_SCHEMA],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-has-filters]': 'value().length ? "" : null',
    '[attr.data-editing]': 'editorMode()',
  },
  template: `
    <div
      hellChipSet
      tabindex="-1"
      data-slot="tokens"
      [ui]="part('tokens')"
      [attr.aria-label]="effectiveAriaLabel()"
      (keydown)="onTokenSetKeydown($event)"
    >
      @for (filter of value(); track filterIdentity(filter)) {
        <span
          hellChip
          size="sm"
          data-slot="token"
          [ui]="part('token')"
          [label]="filterLabel(filter)"
          [disabled]="disabled()"
          [attr.data-field]="filter.field"
          [attr.data-hell-filter-builder-id]="domIdentity(filterIdentity(filter))"
          (remove)="removeFilter(filterIdentity(filter))"
        >
          <button
            #editTrigger="hellPopoverTrigger"
            type="button"
            tabindex="-1"
            data-slot="tokenLabel"
            data-hell-filter-builder-edit
            [class]="part('tokenLabel')"
            [attr.aria-label]="labels.edit(filterLabel(filter))"
            [hellPopoverTrigger]="editPopover"
            [disabled]="disabled()"
            [closeOnEscape]="false"
            [trapFocus]="false"
            (pointerdown)="beginEdit(filter, editTrigger)"
            (click)="beginEdit(filter, editTrigger)"
            (openChange)="onEditOpenChange($any($event), filterIdentity(filter), editTrigger)"
          >
            <span>{{ filterLabel(filter) }}</span>
          </button>
          <button hellChipRemove></button>
        </span>

        <ng-template #editPopover>
          <div hellPopover [attr.aria-label]="labels.edit(filterLabel(filter))">
            @if (isEditing(filterIdentity(filter))) {
              <ng-container *ngTemplateOutlet="projectedEditor" />
            }
          </div>
        </ng-template>
      }

      @if (editorMode() === 'create') {
        <ng-container *ngTemplateOutlet="projectedEditor" />
      } @else {
        <div
          hellControlGroup
          data-slot="control"
          [ui]="part('control')"
          [disabled]="disabled()"
        >
          <div
            hellCombobox
            [ui]="pickerUi"
            [value]="null"
            [options]="availableFields()"
            [wrapNavigation]="false"
            [disabled]="disabled()"
            (valueChange)="activateField($any($event))"
            (openChange)="onPickerOpenChange($any($event))"
          >
            <input
              hellChipInput
              hellComboboxInput
              data-hell-filter-builder-input
              type="search"
              autocomplete="off"
              spellcheck="false"
              [attr.aria-label]="effectiveAriaLabel()"
              [attr.placeholder]="effectivePlaceholder()"
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
              @for (descriptor of availableFields(); track descriptor.field) {
                <div
                  hellComboboxOption
                  data-slot="fieldOption"
                  [value]="descriptor"
                  [ui]="part('fieldOption')"
                >
                  {{ descriptor.label }}
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>

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

    <ng-template #projectedEditor>
      @if (activeEditorTemplate(); as template) {
        @if (editorContext(); as context) {
          <div
            data-slot="editor"
            tabindex="-1"
            [class]="part('editor')"
            [attr.data-mode]="context.mode"
            [attr.data-field]="context.descriptor.field"
            [attr.data-hell-filter-builder-owner]="instanceId"
            (keydown.escape)="onEditorEscape($event)"
            (focusout)="onEditorFocusOut()"
          >
            <ng-container
              [ngTemplateOutlet]="template"
              [ngTemplateOutletContext]="context"
              [ngTemplateOutletInjector]="editorInjector"
            />
          </div>
        }
      }
    </ng-template>
  `,
})
export class HellFilterBuilderRenderer<TFilter extends HellFilter = HellFilter> {
  /** Tailwind class refinements for renderer-owned durable public parts. */
  readonly ui = input<HellUiInput<HellFilterBuilderPart>>(undefined, { alias: 'ui' });

  /** @internal Template-only Part Style Map resolver. */
  protected readonly part = hellPartStyler<HellFilterBuilderPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_FILTER_BUILDER_RECIPE,
  });

  /** Typed application field descriptors. */
  readonly fields = input.required<readonly HellFilterFieldDescriptor<TFilter>[]>();
  /** Complete controlled expression array. */
  readonly value = input<readonly TFilter[]>([]);
  /** Required stable identity callback for controlled recreation and reorder. */
  readonly identify = input.required<HellFilterIdentity<TFilter>>();
  /** Disables field selection, editing, removal, and clear-all. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Optional field-picker placeholder. */
  readonly placeholder = input<string | null>(null);
  /** Accessible name; defaults to the Label Contract's `input` value. */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  /** Emits the complete next controlled array after valid user actions. */
  readonly valueChange = output<readonly TFilter[]>();

  /** @internal Template-only effective labels. */
  protected readonly labels = inject(HELL_FILTER_BUILDER_LABELS);
  /** @internal Template-only projected-editor injector. */
  protected readonly editorInjector = inject(Injector);
  /** @internal Template-only Combobox Part Style Map. */
  protected readonly pickerUi = HELL_FILTER_BUILDER_PICKER_UI;
  /** @internal Template-only owner marker for portalled editors. */
  protected readonly instanceId = ++nextFilterBuilderId;
  /** @internal Template-only field query. */
  protected readonly query = signal('');
  /** @internal Template-only Combobox state. */
  protected readonly pickerOpen = signal(false);
  /** @internal Template-only live-region message. */
  protected readonly liveMessage = signal('');
  private readonly editor = signal<HellFilterBuilderEditorState<TFilter> | null>(null);
  /** @internal Template-only editor mode. */
  protected readonly editorMode = computed(() => this.editor()?.mode ?? null);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);
  private readonly floatingScope = inject(HellFilterBuilderFloatingScope);
  private readonly editorTemplates = inject(HellFilterBuilderEditorRegistry).editors;
  private nextEditorSession = 0;
  private focusTimer: ReturnType<typeof setTimeout> | null = null;

  /** @internal Template-only accessible name. */
  protected readonly effectiveAriaLabel = computed(() => this.ariaLabel() ?? this.labels.input);
  /** @internal Template-only placeholder. */
  protected readonly effectivePlaceholder = computed(
    () => this.placeholder() ?? this.labels.placeholder,
  );
  /** @internal Template-only filtered field options. */
  protected readonly availableFields = computed(() => {
    const query = this.query();
    const current = this.value();
    const available = this.fields().filter(
      (descriptor) =>
        this.templateForField(descriptor.field) !== null &&
        (descriptor.multiple || !current.some((filter) => filter.field === descriptor.field)),
    );
    return hellRankLocalSearch(available, {
      query,
      fields: [
        { weight: 2, get: (descriptor) => descriptor.label },
        { weight: 1, get: (descriptor) => descriptor.field },
      ],
    }).map(({ item }) => item);
  });
  /** @internal Template-only projected editor template. */
  protected readonly activeEditorTemplate = computed(() => {
    const state = this.editor();
    return state ? this.templateForField(state.field) : null;
  });
  /** @internal Template-only projected editor context. */
  protected readonly editorContext = computed(() => this.createEditorContext());

  constructor() {
    this.destroyRef.onDestroy(() => this.clearFocusTimer());
    effect(() => {
      const state = this.editor();
      if (
        !state ||
        (this.descriptorForField(state.field) && this.templateForField(state.field))
      ) {
        return;
      }
      this.cancelEditor(state.session);
    });
  }

  /** @internal Template-only stable identity lookup. */
  protected filterIdentity(filter: TFilter): HellFilterIdentityValue {
    return this.identify()(filter);
  }

  /** @internal Template-only DOM-safe identity projection. */
  protected domIdentity(identity: HellFilterIdentityValue): string {
    return typeof identity === 'number' ? `number:${identity}` : `string:${identity}`;
  }

  /** @internal Template-only descriptor display projection. */
  protected filterLabel(filter: TFilter): string {
    const descriptor = this.descriptorForField(filter.field);
    return descriptor ? descriptor.display(filter) : String(filter.field);
  }

  /** @internal Template event handler. */
  protected onPickerInput(event: Event): void {
    if (this.disabled()) return;
    const input = event.target as HTMLInputElement;
    this.query.set(input.value);
    this.syncComboboxLayer(input, input.value, this.pickerOpen());
  }

  /** @internal Template event handler. */
  protected onPickerOpenChange(open: boolean): void {
    this.pickerOpen.set(open);
  }

  /** @internal Template event handler. */
  protected onPickerKeydown(event: KeyboardEvent): void {
    if (this.disabled() || event.defaultPrevented) return;

    if (event.key === 'Tab' && this.pickerOpen()) {
      const input = event.currentTarget as HTMLInputElement;
      const activeId = input.getAttribute('aria-activedescendant');
      const activeOption = activeId ? input.ownerDocument.getElementById(activeId) : null;
      if (
        !activeOption?.matches(
          '[role="option"]:not([aria-disabled="true"]):not([data-disabled]):not([disabled])',
        )
      ) {
        return;
      }
      event.preventDefault();
      this.dispatchComboboxKey(input, 'Enter');
      return;
    }

    if (event.key !== 'Escape') return;
    const input = event.currentTarget as HTMLInputElement;
    if (this.pickerOpen() || input.getAttribute('aria-expanded') === 'true') return;
    if (!this.query()) return;
    this.query.set('');
    input.value = '';
    event.preventDefault();
    event.stopPropagation();
  }

  /** @internal Template event handler. */
  protected activateField(descriptor: HellFilterFieldDescriptor<TFilter> | null): void {
    if (!descriptor || this.disabled()) return;
    this.beginCreate(descriptor);
  }

  /** @internal Template event handler. */
  protected beginEdit(filter: TFilter, trigger: HellPopoverTrigger): void {
    if (this.disabled()) return;
    const identity = this.filterIdentity(filter);
    const current = findHellFilterByIdentity(this.value(), identity, this.identify());
    if (!current) return;
    const descriptor = this.descriptorForField(current.field);
    if (!descriptor || !this.templateForField(descriptor.field)) return;

    const active = this.editor();
    if (
      active?.mode === 'edit' &&
      active.identity !== null &&
      sameHellFilterIdentity(active.identity, identity)
    ) {
      return;
    }

    this.pickerOpen.set(false);
    this.editor.set({
      mode: 'edit',
      field: descriptor.field,
      identity,
      trigger,
      session: ++this.nextEditorSession,
    });
  }

  /** @internal Template event handler. */
  protected onEditOpenChange(
    open: boolean,
    identity: HellFilterIdentityValue,
    trigger: HellPopoverTrigger,
  ): void {
    if (open) {
      const filter = findHellFilterByIdentity(this.value(), identity, this.identify());
      if (filter) this.beginEdit(filter, trigger);
      this.scheduleEditorFocus('edit');
      return;
    }

    const state = this.editor();
    if (
      state?.mode === 'edit' &&
      state.identity !== null &&
      sameHellFilterIdentity(state.identity, identity)
    ) {
      this.editor.set(null);
    }
  }

  /** @internal Template-only editor state projection. */
  protected isEditing(identity: HellFilterIdentityValue): boolean {
    const state = this.editor();
    return Boolean(
      state?.mode === 'edit' &&
        state.identity !== null &&
        sameHellFilterIdentity(state.identity, identity),
    );
  }

  /** @internal Template event handler. */
  protected onTokenSetKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    const target = event.target instanceof HTMLElement ? event.target : null;
    const token = target?.closest<HTMLElement>('[data-slot="token"]');
    if (!token) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.schedulePickerFocus();
      return;
    }

    if (this.isPrintableTokenKey(event)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.schedulePickerFocus(event.key);
      return;
    }

    if (event.key !== 'Enter' && event.key !== ' ') return;
    const edit = token.querySelector<HTMLButtonElement>('[data-hell-filter-builder-edit]');
    if (!edit) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    edit.click();
  }

  /** @internal Template event handler. */
  protected onEditorEscape(event: Event): void {
    if (event.defaultPrevented) return;
    event.preventDefault();
    event.stopPropagation();
    const state = this.editor();
    if (state) this.cancelEditor(state.session);
  }

  /** @internal Template event handler. */
  protected onEditorFocusOut(): void {
    const state = this.editor();
    if (state?.mode !== 'create') return;
    setTimeout(() => {
      if (this.editor()?.session !== state.session) return;
      if (!this.floatingScope.containsFloatingTarget(this.host.ownerDocument.activeElement)) {
        this.cancelEditor(state.session, false);
      }
    }, 0);
  }

  /** @internal Template event handler. */
  protected removeFilter(identity: HellFilterIdentityValue): void {
    if (this.disabled()) return;
    const current = this.value();
    const filter = findHellFilterByIdentity(current, identity, this.identify());
    const next = removeHellFilterBuilderValue(current, identity, this.identify());
    if (!filter || !next) return;
    this.valueChange.emit(next);
    this.liveMessage.set(this.labels.removed(this.filterLabel(filter)));
  }

  /** @internal Template event handler. */
  protected clearAll(): void {
    if (this.disabled() || !this.value().length) return;
    this.valueChange.emit([]);
    this.liveMessage.set(this.labels.cleared);
    this.schedulePickerFocus();
  }

  private beginCreate(descriptor: HellFilterFieldDescriptor<TFilter>): void {
    if (!this.templateForField(descriptor.field)) return;
    if (
      !descriptor.multiple &&
      this.value().some((filter) => filter.field === descriptor.field)
    ) {
      return;
    }
    this.query.set('');
    this.pickerOpen.set(false);
    this.editor.set({
      mode: 'create',
      field: descriptor.field,
      identity: null,
      trigger: null,
      session: ++this.nextEditorSession,
    });
    this.scheduleEditorFocus('create');
  }

  private createEditorContext(): HellFilterBuilderEditorContext<TFilter> | null {
    const state = this.editor();
    if (!state) return null;
    const descriptor = this.descriptorForField(state.field);
    if (!descriptor) return null;
    const filter =
      state.mode === 'edit' && state.identity !== null
        ? findHellFilterByIdentity(this.value(), state.identity, this.identify())
        : null;

    const context: HellFilterBuilderEditorContext<TFilter> = {
      get $implicit(): HellFilterBuilderEditorContext<TFilter> {
        return context;
      },
      descriptor,
      filter,
      mode: state.mode,
      display: (candidate) => descriptor.display(candidate),
      validate: (candidate) => descriptor.validate(candidate),
      commit: (candidate) => this.commitEditor(state.session, candidate),
      cancel: () => this.cancelEditor(state.session),
    };
    return context;
  }

  private commitEditor(session: number, filter: TFilter): boolean {
    if (this.disabled()) return false;
    const state = this.editor();
    if (!state || state.session !== session) return false;
    const descriptor = this.descriptorForField(state.field);
    if (!descriptor) return false;

    const result = commitHellFilterBuilderValue(
      this.value(),
      {
        mode: state.mode,
        descriptor,
        filter,
        editIdentity: state.identity ?? undefined,
      },
      this.identify(),
    );
    if (!result) return false;

    const label = descriptor.display(filter);
    this.valueChange.emit(result.value);
    this.liveMessage.set(
      state.mode === 'edit' ? this.labels.updated(label) : this.labels.added(label),
    );
    this.editor.set(null);

    if (state.mode === 'edit' && state.trigger) {
      void state.trigger.hide('keyboard').then(() => {
        this.scheduleTokenFocus(result.identity);
      });
    } else {
      this.schedulePickerFocus();
    }
    return true;
  }

  private cancelEditor(session: number, restoreFocus = true): void {
    const state = this.editor();
    if (!state || state.session !== session) return;
    this.editor.set(null);

    if (state.mode === 'edit' && state.trigger) {
      void state.trigger.hide(restoreFocus ? 'keyboard' : 'mouse').then(() => {
        if (restoreFocus && state.identity !== null) this.scheduleTokenFocus(state.identity);
      });
    } else if (restoreFocus) {
      this.schedulePickerFocus();
    }
  }

  private descriptorForField(
    field: TFilter['field'],
  ): HellFilterFieldDescriptor<TFilter> | null {
    return this.fields().find((descriptor) => descriptor.field === field) ?? null;
  }

  private templateForField(
    field: TFilter['field'],
  ): TemplateRef<HellFilterBuilderEditorContext<TFilter>> | null {
    const registration = this.editorTemplates().find(
      (candidate) =>
        (candidate as HellFilterBuilderEditor<TFilter>).descriptor().field === field,
    ) as HellFilterBuilderEditor<TFilter> | undefined;
    return registration ? hellFilterBuilderEditorTemplate(registration) : null;
  }

  private scheduleEditorFocus(mode: 'create' | 'edit'): void {
    this.scheduleFocus(() => {
      const root = mode === 'create' ? this.host : this.host.ownerDocument.body;
      const editor = root.querySelector<HTMLElement>(
        `[data-slot="editor"][data-mode="${mode}"]` +
          `[data-hell-filter-builder-owner="${this.instanceId}"]`,
      );
      const focusable = editor?.querySelector<HTMLElement>(
        '[autofocus], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), ' +
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      focusable?.focus({ preventScroll: true });
    });
  }

  private schedulePickerFocus(text = ''): void {
    this.scheduleFocus(() => {
      const input = this.host.querySelector<HTMLInputElement>('[data-hell-filter-builder-input]');
      if (!input) return;
      input.focus({ preventScroll: true });
      if (!text) return;
      input.value = text;
      const InputEventCtor = input.ownerDocument.defaultView?.InputEvent;
      const event = InputEventCtor
        ? new InputEventCtor('input', {
            bubbles: true,
            data: text,
            inputType: 'insertText',
          })
        : new Event('input', { bubbles: true });
      input.dispatchEvent(event);
    });
  }

  private scheduleTokenFocus(identity: HellFilterIdentityValue): void {
    this.scheduleFocus(() => {
      const domIdentity = this.domIdentity(identity);
      const token = Array.from(
        this.host.querySelectorAll<HTMLElement>('[data-hell-filter-builder-id]'),
      ).find(
        (candidate) => candidate.getAttribute('data-hell-filter-builder-id') === domIdentity,
      );
      if (token) token.focus({ preventScroll: true });
      else this.schedulePickerFocus();
    });
  }

  private scheduleFocus(callback: () => void): void {
    this.clearFocusTimer();
    this.focusTimer = setTimeout(() => {
      this.focusTimer = null;
      callback();
    }, 0);
  }

  private clearFocusTimer(): void {
    if (this.focusTimer === null) return;
    clearTimeout(this.focusTimer);
    this.focusTimer = null;
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
}
