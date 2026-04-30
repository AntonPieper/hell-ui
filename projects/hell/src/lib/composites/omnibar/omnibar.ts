import { NgClass, NgTemplateOutlet } from '@angular/common';
import {
  AfterRenderRef,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  Injector,
  TemplateRef,
  ViewChild,
  afterNextRender,
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
  HELL_OVERLAY_SCOPE,
  HellFloatingInteractionController,
  HellOverlayScopeRegistry,
  type HellOverlayScope,
} from '../../core/overlay-scope';
import {
  type HellSearchField,
  type HellSearchResult,
  type HellSearchSource,
} from '../../core/search';
import { HellInput } from '../../primitives/input/input';
import { HellListbox } from '../../primitives/listbox/listbox';
import { HellSearch, HellSearchClear } from '../../primitives/search/search';
import { HellSkeleton } from '../../primitives/skeleton/skeleton';
import { HellCommandPaletteService } from './command-palette';
import { HellStyleable } from '../../core/styleable';

/**
 * Advanced contract implemented by omnibar item directives. Custom items can
 * implement it to join keyboard navigation, active-descendant wiring, scrolling,
 * and submit selection.
 */
export interface HellOmnibarRegisteredItem {
  /** Stable DOM id used for `aria-activedescendant`. */
  readonly itemId: string;
  /** Whether activation should close the parent omnibar. */
  readonly closeOnSelect: () => boolean;

  /** Raw item value used for active-item bookkeeping. */
  value(): unknown;
  /** Emits the child `(select)` output and returns the selected payload. */
  selectValue(): unknown;
  /** Keep keyboard navigation visible without exposing scroll policy upstream. */
  scrollIntoView(): void;
}

/* ──────────────────────────── Component ──────────────────────────── */

let nextOmnibarId = 0;
let nextOmnibarItemId = 0;

