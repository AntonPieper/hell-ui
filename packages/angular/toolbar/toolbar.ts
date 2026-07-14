import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, Directive, ElementRef, NO_ERRORS_SCHEMA, NgZone, TemplateRef, afterNextRender, afterRenderEffect, booleanAttribute, computed, contentChildren, effect, forwardRef, inject, input, output, signal, viewChild } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HELL_MENU_DIRECTIVES } from '@hell-ui/angular/menu';
import { hellCreateLabels, hellPartStyler, type HellButtonVariant, type HellOrientation, type HellRecipe, type HellSize, type HellUi, type HellUiInput } from '@hell-ui/angular/core';
import type { InjectionToken } from '@angular/core';
import {
  hellResolveToolbarOverflow,
  type HellToolbarOverflowItem,
  type HellToolbarOverflowMetrics,
  type HellToolbarOverflowResult,
} from './toolbar-overflow';

/**
 * How a toolbar action participates in responsive overflow:
 *
 *   - `primary`      never overflows; it always renders inline as a button.
 *   - `default`      renders inline while it fits and collapses into the
 *                    overflow menu (last-declared first) when space runs out.
 *   - `overflowOnly` never renders inline; it always lives in the overflow menu.
 */
export type HellToolbarActionPriority = 'primary' | 'default' | 'overflowOnly';

/**
 * The kind of a declared toolbar item.
 *
 *   - `action`    a dual-rendered button/menu-item (see {@link HellToolbarAction}).
 *   - `separator` a group divider that renders inline and as a menu separator.
 *   - `widget`    projected content that stays inline and never menu-ifies.
 */
export type HellToolbarItemKind = 'action' | 'separator' | 'widget';

/** Built-in accessibility labels owned by the toolbar entry point. */
export interface HellToolbarLabels {
  /** Accessible name for the trailing button that opens the overflow menu. */
  readonly overflowTrigger: string;
}

/** Injection token resolving to the effective toolbar labels. */
export const HELL_TOOLBAR_LABELS: InjectionToken<HellToolbarLabels> = hellCreateLabels<HellToolbarLabels>('HELL_TOOLBAR_LABELS', {
  overflowTrigger: 'More actions',
});

/** Public parts of the HellToolbar module, styleable through its Part Style Map. */
export type HellToolbarPart =
  | 'root'
  | 'action'
  | 'separator'
  | 'widget'
  | 'overflowTrigger'
  | 'overflowMenu'
  | 'overflowItem'
  | 'overflowSeparator';
/** Part Style Map accepted by the HellToolbar `ui` input. */
export type HellToolbarUi = HellUi<HellToolbarPart>;



/**
 * Base marker for the three kinds of declared toolbar item. Each concrete
 * directive registers itself under this token so the toolbar can query actions,
 * separators, and widgets together in declaration order.
 */
abstract class HellToolbarItem {
  /** Discriminates the item kind for the toolbar's rendering and overflow logic. */
  abstract readonly kind: HellToolbarItemKind;
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
  providers: [{ provide: HellToolbarItem, useExisting: forwardRef(() => HellToolbarAction) }],
})
export class HellToolbarAction extends HellToolbarItem {
  /** Discriminates this item as a dual-rendered action. */
  override readonly kind = 'action' as const;
  /** Accessible, human-readable label. Rendered as button text and menu-item text. */
  readonly label = input.required<string>();
  /** Whether the action is disabled in both renderings. Defaults to `false`. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Overflow priority. Defaults to `'default'`. */
  readonly priority = input<HellToolbarActionPriority>('default');
  /** Inline button variant. Ignored by the overflow menu-item rendering. Defaults to `'default'`. */
  readonly variant = input<HellButtonVariant>('default');
  /**
   * Renders the inline button as an icon-only Hell button: the `label` becomes
   * the button's accessible name (`aria-label`) and native `title` tooltip, and
   * the visible text is hidden. The overflow menu item always shows the label.
   * Defaults to `false`.
   */
  readonly iconOnly = input(false, { transform: booleanAttribute });
  /** Emits when the action is activated from either rendering. */
  readonly activated = output<void>();

