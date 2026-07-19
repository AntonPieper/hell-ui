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
  Injectable,
  NgZone,
  Renderer2,
  ViewChild,
  booleanAttribute,
  computed,
  contentChild,
  effect,
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
import { HellChipSetController } from '@hell-ui/angular/internal/chip';
import { HellFloatingDismissController, hellOutsideFocus } from '@hell-ui/angular/internal/core';
import { hellCreateLabels, type HellLabels } from '@hell-ui/angular/core';
import { NgpInput } from 'ng-primitives/input';
import { HellChipInput } from '@hell-ui/angular/chip';
import { HellSearch, HellSearchClear } from '@hell-ui/angular/input';
import {
  HellGlobalKeydownService,
  hellShouldHandleGlobalHotkey,
  matchHotkey,
} from '@hell-ui/angular/internal/hotkeys';
import {
  HellOmnibarRuntime,
  type HellOmnibarActionRegistration,
  type HellOmnibarItemRegistration,
} from './omnibar.runtime';
import { hellPartStyler, type HellRecipe, type HellUi, type HellUiInput } from '@hell-ui/angular/core';
import {
  HELL_OPTION_SURFACE_METRICS,
  HELL_OPTION_SURFACE_SELECTED_STATES,
} from '@hell-ui/angular/internal/option';
import type { InjectionToken } from '@angular/core';

/** Built-in accessibility labels owned by the omnibar entry point. */
export interface HellOmnibarLabels {
  /** Accessible label for the clear-search button. */
  readonly clearSearch: string;
}

/** Injection token resolving to the effective omnibar labels. */
export const HELL_OMNIBAR_LABELS: InjectionToken<HellLabels<HellOmnibarLabels>> = hellCreateLabels<HellOmnibarLabels>('HELL_OMNIBAR_LABELS', {
  clearSearch: 'Clear search',
});

/* ──────────────────────────── Component ──────────────────────────── */

let nextOmnibarId = 0;
let nextOmnibarItemId = 0;
let nextOmnibarGroupLabelId = 0;

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

/** Public parts of the HellOmnibar module, styleable through its Part Style Map. */
export type HellOmnibarPart =
  | 'root'
  | 'control'
  | 'inputWrap'
  | 'input'
  | 'clear'
  | 'panel'
  | 'actions'
  | 'results';

/** Part Style Map accepted by the HellOmnibar `ui` input. */
export type HellOmnibarUi = HellUi<HellOmnibarPart>;

const HELL_OMNIBAR_RECIPE = {
  root: 'relative inline-flex w-full',
  control: 'inline-flex w-full items-center gap-hell-2',
  inputWrap: 'relative flex min-w-0 flex-1 items-center overflow-hidden',
  input: 'h-full w-full bg-transparent outline-none',
  clear: 'inline-flex h-[18px] w-[18px] items-center justify-center rounded-full',
  panel: 'flex w-full flex-col overflow-hidden',
  actions: 'flex items-center gap-hell-1',
  results: 'flex flex-1 flex-col overflow-y-auto',
} satisfies HellRecipe<HellOmnibarPart>;

const HELL_OMNIBAR_GROUP_RECIPE = {
  root: 'flex flex-col gap-px',
} satisfies HellRecipe<'root'>;

const HELL_OMNIBAR_GROUP_LABEL_RECIPE = {
  root: 'text-[10px] font-semibold uppercase',
} satisfies HellRecipe<'root'>;

const HELL_OMNIBAR_ITEM_RECIPE = {
  // The shared option surface (metrics + active/selected treatment) keeps
  // omnibar items visually in family with select/combobox/listbox options;
  // width/reset atoms are the button-host specifics.
  root: `flex w-full items-center gap-hell-3 border-0 text-start font-[inherit] ${HELL_OPTION_SURFACE_METRICS} ${HELL_OPTION_SURFACE_SELECTED_STATES} focus-visible:shadow-[0_0_0_2px_var(--color-hell-focus-ring)]`,
} satisfies HellRecipe<'root'>;

