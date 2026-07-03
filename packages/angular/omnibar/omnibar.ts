import {
  NgTemplateOutlet } from '@angular/common';
import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  Overlay,
  type ConnectedPosition,
  type ScrollStrategy,
} from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  NgZone,
  TemplateRef,
  ViewChild,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import {
  HELL_FLOATING_SCOPE,
  HellFloatingScopeRegistry,
  type HellFloatingScope,
} from '@hell-ui/angular/internal/core';
import { HellFloatingDismissController, hellOutsideFocus } from '@hell-ui/angular/internal/core';
import {
  type HellSearchField,
  type HellSearchResult,
  type HellSearchSource,
} from '@hell-ui/angular/core';
import { type HellLabels, HELL_LABELS } from '@hell-ui/angular/core';
import { NgpInput } from 'ng-primitives/input';
import { HellSearch, HellSearchClear } from '@hell-ui/angular/search';
import { HellSkeleton } from '@hell-ui/angular/skeleton';
import {
  HellGlobalKeydownService,
  hellShouldHandleGlobalHotkey,
  matchHotkey,
} from '@hell-ui/angular/internal/hotkeys';
import { HellOmnibarRuntime } from './omnibar.runtime';
import { HellPartStyleable, type HellRecipe, type HellUi } from '@hell-ui/angular/core';

/**
 * Advanced contract implemented by omnibar item directives. Custom items can
 * implement it to join keyboard navigation, active-descendant wiring, scrolling,
 * and submit selection.
 */
export interface HellOmnibarLoadingTemplateContext {
  /** Row count requested by `loadingRows`, useful when custom templates still render placeholders. */
  readonly $implicit: number;
  readonly rows: number;
  readonly message: string;
}

export interface HellOmnibarRegisteredItem {
  /** Stable DOM id used for `aria-activedescendant`. */
  readonly itemId: string;
  /** Whether activation should close the parent omnibar. */
  readonly closeOnSelect: () => boolean;
  /** Whether this item is disabled and unavailable for navigation/activation. */
  readonly disabled: () => boolean;

  /** Raw item value used for active-item bookkeeping. */
  value(): unknown;
  /** Emits the child `(select)` output and returns the selected payload. */
  selectValue(): unknown;
  /** Keep keyboard navigation visible without exposing scroll policy upstream. */
  scrollIntoView(): void;
}

export interface HellOmnibarRegisteredAction {
  /** Moves DOM focus into an action reached through the omnibar keyboard contract. */
  focus(): void;
}

/* ──────────────────────────── Component ──────────────────────────── */

let nextOmnibarId = 0;
let nextOmnibarItemId = 0;

const HELL_OMNIBAR_OVERLAY_STYLE_VARIABLES = [
  '--hell-omnibar-panel-bg',
  '--hell-omnibar-panel-radius',
  '--hell-omnibar-panel-shadow',
  '--hell-omnibar-panel-max-height',
] as const;

const HELL_OMNIBAR_OVERLAY_POSITIONS: ConnectedPosition[] = [
  {
    originX: 'start',
    originY: 'bottom',
    overlayX: 'start',
    overlayY: 'top',
    offsetY: 4,
  },
  {
    originX: 'start',
    originY: 'top',
    overlayX: 'start',
    overlayY: 'bottom',
    offsetY: -4,
  },
];

export type HellOmnibarPart =
  | 'root'
  | 'control'
  | 'inputWrap'
  | 'input'
  | 'clear'
  | 'panel'
  | 'actions'
  | 'results'
  | 'loading'
  | 'skeletonRow'
  | 'skeletonText'
  | 'empty';

export type HellOmnibarUi = HellUi<HellOmnibarPart>;

export type HellOmnibarPanelPart = 'root';
export type HellOmnibarPanelUi = HellUi<HellOmnibarPanelPart>;

export type HellOmnibarGroupPart = 'root';
export type HellOmnibarGroupUi = HellUi<HellOmnibarGroupPart>;

export type HellOmnibarGroupLabelPart = 'root';
export type HellOmnibarGroupLabelUi = HellUi<HellOmnibarGroupLabelPart>;

export type HellOmnibarItemPart = 'root';
export type HellOmnibarItemUi = HellUi<HellOmnibarItemPart>;

export type HellOmnibarItemIconPart = 'root';
export type HellOmnibarItemIconUi = HellUi<HellOmnibarItemIconPart>;

export type HellOmnibarItemTextPart = 'root';
export type HellOmnibarItemTextUi = HellUi<HellOmnibarItemTextPart>;

export type HellOmnibarItemSubtextPart = 'root';
export type HellOmnibarItemSubtextUi = HellUi<HellOmnibarItemSubtextPart>;

export type HellOmnibarItemTrailingPart = 'root';
export type HellOmnibarItemTrailingUi = HellUi<HellOmnibarItemTrailingPart>;

export type HellOmnibarChipPart = 'root';
export type HellOmnibarChipUi = HellUi<HellOmnibarChipPart>;

export type HellOmnibarChipRemovePart = 'root';
export type HellOmnibarChipRemoveUi = HellUi<HellOmnibarChipRemovePart>;

