import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  NO_ERRORS_SCHEMA,
  NgZone,
  TemplateRef,
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HELL_MENU_DIRECTIVES } from '@hell-ui/angular/menu';
import {
  hellPartStyler,
  type HellButtonVariant,
  type HellOrientation,
  type HellRecipe,
  type HellSize,
  type HellUi,
  type HellUiInput,
} from '@hell-ui/angular/core';

/**
 * How a toolbar action participates in responsive overflow:
 *
 *   - `primary`      never overflows; it always renders inline as a button.
 *   - `default`      renders inline while it fits and collapses into the
 *                    overflow menu (last-declared first) when space runs out.
 *   - `overflowOnly` never renders inline; it always lives in the overflow menu.
 */
export type HellToolbarActionPriority = 'primary' | 'default' | 'overflowOnly';

/** Public parts of the HellToolbar module, styleable through its Part Style Map. */
export type HellToolbarPart =
  | 'root'
  | 'action'
  | 'overflowTrigger'
  | 'overflowMenu'
  | 'overflowItem';
/** Part Style Map accepted by the HellToolbar `ui` input. */
export type HellToolbarUi = HellUi<HellToolbarPart>;

/** One action's inputs to the priority-based overflow policy. */
export interface HellToolbarOverflowItem {
  /** How the action participates in overflow. */
  readonly priority: HellToolbarActionPriority;
  /** Measured inline width of the action's button, in pixels. */
  readonly width: number;
}

/** Geometry inputs to the priority-based overflow policy. */
export interface HellToolbarOverflowMetrics {
  /** Available inline size of the actions row, in pixels. */
  readonly available: number;
  /** Gap between adjacent controls, in pixels. */
  readonly gap: number;
  /** Reserved width of the overflow trigger button, in pixels. */
  readonly triggerWidth: number;
}

/** The result of resolving overflow: which declared indices render where. */
export interface HellToolbarOverflowResult {
  /** Declared indices rendered inline as buttons, in declaration order. */
  readonly inline: readonly number[];
  /** Declared indices rendered in the overflow menu, in declaration order. */
  readonly overflow: readonly number[];
}

/**
 * Resolves which actions render inline and which collapse into the overflow
 * menu, honoring the priority policy: `primary` never overflows, `overflowOnly`
 * never renders inline, and `default` actions overflow from the last-declared
 * first until the inline row (plus a reserved overflow trigger) fits
 * `available`. This is the pure core of the toolbar's measurement loop and is
 * exported so the policy can be unit-tested without a DOM.
 */
export function hellResolveToolbarOverflow(
  items: readonly HellToolbarOverflowItem[],
  metrics: HellToolbarOverflowMetrics,
): HellToolbarOverflowResult {
  const indexed = items.map((item, index) => ({ ...item, index }));
  const eligible = indexed.filter((item) => item.priority !== 'overflowOnly');
  const primaries = eligible.filter((item) => item.priority === 'primary');
  const defaults = eligible.filter((item) => item.priority === 'default');
  const hasOverflowOnly = indexed.some((item) => item.priority === 'overflowOnly');

  const fits = (visibleDefaults: number): boolean => {
    const shown = [...primaries, ...defaults.slice(0, visibleDefaults)];
    const willOverflow = visibleDefaults < defaults.length || hasOverflowOnly;
    const controlCount = shown.length + (willOverflow ? 1 : 0);
    const widthSum = shown.reduce((sum, item) => sum + item.width, 0);
    const gaps = Math.max(0, controlCount - 1) * metrics.gap;
    const reserve = willOverflow ? metrics.triggerWidth : 0;
    return widthSum + gaps + reserve <= metrics.available;
  };

  let visibleDefaults = defaults.length;
  while (visibleDefaults > 0 && !fits(visibleDefaults)) visibleDefaults -= 1;

  const visibleDefaultIndices = new Set(
    defaults.slice(0, visibleDefaults).map((item) => item.index),
  );

  const inline: number[] = [];
  const overflow: number[] = [];
  for (const item of indexed) {
    if (item.priority === 'overflowOnly') {
      overflow.push(item.index);
    } else if (item.priority === 'primary' || visibleDefaultIndices.has(item.index)) {
      inline.push(item.index);
    } else {
      overflow.push(item.index);
    }
  }

  return { inline, overflow };
}

