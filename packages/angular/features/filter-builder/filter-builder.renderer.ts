/** Package-local rendering and interaction runtime for `HellFilterBuilder`. */
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NO_ERRORS_SCHEMA,
  TemplateRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { HELL_CHIP_IMPORTS } from 'hell-ui/chip';
import { HELL_COMBOBOX_IMPORTS } from 'hell-ui/combobox';
import { HELL_CONTROL_GROUP_IMPORTS } from 'hell-ui/control-group';
import {
  hellRankLocalSearch,
  type HellUiInput,
} from 'hell-ui/core';
import {
  HELL_FLOATING_SCOPE,
  HellFloatingScopeRegistry,
  hellPartStyler,
  type HellRecipe,
} from 'hell-ui/internal/core';
import { HellPopover, HellPopoverTrigger } from 'hell-ui/popover';

import { HellFilterBuilderEditorSurface } from './filter-builder.editor-surface';
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
  type HellFilterDisplayParts,
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
  | 'tokenField'
  | 'tokenOperator'
  | 'tokenValue'
  | 'control'
  | 'panel'
  | 'fieldOption'
  | 'editor'
  | 'clear'
  | 'live';

const HELL_FILTER_BUILDER_RECIPE = {
  // The root is the Control Group frame. It only adds the positioning context
  // for the anchor-only create trigger; the frame keeps the group's stretch
  // alignment and grows vertically because the chip set wraps inside it.
  root: 'relative',
  // The Chip Set owns in-group spacing through `data-in-control-group`; the
  // Filter Builder deliberately adds no private spacing overrides.
  tokens: '',
  token: 'min-w-0',
  tokenLabel:
    'inline-flex min-w-0 items-center gap-hell-1 border-0 bg-transparent p-0 font-[family-name:inherit] text-inherit outline-none',
  tokenField: 'shrink-0 text-hell-foreground-muted',
  tokenOperator: 'shrink-0 text-hell-foreground-muted',
  tokenValue: 'max-w-[16rem] truncate font-medium text-hell-foreground',
  control:
    'h-auto min-h-0 w-auto min-w-[8rem] flex-1 rounded-none border-0 bg-transparent p-0 shadow-none data-hover:border-transparent data-focus:border-transparent data-focus:shadow-none',
  panel: 'z-[var(--hell-z-popover,60)] max-h-[280px] shadow-hell-lg',
  fieldOption: 'data-[active]:bg-hell-surface-muted',
  editor: 'relative min-w-[240px]',
  clear: '',
  live: 'sr-only',
} satisfies HellRecipe<HellFilterBuilderPart>;

/**
 * Anchor-only create trigger. It is private overlay scaffolding rather than a
 * Public Part: the popover engine needs a `button[hellPopoverTrigger]` host,
 * while the surface itself is anchored to and dismissed against the frame.
 */