export type HellOmnibarActionsStripPart = 'root';
export type HellOmnibarActionsStripUi = HellUi<HellOmnibarActionsStripPart>;

export type HellOmnibarActionPart = 'root';
export type HellOmnibarActionUi = HellUi<HellOmnibarActionPart>;

const HELL_OMNIBAR_RECIPE = {
  root: 'relative inline-flex w-full',
  control: 'inline-flex w-full items-center gap-hell-2',
  inputWrap: 'relative flex min-w-0 flex-1 items-center overflow-hidden',
  input: 'h-full w-full bg-transparent outline-none',
  clear: 'inline-flex h-[18px] w-[18px] items-center justify-center rounded-full',
  panel: 'flex w-full flex-col overflow-hidden',
  actions: 'flex items-center gap-hell-1',
  results: 'flex flex-1 flex-col overflow-y-auto',
  loading: 'flex flex-col',
  skeletonRow: 'flex items-center',
  skeletonText: 'flex min-w-0 flex-1 flex-col',
  empty: 'text-center text-xs',
} satisfies HellRecipe<HellOmnibarPart>;

const HELL_OMNIBAR_PANEL_RECIPE = {
  root: '',
} satisfies HellRecipe<HellOmnibarPanelPart>;

const HELL_OMNIBAR_GROUP_RECIPE = {
  root: 'flex flex-col gap-px',
} satisfies HellRecipe<HellOmnibarGroupPart>;

const HELL_OMNIBAR_GROUP_LABEL_RECIPE = {
  root: 'text-[10px] font-semibold uppercase',
} satisfies HellRecipe<HellOmnibarGroupLabelPart>;

const HELL_OMNIBAR_ITEM_RECIPE = {
  root: 'flex w-full items-center gap-hell-3 rounded-hell-sm',
} satisfies HellRecipe<HellOmnibarItemPart>;

const HELL_OMNIBAR_ITEM_ICON_RECIPE = {
  root: 'inline-flex w-4 shrink-0 items-center justify-center text-hell-foreground-subtle',
} satisfies HellRecipe<HellOmnibarItemIconPart>;

const HELL_OMNIBAR_ITEM_TEXT_RECIPE = {
  root: 'flex min-w-0 flex-1 flex-col overflow-hidden',
} satisfies HellRecipe<HellOmnibarItemTextPart>;

const HELL_OMNIBAR_ITEM_SUBTEXT_RECIPE = {
  root: 'text-[11px] text-hell-foreground-muted',
} satisfies HellRecipe<HellOmnibarItemSubtextPart>;

const HELL_OMNIBAR_ITEM_TRAILING_RECIPE = {
  root: 'ms-auto inline-flex items-center',
} satisfies HellRecipe<HellOmnibarItemTrailingPart>;

const HELL_OMNIBAR_CHIP_RECIPE = {
  root: 'inline-flex items-center gap-1 rounded-hell-sm',
} satisfies HellRecipe<HellOmnibarChipPart>;

const HELL_OMNIBAR_CHIP_REMOVE_RECIPE = {
  root: 'inline-flex h-[18px] w-[18px] items-center justify-center rounded-hell-sm',
} satisfies HellRecipe<HellOmnibarChipRemovePart>;

const HELL_OMNIBAR_ACTIONS_STRIP_RECIPE = {
  root: '',
} satisfies HellRecipe<HellOmnibarActionsStripPart>;

const HELL_OMNIBAR_ACTION_RECIPE = {
  root: 'inline-flex items-center gap-hell-1 rounded-hell-sm',
} satisfies HellRecipe<HellOmnibarActionPart>;

/**
 * Composite command palette searchbox with a debounced search service,
 * configurable actions strip, grouped results, and optional global hotkey.
 * Rendering of results is fully owned by projected content; the omnibar wires
 * up query state, keyboard navigation, active-item tracking, and selection.
 * While open, Tab stays anchored on the input; options use `aria-activedescendant`,
 * and F6 enters/leaves the optional actions strip without adding tab stops.
 *
 * Slots (multi-slot `<ng-content>` with attribute selectors):
 *   - `[hellOmnibarLeading]`  — icon/badge before the input
 *   - `[hellOmnibarTrailing]` — kbd hint, status, etc. after the input
 *   - `[hellOmnibarActions]`  — actions strip rendered above results
 *   - default slot            — projected groups + items (panel body)
 *
 * State injection: child directives `[hellOmnibarItem]`, `[hellOmnibarGroup]`,
 * and `[hellOmnibarAction]` `inject(HellOmnibar)` to register/dispatch.
 */
