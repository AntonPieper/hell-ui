import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  computed,
  inject,
  input,
  type InjectionToken,
  type Provider,
} from '@angular/core';
import {
  NgpPagination,
  NgpPaginationButton,
  NgpPaginationFirst,
  NgpPaginationLast,
  NgpPaginationNext,
  NgpPaginationPrevious,
  injectPaginationButtonState,
  injectPaginationFirstState,
  injectPaginationLastState,
  injectPaginationNextState,
  injectPaginationPreviousState,
  injectPaginationState,
  providePaginationButtonState,
  providePaginationFirstState,
  providePaginationLastState,
  providePaginationNextState,
  providePaginationPreviousState,
} from 'ng-primitives/pagination';
import { HellNativeSelect, type HellNativeSelectUi } from '@hell-ui/angular/input';
import { hellCreateLabels } from '@hell-ui/angular/core';
import { hellPartStyler, type HellRecipe, type HellUi, type HellUiInput } from '@hell-ui/angular/core';

/** Built-in accessibility labels owned by the pagination entry point. */
export interface HellPaginationLabels {
  /** Accessible label for the pagination navigation landmark. */
  readonly navigation: string;
  /** Accessible label for the first-page control. */
  readonly firstPage: string;
  /** Accessible label for the previous-page control. */
  readonly previousPage: string;
  /** Accessible label for the next-page control. */
  readonly nextPage: string;
  /** Accessible label for the last-page control. */
  readonly lastPage: string;
  /** Accessible label for a numbered page button. */
  readonly page: (page: number) => string;
  /** Status text announcing the current page in `previous-next` mode. */
  readonly pageStatus?: (page: number, pageCount: number) => string;
  /** Label for the page-jump select in `jump` mode. */
  readonly jumpToPage?: string;
  /** Trailing text showing the total page count in `jump` mode. */
  readonly pageTotal?: (pageCount: number) => string;
}

const HELL_PAGINATION_LABEL_CONTRACT = hellCreateLabels<HellPaginationLabels>(
  'HELL_PAGINATION_LABELS',
  {
    navigation: 'Pagination',
    firstPage: 'First page',
    previousPage: 'Previous page',
    nextPage: 'Next page',
    lastPage: 'Last page',
    page: (page) => `Page ${page}`,
    pageStatus: (page, pageCount) => `Page ${page} of ${pageCount}`,
    jumpToPage: 'Page',
    pageTotal: (pageCount) => `of ${pageCount}`,
  },
);

/** Injection token resolving to the effective pagination labels. */
export const HELL_PAGINATION_LABELS: InjectionToken<HellPaginationLabels> =
  HELL_PAGINATION_LABEL_CONTRACT.token;

/** Override any subset of the pagination labels for an injector scope. */
export function provideHellPaginationLabels(
  overrides: Partial<HellPaginationLabels>,
): Provider {
  return HELL_PAGINATION_LABEL_CONTRACT.provide(overrides);
}

/** Layout variant of the `HellPaginationStrip`: full page buttons, a compact previous/next control, or a page-jump select. */
export type HellPaginationMode = 'pages' | 'previous-next' | 'jump';

/** Public parts of the HellPagination module, styleable through its Part Style Map. */
export type HellPaginationPart = 'root';
/** Part Style Map accepted by the HellPagination `ui` input. */
export type HellPaginationUi = HellUi<HellPaginationPart>;

/** Public parts of the HellPaginationFirst module, styleable through its Part Style Map. */
export type HellPaginationFirstPart = 'root';
/** Part Style Map accepted by the HellPaginationFirst `ui` input. */
export type HellPaginationFirstUi = HellUi<HellPaginationFirstPart>;

/** Public parts of the HellPaginationPrev module, styleable through its Part Style Map. */
export type HellPaginationPrevPart = 'root';
/** Part Style Map accepted by the HellPaginationPrev `ui` input. */
export type HellPaginationPrevUi = HellUi<HellPaginationPrevPart>;