const HELL_OMNIBAR_ACTIONS_STRIP_RECIPE = {
  root: '',
} satisfies HellRecipe<'root'>;

const HELL_OMNIBAR_ACTION_RECIPE = {
  root: 'inline-flex items-center gap-hell-1 rounded-hell-sm',
} satisfies HellRecipe<'root'>;

/**
 * Omnibar-local renderer coordination. Child directives and floating
 * descendants register through this provider so those seams never become
 * members of the public root, item, or action contracts.
 */
@Injectable()
class HellOmnibarController implements HellFloatingScope {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly runtime = inject(HellOmnibarRuntime);
  private readonly floatingScope = new HellFloatingScopeRegistry(() => this.host.nativeElement);

  query: () => string = () => '';
  close: () => void = () => {};
  focus: () => void = () => {};
  isOpen: () => boolean = () => false;
  emitSubmit: (event: HellOmnibarSubmitEvent) => void = () => {};

  registerItem(item: HellOmnibarItemRegistration): void {
    this.runtime.registerItem(item);
  }

  unregisterItem(item: HellOmnibarItemRegistration): void {
    this.runtime.unregisterItem(item);
  }

  setActive(item: HellOmnibarItemRegistration): void {
    this.runtime.setActive(item);
  }

  isActive(item: HellOmnibarItemRegistration): boolean {
    return this.runtime.isActive(item);
  }

  activate(item: HellOmnibarItemRegistration, source: HellOmnibarActivationSource): void {
    if (item.disabled()) return;

    this.emitSubmit({ query: this.query(), item: item.selectValue(), source });
    if (item.closeOnSelect()) this.close();
  }

  registerAction(action: HellOmnibarActionRegistration): void {
    this.runtime.registerAction(action);
  }

  unregisterAction(action: HellOmnibarActionRegistration): void {
    this.runtime.unregisterAction(action);
  }

  focusAdjacentAction(action: HellOmnibarActionRegistration, delta: number): void {
    this.runtime.focusAdjacentAction(action, delta);
  }