@Component({
  selector: 'hell-omnibar',
  imports: [
    NgTemplateOutlet,
    NgpInput,
    HellSearch,
    HellSearchClear,
    HellSkeleton,
    CdkConnectedOverlay,
    CdkOverlayOrigin,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    HellOmnibarRuntime,
    { provide: HELL_FLOATING_SCOPE, useExisting: forwardRef(() => HellOmnibar) },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-open]': 'isOpen() ? "true" : null',
    '[attr.data-size]': 'size()',
    '[attr.data-empty]': 'isEmpty() ? "true" : null',
  },
  template: `
    <div
      data-slot="control"
      [class]="part('control')"
      hellSearch
      cdkOverlayOrigin
      #overlayOrigin="cdkOverlayOrigin"
      #control
    >
      <ng-content select="[hellOmnibarLeading]" />
      <div data-slot="inputWrap" [class]="part('inputWrap')" #wrap>
        <input
          #input
          ngpInput
          data-slot="input"
          [class]="part('input')"
          type="search"
          [id]="inputId"
          [attr.role]="'combobox'"
          [attr.aria-expanded]="isOpen()"
          [attr.aria-controls]="panelId"
          [attr.aria-activedescendant]="activeDescendantId()"
          [attr.aria-autocomplete]="'list'"
          [attr.aria-label]="ariaLabel()"
          [attr.placeholder]="placeholder()"
          [value]="value()"
          [disabled]="disabled()"
          autocomplete="off"
          spellcheck="false"
          (input)="onInput($event)"
          (focus)="onFocus()"
          (blur)="onBlur($event)"
          (click)="onCursorChange()"
          (keydown)="onKeyDown($event)"
          (keyup)="onCursorChange()"
          (select)="onCursorChange()"
        />
      </div>
      <button
        hellSearchClear
        data-slot="clear"
        [class]="part('clear')"
        type="button"
        [attr.aria-label]="labels.omnibar.clearSearch"
        [attr.data-empty]="value() ? null : ''"
        [attr.tabindex]="isOpen() ? -1 : null"
        (click)="onClearClick($event)"
      ></button>
      <ng-content select="[hellOmnibarTrailing]" />
    </div>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="overlayOrigin"
      [cdkConnectedOverlayOpen]="isOpen()"
      [cdkConnectedOverlayPositions]="overlayPositions"
      [cdkConnectedOverlayMinWidth]="minPanelWidth()"
      [cdkConnectedOverlayMatchWidth]="true"
      [cdkConnectedOverlayHasBackdrop]="false"
      [cdkConnectedOverlayFlexibleDimensions]="true"
      [cdkConnectedOverlayGrowAfterOpen]="true"
      [cdkConnectedOverlayPush]="true"
      [cdkConnectedOverlayViewportMargin]="8"
      [cdkConnectedOverlayScrollStrategy]="overlayScrollStrategy"
      [cdkConnectedOverlayPanelClass]="'hell-omnibar-overlay-pane'"
      (attach)="onOverlayAttach()"
      (detach)="onOverlayDetach()"
      (positionChange)="onOverlayPositionChange()"
      (overlayOutsideClick)="onOverlayOutsideClick($event)"
    >
      <div
        #panel
        data-slot="panel"
        [id]="panelId + '-surface'"
        [class]="part('panel')"
      >
        <!-- Projected action directives register with the runtime on
             construction, so the strip wrapper can stay conditional without
             a registration chicken-and-egg. -->
        @if (hasActions()) {
          <div data-slot="actions" [class]="part('actions')">
            <ng-content select="[hellOmnibarActions]" />
          </div>
        }
        <div
          data-slot="results"
          [class]="part('results')"
          [id]="panelId"
          [attr.role]="hasListboxResults() ? 'listbox' : null"
        >
          @if (hasListboxResults()) {
            <ng-content />
          }
        </div>
        @if (loading()) {
          <div
            data-slot="loading"
            [class]="part('loading')"
            role="status"
            [attr.aria-label]="loadingMessage()"
          >
            @if (loadingTemplate(); as tpl) {
              <ng-container *ngTemplateOutlet="tpl; context: loadingTemplateContext()" />
            } @else {
              @for (row of skeletonRows(); track row) {
                <div data-slot="skeletonRow" [class]="part('skeletonRow')">
                  <div hellSkeleton shape="circle" width="18px" height="18px"></div>
                  <div data-slot="skeletonText" [class]="part('skeletonText')">
                    <div hellSkeleton width="70%" height="12px"></div>
                    <div hellSkeleton width="46%" height="10px"></div>
                  </div>
                </div>
              }
            }
          </div>
        } @else if (isEmpty()) {
          @if (emptyTemplate(); as tpl) {
            <ng-container *ngTemplateOutlet="tpl" />
          } @else {
            <div data-slot="empty" [class]="part('empty')">{{ emptyMessage() }}</div>
          }
        }
        <ng-content select="[hellOmnibarFooter]" />
      </div>
      <div #floatingOutlet></div>
    </ng-template>
  `,
  exportAs: 'hellOmnibar',
})
export class HellOmnibar extends HellPartStyleable<HellOmnibarPart> implements HellFloatingScope {
  protected readonly recipe = HELL_OMNIBAR_RECIPE;
  protected readonly defaultUiPart = 'root';
  protected readonly labels = inject<HellLabels>(HELL_LABELS);
  private readonly overlay = inject(Overlay);
  private readonly ngZone = inject(NgZone);