  /** The projected icon template, rendered before the label in both renderings. */
  readonly icon = inject<TemplateRef<unknown>>(TemplateRef);
}

/**
 * A group divider between toolbar actions, declared on an `<ng-template>`. It
 * renders as an inline vertical divider between two visible groups and as a menu
 * separator between two overflowed groups; separators that would sit at an edge
 * or double up collapse away. Separators also make collapse group-aware: each
 * trailing group between separators overflows as a unit (see
 * {@link hellResolveToolbarOverflow}).
 */
@Directive({
  selector: 'ng-template[hellToolbarSeparator]',
  providers: [{ provide: HellToolbarItem, useExisting: forwardRef(() => HellToolbarSeparator) }],
})
export class HellToolbarSeparator extends HellToolbarItem {
  /** Discriminates this item as a group divider. */
  override readonly kind = 'separator' as const;
}

/**
 * Projected arbitrary content — a search field, select, toggle group, etc. —
 * declared on an `<ng-template>`. A widget participates in toolbar layout and
 * the roving tab order but never collapses into the overflow menu (it is
 * primary-like) and never menu-ifies. This is the honest boundary: things that
 * can menu-ify are actions; things that cannot are widgets that stay visible.
 */
@Directive({
  selector: 'ng-template[hellToolbarWidget]',
  providers: [{ provide: HellToolbarItem, useExisting: forwardRef(() => HellToolbarWidget) }],
})
export class HellToolbarWidget extends HellToolbarItem {
  /** Discriminates this item as never-collapsing projected content. */
  override readonly kind = 'widget' as const;
  /** The projected content template rendered inline in the toolbar. */
  readonly content = inject<TemplateRef<unknown>>(TemplateRef);
}

/** A resolved toolbar item paired with its declaration index and group. */
type HellToolbarItemModel =
  | { readonly kind: 'action'; readonly index: number; readonly group: number; readonly action: HellToolbarAction }
  | { readonly kind: 'separator'; readonly index: number; readonly group: number }
  | { readonly kind: 'widget'; readonly index: number; readonly group: number; readonly widget: HellToolbarWidget };

const HELL_TOOLBAR_RECIPE = {
  root: 'relative flex w-full min-w-0 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch',
  action: '',
  separator:
    'shrink-0 self-stretch bg-hell-border data-[orientation=vertical]:w-px data-[orientation=vertical]:mx-hell-1 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:my-hell-1',
  widget: 'flex shrink-0 items-center',
  overflowTrigger: '',
  overflowMenu: '',
  overflowItem: '',
  overflowSeparator: '',
} satisfies HellRecipe<HellToolbarPart>;

const DEFAULT_GAP = 8;
const DEFAULT_TRIGGER_WIDTH = 40;
const COLLAPSED_METRICS: HellToolbarOverflowMetrics = {
  available: 0,
  gap: DEFAULT_GAP,
  triggerWidth: DEFAULT_TRIGGER_WIDTH,
};

