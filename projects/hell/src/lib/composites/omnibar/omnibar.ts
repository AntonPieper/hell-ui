import { NgTemplateOutlet } from '@angular/common';
import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  type ConnectedPosition,
} from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
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
} from '../../core/floating-scope';
import { HellFloatingDismissController, hellOutsideFocus } from '../../core/floating-dismissal';
import {
  type HellSearchField,
  type HellSearchResult,
  type HellSearchSource,
} from '../../core/search';
import { HELL_LABELS } from '../../core/labels';
import { HellInput } from '../../primitives/input/input';
import { HellSearch, HellSearchClear } from '../../primitives/search/search';
import { HellSkeleton } from '../../primitives/skeleton/skeleton';
import {
  HellGlobalKeydownService,
  hellShouldHandleGlobalHotkey,
  matchHotkey,
} from '../../core/hotkeys';
import { HellOmnibarRuntime } from './omnibar.runtime';
import { HellStyleable } from '../../core/styleable';

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
    HellInput,
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
    '[class.hell-omnibar]': '!unstyled()',
    '[attr.data-open]': 'isOpen() ? "true" : null',
    '[attr.data-size]': 'size()',
    '[attr.data-empty]': 'isEmpty() ? "true" : null',
  },
  template: `
    <div data-slot="control" hellSearch cdkOverlayOrigin #overlayOrigin="cdkOverlayOrigin" #control>
      <ng-content select="[hellOmnibarLeading]" />
      <div data-slot="input-wrap" #wrap>
        <input
          #input
          hellInput
          [unstyled]="true"
          data-slot="input"
          type="search"
          [id]="inputId"
          [attr.role]="'combobox'"
          [attr.aria-expanded]="isOpen()"
          [attr.aria-controls]="panelId"
          [attr.aria-activedescendant]="activeItemId()"
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
      [cdkConnectedOverlayPanelClass]="'hell-omnibar-overlay-pane'"
      (detach)="onOverlayDetach()"
      (positionChange)="onOverlayPositionChange()"
      (overlayOutsideClick)="onOverlayOutsideClick($event)"
    >
      <div
        #panel
        data-slot="panel"
        [id]="panelId + '-surface'"
        [class.hell-omnibar-panel-surface]="!unstyled()"
      >
        <div data-slot="actions" [attr.data-empty]="!hasActions() ? 'true' : null">
          <ng-content select="[hellOmnibarActions]" />
        </div>
        <div data-slot="results" [id]="panelId" role="listbox">
          @if (loading()) {
            <div data-slot="loading" role="status" [attr.aria-label]="loadingMessage()">
              @if (loadingTemplate(); as tpl) {
                <ng-container *ngTemplateOutlet="tpl; context: loadingTemplateContext()" />
              } @else {
                @for (row of skeletonRows(); track row) {
                  <div data-slot="skeleton-row">
                    <div hellSkeleton shape="circle" width="18px" height="18px"></div>
                    <div data-slot="skeleton-text">
                      <div hellSkeleton width="70%" height="12px"></div>
                      <div hellSkeleton width="46%" height="10px"></div>
                    </div>
                  </div>
                }
              }
            </div>
          } @else {
            <ng-content />
            @if (isEmpty()) {
              @if (emptyTemplate(); as tpl) {
                <ng-container *ngTemplateOutlet="tpl" />
              } @else {
                <div data-slot="empty">{{ emptyMessage() }}</div>
              }
            }
          }
        </div>
        <ng-content select="[hellOmnibarFooter]" />
      </div>
    </ng-template>
  `,
  exportAs: 'hellOmnibar',
})
export class HellOmnibar extends HellStyleable implements HellFloatingScope {
  protected readonly labels = inject(HELL_LABELS);

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
  private overlayPanelElement: HTMLElement | null = null;
  private readonly overlayPanelContainer = signal<HTMLElement | null>(null);
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
  protected readonly activeItemId = this.runtime.activeItemId;
  protected readonly isEmpty = this.runtime.isEmpty;
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

  @ViewChild('input', { static: true }) private inputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('panel') private set panelRef(ref: ElementRef<HTMLElement> | undefined) {
    const next = ref?.nativeElement ?? null;
    if (next === this.overlayPanelElement) return;

    this.unregisterOverlayPanel();
    this.overlayPanelElement = next;
    this.overlayPanelContainer.set(next);

    if (next) {
      this.floatingScope.registerFloatingElement(next);
      this.syncOverlayPanelStyles();
    }
  }