  /* ── Inputs ────────────────────────────────────────────────────────── */

  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly placeholder = input<string>('Search…');
  readonly ariaLabel = input<string>('Search');
  readonly emptyMessage = input<string>('No results');
  readonly emptyTemplate = input<TemplateRef<unknown> | null>(null);
  readonly loadingTemplate = input<TemplateRef<HellOmnibarLoadingTemplateContext> | null>(null);
  /** Local items ranked by `HellSearchService` whenever the query changes. */
  readonly searchItems = input<readonly unknown[] | null>(null);
  /** Async/remote source. Superseded searches receive an abort signal. */
  readonly searchSource = input<HellSearchSource<unknown> | null>(null);
  /** Weighted local fields used for `searchItems` or raw source items. */
  readonly searchFields = input<readonly HellSearchField<never>[]>([]);
  /** Caps emitted/rendered search results after ranking or source ordering. */
  readonly searchLimit = input<number | undefined>(undefined);
  /** Opaque caller context forwarded to `searchSource` on every request. */
  readonly searchParams = input<unknown>(undefined);
  /** Debounce in ms before search starts; set 0 for immediate searches. */
  readonly searchDebounce = input<number>(120);
  readonly loadingMessage = input<string>('Searching');
  readonly loadingRows = input<number>(4);

  /** Optional global hotkey, e.g. `'mod+k'` (Cmd on macOS, Ctrl elsewhere)
   *  or `'/'`. Pass `null` to avoid registering a document-level listener. */
  readonly hotkey = input<string | null>(null);

  /** When true (default), opens the panel automatically once the user types
   *  or focuses. Set false for fully-controlled mode. */
  readonly openOnFocus = input(true, { transform: booleanAttribute });

  readonly value = model<string>('');

  /** Minimum CDK connected-overlay panel width. The overlay still matches the control when wider. */
  readonly minPanelWidth = input<number>(320);

  /* ── Outputs ───────────────────────────────────────────────────────── */

  readonly submit = output<HellOmnibarSubmitEvent>();
  readonly openChange = output<boolean>();
  /** Emits ranked results so projected content can render custom rows. */
  readonly searchResultsChange = output<readonly HellSearchResult<unknown>[]>();
  /** Emits async source failures; the component keeps the panel usable. */
  readonly searchError = output<unknown>();

  /* ── Internal state ────────────────────────────────────────────────── */

  readonly inputId = `hell-omnibar-${++nextOmnibarId}`;
  readonly panelId = `${this.inputId}-panel`;

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly runtime = inject(HellOmnibarRuntime<unknown>);
  private readonly globalKeydown = inject(HellGlobalKeydownService);

  private readonly _open = signal(false);
  private readonly openVersion = signal(0);
  protected readonly isOpen = computed(() => !this.disabled() && this._open());
  protected readonly overlayPositions = HELL_OMNIBAR_OVERLAY_POSITIONS;
  protected readonly overlayScrollStrategy: ScrollStrategy =
    this.overlay.scrollStrategies.reposition({
      scrollThrottle: 0,
    });
  private overlayPanelElement: HTMLElement | null = null;
  protected readonly cursor = signal(0);
  readonly searchResults = computed(() => this.runtime.results());
  readonly loading = computed(() => this.runtime.loading());
  readonly error = computed(() => this.runtime.error());
  protected readonly skeletonRows = computed(() =>
    Array.from({ length: Math.max(1, this.loadingRows()) }, (_, i) => i),
  );
  protected readonly loadingTemplateContext = computed<HellOmnibarLoadingTemplateContext>(() => ({
    $implicit: Math.max(1, this.loadingRows()),
    rows: Math.max(1, this.loadingRows()),
    message: this.loadingMessage(),
  }));

  /* ── Item registry ─────────────────────────────────────────────────── */

  protected readonly activeIndex = this.runtime.activeIndex;
  protected readonly isEmpty = this.runtime.isEmpty;
  protected readonly hasListboxResults = computed(() => !this.loading() && !this.isEmpty());
  protected readonly activeDescendantId = computed(() =>
    this.isOpen() && this.hasListboxResults() ? this.runtime.activeItemId() : null,
  );
  protected readonly hasActions = this.runtime.hasActions;

  private readonly floatingScope = new HellFloatingScopeRegistry(() => this.host.nativeElement);
  private readonly floatingFocusDismissal = new HellFloatingDismissController({
    root: () => this.host.nativeElement,
    scope: this,
    ownerDocument: () => this.host.nativeElement.ownerDocument,
    active: () => this.isOpen(),
    activeKey: () => this.openVersion(),
    dismiss: hellOutsideFocus,
    onDismiss: () => this.close(),
  });

  /* ── View refs ─────────────────────────────────────────────────────── */

  @ViewChild(CdkConnectedOverlay) private connectedOverlay?: CdkConnectedOverlay;
  @ViewChild('control', { static: true }) private controlRef?: ElementRef<HTMLElement>;
  @ViewChild('input', { static: true }) private inputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('panel') private set panelRef(ref: ElementRef<HTMLElement> | undefined) {
    const next = ref?.nativeElement ?? null;
    if (next === this.overlayPanelElement) return;

    this.unregisterOverlayPanel();
    this.overlayPanelElement = next;

    if (next) {
      this.floatingScope.registerFloatingElement(next);
      this.syncOverlayPanelStyles();
    }
  }
  @ViewChild('floatingOutlet') private set floatingOutletRef(
    ref: ElementRef<HTMLElement> | undefined,
  ) {
    const next = ref?.nativeElement ?? null;
    if (next === this.floatingOutletElement) return;

    this.unregisterFloatingOutlet();
    this.floatingOutletElement = next;
    if (next) this.floatingScope.registerFloatingElement(next);
  }
  private floatingOutletElement: HTMLElement | null = null;
  private overlayGeometryCleanup: VoidFunction | null = null;
  private overlayGeometryFrame: number | null = null;