/**
 * A single toolbar action, declared once on an `<ng-template>` and rendered by
 * `HellToolbar` in one of two ways depending on available width: as an inline
 * Hell button, or as an item in the trailing overflow menu. The template's
 * projected content is the action's optional leading icon; `label`, `disabled`,
 * and `priority` stay identical between both renderings.
 */
@Directive({
  selector: 'ng-template[hellToolbarAction]',
})
export class HellToolbarAction {
  /** Accessible, human-readable label. Rendered as button text and menu-item text. */
  readonly label = input.required<string>();
  /** Whether the action is disabled in both renderings. Defaults to `false`. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Overflow priority. Defaults to `'default'`. */
  readonly priority = input<HellToolbarActionPriority>('default');
  /** Inline button variant. Ignored by the overflow menu-item rendering. Defaults to `'default'`. */
  readonly variant = input<HellButtonVariant>('default');
  /** Emits when the action is activated from either rendering. */
  readonly activated = output<void>();

  /** The projected icon template, rendered before the label in both renderings. */
  readonly icon = inject<TemplateRef<unknown>>(TemplateRef);
}

const HELL_TOOLBAR_RECIPE = {
  root: 'flex w-full min-w-0 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch',
  action: '',
  overflowTrigger: '',
  overflowMenu: '',
  overflowItem: '',
} satisfies HellRecipe<HellToolbarPart>;

const DEFAULT_GAP = 8;
const DEFAULT_TRIGGER_WIDTH = 40;

/**
 * A responsive action toolbar following the WAI-ARIA toolbar pattern. Consumers
 * declare each action once with a `hellToolbarAction` template; the toolbar
 * renders the actions that fit as inline Hell buttons and collapses the rest
 * into a trailing overflow menu (the Hell menu). Overflow membership is
 * recalculated from a container-driven `ResizeObserver` — measured and computed
 * outside change detection and committed once per resize frame — so no action
 * is ever unreachable at any width. A roving tabindex spans the visible actions
 * and the overflow trigger, giving the toolbar a single tab stop with arrow-key
 * navigation.
 */