  constructor() {
    super();
    effect(() => {
      // Reset active when items shift or query changes.
      this.value();
      this.runtime.items().length;
      this.runtime.resetActive();
    });
    effect(() => {
      const open = this.isOpen();
      const size = this.size();
      void size;
      if (open) queueMicrotask(() => this.syncOverlayPanelStyles());
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
    this.destroyRef.onDestroy(() => this.unregisterOverlayPanel());
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

  /** Current container for child Floating Interaction primitives (menus, popovers). */
  get floatingContainerElement(): HTMLElement {
    return this.overlayPanelContainer() ?? this.host.nativeElement;
  }

  /** Container for child Floating Interaction primitives that should behave as part of the omnibar. */
  floatingContainer(): HTMLElement {
    return this.floatingContainerElement;
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

  protected onOverlayDetach(): void {
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
    this.overlayPanelContainer.set(null);
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
  host: { '[class.hell-omnibar-panel-content]': '!unstyled()' },
})
export class HellOmnibarPanel extends HellStyleable {}

@Directive({
  selector: '[hellOmnibarGroup]',
  host: {
    '[class.hell-omnibar-group]': '!unstyled()',
    role: 'group',
    '[attr.aria-label]': 'label() || null',
  },
})
export class HellOmnibarGroup extends HellStyleable {
  readonly label = input<string>('');
}

@Directive({
  selector: '[hellOmnibarGroupLabel]',
  host: { '[class.hell-omnibar-group-label]': '!unstyled()', role: 'presentation' },
})
export class HellOmnibarGroupLabel extends HellStyleable {}

/**
 * A selectable result row. `[value]` is the payload emitted via `(select)`
 * and `(submit)` on the parent omnibar. Active state and click selection
 * are managed by the command palette/listbox pair; consumers control rendering.
 */
@Directive({
  selector: 'button[hellOmnibarItem]',
  host: {
    '[class.hell-omnibar-item]': '!unstyled()',
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
  extends HellStyleable
  implements HellOmnibarRegisteredItem
{
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
  host: { '[class.hell-omnibar-item-icon]': '!unstyled()', 'aria-hidden': 'true' },
})
export class HellOmnibarItemIcon extends HellStyleable {}

@Directive({
  selector: '[hellOmnibarItemText]',
  host: { '[class.hell-omnibar-item-text]': '!unstyled()' },
})
export class HellOmnibarItemText extends HellStyleable {}

@Directive({
  selector: '[hellOmnibarItemSubtext]',
  host: { '[class.hell-omnibar-item-subtext]': '!unstyled()' },
})
export class HellOmnibarItemSubtext extends HellStyleable {}

@Directive({
  selector: '[hellOmnibarItemTrailing]',
  host: { '[class.hell-omnibar-item-trailing]': '!unstyled()' },
})
export class HellOmnibarItemTrailing extends HellStyleable {}

@Directive({
  selector: '[hellOmnibarChip]',
  host: { '[class.hell-omnibar-chip]': '!unstyled()' },
})
export class HellOmnibarChip extends HellStyleable {}

@Directive({
  selector: 'button[hellOmnibarChipRemove]',
  host: {
    '[class.hell-omnibar-chip-remove]': '!unstyled()',
    type: 'button',
    '[attr.tabindex]': 'tabIndex()',
  },
})
export class HellOmnibarChipRemove extends HellStyleable {
  private readonly omnibar = inject(HellOmnibar, { optional: true });

  protected tabIndex(): -1 | null {
    return this.omnibar?.internalControlTabIndex() ?? null;
  }
}

@Directive({
  selector: '[hellOmnibarActions]',
  host: {
    '[class.hell-omnibar-actions-strip]': '!unstyled()',
    role: 'toolbar',
    'aria-orientation': 'horizontal',
  },
})
export class HellOmnibarActionsStrip extends HellStyleable {}

/** Action button rendered in the actions strip. */
@Directive({
  selector: 'button[hellOmnibarAction]',
  host: {
    '[class.hell-omnibar-action]': '!unstyled()',
    type: 'button',
    '[attr.tabindex]': 'tabIndex()',
    '[attr.data-active]': 'pressed() ? "true" : null',
    '(keydown)': 'onKeyDown($event)',
  },
})
export class HellOmnibarAction extends HellStyleable implements HellOmnibarRegisteredAction {
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

export { matchHotkey };