  constructor() {
    super();
    effect(() => {
      // Reset active when items shift or query changes.
      this.value();
      this.runtime.items().length;
      this.runtime.resetActive();
    });
    effect((onCleanup) => {
      const open = this.isOpen();
      const size = this.size();
      const minPanelWidth = this.minPanelWidth();
      void size;
      void minPanelWidth;
      if (!open) return;

      this.startOverlayGeometryTracking();
      queueMicrotask(() => this.syncOverlayGeometry());
      onCleanup(() => this.stopOverlayGeometryTracking());
    });
    effect(() => {
      const items = this.searchItems();
      const source = this.searchSource();
      const fields = this.searchFields();
      const limit = this.searchLimit();
      const params = this.searchParams();
      const debounce = this.searchDebounce();
      const query = this.value();
      this.runtime.setQuery(query);

      if (!source && items === null) {
        this.runtime.cancel();
        this.runtime.clearResults();
        return;
      }

      this.runtime.scheduleSearch(
        {
          items: items ?? undefined,
          source,
          fields: fields as readonly HellSearchField<unknown>[],
          limit,
          params,
        },
        debounce,
      );
    });
    effect(() => this.searchResultsChange.emit(this.searchResults()));
    effect(() => {
      const error = this.error();
      if (error) this.searchError.emit(error);
    });

    this.installHotkey();
    this.floatingFocusDismissal.connect(this.destroyRef);
    this.destroyRef.onDestroy(() => {
      this.stopOverlayGeometryTracking();
      this.unregisterOverlayPanel();
      this.unregisterFloatingOutlet();
    });
  }

  /* ── Public API for actions / hotkey wiring ────────────────────────── */

  /** Programmatically focus the input (e.g. from an action handler). */
  focus(): void {
    this.inputRef?.nativeElement.focus();
  }

  /** @internal Open-state controls leave Tab on the input while keeping closed state native. */
  internalControlTabIndex(): -1 | null {
    return this.isOpen() ? -1 : null;
  }

  /** Container for child Floating Interaction primitives (menus, popovers) that should
   *  behave as part of the omnibar instead of outside-click targets. */
  floatingContainer(): HTMLElement {
    return this.floatingOutletElement ?? this.host.nativeElement;
  }

  registerFloatingElement(element: HTMLElement): void {
    this.floatingScope.registerFloatingElement(element);
  }

  unregisterFloatingElement(element: HTMLElement): void {
    this.floatingScope.unregisterFloatingElement(element);
  }

  containsFloatingTarget(target: EventTarget | Node | null): boolean {
    return this.floatingScope.containsFloatingTarget(target);
  }

  /** Open the panel. Idempotent. */
  open(): void {
    if (this._open()) return;
    this.openVersion.update((version) => version + 1);
    this._open.set(true);
    this.openChange.emit(true);
  }

  /** Close the panel. Idempotent. */
  close(): void {
    if (!this._open()) return;
    this.openVersion.update((version) => version + 1);
    this._open.set(false);
    this.openChange.emit(false);
  }

  /** Set the entire query string and re-focus the input. */
  setValue(next: string, opts?: { focus?: boolean; caretToEnd?: boolean }): void {
    this.value.set(next);
    if (opts?.focus !== false) this.focus();
    if (opts?.caretToEnd !== false) {
      this.cursor.set(next.length);
      queueMicrotask(() => {
        const el = this.inputRef?.nativeElement;
        if (!el) return;
        el.setSelectionRange(next.length, next.length);
      });
    }
  }

  /* ── Item / action registration (used by child directives) ─────────── */

  registerItem(item: HellOmnibarRegisteredItem): void {
    this.runtime.registerItem(item);
  }

  unregisterItem(item: HellOmnibarRegisteredItem): void {
    this.runtime.unregisterItem(item);
  }

  setActive(item: HellOmnibarRegisteredItem): void {
    this.runtime.setActive(item);
  }

  isActive(item: HellOmnibarRegisteredItem): boolean {
    return this.runtime.isActive(item);
  }

  activate(item: HellOmnibarRegisteredItem, source: HellOmnibarActivationSource): void {
    if (item.disabled()) return;

    const selected = item.selectValue();

    this.submit.emit({
      value: this.value(),
      item: selected,
      source,
    });

    if (item.closeOnSelect()) this.close();
  }

  registerAction(action: HellOmnibarAction): void {
    this.runtime.registerAction(action);
  }
  unregisterAction(action: HellOmnibarAction): void {
    this.runtime.unregisterAction(action);
  }

