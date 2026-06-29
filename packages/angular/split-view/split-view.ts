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
import { HellPartStyleable, type HellRecipe, type HellUi } from '@hell-ui/angular/core';
import { HellResizable, HellResizableHandle, HellResizablePane } from '@hell-ui/angular/resizable';

export type HellSplitViewPart =
  | 'root'
  | 'resizable'
  | 'screen'
  | 'pane'
  | 'compactHeader'
  | 'detailHeader'
  | 'itemNavigation';
export type HellSplitViewUi = HellUi<HellSplitViewPart>;

const HELL_SPLIT_VIEW_RECIPE = {
  root: 'h-full w-full',
  resizable: 'h-full w-full',
  screen: 'flex h-full w-full flex-col',
  pane: 'flex min-h-0 min-w-0 flex-col overflow-hidden',
  compactHeader: 'gap-hell-2 border-hell-border bg-hell-surface-subtle p-hell-2',
  detailHeader: 'gap-hell-2 border-hell-border bg-hell-surface-subtle p-hell-2',
  itemNavigation: 'gap-hell-1',
} satisfies HellRecipe<HellSplitViewPart>;

/** Primary pane template for `hell-split-view`; receives `{ compact, detailOpen }`. */
@Directive({
  selector: 'ng-template[hellSplitPrimary]',
})
export class HellSplitPrimary {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

/** Detail pane template for `hell-split-view`; receives `{ compact, detailOpen }`. */
@Directive({
  selector: 'ng-template[hellSplitDetail]',
})
export class HellSplitDetail {
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
            <button hellButton variant="ghost" size="sm" type="button" (click)="closeDetail()">
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
export class HellSplitView extends HellPartStyleable<HellSplitViewPart> {
  protected readonly recipe = HELL_SPLIT_VIEW_RECIPE;
  protected readonly defaultUiPart = 'root';

  readonly compactBelow = input(720, { transform: numberAttribute });
  readonly detailOpen = input(false, { transform: booleanAttribute });
  readonly framed = input(false, { transform: booleanAttribute });
  readonly backLabel = input('Back');
  readonly primaryFlex = input(3, { transform: numberAttribute });
  readonly detailFlex = input(2, { transform: numberAttribute });
  readonly primaryMinSize = input(320, { transform: numberAttribute });
  readonly detailMinSize = input(260, { transform: numberAttribute });
  readonly height = input<string | number | null>(null);
  readonly itemNavigation = input(false, { transform: booleanAttribute });
  readonly itemNavigationLabel = input('Item navigation');
  readonly previousItemLabel = input('Previous item');
  readonly nextItemLabel = input('Next item');
  readonly previousItemDisabled = input(false, { transform: booleanAttribute });
  readonly nextItemDisabled = input(false, { transform: booleanAttribute });

  readonly detailOpenChange = output<boolean>();
  readonly previousItem = output<void>();
  readonly nextItem = output<void>();

  protected readonly primaryTemplate = contentChild(HellSplitPrimary);
  protected readonly detailTemplate = contentChild(HellSplitDetail);

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly destroyRef = inject(DestroyRef);
  private readonly inlineSize = signal(0);

  protected readonly isCompact = computed(() => {
    const breakpoint = this.compactBelow();
    return breakpoint > 0 && this.inlineSize() > 0 && this.inlineSize() < breakpoint;
  });

  protected readonly templateContext = computed(() => ({
    compact: this.isCompact(),
    detailOpen: this.detailOpen(),
  }));
  protected readonly heightValue = computed(() => {
    const value = this.height();
    if (value == null || value === '') return null;
    if (typeof value === 'number') return `${value}px`;

    const trimmed = value.trim();
    return /^-?\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed;
  });

  constructor() {
    super();
    const update = () => this.inlineSize.set(this.host.clientWidth);
    queueMicrotask(update);

    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      const size = entries[0]?.contentRect.width ?? this.host.clientWidth;
      this.inlineSize.set(size);
    });
    observer.observe(this.host);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  protected closeDetail(): void {
    this.detailOpenChange.emit(false);
  }

  protected itemNavigationPageCount(): number {
    if (this.previousItemDisabled() && this.nextItemDisabled()) return 1;
    return this.previousItemDisabled() || this.nextItemDisabled() ? 2 : 3;
  }

  protected itemNavigationPage(): number {
    if (this.previousItemDisabled()) return 1;
    if (this.nextItemDisabled()) return this.itemNavigationPageCount();
    return 2;
  }

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

export const HELL_SPLIT_VIEW_DIRECTIVES = [
  HellSplitView,
  HellSplitPrimary,
  HellSplitDetail,
] as const;