/** Public parts of the HellPaginationNext module, styleable through its Part Style Map. */
export type HellPaginationNextPart = 'root';
/** Part Style Map accepted by the HellPaginationNext `ui` input. */
export type HellPaginationNextUi = HellUi<HellPaginationNextPart>;

/** Public parts of the HellPaginationLast module, styleable through its Part Style Map. */
export type HellPaginationLastPart = 'root';
/** Part Style Map accepted by the HellPaginationLast `ui` input. */
export type HellPaginationLastUi = HellUi<HellPaginationLastPart>;

/** Public parts of the HellPaginationButton module, styleable through its Part Style Map. */
export type HellPaginationButtonPart = 'root';
/** Part Style Map accepted by the HellPaginationButton `ui` input. */
export type HellPaginationButtonUi = HellUi<HellPaginationButtonPart>;

/** Public parts of the HellPaginationStrip module, styleable through its Part Style Map. */
export type HellPaginationStripPart =
  | 'root'
  | 'controlGlyph'
  | 'status'
  | 'jump'
  | 'jumpLabel'
  | 'jumpSelect'
  | 'jumpTotal';
/** Part Style Map accepted by the HellPaginationStrip `ui` input. */
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
 * ng-primitives >= 0.123 registers its pagination `keydown.enter`/`keydown.space`
 * handlers as literal DOM event names, so keyboard activation never reaches
 * them. Hell keeps Enter/Space activation (with the anchor guard and without
 * double-firing native click synthesis) through Angular host listeners until
 * upstream restores it.
 */
function paginationKeyboardActivation(
  native: HellPaginationNativeControl,
  disabled: () => boolean,
  action: () => void,
): (event: Event) => void {
  return (event) => {
    if (disabled()) {
      native.preventDisabledAnchor(event, true);
      return;
    }
    event.preventDefault();
    action();
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
export class HellPagination {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellPaginationPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellPaginationPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_PAGINATION_RECIPE,
  });
}

/** Directive turning a `<button>` or `<a>` into the first-page pagination control. */
@Directive({
  selector: 'button[hellPaginationFirst], a[hellPaginationFirst]',
  hostDirectives: [
    { directive: NgpPaginationFirst, inputs: ['ngpPaginationFirstDisabled:disabled'] },
  ],
  providers: [providePaginationFirstState()],
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
    '(keydown.enter)': 'activate($event)',
    '(keydown.space)': 'activate($event)',
  },
})
export class HellPaginationFirst {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellPaginationFirstPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellPaginationFirstPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_PAGINATION_FIRST_RECIPE,
  });
  /** Host-tag-aware native control helpers (button vs. anchor attributes and guards). */
  protected readonly native = injectPaginationNativeControl();
  private readonly state = injectPaginationFirstState();
  /** Whether this control is currently disabled by pagination state. */
  protected readonly disabled = computed(() => this.state().disabled());
  /** Keyboard (Enter/Space) activation handler that navigates to the first page. */
  protected readonly activate = paginationKeyboardActivation(this.native, this.disabled, () =>
    this.state().goToFirstPage(),
  );
}

/** Directive turning a `<button>` or `<a>` into the previous-page pagination control. */
@Directive({
  selector: 'button[hellPaginationPrev], a[hellPaginationPrev]',
  hostDirectives: [
    { directive: NgpPaginationPrevious, inputs: ['ngpPaginationPreviousDisabled:disabled'] },
  ],
  providers: [providePaginationPreviousState()],
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
    '(keydown.enter)': 'activate($event)',
    '(keydown.space)': 'activate($event)',
  },
})
export class HellPaginationPrev {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellPaginationPrevPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellPaginationPrevPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_PAGINATION_PREV_RECIPE,
  });
  /** Host-tag-aware native control helpers (button vs. anchor attributes and guards). */
  protected readonly native = injectPaginationNativeControl();
  private readonly state = injectPaginationPreviousState();
  /** Whether this control is currently disabled by pagination state. */
  protected readonly disabled = computed(() => this.state().disabled());
  /** Keyboard (Enter/Space) activation handler that navigates to the previous page. */
  protected readonly activate = paginationKeyboardActivation(this.native, this.disabled, () =>
    this.state().goToPreviousPage(),
  );
}