  /* ── Event handlers (template) ─────────────────────────────────────── */

  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const next = input.value;
    this.value.set(next);
    this.cursor.set(input.selectionStart ?? next.length);
    if (this.openOnFocus()) this.open();
  }

  protected onFocus(): void {
    if (this.openOnFocus()) this.open();
  }

  protected onBlur(event: FocusEvent): void {
    this.floatingFocusDismissal.handleFocusExit(event);
  }

  protected onCursorChange(): void {
    const el = this.inputRef?.nativeElement;
    if (!el) return;
    this.cursor.set(el.selectionStart ?? el.value.length);
  }

  protected onClearClick(event: MouseEvent): void {
    event.stopPropagation();
    queueMicrotask(() => {
      this.value.set('');
      this.cursor.set(0);
      this.focus();
      if (this.openOnFocus()) this.open();
    });
  }

  protected onOverlayOutsideClick(event: MouseEvent): void {
    if (this.floatingFocusDismissal.isInside(event.target)) return;
    this.close();
  }

  protected onOverlayAttach(): void {
    this.syncOverlayGeometry();
  }

  protected onOverlayDetach(): void {
    this.stopOverlayGeometryTracking();
    this.unregisterOverlayPanel();
  }

  protected onOverlayPositionChange(): void {
    this.syncOverlayPanelStyles();
  }

  protected onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        if (!this.isOpen()) {
          this.open();
        } else {
          this.moveActive(1);
        }
        event.preventDefault();
        break;
      case 'ArrowUp':
        if (this.isOpen()) {
          this.moveActive(-1);
          event.preventDefault();
        }
        break;
      case 'Home':
        if (this.isOpen() && this.runtime.items().length) {
          this.runtime.firstActive();
          event.preventDefault();
        }
        break;
      case 'End':
        if (this.isOpen() && this.runtime.items().length) {
          this.runtime.lastActive();
          event.preventDefault();
        }
        break;
      case 'F6':
        if (this.isOpen() && this.focusPopupAction(event.shiftKey ? 'last' : 'first')) {
          event.preventDefault();
        }
        break;
      case 'Enter': {
        const item = this.runtime.activeItem();
        if (item && this.isOpen()) {
          this.activate(item, 'keyboard');
          event.preventDefault();
        }
        break;
      }
      case 'Escape':
        if (this.isOpen()) {
          this.close();
          event.stopPropagation();
        } else if (this.value()) {
          this.value.set('');
          this.cursor.set(0);
        } else {
          this.inputRef?.nativeElement.blur();
        }
        break;
    }
  }

  private moveActive(delta: number): void {
    this.runtime.moveActive(delta);
  }

  focusAdjacentAction(action: HellOmnibarRegisteredAction, delta: number): void {
    const actions = this.runtime.actionItems();
    const current = actions.indexOf(action);
    if (current < 0 || !actions.length) return;

    let next = current + delta;
    if (next < 0) next = actions.length - 1;
    if (next >= actions.length) next = 0;
    actions[next]?.focus();
  }

  private focusPopupAction(position: 'first' | 'last'): boolean {
    const actions = this.runtime.actionItems();
    const action = position === 'first' ? actions[0] : actions[actions.length - 1];
    action?.focus();
    return action !== undefined;
  }

  private startOverlayGeometryTracking(): void {
    if (this.overlayGeometryCleanup) return;

    const doc = this.host.nativeElement.ownerDocument;
    const win = doc.defaultView;
    const sync = () => this.scheduleOverlayGeometrySync();

    this.ngZone.runOutsideAngular(() => {
      doc.addEventListener('scroll', sync, true);
      win?.addEventListener('resize', sync);
    });

    this.overlayGeometryCleanup = () => {
      doc.removeEventListener('scroll', sync, true);
      win?.removeEventListener('resize', sync);

      if (this.overlayGeometryFrame !== null && win) {
        win.cancelAnimationFrame(this.overlayGeometryFrame);
      }
      this.overlayGeometryFrame = null;
    };
  }

  private stopOverlayGeometryTracking(): void {
    this.overlayGeometryCleanup?.();
    this.overlayGeometryCleanup = null;
  }

  private scheduleOverlayGeometrySync(): void {
    if (!this.isOpen()) return;

    const win = this.host.nativeElement.ownerDocument.defaultView;
    if (!win) {
      this.syncOverlayGeometry();
      return;
    }

    if (this.overlayGeometryFrame !== null) return;
    this.overlayGeometryFrame = win.requestAnimationFrame(() => {
      this.overlayGeometryFrame = null;
      this.syncOverlayGeometry();
    });
  }

  private syncOverlayGeometry(): void {
    this.syncOverlayPanelStyles();

    const overlayRef = this.connectedOverlay?.overlayRef;
    if (!overlayRef?.hasAttached()) return;

    const width = this.controlRef?.nativeElement.getBoundingClientRect().width;
    overlayRef.updateSize({
      width,
      minWidth: this.minPanelWidth(),
    });
    overlayRef.updatePosition();
  }

  private syncOverlayPanelStyles(): void {
    const panel = this.overlayPanelElement;
    const win = this.host.nativeElement.ownerDocument.defaultView;
    if (!panel || !win) return;

    const styles = win.getComputedStyle(this.host.nativeElement);
    for (const variable of HELL_OMNIBAR_OVERLAY_STYLE_VARIABLES) {
      const value = styles.getPropertyValue(variable);
      if (value) panel.style.setProperty(variable, value.trim());
    }
  }

  private unregisterOverlayPanel(): void {
    if (!this.overlayPanelElement) return;
    this.floatingScope.unregisterFloatingElement(this.overlayPanelElement);
    this.overlayPanelElement = null;
  }

  private unregisterFloatingOutlet(): void {
    if (!this.floatingOutletElement) return;
    this.floatingScope.unregisterFloatingElement(this.floatingOutletElement);
    this.floatingOutletElement = null;
  }

  /* ── Hotkey ────────────────────────────────────────────────────────── */

  private installHotkey(): void {
    effect((onCleanup) => {
      const combo = this.hotkey();
      if (!combo) return;

      const handler = (event: KeyboardEvent) => {
        if (this.disabled()) return;
        if (!matchHotkey(event, combo)) return;
        if (!hellShouldHandleGlobalHotkey(event, combo, this.inputRef?.nativeElement)) return;
        event.preventDefault();
        this.focus();
        this.open();
      };

      onCleanup(this.globalKeydown.register(handler, this.destroyRef));
    });
  }
}

