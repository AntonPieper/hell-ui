import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  computed,
  inject,
  input,
} from '@angular/core';
import {
  NgpPagination,
  NgpPaginationButton,
  NgpPaginationFirst,
  NgpPaginationLast,
  NgpPaginationNext,
  NgpPaginationPrevious,
  injectPaginationState,
} from 'ng-primitives/pagination';
import { HellNativeSelect } from '@hell-ui/angular/input';
import { type HellLabels, HELL_LABELS } from '@hell-ui/angular/core';
import { HellPartStyleable, type HellRecipe, type HellUi } from '@hell-ui/angular/core';

export type HellPaginationMode = 'pages' | 'previous-next' | 'jump';

export type HellPaginationPart = 'root';
export type HellPaginationUi = HellUi<HellPaginationPart>;

export type HellPaginationFirstPart = 'root';
export type HellPaginationFirstUi = HellUi<HellPaginationFirstPart>;

export type HellPaginationPrevPart = 'root';
export type HellPaginationPrevUi = HellUi<HellPaginationPrevPart>;

export type HellPaginationNextPart = 'root';
export type HellPaginationNextUi = HellUi<HellPaginationNextPart>;

export type HellPaginationLastPart = 'root';
export type HellPaginationLastUi = HellUi<HellPaginationLastPart>;

export type HellPaginationButtonPart = 'root';
export type HellPaginationButtonUi = HellUi<HellPaginationButtonPart>;

export type HellPaginationStripPart =
  | 'root'
  | 'controlGlyph'
  | 'status'
  | 'jump'
  | 'jumpLabel'
  | 'jumpSelect'
  | 'jumpTotal';
export type HellPaginationStripUi = HellUi<HellPaginationStripPart>;

const HELL_PAGINATION_RECIPE = {
  root: 'inline-flex flex-wrap items-center gap-hell-1 data-[mode=jump]:gap-hell-2 data-[mode=previous-next]:gap-hell-2',
} satisfies HellRecipe<HellPaginationPart>;

const HELL_PAGINATION_CONTROL_ROOT_RECIPE =
  'inline-flex h-hell-control-sm min-w-[var(--spacing-hell-control-sm)] cursor-pointer select-none items-center justify-center gap-hell-2 whitespace-nowrap rounded-hell-md border border-transparent bg-transparent px-hell-3 font-[inherit] text-xs font-medium leading-none text-hell-foreground transition-[background-color,border-color,color,box-shadow] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] data-hover:bg-hell-surface-muted data-press:bg-hell-surface-muted data-focus-visible:outline-2 data-focus-visible:outline-hell-focus-ring data-focus-visible:outline-offset-1 data-disabled:cursor-not-allowed data-disabled:opacity-[0.45] data-selected:border-hell-primary data-selected:bg-hell-primary data-selected:text-hell-primary-foreground data-selected:font-semibold';

const HELL_PAGINATION_FIRST_RECIPE = {
  root: HELL_PAGINATION_CONTROL_ROOT_RECIPE,
} satisfies HellRecipe<HellPaginationFirstPart>;

const HELL_PAGINATION_PREV_RECIPE = {
  root: HELL_PAGINATION_CONTROL_ROOT_RECIPE,
} satisfies HellRecipe<HellPaginationPrevPart>;

const HELL_PAGINATION_NEXT_RECIPE = {
  root: HELL_PAGINATION_CONTROL_ROOT_RECIPE,
} satisfies HellRecipe<HellPaginationNextPart>;

const HELL_PAGINATION_LAST_RECIPE = {
  root: HELL_PAGINATION_CONTROL_ROOT_RECIPE,
} satisfies HellRecipe<HellPaginationLastPart>;

const HELL_PAGINATION_BUTTON_RECIPE = {
  root: HELL_PAGINATION_CONTROL_ROOT_RECIPE,
} satisfies HellRecipe<HellPaginationButtonPart>;

const HELL_PAGINATION_STRIP_RECIPE = {
  root: HELL_PAGINATION_RECIPE.root,
  controlGlyph: 'inline-flex min-w-[1em] items-center justify-center text-base leading-none',
  status:
    'inline-flex min-h-hell-control-sm items-center whitespace-nowrap text-xs leading-none text-hell-foreground-muted',
  jump: 'inline-flex min-h-hell-control-sm min-w-0 items-center gap-hell-2 whitespace-nowrap text-xs leading-none text-hell-foreground-muted',
  jumpLabel: 'flex-none',
  jumpSelect: 'min-w-[calc(var(--spacing)*18)] max-w-[calc(var(--spacing)*26)]',
  jumpTotal: 'flex-none',
} satisfies HellRecipe<HellPaginationStripPart>;