/**
 * Composite command palette searchbox with a debounced search service,
 * configurable actions strip, grouped results, and optional global hotkey.
 * Rendering of results is fully owned by projected content; the omnibar wires
 * up query state, keyboard navigation, active-item tracking, and selection.
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
    NgClass,
    NgTemplateOutlet,
    HellInput,
    HellListbox,
    HellSearch,
    HellSearchClear,
    HellSkeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    HellCommandPaletteService,
    { provide: HELL_OVERLAY_SCOPE, useExisting: forwardRef(() => HellOmnibar) },
  ],
  host: {
    '[class.hell-omnibar]': '!unstyled()',
    '[attr.data-open]': 'isOpen() ? "true" : null',
    '[attr.data-size]': 'size()',
    '[attr.data-empty]': 'isEmpty() ? "true" : null',
  },
  template: `
    <div data-slot="control" hellSearch #control>
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
        aria-label="Clear search"
        [attr.data-empty]="value() ? null : ''"
        (click)="onClearClick($event)"
      ></button>
      <ng-content select="[hellOmnibarTrailing]" />
    </div>

    @if (isOpen()) {
      <div
        #panel
        data-slot="panel"
        [id]="panelId + '-surface'"
        [style.--hell-omnibar-anchor-top]="anchorTop() + 'px'"
        [style.--hell-omnibar-anchor-left]="anchorLeft() + 'px'"
        [style.--hell-omnibar-anchor-width]="anchorWidth() + 'px'"
        [ngClass]="panelClass()"
        (pointerdown)="onPanelPointerDown($event)"
      >
        <div data-slot="actions" [attr.data-empty]="!hasActions() ? 'true' : null">
          <ng-content select="[hellOmnibarActions]" />
        </div>
        <div data-slot="results" hellListbox [id]="panelId">
          @if (loading()) {
            <div data-slot="loading" role="status" [attr.aria-label]="loadingMessage()">
              @for (row of skeletonRows(); track row) {
                <div data-slot="skeleton-row">
                  <div hellSkeleton shape="circle" width="18px" height="18px"></div>
                  <div data-slot="skeleton-text">
                    <div hellSkeleton width="70%" height="12px"></div>
                    <div hellSkeleton width="46%" height="10px"></div>
                  </div>
                </div>
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
    }
  `,
  exportAs: 'hellOmnibar',
})
export class HellOmnibar extends HellStyleable implements HellOverlayScope {
  /* ── Inputs ────────────────────────────────────────────────────────── */

  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly placeholder = input<string>('Search…');
  readonly ariaLabel = input<string>('Search');
  readonly emptyMessage = input<string>('No results');
  readonly emptyTemplate = input<TemplateRef<unknown> | null>(null);
  readonly panelClass = input<string | string[] | Record<string, boolean>>('');
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
   *  or `'/'`. Pass `null` to disable. The omnibar attaches a `keydown`
   *  listener on `document` while alive. */
  readonly hotkey = input<string | null>(null);

  /** When true (default), opens the panel automatically once the user types
   *  or focuses. Set false for fully-controlled mode. */
  readonly openOnFocus = input(true, { transform: booleanAttribute });

  readonly value = model<string>('');

  /** Width to use for the panel anchor when measuring the control fails
   *  (e.g. SSR). Falls back to 320px. */
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
  private readonly injector = inject(Injector);
  private readonly palette = inject(HellCommandPaletteService<unknown>);

  private readonly _open = signal(false);
  protected readonly isOpen = computed(() => !this.disabled() && this._open());

  protected readonly anchorTop = signal(0);
  protected readonly anchorLeft = signal(0);
  protected readonly anchorWidth = signal(this.minPanelWidth());
  protected readonly cursor = signal(0);
  readonly searchResults = computed(() => this.palette.results());
  readonly loading = computed(() => this.palette.loading());
  readonly error = computed(() => this.palette.error());
  protected readonly skeletonRows = computed(() =>
    Array.from({ length: Math.max(1, this.loadingRows()) }, (_, i) => i),
  );

  /* ── Item registry ─────────────────────────────────────────────────── */

  private readonly items = signal<HellOmnibarRegisteredItem[]>([]);
  private readonly actionItems = signal<HellOmnibarAction[]>([]);
  private readonly _activeIndex = signal(0);
  protected readonly activeIndex = computed(() => {
    const items = this.items();
    if (!items.length) return -1;
    const i = this._activeIndex();
    return Math.max(0, Math.min(i, items.length - 1));
  });
  protected readonly activeItemId = computed(() => {
    const items = this.items();
    const i = this.activeIndex();
    return items[i]?.itemId ?? null;
  });
  protected readonly isEmpty = computed(() => !this.loading() && this.items().length === 0);
  protected readonly hasActions = computed(() => this.actionItems().length > 0);

  private posUpdater?: AfterRenderRef;
  private readonly overlayScope = new HellOverlayScopeRegistry(() => this.host.nativeElement);
  private readonly floatingInteraction = new HellFloatingInteractionController({
    surface: () => this.host.nativeElement,
    scope: this,
    registerSurface: () => false,
    ownerDocument: () => this.host.nativeElement.ownerDocument,
    active: () => this.isOpen(),
    shouldDismiss: ({ reason }) => reason === 'outside-pointer' || reason === 'outside-focus',
    onDismiss: () => this.close(),
  });

  /* ── View refs ─────────────────────────────────────────────────────── */

  @ViewChild('input', { static: true }) private inputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('control', { static: true }) private controlRef?: ElementRef<HTMLElement>;

  constructor() {
    super();
    effect(() => {
      // Reset active when items shift or query changes.
      this.value();
      this.items().length;
      this._activeIndex.set(0);
    });
    effect(() => {
      const open = this.isOpen();
      if (open) this.scheduleAnchorUpdate();
    });
    effect(() => {
      const items = this.searchItems();
      const source = this.searchSource();
      const fields = this.searchFields();
      const limit = this.searchLimit();
      const params = this.searchParams();
      const debounce = this.searchDebounce();
      const query = this.value();
      this.palette.setQuery(query);

      if (!source && items === null) {
        this.palette.cancel();
        this.palette.clearResults();
        return;
      }

      this.palette.scheduleSearch(
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
    this.installAnchorListeners();
    this.floatingInteraction.connect(this.destroyRef);
  }

  /* ── Public API for actions / hotkey wiring ────────────────────────── */

  /** Programmatically focus the input (e.g. from an action handler). */
  focus(): void {
    this.inputRef?.nativeElement.focus();
  }

  /** Container for child overlay primitives (menus, popovers) that should
   *  behave as part of the omnibar instead of outside-click targets. */
  overlayContainer(): HTMLElement {
    return this.host.nativeElement;
  }

  registerOverlayElement(element: HTMLElement): void {
    this.overlayScope.registerOverlayElement(element);
  }

  unregisterOverlayElement(element: HTMLElement): void {
    this.overlayScope.unregisterOverlayElement(element);
  }

  containsOverlayTarget(target: EventTarget | Node | null): boolean {
    return this.overlayScope.containsOverlayTarget(target);
  }

  /** Open the panel. Idempotent. */
  open(): void {
    if (this._open()) return;
    this._open.set(true);
    this.openChange.emit(true);
  }

  /** Close the panel. Idempotent. */
  close(): void {
    if (!this._open()) return;
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
    this.items.update((list) => [...list, item]);
  }

  unregisterItem(item: HellOmnibarRegisteredItem): void {
    this.items.update((list) => list.filter((i) => i !== item));
  }

  setActive(item: HellOmnibarRegisteredItem): void {
    const idx = this.items().indexOf(item);
    if (idx >= 0) this._activeIndex.set(idx);
  }

  isActive(item: HellOmnibarRegisteredItem): boolean {
    return this.items()[this.activeIndex()] === item;
  }

  activate(item: HellOmnibarRegisteredItem, source: HellOmnibarActivationSource): void {
    const selected = item.selectValue();

    this.submit.emit({
      value: this.value(),
      item: selected,
      source,
    });

    if (item.closeOnSelect()) this.close();
  }

  registerAction(action: HellOmnibarAction): void {
    this.actionItems.update((list) => [...list, action]);
  }
  unregisterAction(action: HellOmnibarAction): void {
    this.actionItems.update((list) => list.filter((a) => a !== action));
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
    this.floatingInteraction.handleFocusExit(event);
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

  protected onPanelPointerDown(event: PointerEvent): void {
    void event;
    this.floatingInteraction.markPointerDownInside();
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
        if (this.isOpen() && this.items().length) {
          this._activeIndex.set(0);
          event.preventDefault();
        }
        break;
      case 'End':
        if (this.isOpen() && this.items().length) {
          this._activeIndex.set(this.items().length - 1);
          event.preventDefault();
        }
        break;
      case 'Enter': {
        const item = this.items()[this.activeIndex()];
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
    const len = this.items().length;
    if (!len) return;
    const cur = this.activeIndex();
    let next = cur + delta;
    if (next < 0) next = len - 1;
    if (next >= len) next = 0;
    this._activeIndex.set(next);
    this.items()[next]?.scrollIntoView();
  }

  /* ── Anchor positioning ────────────────────────────────────────────── */

  private installAnchorListeners(): void {
    if (typeof window === 'undefined') return;
    const onChange = () => this.scheduleAnchorUpdate();
    const scrollOpts: AddEventListenerOptions = { passive: true, capture: true };
    window.addEventListener('resize', onChange, { passive: true });
    window.addEventListener('scroll', onChange, scrollOpts);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('resize', onChange);
      window.removeEventListener('scroll', onChange, scrollOpts);
    });
  }

  private scheduleAnchorUpdate(): void {
    if (!this.isOpen()) return;
    this.posUpdater?.destroy();
    this.posUpdater = afterNextRender(() => this.updateAnchor(), { injector: this.injector });
  }

  private updateAnchor(): void {
    const el = this.controlRef?.nativeElement ?? this.host.nativeElement;
    const rect = el.getBoundingClientRect();
    const min = this.minPanelWidth();
    this.anchorTop.set(rect.bottom + 4);
    this.anchorLeft.set(rect.left);
    this.anchorWidth.set(Math.max(rect.width, min));
  }

  /* ── Hotkey ────────────────────────────────────────────────────────── */

  private installHotkey(): void {
    if (typeof document === 'undefined') return;
    const handler = (event: KeyboardEvent) => {
      const combo = this.hotkey();
      if (!combo || this.disabled()) return;
      if (!matchHotkey(event, combo)) return;
      // Don't hijack typing in another input unless we're targeted.
      const active = document.activeElement;
      if (
        active &&
        active !== this.inputRef?.nativeElement &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          (active as HTMLElement).isContentEditable)
      ) {
        // Allow override only if the combo uses a modifier (mod / ctrl / meta / alt)
        if (!/(?:^|\+)(mod|ctrl|meta|alt|shift)(?:\+|$)/i.test(combo)) return;
      }
      event.preventDefault();
      this.focus();
      this.open();
    };
    document.addEventListener('keydown', handler);
    this.destroyRef.onDestroy(() => document.removeEventListener('keydown', handler));
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
  selector: '[hellOmnibarItem]',
  host: {
    '[class.hell-omnibar-item]': '!unstyled()',
    '[id]': 'itemId',
    role: 'option',
    type: 'button',
    '[attr.aria-selected]': 'active() ? "true" : "false"',
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
    void event;
    this.omnibar.activate(this, 'mouse');
  }

  protected onMouseMove(): void {
    if (!this.active()) this.omnibar.setActive(this);
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
  },
})
export class HellOmnibarChipRemove extends HellStyleable {}

@Directive({
  selector: '[hellOmnibarActions]',
  host: {
    '[class.hell-omnibar-actions-strip]': '!unstyled()',
    role: 'menubar',
    'aria-orientation': 'horizontal',
  },
})
export class HellOmnibarActionsStrip extends HellStyleable {}

/** Action button rendered in the actions strip. */
@Directive({
  selector: 'button[hellOmnibarAction], [hellOmnibarAction]',
  host: {
    '[class.hell-omnibar-action]': '!unstyled()',
    role: 'menuitem',
    '[attr.data-active]': 'pressed() ? "true" : null',
  },
})
export class HellOmnibarAction extends HellStyleable {
  readonly pressed = input(false, { transform: booleanAttribute });

  private readonly omnibar = inject(HellOmnibar);

  constructor() {
    super();
    this.omnibar.registerAction(this);
    inject(DestroyRef).onDestroy(() => this.omnibar.unregisterAction(this));
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

/* ──────────────────────────── Hotkey utility ──────────────────────────── */

const isMac = (() => {
  if (typeof navigator === 'undefined') return false;
  const platform =
    (navigator as { userAgentData?: { platform?: string } }).userAgentData?.platform ??
    navigator.platform ??
    '';
  return /mac|iphone|ipad|ipod/i.test(platform);
})();

/**
 * Match a keydown against a hotkey string. Supported tokens:
 *   `mod` (Cmd on macOS, Ctrl elsewhere), `ctrl`, `meta`, `alt`, `shift`,
 *   plus a single literal key ("k", "/", "Enter", …). Tokens are joined with
 *   `+` and case-insensitive.
 */
export function matchHotkey(event: KeyboardEvent, combo: string): boolean {
  const parts = combo
    .toLowerCase()
    .split('+')
    .map((p) => p.trim())
    .filter(Boolean);
  let needCtrl = false;
  let needMeta = false;
  let needAlt = false;
  let needShift = false;
  let key = '';
  for (const p of parts) {
    if (p === 'mod') {
      if (isMac) needMeta = true;
      else needCtrl = true;
    } else if (p === 'ctrl') {
      needCtrl = true;
    } else if (p === 'meta' || p === 'cmd' || p === 'super') {
      needMeta = true;
    } else if (p === 'alt' || p === 'option') {
      needAlt = true;
    } else if (p === 'shift') {
      needShift = true;
    } else {
      key = p;
    }
  }
  if (event.ctrlKey !== needCtrl) return false;
  if (event.metaKey !== needMeta) return false;
  if (event.altKey !== needAlt) return false;
  // Shift is only enforced when explicitly requested — single-character keys
  // like "?" require shift on most layouts, but the user types "shift+/" or
  // just "?". Match either by comparing the produced key.
  if (needShift && !event.shiftKey) return false;
  if (!key) return false;
  return event.key.toLowerCase() === key;
}