/* ──────────────────────────── Children ──────────────────────────── */

@Directive({
  selector: '[hellOmnibarPanel]',
  host: { '[class]': "part('root')", 'data-slot': 'root' },
})
export class HellOmnibarPanel extends HellPartStyleable<HellOmnibarPanelPart> {
  protected readonly recipe = HELL_OMNIBAR_PANEL_RECIPE;
  protected readonly defaultUiPart = 'root';
}

@Directive({
  selector: '[hellOmnibarGroup]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    role: 'group',
    '[attr.aria-label]': 'label() || null',
  },
})
export class HellOmnibarGroup extends HellPartStyleable<HellOmnibarGroupPart> {
  protected readonly recipe = HELL_OMNIBAR_GROUP_RECIPE;
  protected readonly defaultUiPart = 'root';
  readonly label = input<string>('');
}

@Directive({
  selector: '[hellOmnibarGroupLabel]',
  host: { '[class]': "part('root')", 'data-slot': 'root', role: 'presentation' },
})
export class HellOmnibarGroupLabel extends HellPartStyleable<HellOmnibarGroupLabelPart> {
  protected readonly recipe = HELL_OMNIBAR_GROUP_LABEL_RECIPE;
  protected readonly defaultUiPart = 'root';
}

/**
 * A selectable result row. `[value]` is the payload emitted via `(select)`
 * and `(submit)` on the parent omnibar. Active state and click selection
 * are managed by the command palette/listbox pair; consumers control rendering.
 */
@Directive({
  selector: 'button[hellOmnibarItem]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[id]': 'itemId',
    role: 'option',
    type: 'button',
    '[attr.disabled]': 'disabled() ? "" : null',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.data-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-selected]': 'active() ? "true" : "false"',
    tabindex: '-1',
    '[attr.data-active]': 'active() ? "true" : null',
    '(click)': 'onClick($event)',
    '(mousemove)': 'onMouseMove()',
  },
})
export class HellOmnibarItem<T = unknown>
  extends HellPartStyleable<HellOmnibarItemPart>
  implements HellOmnibarRegisteredItem
{
  protected readonly recipe = HELL_OMNIBAR_ITEM_RECIPE;
  protected readonly defaultUiPart = 'root';

  readonly itemValue = input<T>(undefined as T, { alias: 'value' });
  readonly closeOnSelect = input(true, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly select = output<T>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly omnibar = inject(HellOmnibar);

  readonly active = computed(() => this.omnibar.isActive(this));
  readonly itemId = `hell-omnibar-item-${++nextOmnibarItemId}`;

  constructor() {
    super();
    this.omnibar.registerItem(this);
    inject(DestroyRef).onDestroy(() => this.omnibar.unregisterItem(this));
  }

  protected onClick(event: MouseEvent): void {
    if (this.disabled()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.omnibar.activate(this, 'mouse');
  }

  protected onMouseMove(): void {
    if (!this.disabled() && !this.active()) this.omnibar.setActive(this);
  }

  scrollIntoView(): void {
    this.host.nativeElement.scrollIntoView({ block: 'nearest' });
  }

  selectValue(): unknown {
    const selected = this.value();
    this.select.emit(selected as T);
    return selected;
  }

  value(): unknown {
    return this.itemValue();
  }
}

@Directive({
  selector: '[hellOmnibarItemIcon]',
  host: { '[class]': "part('root')", 'data-slot': 'root', 'aria-hidden': 'true' },
})
export class HellOmnibarItemIcon extends HellPartStyleable<HellOmnibarItemIconPart> {
  protected readonly recipe = HELL_OMNIBAR_ITEM_ICON_RECIPE;
  protected readonly defaultUiPart = 'root';
}

@Directive({
  selector: '[hellOmnibarItemText]',
  host: { '[class]': "part('root')", 'data-slot': 'root' },
})
export class HellOmnibarItemText extends HellPartStyleable<HellOmnibarItemTextPart> {
  protected readonly recipe = HELL_OMNIBAR_ITEM_TEXT_RECIPE;
  protected readonly defaultUiPart = 'root';
}

@Directive({
  selector: '[hellOmnibarItemSubtext]',
  host: { '[class]': "part('root')", 'data-slot': 'root' },
})
export class HellOmnibarItemSubtext extends HellPartStyleable<HellOmnibarItemSubtextPart> {
  protected readonly recipe = HELL_OMNIBAR_ITEM_SUBTEXT_RECIPE;
  protected readonly defaultUiPart = 'root';
}

@Directive({
  selector: '[hellOmnibarItemTrailing]',
  host: { '[class]': "part('root')", 'data-slot': 'root' },
})
export class HellOmnibarItemTrailing extends HellPartStyleable<HellOmnibarItemTrailingPart> {
  protected readonly recipe = HELL_OMNIBAR_ITEM_TRAILING_RECIPE;
  protected readonly defaultUiPart = 'root';
}

@Directive({
  selector: '[hellOmnibarChip]',
  host: { '[class]': "part('root')", 'data-slot': 'root' },
})
export class HellOmnibarChip extends HellPartStyleable<HellOmnibarChipPart> {
  protected readonly recipe = HELL_OMNIBAR_CHIP_RECIPE;
  protected readonly defaultUiPart = 'root';
}

@Directive({
  selector: 'button[hellOmnibarChipRemove]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    type: 'button',
    '[attr.tabindex]': 'tabIndex()',
  },
})
export class HellOmnibarChipRemove extends HellPartStyleable<HellOmnibarChipRemovePart> {
  protected readonly recipe = HELL_OMNIBAR_CHIP_REMOVE_RECIPE;
  protected readonly defaultUiPart = 'root';

  private readonly omnibar = inject(HellOmnibar, { optional: true });

  protected tabIndex(): -1 | null {
    return this.omnibar?.internalControlTabIndex() ?? null;
  }
}

@Directive({
  selector: '[hellOmnibarActions]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    role: 'toolbar',
    'aria-orientation': 'horizontal',
  },
})
export class HellOmnibarActionsStrip extends HellPartStyleable<HellOmnibarActionsStripPart> {
  protected readonly recipe = HELL_OMNIBAR_ACTIONS_STRIP_RECIPE;
  protected readonly defaultUiPart = 'root';
}