interface HellPaginationNativeControl {
  nativeButtonType(): 'button' | null;
  nativeButtonDisabled(disabled: boolean): '' | null;
  anchorAriaDisabled(disabled: boolean): 'true' | null;
  disabledAnchorTabIndex(disabled: boolean): -1 | null;
  preventDisabledAnchor(event: Event, disabled: boolean): void;
}

function injectPaginationNativeControl(): HellPaginationNativeControl {
  const host = inject(ElementRef<HTMLElement>).nativeElement;
  const isButton = () => host.tagName.toLowerCase() === 'button';
  const isAnchor = () => host.tagName.toLowerCase() === 'a';

  return {
    nativeButtonType: () => (isButton() ? 'button' : null),
    nativeButtonDisabled: (disabled) => (isButton() && disabled ? '' : null),
    anchorAriaDisabled: (disabled) => (isAnchor() && disabled ? 'true' : null),
    disabledAnchorTabIndex: (disabled) => (isAnchor() && disabled ? -1 : null),
    preventDisabledAnchor: (event, disabled) => {
      if (!isAnchor() || !disabled) return;

      event.preventDefault();
      event.stopImmediatePropagation();
    },
  };
}

/**
 * Wrappers around `ng-primitives/pagination`. Two ways to use:
 *
 *   1. Compose with the `[hellPagination*]` directives on plain `<button>`
 *      elements. Each directive exposes a local `root` part through `[ui]`.
 *      Useful when you want full control over the layout.
 *
 *   2. Drop in `<hell-pagination>` for a ready-made first/prev/pages/next/last
 *      strip that calls back via `(pageChange)`.
 */
@Directive({
  selector: '[hellPagination]',
  hostDirectives: [
    {
      directive: NgpPagination,
      inputs: [
        'ngpPaginationPage:page',
        'ngpPaginationPageCount:pageCount',
        'ngpPaginationDisabled:disabled',
      ],
      outputs: ['ngpPaginationPageChange:pageChange'],
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellPagination extends HellPartStyleable<HellPaginationPart> {
  protected readonly recipe = HELL_PAGINATION_RECIPE;
  protected readonly defaultUiPart = 'root';
}

@Directive({
  selector: 'button[hellPaginationFirst], a[hellPaginationFirst]',
  hostDirectives: [
    { directive: NgpPaginationFirst, inputs: ['ngpPaginationFirstDisabled:disabled'] },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.type]': 'native.nativeButtonType()',
    '[attr.data-variant]': '"ghost"',
    '[attr.data-icon-only]': '""',
    '[attr.disabled]': 'native.nativeButtonDisabled(disabled())',
    '[attr.aria-disabled]': 'native.anchorAriaDisabled(disabled())',
    '[attr.tabindex]': 'native.disabledAnchorTabIndex(disabled())',
    '(click)': 'native.preventDisabledAnchor($event, disabled())',
    '(keydown.enter)': 'native.preventDisabledAnchor($event, disabled())',
  },
})
export class HellPaginationFirst extends HellPartStyleable<HellPaginationFirstPart> {
  protected readonly recipe = HELL_PAGINATION_FIRST_RECIPE;
  protected readonly defaultUiPart = 'root';
  protected readonly native = injectPaginationNativeControl();
  protected readonly disabled = inject(NgpPaginationFirst).disabled;
}

@Directive({
  selector: 'button[hellPaginationPrev], a[hellPaginationPrev]',
  hostDirectives: [
    { directive: NgpPaginationPrevious, inputs: ['ngpPaginationPreviousDisabled:disabled'] },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.type]': 'native.nativeButtonType()',
    '[attr.data-variant]': '"ghost"',
    '[attr.data-icon-only]': '""',
    '[attr.disabled]': 'native.nativeButtonDisabled(disabled())',
    '[attr.aria-disabled]': 'native.anchorAriaDisabled(disabled())',
    '[attr.tabindex]': 'native.disabledAnchorTabIndex(disabled())',
    '(click)': 'native.preventDisabledAnchor($event, disabled())',
    '(keydown.enter)': 'native.preventDisabledAnchor($event, disabled())',
  },
})
export class HellPaginationPrev extends HellPartStyleable<HellPaginationPrevPart> {
  protected readonly recipe = HELL_PAGINATION_PREV_RECIPE;
  protected readonly defaultUiPart = 'root';
  protected readonly native = injectPaginationNativeControl();
  protected readonly disabled = inject(NgpPaginationPrevious).disabled;
}

@Directive({
  selector: 'button[hellPaginationNext], a[hellPaginationNext]',
  hostDirectives: [
    { directive: NgpPaginationNext, inputs: ['ngpPaginationNextDisabled:disabled'] },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.type]': 'native.nativeButtonType()',
    '[attr.data-variant]': '"ghost"',
    '[attr.data-icon-only]': '""',
    '[attr.disabled]': 'native.nativeButtonDisabled(disabled())',
    '[attr.aria-disabled]': 'native.anchorAriaDisabled(disabled())',
    '[attr.tabindex]': 'native.disabledAnchorTabIndex(disabled())',
    '(click)': 'native.preventDisabledAnchor($event, disabled())',
    '(keydown.enter)': 'native.preventDisabledAnchor($event, disabled())',
  },
})
export class HellPaginationNext extends HellPartStyleable<HellPaginationNextPart> {
  protected readonly recipe = HELL_PAGINATION_NEXT_RECIPE;
  protected readonly defaultUiPart = 'root';
  protected readonly native = injectPaginationNativeControl();
  protected readonly disabled = inject(NgpPaginationNext).disabled;
}

@Directive({
  selector: 'button[hellPaginationLast], a[hellPaginationLast]',
  hostDirectives: [
    { directive: NgpPaginationLast, inputs: ['ngpPaginationLastDisabled:disabled'] },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.type]': 'native.nativeButtonType()',
    '[attr.data-variant]': '"ghost"',
    '[attr.data-icon-only]': '""',
    '[attr.disabled]': 'native.nativeButtonDisabled(disabled())',
    '[attr.aria-disabled]': 'native.anchorAriaDisabled(disabled())',
    '[attr.tabindex]': 'native.disabledAnchorTabIndex(disabled())',
    '(click)': 'native.preventDisabledAnchor($event, disabled())',
    '(keydown.enter)': 'native.preventDisabledAnchor($event, disabled())',
  },
})
export class HellPaginationLast extends HellPartStyleable<HellPaginationLastPart> {
  protected readonly recipe = HELL_PAGINATION_LAST_RECIPE;
  protected readonly defaultUiPart = 'root';
  protected readonly native = injectPaginationNativeControl();
  protected readonly disabled = inject(NgpPaginationLast).disabled;
}