  controlTabIndex(): -1 | null {
    return this.isOpen() ? -1 : null;
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
}

/**
 * Composite command palette searchbox for command interaction coordination.
 * Consumers own search resources, status policy, and projected result chrome;
 * the omnibar owns query/open state, hotkeys, keyboard navigation, activation,
 * floating dismissal, focus handoff, and scroll anchoring.
 * Options use `aria-activedescendant`; F6 enters/leaves the optional actions
 * strip without adding action tab stops, while projected Chip tokens retain
 * the public Chip Set's roving-focus behavior.
 *
 * Slots (multi-slot `<ng-content>` with attribute selectors):
 *   - `[hellOmnibarLeading]`  — icon/badge before the input
 *   - `[hellOmnibarTrailing]` — kbd hint, status, etc. after the input
 *   - `[hellOmnibarActions]`  — actions strip rendered above results
 *   - default slot            — projected groups + items (panel body)
 *
 * Child renderer coordination stays behind an unexported local controller.
 */
@Component({
  selector: 'hell-omnibar',
  imports: [
    HellChipInput,
    NgpInput,
    HellSearch,
    HellSearchClear,
    CdkConnectedOverlay,
    CdkOverlayOrigin,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    HellOmnibarRuntime,
    HellOmnibarController,
    HellChipSetController,
    { provide: HELL_FLOATING_SCOPE, useExisting: HellOmnibarController },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    'data-orientation': 'horizontal',
    role: 'group',
    tabindex: '-1',
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
          hellChipInput
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
          [value]="query()"
          [disabled]="disabled()"
          autocomplete="off"
          spellcheck="false"
          (input)="onInput($event)"
          (focus)="onFocus()"
          (blur)="onBlur($event)"
          (keydown)="onKeyDown($event)"
        />
      </div>
      <button
        hellSearchClear
        data-slot="clear"
        [class]="part('clear')"
        type="button"
        [attr.aria-label]="labels.clearSearch"
        [attr.data-empty]="query() ? null : ''"
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
          <ng-content />
        </div>
        <ng-content select="[hellOmnibarFooter]" />
      </div>
      <div #floatingOutlet></div>
    </ng-template>
  `,
  exportAs: 'hellOmnibar',
})
export class HellOmnibar {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellOmnibarPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellOmnibarPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_OMNIBAR_RECIPE,
  });
  /** Resolved accessibility labels for the omnibar. */
  protected readonly labels = inject(HELL_OMNIBAR_LABELS);
  private readonly overlay = inject(Overlay);
  private readonly ngZone = inject(NgZone);

  /* ── Inputs ────────────────────────────────────────────────────────── */

  /** Control size preset; defaults to `'md'`. */
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  /** Whether the omnibar is disabled and cannot be opened or edited. Defaults to false. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Input placeholder text; defaults to `'Search…'`. */
  readonly placeholder = input<string>('Search…');
  /** Accessible label for the search input; defaults to `'Search'`. */
  readonly ariaLabel = input<string>('Search');

  /** Optional global hotkey, e.g. `'mod+k'` (Cmd on macOS, Ctrl elsewhere)
   *  or `'/'`. Pass `null` to avoid registering a document-level listener. */
  readonly hotkey = input<string | null>(null);

  /** When true (default), opens the panel automatically once the user types
   *  or focuses. Set false for fully-controlled mode. */
  readonly openOnFocus = input(true, { transform: booleanAttribute });

  /** Controlled query text. */
  readonly query = model<string>('');

  /** Controlled panel-open state. */
  readonly open = model(false);

  /** Minimum CDK connected-overlay panel width. The overlay still matches the control when wider. */
  readonly minPanelWidth = input<number>(320);

  /* ── Outputs ───────────────────────────────────────────────────────── */

  /** Emits when an item is activated by pointer or keyboard. */
  readonly submit = output<HellOmnibarSubmitEvent>();

  /* ── Internal state ────────────────────────────────────────────────── */

  /** Unique DOM id for the search input. */
  protected readonly inputId = `hell-omnibar-${++nextOmnibarId}`;
  /** Unique DOM id for the results panel. */
  protected readonly panelId = `${this.inputId}-panel`;

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderer = inject(Renderer2);
  private readonly runtime = inject(HellOmnibarRuntime);
  private readonly controller = inject(HellOmnibarController);
  private readonly chipSetController = inject(HellChipSetController);
  private readonly globalKeydown = inject(HellGlobalKeydownService);

  private readonly openVersion = signal(0);
  private observedOpen = false;
  /** Whether the panel is currently open (never open while disabled). */
  protected readonly isOpen = computed(() => !this.disabled() && this.open());
  /** Connected-overlay positions used to place the results panel. */
  protected readonly overlayPositions = HELL_OMNIBAR_OVERLAY_POSITIONS;
  /** Scroll strategy that repositions the overlay as the page scrolls. */
  protected readonly overlayScrollStrategy: ScrollStrategy =
    this.overlay.scrollStrategies.reposition({
      scrollThrottle: 0,
  });
  private overlayPanelElement: HTMLElement | null = null;

  /* ── Item registry ─────────────────────────────────────────────────── */

  /** Whether there are no registered result items. */
  protected readonly isEmpty = computed(() => this.runtime.items().length === 0);
  /** Whether projected result directives form a listbox. */
  protected readonly hasListboxResults = computed(() => !this.isEmpty());
  /** DOM id of the active item for `aria-activedescendant`, or null. */
  protected readonly activeDescendantId = computed(() =>
    this.isOpen() && this.hasListboxResults() ? this.runtime.activeItemId() : null,
  );
  /** Whether any action buttons are registered in the actions strip. */
  protected readonly hasActions = this.runtime.hasActions;

  private readonly floatingFocusDismissal = new HellFloatingDismissController({
    root: () => this.host.nativeElement,
    scope: this.controller,
    ownerDocument: () => this.host.nativeElement.ownerDocument,
    active: () => this.isOpen(),
    activeKey: () => this.openVersion(),
    dismiss: hellOutsideFocus,
    onDismiss: () => this.requestClose(),
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
      this.controller.registerFloatingElement(next);
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
    if (next) this.controller.registerFloatingElement(next);
  }
  private floatingOutletElement: HTMLElement | null = null;
  private overlayGeometryCleanup: VoidFunction | null = null;
  private overlayGeometryFrame: number | null = null;

  constructor() {
    // Projected chips bubble to the host, while input commands stay on the
    // native search control so Escape cancels its built-in clear behavior.
    const stopChipSetKeydown = this.renderer.listen(
      this.host.nativeElement,
      'keydown',
      (event: KeyboardEvent) => this.chipSetController.onKeydown(event),
    );
    this.controller.query = this.query;
    this.controller.close = () => this.requestClose();
    this.controller.focus = () => this.focus();
    this.controller.isOpen = this.isOpen;
    this.controller.emitSubmit = (event) => this.submit.emit(event);

    effect(() => {
      // Reset active when items shift or query changes.
      this.query();
      this.runtime.items();
      this.runtime.resetActive();
    });
    effect(() => {
      const next = this.open();
      if (next === this.observedOpen) return;

      this.observedOpen = next;
      this.openVersion.update((version) => version + 1);
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

    this.installHotkey();
    this.floatingFocusDismissal.connect(this.destroyRef);
    this.destroyRef.onDestroy(stopChipSetKeydown);
    this.destroyRef.onDestroy(() => {
      this.stopOverlayGeometryTracking();
      this.unregisterOverlayPanel();
      this.unregisterFloatingOutlet();
    });
  }

  /* ── Public imperative focus/floating anchors ──────────────────────── */

  /** Programmatically focus the input (e.g. from an action handler). */
  focus(): void {
    this.inputRef?.nativeElement.focus();
  }

  /** Container for child Floating Interaction primitives (menus, popovers) that should
   *  behave as part of the omnibar instead of outside-click targets. */
  floatingContainer(): HTMLElement {
    return this.floatingOutletElement ?? this.host.nativeElement;
  }

  /* ── Event handlers (template) ─────────────────────────────────────── */

  /** Handle input changes, syncing the query and opening the panel when configured. */
  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value === this.query()) return;

    this.query.set(input.value);
    if (this.openOnFocus()) this.requestOpen();
  }

  /** Open the panel on input focus when `openOnFocus` is set. */
  protected onFocus(): void {
    if (this.openOnFocus()) this.requestOpen();
  }

  /** Handle focus leaving the input, dismissing the panel on outside focus. */
  protected onBlur(event: FocusEvent): void {
    this.floatingFocusDismissal.handleFocusExit(event);
  }

  /** Clear the query and refocus the input when the clear button is clicked. */
  protected onClearClick(event: MouseEvent): void {
    event.stopPropagation();
    queueMicrotask(() => {
      this.query.set('');
      this.focus();
      if (this.openOnFocus()) this.requestOpen();
    });
  }

  /** Close the panel on a click outside the omnibar and its floating elements. */
  protected onOverlayOutsideClick(event: MouseEvent): void {
    if (this.floatingFocusDismissal.isInside(event.target)) return;
    this.requestClose();
  }

  /** Sync overlay geometry when the overlay attaches. */
  protected onOverlayAttach(): void {
    this.syncOverlayGeometry();
  }

  /** Stop geometry tracking and release the panel when the overlay detaches. */
  protected onOverlayDetach(): void {
    this.stopOverlayGeometryTracking();
    this.unregisterOverlayPanel();
  }

  /** Re-apply panel styles when the overlay position changes. */
  protected onOverlayPositionChange(): void {
    this.syncOverlayPanelStyles();
  }

  /** Handle keyboard navigation and activation at the native search input. */
  protected onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        if (!this.isOpen()) {
          this.requestOpen();
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
          this.controller.activate(item, 'keyboard');
          event.preventDefault();
        }
        break;
      }
      case 'Escape':
        // Own the complete close → clear → blur sequence. Native
        // `<input type="search">` Escape handling may emit a follow-up input
        // event after clearing, which would otherwise reopen via openOnFocus.
        event.preventDefault();
        if (this.isOpen()) {
          this.requestClose();
          event.stopPropagation();
        } else if (this.query()) {
          this.query.set('');
        } else {
          this.inputRef?.nativeElement.blur();
        }
        break;
    }
  }

  private moveActive(delta: number): void {
    this.runtime.moveActive(delta);
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
    this.controller.unregisterFloatingElement(this.overlayPanelElement);
    this.overlayPanelElement = null;
  }

  private unregisterFloatingOutlet(): void {
    if (!this.floatingOutletElement) return;
    this.controller.unregisterFloatingElement(this.floatingOutletElement);
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
        this.requestOpen();
      };

      onCleanup(this.globalKeydown.register(handler, this.destroyRef));
    });
  }

  private requestOpen(): void {
    if (this.disabled()) return;
    this.setOpen(true);
  }

  private requestClose(): void {
    this.setOpen(false);
  }

  private setOpen(next: boolean): void {
    if (this.open() === next) return;

    this.observedOpen = next;
    this.openVersion.update((version) => version + 1);
    this.open.set(next);
  }
}

/* ──────────────────────────── Children ──────────────────────────── */

/**
 * Groups related result items under an optional label. A projected
 * `[hellOmnibarGroupLabel]` names the group through `aria-labelledby`;
 * the `label` input is the fallback for groups without a visible label.
 */
@Directive({
  selector: '[hellOmnibarGroup]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    role: 'group',
    '[attr.aria-labelledby]': 'visibleLabel()?.id ?? null',
    '[attr.aria-label]': 'visibleLabel() ? null : label() || null',
  },
})
export class HellOmnibarGroup {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_OMNIBAR_GROUP_RECIPE,
  });
  /** Fallback accessible label for groups without a visible label. */
  readonly label = input<string>('');

  /** Projected visible label that names the group when present. */
  protected readonly visibleLabel = contentChild(HellOmnibarGroupLabel);
}

/** Visible label heading that supplies its result group's accessible name. */
@Directive({
  selector: '[hellOmnibarGroupLabel]',
  host: { '[class]': "part('root')", 'data-slot': 'root', '[id]': 'id' },
})
export class HellOmnibarGroupLabel {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_OMNIBAR_GROUP_LABEL_RECIPE,
  });

  /** Stable id the parent group references through `aria-labelledby`. */
  readonly id = `hell-omnibar-group-label-${++nextOmnibarGroupLabelId}`;
}

/**
 * A selectable result row. `[value]` is the required payload emitted via
 * `(select)` and `(submit)` on the parent omnibar; omitting it is a template
 * type-checking error, so activation never carries an undefined payload.
 * Active state and click selection are managed by the command palette/listbox
 * pair; consumers control rendering.
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
export class HellOmnibarItem<T = unknown> {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_OMNIBAR_ITEM_RECIPE,
  });

  /** Required payload emitted via `(select)` and the parent `(submit)` when activated. */
  readonly itemValue = input.required<T>({ alias: 'value' });
  /** Whether selecting this item closes the panel; defaults to true. */
  readonly closeOnSelect = input(true, { transform: booleanAttribute });
  /** Whether the item is disabled for navigation and activation. Defaults to false. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Emits the item value when the item is selected. */
  readonly select = output<T>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly controller = inject(HellOmnibarController);

  /** Whether this item is currently the active (highlighted) item. */
  protected readonly active = computed(() => this.controller.isActive(this.registration));
  /** Stable DOM id used for `aria-activedescendant`. */
  protected readonly itemId = `hell-omnibar-item-${++nextOmnibarItemId}`;
  private readonly registration: HellOmnibarItemRegistration = {
    itemId: this.itemId,
    closeOnSelect: this.closeOnSelect,
    disabled: this.disabled,
    selectValue: () => {
      const selected = this.itemValue();
      this.select.emit(selected);
      return selected;
    },
    scrollIntoView: () => this.host.nativeElement.scrollIntoView({ block: 'nearest' }),
  };

  constructor() {
    this.controller.registerItem(this.registration);
    inject(DestroyRef).onDestroy(() => this.controller.unregisterItem(this.registration));
  }

  /** Activate the item on click unless disabled. */
  protected onClick(event: MouseEvent): void {
    if (this.disabled()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.controller.activate(this.registration, 'mouse');
  }

  /** Make the item active when the pointer moves over it. */
  protected onMouseMove(): void {
    if (!this.disabled() && !this.active()) this.controller.setActive(this.registration);
  }
}

/** Toolbar container for action buttons rendered above the results. */
@Directive({
  selector: '[hellOmnibarActions]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    role: 'toolbar',
    'aria-orientation': 'horizontal',
  },
})
export class HellOmnibarActionsStrip {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_OMNIBAR_ACTIONS_STRIP_RECIPE,
  });
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
export class HellOmnibarAction {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_OMNIBAR_ACTION_RECIPE,
  });

  /** Whether the action renders in a pressed/active state. Defaults to false. */
  readonly pressed = input(false, { transform: booleanAttribute });

  private readonly host = inject(ElementRef<HTMLButtonElement>);
  private readonly controller = inject(HellOmnibarController);
  private readonly registration: HellOmnibarActionRegistration = {
    focus: () => this.host.nativeElement.focus(),
  };

  constructor() {
    this.controller.registerAction(this.registration);
    inject(DestroyRef).onDestroy(() => this.controller.unregisterAction(this.registration));
  }

  /** Keep the button out of the tab order while the panel is open. */
  protected tabIndex(): -1 | null {
    return this.controller.controlTabIndex();
  }

  /** Handle arrow/F6/Escape navigation within the actions strip. */
  protected onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowLeft':
        this.controller.focusAdjacentAction(this.registration, -1);
        event.preventDefault();
        break;
      case 'ArrowRight':
        this.controller.focusAdjacentAction(this.registration, 1);
        event.preventDefault();
        break;
      case 'F6':
        this.controller.focus();
        event.preventDefault();
        break;
      case 'Escape':
        this.controller.focus();
        this.controller.close();
        event.preventDefault();
        event.stopPropagation();
        break;
    }
  }
}

/* ──────────────────────────── Types ──────────────────────────── */

/** How an omnibar item was activated, useful for analytics or branching UX. */
export type HellOmnibarActivationSource = 'mouse' | 'keyboard';

/**
 * Payload emitted after an item selects. `query` is the current query text,
 * `item` is the selected payload, and `source` identifies the activation path.
 */
export interface HellOmnibarSubmitEvent<T = unknown> {
  /** Current query text at the moment of activation. */
  readonly query: string;
  /** Selected item payload. */
  readonly item: T;
  /** How the item was activated. */
  readonly source: HellOmnibarActivationSource;
}

/**
 * Standalone imports for the complete omnibar composition: root, group
 * parts, result items, actions strip, and action button directives. Compose
 * tokens from the public Chip primitives; item chrome (icons, text, subtext,
 * trailing hints) is consumer-owned markup styled with plain classes.
 */
export const HELL_OMNIBAR_IMPORTS = [
  HellOmnibar,
  HellOmnibarGroup,
  HellOmnibarGroupLabel,
  HellOmnibarItem,
  HellOmnibarActionsStrip,
  HellOmnibarAction,
] as const;