const HELL_FILTER_BUILDER_CREATE_TRIGGER =
  'pointer-events-none absolute bottom-0 start-0 h-0 w-0 overflow-hidden border-0 bg-transparent p-0 opacity-0';

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
    ...HELL_CHIP_IMPORTS,
    ...HELL_COMBOBOX_IMPORTS,
    ...HELL_CONTROL_GROUP_IMPORTS,
    HellPopover,
    HellPopoverTrigger,
    HellFilterBuilderEditorSurface,
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
    class: 'contents',
  },
  template: `
    <div
      #frame
      hellControlGroup
      data-slot="root"
      size="md"
      [ui]="part('root')"
      [disabled]="disabled()"
      [attr.data-has-filters]="value().length ? '' : null"
      [attr.data-editing]="editorMode()"
      (mousedown)="onFrameMouseDown($event)"
    >
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
              @if (filterParts(filter); as parts) {
                <span data-slot="tokenField" [class]="part('tokenField')">{{ parts.field }}</span>
                @if (parts.operator) {
                  <span data-slot="tokenOperator" [class]="part('tokenOperator')">
                    {{ parts.operator }}
                  </span>
                }
                <span data-slot="tokenValue" [class]="part('tokenValue')">{{ parts.value }}</span>
              } @else {
                <span data-slot="tokenValue" [class]="part('tokenValue')">
                  {{ filterLabel(filter) }}
                </span>
              }
            </button>
            <button hellChipRemove></button>
          </span>

          <ng-template #editPopover>
            <div
              hellPopover
              hellFilterBuilderEditorSurface
              #editSurface="hellFilterBuilderEditorSurface"
              [attr.aria-label]="labels.edit(filterLabel(filter))"
            >
              @if (isEditing(filterIdentity(filter))) {
                <ng-container
                  *ngTemplateOutlet="projectedEditor; context: { surface: editSurface }"
                />
              }
            </div>
          </ng-template>
        }

        <div
          hellCombobox
          data-slot="control"
          [ui]="part('control')"
          [value]="pickerValue()"
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

      @if (value().length) {
        <button
          hellControlGroupAction
          data-slot="clear"
          [ui]="part('clear')"
          [attr.aria-label]="labels.clearAll"
          [disabled]="disabled()"
          (click)="clearAll()"
        ></button>
      }

      <button
        #createTrigger="hellPopoverTrigger"
        type="button"
        tabindex="-1"
        aria-hidden="true"
        data-hell-filter-builder-create-trigger
        [class]="createTriggerClass"
        [hellPopoverTrigger]="createPopover"
        [anchor]="frame"
        placement="bottom-start"
        [closeOnEscape]="false"
        [trapFocus]="false"
        (openChange)="onCreateOpenChange($any($event))"
      ></button>
    </div>

    <ng-template #createPopover>
      <div
        hellPopover
        hellFilterBuilderEditorSurface
        #createSurface="hellFilterBuilderEditorSurface"
        [attr.aria-label]="effectiveAriaLabel()"
      >
        @if (editorMode() === 'create') {
          <ng-container
            *ngTemplateOutlet="projectedEditor; context: { surface: createSurface }"
          />
        }
      </div>
    </ng-template>

    <div data-slot="live" [class]="part('live')" aria-live="polite" aria-atomic="true">
      {{ liveMessage() }}
    </div>

    <ng-template #projectedEditor let-surface="surface">
      @if (activeEditorTemplate(); as template) {
        @if (editorContext(); as context) {
          <div
            data-slot="editor"
            tabindex="-1"
            [class]="part('editor')"
            [attr.data-mode]="context.mode"
            [attr.data-field]="context.descriptor.field"
            [attr.data-hell-filter-builder-owner]="instanceId"
            (keydown)="onEditorKeydown($event)"
            (keydown.escape)="onEditorEscape($event)"
            (focusout)="onEditorFocusOut(surface)"
          >
            <ng-container
              [ngTemplateOutlet]="template"
              [ngTemplateOutletContext]="context"
              [ngTemplateOutletInjector]="surface.injector"
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
  /** @internal Template-only private class for the anchor-only create trigger. */
  protected readonly createTriggerClass = HELL_FILTER_BUILDER_CREATE_TRIGGER;
  /** @internal Template-only owner marker for portalled editors. */
  protected readonly instanceId = ++nextFilterBuilderId;
  /** @internal Template-only field query. */
  protected readonly query = signal('');
  /** @internal Template-only Combobox state. */
  protected readonly pickerOpen = signal(false);
  /**
   * @internal Template-only field-picker Control Value Authority. The picker
   * is a command surface, not a value surface: a committed field is mirrored
   * here only until its editor closes, then cleared so re-picking the same
   * field is a real change and commits again.
   */
  protected readonly pickerValue = signal<HellFilterFieldDescriptor<TFilter> | null>(null);
  /** @internal Template-only live-region message. */
  protected readonly liveMessage = signal('');
  private readonly editor = signal<HellFilterBuilderEditorState<TFilter> | null>(null);
  /** @internal Template-only editor mode. */
  protected readonly editorMode = computed(() => this.editor()?.mode ?? null);
  /** Anchor-only trigger owning the create editor's popover surface. */
  private readonly createTrigger = viewChild.required<HellPopoverTrigger>('createTrigger');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);
  private readonly editorTemplates = inject(HellFilterBuilderEditorRegistry).editors;
  private nextEditorSession = 0;
  private focusTimer: ReturnType<typeof setTimeout> | null = null;
  /** Whether the focus currently leaving an editor is leaving by Tab. */
  private editorTabbing = false;

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

  /**
   * @internal Template-only structured token projection. Returns `null` when
   * the descriptor supplies no `displayParts`, so the chip falls back to the
   * flat `display(filter)` string.
   */
  protected filterParts(filter: TFilter): HellFilterDisplayParts | null {
    return this.descriptorForField(filter.field)?.displayParts?.(filter) ?? null;
  }

  /**
   * @internal Template event handler. Clicking empty frame space starts a new
   * filter; chips, the remove buttons, the clear action, and the inline input
   * keep their own targets.
   */
  protected onFrameMouseDown(event: MouseEvent): void {
    if (this.disabled() || event.defaultPrevented || event.button !== 0) return;
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target) return;
    if (target.closest('[data-slot="token"], button, a, input, select, textarea')) return;
    event.preventDefault();
    this.focusPickerInput();
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
    if (this.disabled()) return;

    // The Combobox engine already consumed Escape by the time this runs — it
    // preventDefaults every Escape, open or not — so the second Escape layer
    // reads the live dropdown state instead of `defaultPrevented`. The DOM
    // attribute still holds the pre-keydown state, which keeps the layers
    // ordered: close the dropdown first, clear the query only on the next
    // press.
    if (event.key === 'Escape') {
      const input = event.currentTarget as HTMLInputElement;
      if (this.pickerOpen() || input.getAttribute('aria-expanded') === 'true') return;
      if (!this.query()) return;
      this.query.set('');
      input.value = '';
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (event.defaultPrevented) return;

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
    }
  }

  /** @internal Template event handler. */
  protected activateField(descriptor: HellFilterFieldDescriptor<TFilter> | null): void {
    if (!descriptor || this.disabled()) return;
    this.pickerValue.set(descriptor);
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

  /**
   * @internal Template event handler. The create popover is opened by the
   * renderer, so this only observes engine-driven closes (outside pointer or
   * outside focus) and cancels the matching create session without stealing
   * focus. Renderer-driven closes see a cleared editor and no-op.
   */
  protected onCreateOpenChange(open: boolean): void {
    if (open) return;
    const state = this.editor();
    if (state?.mode !== 'create') return;
    this.cancelEditor(state.session, false);
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

  /**
   * @internal Template event handler. Layered Escape for the projected
   * editor.
   *
   * A composed control inside the editor keeps Escape while its own layer is
   * open, and `defaultPrevented` normally says so. It is not enough on its
   * own: the Combobox engine preventDefaults every Escape, open or not, so an
   * editor whose field is a Combobox could never be cancelled from that field
   * — the same engine quirk `onPickerKeydown` works around. Only a control
   * that reports a closed layer overrides the prevention.
   *
   * Nested surfaces that portal out of the editor (an application popover or
   * date picker) never reach this handler at all; their own Escape closes
   * them one layer at a time.
   */
  protected onEditorEscape(event: Event): void {
    if (event.defaultPrevented && !this.isSpuriousEscapePrevention(event)) return;
    event.preventDefault();
    event.stopPropagation();
    const state = this.editor();
    if (state) this.cancelEditor(state.session);
  }

  /**
   * Whether a prevented Escape came from a composed field that had no layer
   * of its own open.
   *
   * `aria-expanded` is trusted in one direction only. `"false"` is reliable:
   * the control is telling us it had nothing to close, so its preventDefault
   * was reflexive rather than meaningful. `"true"` is not reliable, because a
   * trigger still reports the previous state on the task its own panel closes
   * — asserting on it would strand the editor open after a nested layer was
   * dismissed.
   */
  private isSpuriousEscapePrevention(event: Event): boolean {
    const target = event.target instanceof HTMLElement ? event.target : null;
    return target?.closest('[aria-expanded]')?.getAttribute('aria-expanded') === 'false';
  }

  /**
   * @internal Template event handler. Records that the focus about to leave
   * the editor is leaving by Tab, so `onEditorFocusOut` can tell a keyboard
   * exit from an outside pointer interaction. The browser moves focus while
   * still in this task, so the flag is cleared on the next one.
   */
  protected onEditorKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    this.editorTabbing = true;
    setTimeout(() => {
      this.editorTabbing = false;
    }, 0);
  }

  /**
   * @internal Template event handler. Create editing ends when focus leaves
   * the editor's own surface.
   *
   * Containment is asked of the editor surface, not of the builder's Floating
   * Scope: that scope is rooted at the renderer host, so it counts the frame
   * as inside and would keep the create popover open while the user is back
   * in the inline picker — leaving the picker's dropdown and the create
   * popover live at once.
   *
   * Focus is pulled back to the inline picker only when Tab carried it out of
   * the builder entirely. The panel is portalled to the end of the document,
   * so tabbing forward off the editor lands on `<body>` or wraps to the first
   * focusable on the page — either way the user is ejected from the
   * component, which the three-tab-stop model does not allow. Tab that lands
   * back inside the frame is left alone, and an outside pointer interaction
   * dismisses without stealing focus at all.
   */
  protected onEditorFocusOut(surface: HellFilterBuilderEditorSurface): void {
    const state = this.editor();
    if (state?.mode !== 'create') return;
    const byTab = this.editorTabbing;
    setTimeout(() => {
      if (this.editor()?.session !== state.session) return;
      const active = this.host.ownerDocument.activeElement;
      if (surface.containsTarget(active)) return;
      const insideBuilder = active instanceof Node && this.host.contains(active);
      if (byTab && !insideBuilder) this.focusPickerInput();
      this.cancelEditor(state.session, false);
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
    const trigger = this.createTrigger();
    this.query.set('');
    this.pickerOpen.set(false);
    this.resetPickerText();
    const session = ++this.nextEditorSession;
    this.editor.set({
      mode: 'create',
      field: descriptor.field,
      identity: null,
      trigger,
      session,
    });
    // An already-open trigger must not be shown again: `show()` resolves
    // against the surface that is already mounted, so the focus step would
    // run before the swapped-in editor content renders and land on `<body>`.
    if (trigger.open()) {
      this.scheduleEditorFocus('create');
      return;
    }
    void trigger.show().then(() => {
      if (this.isLatestSession(session)) this.scheduleEditorFocus('create');
    });
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
    this.pickerValue.set(null);
    this.valueChange.emit(result.value);
    this.liveMessage.set(
      state.mode === 'edit' ? this.labels.updated(label) : this.labels.added(label),
    );
    this.editor.set(null);

    if (state.trigger) {
      void state.trigger.hide(state.mode === 'edit' ? 'keyboard' : 'program').then(() => {
        if (!this.isLatestSession(state.session)) return;
        if (state.mode === 'edit') this.scheduleTokenFocus(result.identity);
        else this.schedulePickerFocus();
      });
    } else {
      this.schedulePickerFocus();
    }
    return true;
  }

  /**
   * Whether no newer editor session has started since `session` closed. A
   * popover's exit promise can resolve after the next editor already opened;
   * restoring focus then would pull focus out of the live editor and cancel
   * it through the focus-out rule.
   */
  private isLatestSession(session: number): boolean {
    return this.nextEditorSession === session;
  }

  private cancelEditor(session: number, restoreFocus = true): void {
    const state = this.editor();
    if (!state || state.session !== session) return;
    this.editor.set(null);
    this.pickerValue.set(null);

    if (state.trigger) {
      const origin = state.mode === 'edit' && restoreFocus ? 'keyboard' : 'program';
      void state.trigger.hide(origin).then(() => {
        if (!restoreFocus || !this.isLatestSession(state.session)) return;
        if (state.mode === 'edit') {
          if (state.identity !== null) this.scheduleTokenFocus(state.identity);
        } else {
          this.schedulePickerFocus();
        }
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
      // Both editor surfaces are portalled popovers; the owner marker keeps
      // the lookup scoped to this Filter Builder instance.
      const root = this.host.ownerDocument.body;
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

  /**
   * Clears the field-picker input's rendered text. The picker stays mounted
   * across the create lifecycle now, so the engine's committed display text
   * must be cleared explicitly rather than by destroying the control.
   */
  private resetPickerText(): void {
    const input = this.host.querySelector<HTMLInputElement>('[data-hell-filter-builder-input]');
    if (input) input.value = '';
  }

  private focusPickerInput(text = ''): void {
    const input = this.host.querySelector<HTMLInputElement>('[data-hell-filter-builder-input]');
    if (!input) return;
    input.focus({ preventScroll: true });
    if (!text) return;
    const InputEventCtor = input.ownerDocument.defaultView?.InputEvent;
    const event = InputEventCtor
      ? new InputEventCtor('input', { bubbles: true, data: text, inputType: 'insertText' })
      : new Event('input', { bubbles: true });
    input.value = text;
    input.dispatchEvent(event);
  }

  private schedulePickerFocus(text = ''): void {
    this.scheduleFocus(() => this.focusPickerInput(text));
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