@Directive({
  selector: 'button[hellPaginationButton], a[hellPaginationButton]',
  hostDirectives: [
    {
      directive: NgpPaginationButton,
      inputs: ['ngpPaginationButtonPage:page', 'ngpPaginationButtonDisabled:disabled'],
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.type]': 'native.nativeButtonType()',
    '[attr.data-variant]': '"ghost"',
    '[attr.data-icon-only]': '""',
    '[attr.disabled]': 'native.nativeButtonDisabled(disabled())',
    '[attr.aria-disabled]': 'native.anchorAriaDisabled(disabled())',
    '[attr.tabindex]': 'native.disabledAnchorTabIndex(disabled())',
    '(click)': 'native.preventDisabledAnchor($event, disabled())',
    '(keydown.enter)': 'native.preventDisabledAnchor($event, disabled())',
  },
})
export class HellPaginationButton extends HellPartStyleable<HellPaginationButtonPart> {
  protected readonly recipe = HELL_PAGINATION_BUTTON_RECIPE;
  protected readonly defaultUiPart = 'root';
  protected readonly native = injectPaginationNativeControl();
  protected readonly disabled = inject(NgpPaginationButton).disabled;
}

/**
 * Ready-made pagination strip. Numbered buttons are clamped to a sliding
 * window of `siblingCount * 2 + 1` around the active page. Set `mode` to
 * `previous-next` for a compact previous/next-only control or `jump` for a
 * previous/select/next control.
 */