/** Directive turning a `<button>` or `<a>` into the next-page pagination control. */
@Directive({
  selector: 'button[hellPaginationNext], a[hellPaginationNext]',
  hostDirectives: [
    { directive: NgpPaginationNext, inputs: ['ngpPaginationNextDisabled:disabled'] },
  ],
  providers: [providePaginationNextState()],
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
    '(keydown.enter)': 'activate($event)',
    '(keydown.space)': 'activate($event)',
  },
})
export class HellPaginationNext {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellPaginationNextPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellPaginationNextPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_PAGINATION_NEXT_RECIPE,
  });
  /** Host-tag-aware native control helpers (button vs. anchor attributes and guards). */
  protected readonly native = injectPaginationNativeControl();
  private readonly state = injectPaginationNextState();
  /** Whether this control is currently disabled by pagination state. */
  protected readonly disabled = computed(() => this.state().disabled());
  /** Keyboard (Enter/Space) activation handler that navigates to the next page. */
  protected readonly activate = paginationKeyboardActivation(this.native, this.disabled, () =>
    this.state().goToNextPage(),
  );
}

/** Directive turning a `<button>` or `<a>` into the last-page pagination control. */
@Directive({
  selector: 'button[hellPaginationLast], a[hellPaginationLast]',
  hostDirectives: [
    { directive: NgpPaginationLast, inputs: ['ngpPaginationLastDisabled:disabled'] },
  ],
  providers: [providePaginationLastState()],
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
    '(keydown.enter)': 'activate($event)',
    '(keydown.space)': 'activate($event)',
  },
})
export class HellPaginationLast {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellPaginationLastPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellPaginationLastPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_PAGINATION_LAST_RECIPE,
  });
  /** Host-tag-aware native control helpers (button vs. anchor attributes and guards). */
  protected readonly native = injectPaginationNativeControl();
  private readonly state = injectPaginationLastState();
  /** Whether this control is currently disabled by pagination state. */
  protected readonly disabled = computed(() => this.state().disabled());
  /** Keyboard (Enter/Space) activation handler that navigates to the last page. */
  protected readonly activate = paginationKeyboardActivation(this.native, this.disabled, () =>
    this.state().goToLastPage(),
  );
}

