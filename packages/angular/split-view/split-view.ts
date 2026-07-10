import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  NO_ERRORS_SCHEMA,
  TemplateRef,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidArrowLeft } from '@ng-icons/font-awesome/solid';
import { HellButton } from '@hell-ui/angular/button';
import { HellIcon } from '@hell-ui/angular/icon';
import {
  HellPagination,
  HellPaginationNext,
  HellPaginationPrev,
} from '@hell-ui/angular/pagination';
import { hellPartStyler, type HellRecipe, type HellUi, type HellUiInput } from '@hell-ui/angular/core';
import { HellResizable, HellResizableHandle, HellResizablePane } from '@hell-ui/angular/resizable';

/** Public parts of the HellSplitView module, styleable through its Part Style Map. */
export type HellSplitViewPart =
  | 'root'
  | 'resizable'
  | 'screen'
  | 'pane'
  | 'compactHeader'
  | 'backButton'
  | 'detailHeader'
  | 'itemNavigation';
/** Part Style Map accepted by the HellSplitView `ui` input. */
export type HellSplitViewUi = HellUi<HellSplitViewPart>;

const HELL_SPLIT_VIEW_RECIPE = {
  root: 'h-full w-full',
  resizable: 'h-full w-full',
  screen: 'flex h-full w-full flex-col',
  pane: 'flex min-h-0 min-w-0 flex-col overflow-hidden',
  compactHeader: 'gap-hell-2 border-hell-border bg-hell-surface-subtle p-hell-2',
  backButton: '',
  detailHeader: 'gap-hell-2 border-hell-border bg-hell-surface-subtle p-hell-2',
  itemNavigation: 'gap-hell-1',
} satisfies HellRecipe<HellSplitViewPart>;