/**
 * A responsive action toolbar following the WAI-ARIA toolbar pattern. Consumers
 * declare each action once with a `hellToolbarAction` template — plus optional
 * `hellToolbarSeparator` group dividers and `hellToolbarWidget` projected
 * controls — and the toolbar renders the items that fit as inline Hell controls
 * and collapses the rest into a trailing overflow menu (the Hell menu). Overflow
 * membership is recalculated from a container-driven `ResizeObserver` — measured
 * against an off-screen sizing row and committed once per resize frame — so no
 * action is ever unreachable at any width and container growth never feeds a
 * stale zero width back into the policy. A roving tabindex spans the visible
 * controls and the overflow trigger, giving the toolbar a single tab stop with
 * arrow-key navigation; when the focused action collapses out of the row, focus
 * moves to the overflow trigger rather than dropping to the document body.
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
    <ng-template #actionInner let-action="action">
      @if (action.icon) {
        <ng-container [ngTemplateOutlet]="action.icon" />
      }
      @if (!action.iconOnly()) {
        <span class="hell-toolbar-action-label">{{ action.label() }}</span>
      }
    </ng-template>

    <div #actionsRow class="hell-toolbar-actions" data-hell-toolbar-actions>
      @for (view of inlineViews(); track view.index) {
        @switch (view.kind) {
          @case ('action') {
            @let action = actionOf(view);
            <button
              hellButton
              type="button"
              data-slot="action"
              data-hell-toolbar-control
              tabindex="-1"
              [attr.data-item-index]="view.index"
              [variant]="action.variant()"
              [size]="size()"
              [iconOnly]="action.iconOnly()"
              [disabled]="action.disabled()"
              [ui]="part('action')"
              [attr.aria-label]="action.iconOnly() ? action.label() : null"
              [attr.title]="action.iconOnly() ? action.label() : null"
              (click)="activate(action)"
            >
              <ng-container [ngTemplateOutlet]="actionInner" [ngTemplateOutletContext]="{ action }" />
            </button>
          }
          @case ('separator') {
            <span
              data-slot="separator"
              role="separator"
              [class]="part('separator')"
              [attr.data-orientation]="separatorOrientation()"
              [attr.aria-orientation]="separatorOrientation()"
            ></span>
          }
          @case ('widget') {
            <div
              data-slot="widget"
              data-hell-toolbar-widget
              [attr.data-item-index]="view.index"
              [class]="part('widget')"
            >
              <ng-container [ngTemplateOutlet]="widgetOf(view).content" />
            </div>
          }
        }
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
          [attr.aria-label]="effectiveOverflowLabel()"
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

    <!-- Off-screen sizing row: every collapsible item at its natural inline
         width, so the policy always has fresh widths regardless of what is
         currently visible. Inert and aria-hidden, so it never reaches focus or
         the accessibility tree. -->
    <div #measureRow class="hell-toolbar-measure" aria-hidden="true" inert>
      @for (view of measureViews(); track view.index) {
        @switch (view.kind) {
          @case ('action') {
            @let action = actionOf(view);
            <button
              hellButton
              type="button"
              tabindex="-1"
              class="hell-toolbar-measure-item"
              [attr.data-item-index]="view.index"
              [variant]="action.variant()"
              [size]="size()"
              [iconOnly]="action.iconOnly()"
              [ui]="part('action')"
            >
              <ng-container [ngTemplateOutlet]="actionInner" [ngTemplateOutletContext]="{ action }" />
            </button>
          }
          @case ('separator') {
            <span
              class="hell-toolbar-measure-item"
              [class]="part('separator')"
              [attr.data-item-index]="view.index"
              [attr.data-orientation]="separatorOrientation()"
            ></span>
          }
        }
      }
    </div>

    <ng-template #overflowMenu>
      <div hellMenu data-slot="overflowMenu" [ui]="part('overflowMenu')">
        @for (view of overflowViews(); track view.index) {
          @switch (view.kind) {
            @case ('action') {
              @let action = actionOf(view);
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
            @case ('separator') {
              <div hellMenuSeparator data-slot="overflowSeparator" [ui]="part('overflowSeparator')"></div>
            }
          }
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
  /**
   * Accessible label for the overflow trigger button. When left empty (the
   * default) it falls back to the toolbar Label Contract's `overflowTrigger`
   * string (`HELL_TOOLBAR_LABELS`), so the English default lives in the
   * contract rather than a hardcoded input value.
   */
  readonly overflowLabel = input('');

  /** All declared items (actions, separators, widgets) in declaration order. */
  private readonly declaredItems = contentChildren(HellToolbarItem);

  private readonly labels = inject(HELL_TOOLBAR_LABELS);
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly actionsRow = viewChild<ElementRef<HTMLElement>>('actionsRow');
  private readonly measureRow = viewChild<ElementRef<HTMLElement>>('measureRow');

  /**
   * The committed overflow resolution, or `null` before the first measurement.
   * While `null` the toolbar starts collapsed to its pinned items (primaries
   * and widgets), so first paint never flashes a clipped, over-full row.
   */
  private readonly committed = signal<HellToolbarOverflowResult | null>(null);
  /** Cached inline widths keyed by declaration index; a measured zero is ignored. */
  private readonly widths = new Map<number, number>();
  private triggerWidth = DEFAULT_TRIGGER_WIDTH;
  private activeIndex = 0;
  private lastFocusedControl: HTMLElement | null = null;

  /** Declared items paired with their declaration index and separator group. */
  protected readonly itemModels = computed<readonly HellToolbarItemModel[]>(() => {
    let group = 0;
    return this.declaredItems().map((item, index): HellToolbarItemModel => {
      if (item instanceof HellToolbarAction) {
        return { kind: 'action', index, group, action: item };
      }
      if (item instanceof HellToolbarWidget) {
        return { kind: 'widget', index, group, widget: item };
      }
      const separator: HellToolbarItemModel = { kind: 'separator', index, group };
      group += 1;
      return separator;
    });
  });

  /** Overflow resolution driving the render: committed measurement, else collapsed-to-pinned. */
  private readonly resolution = computed<HellToolbarOverflowResult>(
    () => this.committed() ?? this.collapsedResolution(),
  );

  /** Items rendered inline, in declaration order. */
  protected readonly inlineViews = computed<readonly HellToolbarItemModel[]>(() =>
    this.viewsFor(this.resolution().inline),
  );

  /** Items rendered in the overflow menu, in declaration order. */
  protected readonly overflowViews = computed<readonly HellToolbarItemModel[]>(() =>
    this.viewsFor(this.resolution().overflow),
  );

  /** Collapsible items rendered off-screen for width measurement (never widgets). */
  protected readonly measureViews = computed<readonly HellToolbarItemModel[]>(() =>
    this.itemModels().filter((model) => model.kind !== 'widget'),
  );

  /** Whether the overflow trigger and menu are rendered. */
  protected readonly showOverflow = computed(() =>
    this.overflowViews().some((view) => view.kind === 'action'),
  );

  /** Axis of an inline separator: perpendicular to the toolbar's own axis. */
  protected readonly separatorOrientation = computed<HellOrientation>(() =>
    this.orientation() === 'vertical' ? 'horizontal' : 'vertical',
  );

  /** The resolved overflow-trigger label: the input override, else the contract default. */
  protected readonly effectiveOverflowLabel = computed(
    () => this.overflowLabel() || this.labels.overflowTrigger,
  );

  constructor() {
    afterNextRender(() => this.setupObserver());

    // Re-measure whenever the declared item set changes: reset to the collapsed
    // baseline, then let the next frame commit the resolved layout.
    effect(() => {
      this.declaredItems();
      this.committed.set(null);
      this.scheduleMeasure();
    });

    // Keep exactly one control in the tab order after every layout commit, and
    // rescue focus if the focused action just collapsed out of the row.
    afterRenderEffect(() => {
      this.inlineViews();
      this.overflowViews();
      this.syncRovingTabindex();
      this.restoreFocusAfterCollapse();
    });
  }

  /** Emits the action's activation output from either rendering. */
  protected activate(action: HellToolbarAction): void {
    if (action.disabled()) return;
    action.activated.emit();
  }

  /** Narrows a view model to its action; only called from the `action` branch. */
  protected actionOf(view: HellToolbarItemModel): HellToolbarAction {
    return (view as Extract<HellToolbarItemModel, { kind: 'action' }>).action;
  }

  /** Narrows a view model to its widget; only called from the `widget` branch. */
  protected widgetOf(view: HellToolbarItemModel): HellToolbarWidget {
    return (view as Extract<HellToolbarItemModel, { kind: 'widget' }>).widget;
  }

  private viewsFor(indices: readonly number[]): readonly HellToolbarItemModel[] {
    const models = this.itemModels();
    const views: HellToolbarItemModel[] = [];
    for (const index of indices) {
      const model = models[index];
      if (model) views.push(model);
    }
    return views;
  }

  private policyItems(): HellToolbarOverflowItem[] {
    return this.itemModels().map((model) => ({
      kind: model.kind,
      priority: model.kind === 'action' ? model.action.priority() : undefined,
      width: this.widths.get(model.index) ?? 0,
      group: model.group,
    }));
  }

  /** Baseline resolution before the first measurement: everything collapsible overflows. */
  private collapsedResolution(): HellToolbarOverflowResult {
    return hellResolveToolbarOverflow(this.policyItems(), COLLAPSED_METRICS);
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
   * Measures the off-screen sizing row and resolves overflow. Runs outside
   * Angular; the resolved membership is committed back inside the zone only when
   * it changes, so one resize frame produces at most one change-detection pass.
   */
  private measure(): void {
    const row = this.actionsRow()?.nativeElement;
    const view = this.host.ownerDocument.defaultView;
    if (!view || !row || !row.isConnected) return;

    // Overflow collapsing is a horizontal concern; a vertical toolbar keeps
    // every action inline (except overflowOnly) and relies on surrounding
    // layout to scroll, so it resolves against an unbounded width.
    const horizontal = this.orientation() !== 'vertical';
    const available = horizontal ? row.clientWidth : Number.MAX_SAFE_INTEGER;
    if (horizontal && available <= 0) return;

    const gap = this.measureGap(view, row);
    this.cacheWidths(row);

    const trigger = row.querySelector<HTMLElement>('[data-slot="overflowTrigger"]');
    if (trigger) this.triggerWidth = trigger.getBoundingClientRect().width || this.triggerWidth;

    const resolution = hellResolveToolbarOverflow(this.policyItems(), {
      available,
      gap,
      triggerWidth: this.triggerWidth,
    });
    this.commit(resolution);
  }

  /** Refreshes cached widths from the sizing row (actions + separators) and live widgets. */
  private cacheWidths(row: HTMLElement): void {
    const measureRow = this.measureRow()?.nativeElement;
    const record = (element: HTMLElement): void => {
      const index = Number(element.getAttribute('data-item-index'));
      if (!Number.isInteger(index)) return;
      const width = element.getBoundingClientRect().width;
      // Ignore a transient zero so container growth never feeds width-0 into the
      // policy; the last non-zero width stays cached until re-measured.
      if (width > 0) this.widths.set(index, width);
    };

    if (measureRow) {
      measureRow
        .querySelectorAll<HTMLElement>('[data-item-index]')
        .forEach(record);
    }
    // Widgets are never in the sizing row (their content may have side effects);
    // they are always inline, so measure them where they render.
    row
      .querySelectorAll<HTMLElement>('[data-hell-toolbar-widget][data-item-index]')
      .forEach(record);
  }

  /** Commits a resolved membership inside the zone, only when it changed. */
  private commit(next: HellToolbarOverflowResult): void {
    const current = this.committed();
    if (current && sameResolution(current, next)) return;
    this.zone.run(() => this.committed.set(next));
  }

  private measureGap(view: Window, row: HTMLElement): number {
    const raw = view.getComputedStyle(row).columnGap;
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : DEFAULT_GAP;
  }

  /** The roving-focus controls in DOM order: action buttons, widgets, overflow trigger. */
  private focusableControls(): HTMLElement[] {
    const row = this.actionsRow()?.nativeElement;
    if (!row) return [];

    const nodes = row.querySelectorAll<HTMLElement>(
      '[data-hell-toolbar-control], [data-hell-toolbar-widget]',
    );
    const controls: HTMLElement[] = [];
    for (const node of Array.from(nodes)) {
      if (node.hasAttribute('data-hell-toolbar-widget')) {
        const focusable = this.firstFocusable(node);
        if (focusable) controls.push(focusable);
      } else if (!node.hasAttribute('disabled')) {
        controls.push(node);
      }
    }
    return controls;
  }

  /** The first focusable element inside a widget, resolved independently of roving tabindex. */
  private firstFocusable(container: HTMLElement): HTMLElement | null {
    const formControl = container.querySelector<HTMLElement>(
      'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href]',
    );
    return formControl ?? container.querySelector<HTMLElement>('[tabindex]');
  }

  private syncRovingTabindex(): void {
    const controls = this.focusableControls();
    if (!controls.length) return;

    // The tab stop follows real focus: when a membership commit re-renders the
    // row while a control is focused, its positional index may have shifted, so
    // a stale activeIndex would hand the tab stop to a different control than
    // the one the user is actually on.
    const active = this.host.ownerDocument.activeElement;
    const focusedIndex = controls.findIndex(
      (control) => control === active || control.contains(active),
    );
    this.activeIndex =
      focusedIndex >= 0
        ? focusedIndex
        : Math.min(Math.max(this.activeIndex, 0), controls.length - 1);
    controls.forEach((control, index) =>
      control.setAttribute('tabindex', index === this.activeIndex ? '0' : '-1'),
    );
  }

  /** Moves focus to the overflow trigger when the focused control collapsed out of the row. */
  private restoreFocusAfterCollapse(): void {
    const previous = this.lastFocusedControl;
    if (!previous || previous.isConnected) return;

    const doc = this.host.ownerDocument;
    const active = doc.activeElement;
    // Only rescue focus if it fell to the body because our control was removed.
    if (active && active !== doc.body && active !== doc.documentElement) return;

    const controls = this.focusableControls();
    const trigger =
      this.actionsRow()?.nativeElement.querySelector<HTMLElement>('[data-slot="overflowTrigger"]') ??
      null;
    const target = trigger ?? controls[controls.length - 1] ?? null;
    if (!target) return;

    const index = controls.indexOf(target);
    if (index >= 0) this.activeIndex = index;
    this.lastFocusedControl = target;
    target.focus();
    this.syncRovingTabindex();
  }

  /** Moves the roving focus across visible controls per the APG toolbar pattern. */
  protected onKeydown(event: KeyboardEvent): void {
    // Interactive widgets (text fields, selects, editable regions) own their own
    // keys; leave the toolbar's arrow/Home/End roving to non-editable controls.
    if (this.isEditableTarget(this.host.ownerDocument.activeElement)) return;

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
    this.lastFocusedControl = controls[target];
    controls[target].focus();
    this.syncRovingTabindex();
  }

  private isEditableTarget(element: unknown): boolean {
    if (!(element instanceof HTMLElement)) return false;
    const tag = element.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    return element.isContentEditable;
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
    this.lastFocusedControl = controls[index];
    this.syncRovingTabindex();
  }
}

/** Structural equality for two resolved memberships. */
function sameResolution(a: HellToolbarOverflowResult, b: HellToolbarOverflowResult): boolean {
  return sameOrder(a.inline, b.inline) && sameOrder(a.overflow, b.overflow);
}

function sameOrder(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return false;
  return true;
}

/**
 * Standalone imports for the complete toolbar API: the toolbar, its action, and
 * the separator and widget declarations.
 */
export const HELL_TOOLBAR_DIRECTIVES = [
  HellToolbar,
  HellToolbarAction,
  HellToolbarSeparator,
  HellToolbarWidget,
] as const;