/** Directive turning a `<button>` or `<a>` into a numbered page pagination control. */
@Directive({
  selector: 'button[hellPaginationButton], a[hellPaginationButton]',
  hostDirectives: [
    {
      directive: NgpPaginationButton,
      inputs: ['ngpPaginationButtonPage:page', 'ngpPaginationButtonDisabled:disabled'],
    },
  ],
  providers: [providePaginationButtonState()],
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
    '(keydown.enter)': 'activate($event)',
    '(keydown.space)': 'activate($event)',
  },
})
export class HellPaginationButton {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellPaginationButtonPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellPaginationButtonPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_PAGINATION_BUTTON_RECIPE,
  });
  /** Host-tag-aware native control helpers (button vs. anchor attributes and guards). */
  protected readonly native = injectPaginationNativeControl();
  private readonly state = injectPaginationButtonState();
  /** Whether this control is currently disabled by pagination state. */
  protected readonly disabled = computed(() => this.state().disabled());
  /** Keyboard (Enter/Space) activation handler that navigates to this button's page. */
  protected readonly activate = paginationKeyboardActivation(this.native, this.disabled, () =>
    this.state().goToPage(),
  );
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
    '[attr.aria-label]': 'labels.navigation',
    role: 'navigation',
  },
  template: `
    @if (mode() === 'pages') {
      <button hellPaginationFirst type="button" [attr.aria-label]="labels.firstPage">
        <span data-slot="controlGlyph" [class]="part('controlGlyph')" aria-hidden="true">
          &laquo;
        </span>
      </button>
    }
    <button hellPaginationPrev type="button" [attr.aria-label]="labels.previousPage">
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
          [attr.aria-label]="labels.page(p)"
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
        <select
          hellNativeSelect
          data-slot="jumpSelect"
          size="sm"
          [ui]="jumpSelectUi()"
          [attr.aria-label]="pageJumpLabel()"
          [value]="currentPage()"
          [disabled]="paginationDisabled() || pageCount() < 2"
          (change)="goToSelectedPage($event)"
        >
          @for (p of pageOptions(); track trackPage($index, p)) {
            <option [value]="p" [selected]="p === currentPage()">{{ p }}</option>
          }
        </select>
        <span data-slot="jumpTotal" [class]="part('jumpTotal')">{{ pageTotalLabel() }}</span>
      </label>
    }
    <button hellPaginationNext type="button" [attr.aria-label]="labels.nextPage">
      <span data-slot="controlGlyph" [class]="part('controlGlyph')" aria-hidden="true">
        &rsaquo;
      </span>
    </button>
    @if (mode() === 'pages') {
      <button hellPaginationLast type="button" [attr.aria-label]="labels.lastPage">
        <span data-slot="controlGlyph" [class]="part('controlGlyph')" aria-hidden="true">
          &raquo;
        </span>
      </button>
    }
  `,
})
export class HellPaginationStrip {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellPaginationStripPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellPaginationStripPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_PAGINATION_STRIP_RECIPE,
  });

  /** Number of page buttons to show on each side of the active page. Defaults to `2`. */
  readonly siblingCount = input<number>(2);
  /** Layout variant of the strip. Defaults to `pages`. */
  readonly mode = input<HellPaginationMode>('pages');

  /** Effective accessibility labels for the strip's controls. */
  protected readonly labels = inject(HELL_PAGINATION_LABELS);

  private readonly state = injectPaginationState();

  /** `@for` track function keying rendered pages by page number. */
  protected readonly trackPage = (_: number, page: number) => page;

  /** All page numbers (1…pageCount), used to populate the jump select. */
  protected readonly pageOptions = computed(() =>
    Array.from({ length: this.pageCount() }, (_, i) => i + 1),
  );

  /** Windowed page numbers to render as buttons, clamped around the active page. */
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

  /** The currently active page number. */
  protected currentPage(): number {
    return this.state().page();
  }

  /** The total number of pages, floored and clamped to a non-negative integer. */
  protected pageCount(): number {
    const pageCount = Math.floor(this.state().pageCount());
    return Number.isFinite(pageCount) ? Math.max(0, pageCount) : 0;
  }

  /** Whether pagination is currently disabled. */
  protected paginationDisabled(): boolean {
    return this.state().disabled();
  }

  /** Status text announcing the current page, used in `previous-next` mode. */
  protected pageStatusLabel(): string {
    return (
      this.labels.pageStatus?.(this.currentPage(), this.pageCount()) ??
      `Page ${this.currentPage()} of ${this.pageCount()}`
    );
  }

  /** Label for the page-jump select, used in `jump` mode. */
  protected pageJumpLabel(): string {
    return this.labels.jumpToPage ?? 'Page';
  }

  /** Trailing total-page text shown next to the jump select. */
  protected pageTotalLabel(): string {
    return this.labels.pageTotal?.(this.pageCount()) ?? `of ${this.pageCount()}`;
  }

  /** Part Style Map forwarded to the embedded `hellNativeSelect` jump control. */
  protected jumpSelectUi(): HellNativeSelectUi {
    return { root: this.part('jumpSelect') };
  }

  /** Navigate to the page chosen in the jump select. */
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

/** All HellPagination directives and components, for convenient bulk import. */
export const HELL_PAGINATION_DIRECTIVES = [
  HellPagination,
  HellPaginationFirst,
  HellPaginationPrev,
  HellPaginationNext,
  HellPaginationLast,
  HellPaginationButton,
  HellPaginationStrip,
] as const;