/** Primary pane template for `hell-split-view`; receives `{ compact, detailOpen }`. */
@Directive({
  selector: 'ng-template[hellSplitPrimary]',
})
export class HellSplitPrimary {
  /** The template applied to the primary pane. */
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

/** Detail pane template for `hell-split-view`; receives `{ compact, detailOpen }`. */
@Directive({
  selector: 'ng-template[hellSplitDetail]',
})
export class HellSplitDetail {
  /** The template applied to the detail pane. */
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

/**
 * Master-detail split view. Above `compactBelow`, primary/detail render side by
 * side with a resizable handle. Below it, one pane renders at a time and
 * `detailOpen` becomes the controlled navigation state; back emits
 * `detailOpenChange(false)`. Numeric `height` values are normalized to pixels.
 */
@Component({
  selector: 'hell-split-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    HellButton,
    HellIcon,
    HellPagination,
    HellPaginationPrev,
    HellPaginationNext,
    HellResizable,
    HellResizablePane,
    HellResizableHandle,
  ],
  schemas: [NO_ERRORS_SCHEMA],
  providers: [provideIcons({ faSolidArrowLeft })],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-compact]': 'isCompact() ? "true" : null',
    '[attr.data-detail-open]': 'detailOpen() ? "true" : null',
    '[attr.data-framed]': 'framed() ? "true" : null',
    '[style.--hell-split-view-height]': 'heightValue()',
  },
  template: `
    <ng-template #itemNavigationControls>
      @if (itemNavigation()) {
        <nav
          data-slot="itemNavigation"
          [class]="part('itemNavigation')"
          [attr.aria-label]="itemNavigationLabel()"
        >
          <div
            hellPagination
            [ui]="part('itemNavigation')"
            [page]="itemNavigationPage()"
            [pageCount]="itemNavigationPageCount()"
            (pageChange)="goToItemPage($any($event))"
          >
            <button
              hellPaginationPrev
              type="button"
              [disabled]="previousItemDisabled()"
              [attr.aria-label]="previousItemLabel()"
            >
              <hell-icon [name]="'faSolidArrowLeft'" size="12px" />
            </button>
            <button
              hellPaginationNext
              type="button"
              [disabled]="nextItemDisabled()"
              [attr.aria-label]="nextItemLabel()"
            >
              <hell-icon data-direction="next" [name]="'faSolidArrowLeft'" size="12px" />
            </button>
          </div>
        </nav>
      }
    </ng-template>

    @if (isCompact()) {
      <div data-slot="screen" [class]="part('screen')">
        @if (detailOpen()) {
          <div data-slot="compactHeader" [class]="part('compactHeader')">
            <button
              hellButton
              variant="ghost"
              size="sm"
              type="button"
              data-slot="backButton"
              [ui]="part('backButton')"
              (click)="closeDetail()"
            >
              <hell-icon [name]="'faSolidArrowLeft'" size="13px" />
              <span>{{ backLabel() }}</span>
            </button>
            <ng-container [ngTemplateOutlet]="itemNavigationControls" />
          </div>
          <div data-slot="pane" [class]="part('pane')" data-pane="detail">
            <ng-container
              [ngTemplateOutlet]="detailTemplate()?.template ?? null"
              [ngTemplateOutletContext]="templateContext()"
            />
          </div>
        } @else {
          <div data-slot="pane" [class]="part('pane')" data-pane="primary">
            <ng-container
              [ngTemplateOutlet]="primaryTemplate()?.template ?? null"
              [ngTemplateOutletContext]="templateContext()"
            />
          </div>
        }
      </div>
    } @else {
      <div data-slot="resizable" [class]="part('resizable')">
        <div hellResizable orientation="horizontal">
          <div
            hellResizablePane
            ui="overflow-hidden"
            [initialFlex]="primaryFlex()"
            [minSize]="primaryMinSize()"
          >
            <div data-slot="pane" [class]="part('pane')" data-pane="primary">
              <ng-container
                [ngTemplateOutlet]="primaryTemplate()?.template ?? null"
                [ngTemplateOutletContext]="templateContext()"
              />
            </div>
          </div>
          <div hellResizableHandle appearance="grip"></div>
          <div
            hellResizablePane
            ui="overflow-hidden"
            [initialFlex]="detailFlex()"
            [minSize]="detailMinSize()"
          >
            <div data-slot="pane" [class]="part('pane')" data-pane="detail">
              @if (itemNavigation()) {
                <div data-slot="detailHeader" [class]="part('detailHeader')">
                  <ng-container [ngTemplateOutlet]="itemNavigationControls" />
                </div>
              }
              <ng-container
                [ngTemplateOutlet]="detailTemplate()?.template ?? null"
                [ngTemplateOutletContext]="templateContext()"
              />
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class HellSplitView {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellSplitViewPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellSplitViewPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_SPLIT_VIEW_RECIPE,
  });

  /** Inline size in pixels below which the view switches to compact mode. Defaults to `720`. */
  readonly compactBelow = input(720, { transform: numberAttribute });
  /** Whether the detail pane is shown in compact mode. Defaults to `false`. */
  readonly detailOpen = input(false, { transform: booleanAttribute });
  /** Whether to render the framed appearance. Defaults to `false`. */
  readonly framed = input(false, { transform: booleanAttribute });
  /** Label for the compact-mode back button. Defaults to `'Back'`. */
  readonly backLabel = input('Back');
  /** Initial flex grow factor for the primary pane. Defaults to `3`. */
  readonly primaryFlex = input(3, { transform: numberAttribute });
  /** Initial flex grow factor for the detail pane. Defaults to `2`. */
  readonly detailFlex = input(2, { transform: numberAttribute });
  /** Minimum size in pixels for the primary pane. Defaults to `320`. */
  readonly primaryMinSize = input(320, { transform: numberAttribute });
  /** Minimum size in pixels for the detail pane. Defaults to `260`. */
  readonly detailMinSize = input(260, { transform: numberAttribute });
  /** Fixed height for the view; numbers are normalized to pixels. Defaults to `null` (fill container). */
  readonly height = input<string | number | null>(null);
  /** Whether to render the item navigation controls. Defaults to `false`. */
  readonly itemNavigation = input(false, { transform: booleanAttribute });
  /** Accessible label for the item navigation region. Defaults to `'Item navigation'`. */
  readonly itemNavigationLabel = input('Item navigation');
  /** Accessible label for the previous-item control. Defaults to `'Previous item'`. */
  readonly previousItemLabel = input('Previous item');
  /** Accessible label for the next-item control. Defaults to `'Next item'`. */
  readonly nextItemLabel = input('Next item');
  /** Disables the previous-item control. Defaults to `false`. */
  readonly previousItemDisabled = input(false, { transform: booleanAttribute });
  /** Disables the next-item control. Defaults to `false`. */
  readonly nextItemDisabled = input(false, { transform: booleanAttribute });

  /** Emits the requested `detailOpen` state when the compact back button is pressed. */
  readonly detailOpenChange = output<boolean>();
  /** Emits when the previous-item control is activated. */
  readonly previousItem = output<void>();
  /** Emits when the next-item control is activated. */
  readonly nextItem = output<void>();

  /** The projected `HellSplitPrimary` template, if provided. */
  protected readonly primaryTemplate = contentChild(HellSplitPrimary);
  /** The projected `HellSplitDetail` template, if provided. */
  protected readonly detailTemplate = contentChild(HellSplitDetail);

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly destroyRef = inject(DestroyRef);
  private readonly inlineSize = signal(0);

  /** Whether the view's inline size is currently below `compactBelow`. */
  protected readonly isCompact = computed(() => {
    const breakpoint = this.compactBelow();
    return breakpoint > 0 && this.inlineSize() > 0 && this.inlineSize() < breakpoint;
  });

  /** Context object (`{ compact, detailOpen }`) passed to the primary/detail templates. */
  protected readonly templateContext = computed(() => ({
    compact: this.isCompact(),
    detailOpen: this.detailOpen(),
  }));
  /** Normalized `height` value, in pixels or the given CSS unit, for the host style binding. */
  protected readonly heightValue = computed(() => {
    const value = this.height();
    if (value == null || value === '') return null;
    if (typeof value === 'number') return `${value}px`;

    const trimmed = value.trim();
    return /^-?\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed;
  });

  constructor() {
    const update = () => this.inlineSize.set(this.host.clientWidth);
    queueMicrotask(update);

    // eslint-disable-next-line no-restricted-globals -- SSR feature-detect; ResizeObserver has no injectable seam
    if (typeof ResizeObserver === 'undefined') return;

    // eslint-disable-next-line no-restricted-globals -- guarded by the feature check above
    const observer = new ResizeObserver((entries) => {
      const size = entries[0]?.contentRect.width ?? this.host.clientWidth;
      this.inlineSize.set(size);
    });
    observer.observe(this.host);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  /** Closes the detail pane in compact mode by emitting `detailOpenChange(false)`. */
  protected closeDetail(): void {
    this.detailOpenChange.emit(false);
  }

  /** Number of pages exposed to the item navigation pagination control. */
  protected itemNavigationPageCount(): number {
    if (this.previousItemDisabled() && this.nextItemDisabled()) return 1;
    return this.previousItemDisabled() || this.nextItemDisabled() ? 2 : 3;
  }

  /** Current page reported to the item navigation pagination control. */
  protected itemNavigationPage(): number {
    if (this.previousItemDisabled()) return 1;
    if (this.nextItemDisabled()) return this.itemNavigationPageCount();
    return 2;
  }

  /** Translates a pagination page change into a previous/next item emission. */
  protected goToItemPage(page: number): void {
    const current = this.itemNavigationPage();
    if (page < current) this.goToPreviousItem();
    if (page > current) this.goToNextItem();
  }

  private goToPreviousItem(): void {
    if (!this.previousItemDisabled()) {
      this.previousItem.emit();
    }
  }

  private goToNextItem(): void {
    if (!this.nextItemDisabled()) {
      this.nextItem.emit();
    }
  }
}

/** Standalone imports for the complete split-view API: view, primary, and detail. */
export const HELL_SPLIT_VIEW_DIRECTIVES = [
  HellSplitView,
  HellSplitPrimary,
  HellSplitDetail,
] as const;
