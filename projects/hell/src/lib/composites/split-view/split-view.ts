import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
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
import { HellButton } from '../../primitives/button/button';
import { HellIcon } from '../../primitives/icon/icon';
import { HELL_RESIZABLE_DIRECTIVES } from '../resizable/resizable';

@Directive({
  selector: 'ng-template[hellSplitPrimary]',
})
export class HellSplitPrimary {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

@Directive({
  selector: 'ng-template[hellSplitDetail]',
})
export class HellSplitDetail {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

@Component({
  selector: 'hell-split-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, HellButton, HellIcon, ...HELL_RESIZABLE_DIRECTIVES],
  providers: [provideIcons({ faSolidArrowLeft })],
  host: {
    '[class.hell-split-view]': '!unstyled()',
    '[attr.data-compact]': 'isCompact() ? "true" : null',
    '[attr.data-detail-open]': 'detailOpen() ? "true" : null',
    '[attr.data-framed]': 'framed() ? "true" : null',
    '[style.--hell-split-view-height]': 'heightValue()',
  },
  template: `
    @if (isCompact()) {
      <div data-slot="screen">
        @if (detailOpen()) {
          <div data-slot="compact-header">
            <button hellButton variant="ghost" size="sm" type="button" (click)="closeDetail()">
              <hell-icon name="faSolidArrowLeft" size="13px" />
              <span>{{ backLabel() }}</span>
            </button>
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
          <ng-container
            [ngTemplateOutlet]="detailTemplate()?.template ?? null"
            [ngTemplateOutletContext]="templateContext()"
          />
        </div>
      </div>
    }
  `,
})
export class HellSplitView {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly compactBelow = input(720, { transform: numberAttribute });
  readonly detailOpen = input(false, { transform: booleanAttribute });
  readonly framed = input(false, { transform: booleanAttribute });
  readonly backLabel = input('Back');
  readonly primaryFlex = input(3, { transform: numberAttribute });
  readonly detailFlex = input(2, { transform: numberAttribute });
  readonly primaryMinSize = input(320, { transform: numberAttribute });
  readonly detailMinSize = input(260, { transform: numberAttribute });
  readonly height = input<string | number | null>(null);

  readonly detailOpenChange = output<boolean>();

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
}

export const HELL_SPLIT_VIEW_DIRECTIVES = [
  HellSplitView,
  HellSplitPrimary,
  HellSplitDetail,
] as const;