@Component({
  selector: 'hell-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, HellButton, ...HELL_MENU_DIRECTIVES],
  schemas: [NO_ERRORS_SCHEMA],
  host: {
    role: 'toolbar',
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-orientation]': 'orientation()',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-labelledby]': 'labelledBy() || null',
    '(keydown)': 'onKeydown($event)',
    '(focusin)': 'onFocusIn($event)',
  },
  template: `
    <div #actionsRow class="hell-toolbar-actions" data-hell-toolbar-actions>
      @for (action of inlineActions(); track action) {
        <button
          hellButton
          type="button"
          data-slot="action"
          data-hell-toolbar-control
          tabindex="-1"
          [variant]="action.variant()"
          [size]="size()"
          [disabled]="action.disabled()"
          [ui]="part('action')"
          (click)="activate(action)"
        >
          @if (action.icon) {
            <ng-container [ngTemplateOutlet]="action.icon" />
          }
          <span class="hell-toolbar-action-label">{{ action.label() }}</span>
        </button>
      }

      @if (showOverflow()) {
        <button
          hellButton
          type="button"
          variant="ghost"
          iconOnly
          data-slot="overflowTrigger"
          data-hell-toolbar-control
          tabindex="-1"
          [size]="size()"
          [hellMenuTrigger]="overflowMenu"
          [ui]="part('overflowTrigger')"
          [attr.aria-label]="overflowLabel()"
        >
          <span class="hell-toolbar-overflow-glyph" aria-hidden="true">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" focusable="false">
              <circle cx="3" cy="8" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="13" cy="8" r="1.5" />
            </svg>
          </span>
        </button>
      }
    </div>

    <ng-template #overflowMenu>
      <div hellMenu data-slot="overflowMenu" [ui]="part('overflowMenu')">
        @for (action of overflowActions(); track action) {
          <button
            hellMenuItem
            type="button"
            data-slot="overflowItem"
            [disabled]="action.disabled()"
            [ui]="part('overflowItem')"
            (click)="activate(action)"
          >
            @if (action.icon) {
              <span class="hell-toolbar-overflow-item-icon" aria-hidden="true">
                <ng-container [ngTemplateOutlet]="action.icon" />
              </span>
            }
            <span>{{ action.label() }}</span>
          </button>
        }
      </div>
    </ng-template>
  `,
})
export class HellToolbar {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellToolbarPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellToolbarPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TOOLBAR_RECIPE,
  });

  /** Accessible name for the toolbar region. Prefer `label` or `labelledBy`. */
  readonly label = input('');
  /** ID of an element that labels the toolbar, mapped to `aria-labelledby`. */
  readonly labelledBy = input('');
  /** Layout axis and arrow-key direction. Defaults to `'horizontal'`. */
  readonly orientation = input<HellOrientation>('horizontal');
  /** Size applied to inline action buttons and the overflow trigger. Defaults to `'sm'`. */
  readonly size = input<HellSize>('sm');
  /** Accessible label for the overflow trigger button. Defaults to `'More actions'`. */
  readonly overflowLabel = input('More actions');

  /** All declared actions, in declaration order. */
  protected readonly actions = contentChildren(HellToolbarAction);

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly actionsRow = viewChild<ElementRef<HTMLElement>>('actionsRow');

  /**
   * Number of `default`-priority actions that fit inline. Starts effectively
   * unbounded so the first measurement pass can size every action while they
   * are all rendered, then narrows to the resolved count.
   */
  private readonly visibleDefaultCount = signal(Number.MAX_SAFE_INTEGER);
  private readonly widths = new Map<HellToolbarAction, number>();
  private triggerWidth = DEFAULT_TRIGGER_WIDTH;
  private activeIndex = 0;

  /** Actions rendered inline as buttons, in declaration order. */
  protected readonly inlineActions = computed(() => {
    const actions = this.actions();
    const defaults = actions.filter((action) => action.priority() === 'default');
    const visible = new Set(defaults.slice(0, this.visibleDefaultCount()));
    return actions.filter(
      (action) => action.priority() === 'primary' || visible.has(action),
    );
  });

  /** Actions rendered in the overflow menu, in declaration order. */
  protected readonly overflowActions = computed(() => {
    const inline = new Set(this.inlineActions());
    return this.actions().filter(
      (action) => action.priority() !== 'primary' && !inline.has(action),
    );
  });

  /** Whether the overflow trigger and menu are rendered. */
  protected readonly showOverflow = computed(() => this.overflowActions().length > 0);

  constructor() {
    afterNextRender(() => this.setupObserver());

    // Re-measure from scratch whenever the declared action set changes: show
    // every action, then let the next frame narrow the inline row.
    effect(() => {
      this.actions();
      this.widths.clear();
      this.visibleDefaultCount.set(Number.MAX_SAFE_INTEGER);
      this.scheduleMeasure();
    });

    // Keep exactly one control in the tab order after every layout commit.
    afterRenderEffect(() => {
      this.inlineActions();
      this.overflowActions();
      this.syncRovingTabindex();
    });
  }

  /** Emits the action's activation output from either rendering. */
  protected activate(action: HellToolbarAction): void {
    if (action.disabled()) return;
    action.activated.emit();
  }

  private setupObserver(): void {
    const view = this.host.ownerDocument.defaultView;
    const ResizeObserverCtor = view?.ResizeObserver;
    const row = this.actionsRow()?.nativeElement;
    if (!ResizeObserverCtor || !row) return;

    const observer = new ResizeObserverCtor(() =>
      this.zone.runOutsideAngular(() => this.measure()),
    );
    observer.observe(row);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  private scheduleMeasure(): void {
    const view = this.host.ownerDocument.defaultView;
    if (!view) return;

    // Always defer to a later task so the measurement reads a settled DOM and
    // never re-enters the reset effect's reactive context.
    this.zone.runOutsideAngular(() => {
      if (view.requestAnimationFrame) view.requestAnimationFrame(() => this.measure());
      else view.setTimeout(() => this.measure(), 0);
    });
  }

  /**
   * Measures the inline controls and resolves overflow. Runs outside Angular;
   * the resolved inline count is committed back inside the zone only when it
   * changes, so one resize frame produces at most one change-detection pass.
   */
  private measure(): void {
    const row = this.actionsRow()?.nativeElement;
    const view = this.host.ownerDocument.defaultView;
    if (!view || !row || !row.isConnected) return;

    // Overflow collapsing is a horizontal concern; a vertical toolbar keeps
    // every action inline and relies on the surrounding layout to scroll.
    if (this.orientation() === 'vertical') {
      this.commitVisibleDefaults(this.defaultActionCount());
      return;
    }

    const available = row.clientWidth;
    if (available <= 0) return;

    const gap = this.measureGap(view, row);

    // Refresh cached widths for every currently-rendered inline action button.
    const inline = this.inlineActions();
    const buttons = row.querySelectorAll<HTMLElement>('[data-slot="action"]');
    inline.forEach((action, index) => {
      const button = buttons[index];
      if (button) this.widths.set(action, button.getBoundingClientRect().width);
    });

    const trigger = row.querySelector<HTMLElement>('[data-slot="overflowTrigger"]');
    if (trigger) this.triggerWidth = trigger.getBoundingClientRect().width || this.triggerWidth;

    const actions = this.actions();
    const items = actions.map<HellToolbarOverflowItem>((action) => ({
      priority: action.priority(),
      width: this.widths.get(action) ?? 0,
    }));

    const { inline: inlineIndices } = hellResolveToolbarOverflow(items, {
      available,
      gap,
      triggerWidth: this.triggerWidth,
    });

    const inlineSet = new Set(inlineIndices);
    const nextVisibleDefaults = actions.filter(
      (action, index) => action.priority() === 'default' && inlineSet.has(index),
    ).length;

    this.commitVisibleDefaults(nextVisibleDefaults);
  }

  /** Commits a resolved inline-default count inside the zone, only when it changed. */
  private commitVisibleDefaults(next: number): void {
    if (next === this.clampedVisibleDefaultCount()) return;
    this.zone.run(() => this.visibleDefaultCount.set(next));
  }

  private defaultActionCount(): number {
    return this.actions().filter((action) => action.priority() === 'default').length;
  }

  private clampedVisibleDefaultCount(): number {
    return Math.min(this.visibleDefaultCount(), this.defaultActionCount());
  }

  private measureGap(view: Window, row: HTMLElement): number {
    const raw = view.getComputedStyle(row).columnGap;
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : DEFAULT_GAP;
  }

  private focusableControls(): HTMLElement[] {
    const row = this.actionsRow()?.nativeElement;
    if (!row) return [];
    return Array.from(
      row.querySelectorAll<HTMLElement>('[data-hell-toolbar-control]:not([disabled])'),
    );
  }

  private syncRovingTabindex(): void {
    const controls = this.focusableControls();
    if (!controls.length) return;

    this.activeIndex = Math.min(Math.max(this.activeIndex, 0), controls.length - 1);
    controls.forEach((control, index) =>
      control.setAttribute('tabindex', index === this.activeIndex ? '0' : '-1'),
    );
  }

  /** Moves the roving focus across visible controls per the APG toolbar pattern. */
  protected onKeydown(event: KeyboardEvent): void {
    const movement = this.keyboardMovement(event.key);
    if (!movement) return;

    const controls = this.focusableControls();
    if (!controls.length) return;

    const active = this.host.ownerDocument.activeElement;
    const currentIndex = Math.max(
      controls.findIndex((control) => control === active),
      0,
    );

    let target: number;
    if (movement === 'first') target = 0;
    else if (movement === 'last') target = controls.length - 1;
    else {
      const delta = movement === 'next' ? 1 : -1;
      target = (currentIndex + delta + controls.length) % controls.length;
    }

    event.preventDefault();
    this.activeIndex = target;
    controls[target].focus();
    this.syncRovingTabindex();
  }

  private keyboardMovement(key: string): 'next' | 'previous' | 'first' | 'last' | null {
    const horizontal = this.orientation() !== 'vertical';
    if (key === 'Home') return 'first';
    if (key === 'End') return 'last';
    if (key === (horizontal ? 'ArrowRight' : 'ArrowDown')) return 'next';
    if (key === (horizontal ? 'ArrowLeft' : 'ArrowUp')) return 'previous';
    return null;
  }

  /** Tracks the roving tab stop as focus enters a control (Tab, click, or programmatic). */
  protected onFocusIn(event: FocusEvent): void {
    const controls = this.focusableControls();
    const target = event.target as Node | null;
    const index = controls.findIndex(
      (control) => control === target || control.contains(target),
    );
    if (index < 0) return;

    this.activeIndex = index;
    this.syncRovingTabindex();
  }
}

/** Standalone imports for the complete toolbar API: the toolbar and its action. */
export const HELL_TOOLBAR_DIRECTIVES = [HellToolbar, HellToolbarAction] as const;