/** Action button rendered in the actions strip. */
@Directive({
  selector: 'button[hellOmnibarAction]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    type: 'button',
    '[attr.tabindex]': 'tabIndex()',
    '[attr.data-active]': 'pressed() ? "true" : null',
    '(keydown)': 'onKeyDown($event)',
  },
})
export class HellOmnibarAction
  extends HellPartStyleable<HellOmnibarActionPart>
  implements HellOmnibarRegisteredAction
{
  protected readonly recipe = HELL_OMNIBAR_ACTION_RECIPE;
  protected readonly defaultUiPart = 'root';

  readonly pressed = input(false, { transform: booleanAttribute });

  private readonly host = inject(ElementRef<HTMLButtonElement>);
  private readonly omnibar = inject(HellOmnibar);

  constructor() {
    super();
    this.omnibar.registerAction(this);
    inject(DestroyRef).onDestroy(() => this.omnibar.unregisterAction(this));
  }

  focus(): void {
    this.host.nativeElement.focus();
  }

  protected tabIndex(): -1 | null {
    return this.omnibar.internalControlTabIndex();
  }

  protected onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowLeft':
        this.omnibar.focusAdjacentAction(this, -1);
        event.preventDefault();
        break;
      case 'ArrowRight':
        this.omnibar.focusAdjacentAction(this, 1);
        event.preventDefault();
        break;
      case 'F6':
        this.omnibar.focus();
        event.preventDefault();
        break;
      case 'Escape':
        this.omnibar.focus();
        this.omnibar.close();
        event.preventDefault();
        event.stopPropagation();
        break;
    }
  }
}

/* ──────────────────────────── Types ──────────────────────────── */

/** How an omnibar item was activated, useful for analytics or branching UX. */
export type HellOmnibarActivationSource = 'mouse' | 'keyboard' | 'api';

/**
 * Payload emitted after an item selects. `value` is the current query text,
 * `item` is the selected payload, and `source` identifies the activation path.
 */
export interface HellOmnibarSubmitEvent<T = unknown> {
  readonly value: string;
  readonly item: T;
  readonly source: HellOmnibarActivationSource;
}

/**
 * Standalone imports for the complete omnibar composition: root, panel/group
 * parts, item slots, chips, actions strip, and action button directives.
 */
export const HELL_OMNIBAR_DIRECTIVES = [
  HellOmnibar,
  HellOmnibarPanel,
  HellOmnibarGroup,
  HellOmnibarGroupLabel,
  HellOmnibarItem,
  HellOmnibarItemIcon,
  HellOmnibarItemText,
  HellOmnibarItemSubtext,
  HellOmnibarItemTrailing,
  HellOmnibarChip,
  HellOmnibarChipRemove,
  HellOmnibarActionsStrip,
  HellOmnibarAction,
] as const;