@Component({
  selector: 'hell-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellPaginationFirst,
    HellPaginationPrev,
    HellPaginationNext,
    HellPaginationLast,
    HellPaginationButton,
    HellNativeSelect,
  ],
  hostDirectives: [
    {
      directive: NgpPagination,
      inputs: [
        'ngpPaginationPage:page',
        'ngpPaginationPageCount:pageCount',
        'ngpPaginationDisabled:disabled',
      ],
      outputs: ['ngpPaginationPageChange:pageChange'],
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-mode]': 'mode()',
    '[attr.aria-label]': 'labels.pagination.navigation',
    role: 'navigation',
  },
  template: `
    @if (mode() === 'pages') {
      <button hellPaginationFirst type="button" [attr.aria-label]="labels.pagination.firstPage">
        <span data-slot="controlGlyph" [class]="part('controlGlyph')" aria-hidden="true">
          &laquo;
        </span>
      </button>
    }
    <button hellPaginationPrev type="button" [attr.aria-label]="labels.pagination.previousPage">
      <span data-slot="controlGlyph" [class]="part('controlGlyph')" aria-hidden="true">
        &lsaquo;
      </span>
    </button>
    @if (mode() === 'pages') {
      @for (p of pages(); track trackPage($index, p)) {
        <button
          hellPaginationButton
          [page]="p"
          type="button"
          [attr.aria-label]="labels.pagination.page(p)"
        >
          {{ p }}
        </button>
      }
    }
    @if (mode() === 'previous-next') {
      <span data-slot="status" [class]="part('status')" aria-live="polite">{{
        pageStatusLabel()
      }}</span>
    }
    @if (mode() === 'jump' && pageCount() > 0) {
      <label data-slot="jump" [class]="part('jump')">
        <span data-slot="jumpLabel" [class]="part('jumpLabel')">{{ pageJumpLabel() }}</span>
        <span data-slot="jumpSelect" [class]="part('jumpSelect')">
          <select
            hellNativeSelect
            size="sm"
            [attr.aria-label]="pageJumpLabel()"
            [value]="currentPage()"
            [disabled]="paginationDisabled() || pageCount() < 2"
            (change)="goToSelectedPage($event)"
          >
            @for (p of pageOptions(); track trackPage($index, p)) {
              <option [value]="p" [selected]="p === currentPage()">{{ p }}</option>
            }
          </select>
        </span>
        <span data-slot="jumpTotal" [class]="part('jumpTotal')">{{ pageTotalLabel() }}</span>
      </label>
    }
    <button hellPaginationNext type="button" [attr.aria-label]="labels.pagination.nextPage">
      <span data-slot="controlGlyph" [class]="part('controlGlyph')" aria-hidden="true">
        &rsaquo;
      </span>
    </button>
    @if (mode() === 'pages') {
      <button hellPaginationLast type="button" [attr.aria-label]="labels.pagination.lastPage">
        <span data-slot="controlGlyph" [class]="part('controlGlyph')" aria-hidden="true">
          &raquo;
        </span>
      </button>
    }
  `,
})
export class HellPaginationStrip extends HellPartStyleable<HellPaginationStripPart> {
  protected readonly recipe = HELL_PAGINATION_STRIP_RECIPE;
  protected readonly defaultUiPart = 'root';

  readonly siblingCount = input<number>(2);
  readonly mode = input<HellPaginationMode>('pages');

  protected readonly labels = inject<HellLabels>(HELL_LABELS);

  private readonly state = injectPaginationState();

  protected readonly trackPage = (_: number, page: number) => page;

  protected readonly pageOptions = computed(() =>
    Array.from({ length: this.pageCount() }, (_, i) => i + 1),
  );

  protected readonly pages = computed(() => {
    const total = this.pageCount();
    const current = this.currentPage();
    const span = this.siblingCount() * 2 + 1;
    if (total <= span) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    let start = Math.max(1, current - this.siblingCount());
    let end = start + span - 1;
    if (end > total) {
      end = total;
      start = end - span + 1;
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  protected currentPage(): number {
    return this.state().page();
  }

  protected pageCount(): number {
    const pageCount = Math.floor(this.state().pageCount());
    return Number.isFinite(pageCount) ? Math.max(0, pageCount) : 0;
  }

  protected paginationDisabled(): boolean {
    return this.state().disabled();
  }

  protected pageStatusLabel(): string {
    return (
      this.labels.pagination.pageStatus?.(this.currentPage(), this.pageCount()) ??
      `Page ${this.currentPage()} of ${this.pageCount()}`
    );
  }

  protected pageJumpLabel(): string {
    return this.labels.pagination.jumpToPage ?? 'Page';
  }

  protected pageTotalLabel(): string {
    return this.labels.pagination.pageTotal?.(this.pageCount()) ?? `of ${this.pageCount()}`;
  }

  protected goToSelectedPage(event: Event): void {
    if (this.paginationDisabled()) return;
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;

    const page = Number.parseInt(target.value, 10);
    if (Number.isFinite(page)) {
      this.state().goToPage(page);
    }
  }
}

export const HELL_PAGINATION_DIRECTIVES = [
  HellPagination,
  HellPaginationFirst,
  HellPaginationPrev,
  HellPaginationNext,
  HellPaginationLast,
  HellPaginationButton,
  HellPaginationStrip,
] as const;
