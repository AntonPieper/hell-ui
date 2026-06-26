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
import { HellStyleable } from '@hell-ui/angular/core';
import { HellResizable, HellResizableHandle, HellResizablePane } from '@hell-ui/angular/resizable';

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
    '[class.hell-split-view]': '!unstyled()',
    '[attr.data-compact]': 'isCompact() ? "true" : null',
    '[attr.data-detail-open]': 'detailOpen() ? "true" : null',
    '[attr.data-framed]': 'framed() ? "true" : null',
    '[style.--hell-split-view-height]': 'heightValue()',
  },
  template: `
    <ng-template #itemNavigationControls>
      @if (itemNavigation()) {
        <nav
          hellPagination
          data-slot="item-navigation"
          [page]="itemNavigationPage()"
          [pageCount]="itemNavigationPageCount()"
          [attr.aria-label]="itemNavigationLabel()"
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
        </nav>
      }
    </ng-template>

    @if (isCompact()) {
      <div data-slot="screen">
        @if (detailOpen()) {
          <div data-slot="compact-header">
            <button hellButton variant="ghost" size="sm" type="button" (click)="closeDetail()">
              <hell-icon [name]="'faSolidArrowLeft'" size="13px" />
              <span>{{ backLabel() }}</span>
            </button>
            <ng-container [ngTemplateOutlet]="itemNavigationControls" />
          </div>
          <div data-slot="pane" data-pane="detail">
            <ng-container
              [ngTemplateOutlet]="detailTemplate()?.template ?? null"
              [ngTemplateOutletContext]="templateContext()"
            />
          </div>
        } @else {
          <div data-slot="pane" data-pane="primary">
            <ng-container
              [ngTemplateOutlet]="primaryTemplate()?.template ?? null"
              [ngTemplateOutletContext]="templateContext()"
            />
          </div>
        }
      </div>
    } @else {
      <div hellResizable orientation="horizontal" data-slot="resizable">
        <div
          hellResizablePane
          data-slot="pane"
          data-pane="primary"
          [initialFlex]="primaryFlex()"
          [minSize]="primaryMinSize()"
        >
          <ng-container
            [ngTemplateOutlet]="primaryTemplate()?.template ?? null"
            [ngTemplateOutletContext]="templateContext()"
          />
        </div>
        <div hellResizableHandle appearance="grip"></div>
        <div
          hellResizablePane
          data-slot="pane"
          data-pane="detail"
          [initialFlex]="detailFlex()"
          [minSize]="detailMinSize()"
        >
          @if (itemNavigation()) {
            <div data-slot="detail-header">
              <ng-container [ngTemplateOutlet]="itemNavigationControls" />
            </div>
          }
          <ng-container
            [ngTemplateOutlet]="detailTemplate()?.template ?? null"
            [ngTemplateOutletContext]="templateContext()"
          />
        </div>
      </div>
    }
  `,
})
export class HellSplitView extends HellStyleable {
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
