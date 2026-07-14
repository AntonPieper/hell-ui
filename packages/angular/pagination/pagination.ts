import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  signal,
  type InjectionToken,
} from '@angular/core';
import { NgpPagination, injectPaginationState } from 'ng-primitives/pagination';
import { ngpButton } from 'ng-primitives/button';
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
}

/** Injection token resolving to the effective pagination labels. */
export const HELL_PAGINATION_LABELS: InjectionToken<HellPaginationLabels> =
  hellCreateLabels<HellPaginationLabels>('HELL_PAGINATION_LABELS', {
    navigation: 'Pagination',
    firstPage: 'First page',
    previousPage: 'Previous page',
    nextPage: 'Next page',
    lastPage: 'Last page',
    page: (page) => `Page ${page}`,
  });

/** Public parts of the HellPaginationStrip module, styleable through its Part Style Map. */
export type HellPaginationStripPart = 'root' | 'control' | 'controlGlyph';
/** Part Style Map accepted by the HellPaginationStrip `ui` input. */
export type HellPaginationStripUi = HellUi<HellPaginationStripPart>;

const HELL_PAGINATION_RECIPE = {
  root: 'inline-flex flex-wrap items-center gap-hell-1',
} satisfies HellRecipe<'root'>;

const HELL_PAGINATION_CONTROL_ROOT_RECIPE =
  'inline-flex h-hell-control-sm min-w-[var(--spacing-hell-control-sm)] cursor-pointer select-none items-center justify-center gap-hell-2 whitespace-nowrap rounded-hell-md border border-transparent bg-transparent px-hell-3 font-[inherit] text-xs font-medium leading-none text-hell-foreground transition-[background-color,border-color,color,box-shadow] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] data-hover:bg-hell-surface-muted data-press:bg-hell-surface-muted data-focus-visible:outline-2 data-focus-visible:outline-hell-focus-ring data-focus-visible:outline-offset-1 data-disabled:cursor-not-allowed data-disabled:opacity-[0.45] data-selected:border-hell-primary data-selected:bg-hell-primary data-selected:text-hell-primary-foreground data-selected:font-semibold';

const HELL_PAGE_LINK_RECIPE = {
  root: HELL_PAGINATION_CONTROL_ROOT_RECIPE,
} satisfies HellRecipe<'root'>;

const HELL_PAGINATION_STRIP_RECIPE = {
  root: HELL_PAGINATION_RECIPE.root,
  control: '',
  controlGlyph: 'inline-flex min-w-[1em] items-center justify-center text-base leading-none',
} satisfies HellRecipe<HellPaginationStripPart>;

interface HellPaginationNativeControl {
  nativeButtonType(): 'button' | null;
  preventDisabledAnchor(event: Event, disabled: boolean): void;
}

function injectPaginationNativeControl(): HellPaginationNativeControl {
  const host = inject(ElementRef<HTMLElement>).nativeElement;
  const isButton = () => host.tagName.toLowerCase() === 'button';
  const isAnchor = () => host.tagName.toLowerCase() === 'a';

  return {
    nativeButtonType: () => (isButton() ? 'button' : null),
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
 *   1. Compose the `[hellPagination]` state directive with `hellPageLink`
 *      controls on plain `<button>`/`<a>` elements. Each `hellPageLink` targets
 *      a boundary (`first`/`previous`/`next`/`last`) or a page number, and
 *      exposes a local `root` part through `[ui]`. Useful when you want full
 *      control over the layout.
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
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_PAGINATION_RECIPE,
  });
}

/** Navigation target of a `hellPageLink`: a boundary keyword or a 1-based page number. */
export type HellPageLinkTarget = 'first' | 'previous' | 'next' | 'last' | number;

/**
 * Turns a `<button>` or `<a>` into a single pagination control. `hellPageLink`
 * selects the target: a boundary keyword (`first`/`previous`/`next`/`last`) or a
 * 1-based page number. Reads the shared `[hellPagination]` state to derive the
 * boundary-aware disabled state, the numbered selected state, and navigation.
 */
@Directive({
  selector: 'button[hellPageLink], a[hellPageLink]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.type]': 'native.nativeButtonType()',
    '[attr.data-variant]': '"ghost"',
    '[attr.data-icon-only]': '""',
    '[attr.tabindex]': 'controlDisabled() ? -1 : 0',
    '[attr.aria-current]': 'ariaCurrent()',
    '[attr.data-selected]': 'dataSelected()',
    '(click)': 'onClick($event)',
    '(keydown.enter)': 'activate($event)',
    '(keydown.space)': 'activate($event)',
  },
})
export class HellPageLink {
  /** The page this control navigates to: a boundary keyword or a 1-based page number. */
  readonly hellPageLink = input.required<HellPageLinkTarget>({ alias: 'hellPageLink' });
  /** Explicit disable, layered on top of the boundary state derived from the pagination. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_PAGE_LINK_RECIPE,
  });
  /** Host-tag-aware native control helpers (button `type`, disabled-anchor guard). */
  protected readonly native = injectPaginationNativeControl();
  private readonly state = injectPaginationState();

  /**
   * Whether this control is disabled: an explicit `disabled`, the pagination's
   * own disabled state, or a boundary (first/previous on page 1, next/last on
   * the last page). Numbered targets are never boundary-disabled.
   */
  protected readonly controlDisabled = computed(() => {
    const target = this.hellPageLink();
    const state = this.state();
    if (this.disabled() || state.disabled()) return true;
    if (target === 'first' || target === 'previous') return state.firstPage();
    if (target === 'next' || target === 'last') return state.lastPage();
    return false;
  });

  /**
   * `ngpButton` wires the shared interaction contract (hover/press/focus-visible
   * data attributes, plus the native `disabled`/`aria-disabled` state), matching
   * the five directives this replaces. It reads this plain mirror signal — never
   * the required `hellPageLink` input directly — so its eager setup cannot touch
   * the input before Angular binds it. An effect keeps the mirror in sync with
   * the boundary-aware disabled state.
   */
  private readonly ngpDisabled = signal(false);
  private readonly interactions = ngpButton({ disabled: this.ngpDisabled });

  /** Whether a numbered target equals the current page. */
  private readonly selected = computed(() => {
    const target = this.hellPageLink();
    return typeof target === 'number' && target === this.state().page();
  });

  /** `aria-current` for numbered targets (`true`/`false`); absent on boundary controls. */
  protected readonly ariaCurrent = computed(() =>
    typeof this.hellPageLink() === 'number' ? this.selected() : null,
  );

  /** `data-selected` marker driving the selected recipe styling on the current page. */
  protected readonly dataSelected = computed(() => (this.selected() ? '' : null));

  /** Keyboard (Enter/Space) activation handler that navigates to this control's target. */
  protected readonly activate = paginationKeyboardActivation(
    this.native,
    this.controlDisabled,
    () => this.navigate(),
  );

  constructor() {
    // Runs during change detection (inputs bound), before `ngpButton`'s
    // after-render effects, so the mirror is current when they read it.
    effect(() => this.ngpDisabled.set(this.controlDisabled()));
  }

  /** Pointer activation: guard disabled anchors, otherwise navigate to the target. */
  protected onClick(event: Event): void {
    if (this.controlDisabled()) {
      this.native.preventDisabledAnchor(event, true);
      return;
    }
    this.navigate();
  }

  /** Navigate the shared pagination state to this control's target. */
  private navigate(): void {
    const target = this.hellPageLink();
    const state = this.state();
    switch (target) {
      case 'first':
        state.goToPage(1);
        break;
      case 'previous':
        state.goToPage(state.page() - 1);
        break;
      case 'next':
        state.goToPage(state.page() + 1);
        break;
      case 'last':
        state.goToPage(state.pageCount());
        break;
      default:
        state.goToPage(target);
    }
  }
}

/**
 * Ready-made numbered pagination strip: first/prev/pages/next/last. Numbered
 * buttons are clamped to a sliding window of `siblingCount * 2 + 1` around the
 * active page. Compact previous/next and page-jump forms are documented
 * recipes composed from `[hellPagination]` + `hellPageLink`.
 */
@Component({
  selector: 'hell-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellPageLink],
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
    '[attr.aria-label]': 'labels.navigation',
    role: 'navigation',
  },
  template: `
    <button
      hellPageLink="first"
      type="button"
      data-slot="control"
      [ui]="controlUi()"
      [attr.aria-label]="labels.firstPage"
    >
      <span data-slot="controlGlyph" [class]="part('controlGlyph')" aria-hidden="true">
        &laquo;
      </span>
    </button>
    <button
      hellPageLink="previous"
      type="button"
      data-slot="control"
      [ui]="controlUi()"
      [attr.aria-label]="labels.previousPage"
    >
      <span data-slot="controlGlyph" [class]="part('controlGlyph')" aria-hidden="true">
        &lsaquo;
      </span>
    </button>
    @for (p of pages(); track trackPage($index, p)) {
      <button
        [hellPageLink]="p"
        type="button"
        data-slot="control"
        [ui]="controlUi()"
        [attr.aria-label]="labels.page(p)"
      >
        {{ p }}
      </button>
    }
    <button
      hellPageLink="next"
      type="button"
      data-slot="control"
      [ui]="controlUi()"
      [attr.aria-label]="labels.nextPage"
    >
      <span data-slot="controlGlyph" [class]="part('controlGlyph')" aria-hidden="true">
        &rsaquo;
      </span>
    </button>
    <button
      hellPageLink="last"
      type="button"
      data-slot="control"
      [ui]="controlUi()"
      [attr.aria-label]="labels.lastPage"
    >
      <span data-slot="controlGlyph" [class]="part('controlGlyph')" aria-hidden="true">
        &raquo;
      </span>
    </button>
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

  /** Effective accessibility labels for the strip's controls. */
  protected readonly labels = inject(HELL_PAGINATION_LABELS);

  private readonly state = injectPaginationState();

  /** `@for` track function keying rendered pages by page number. */
  protected readonly trackPage = (_: number, page: number) => page;

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

  /** Part Style Map forwarded to each rendered `[hellPagination*]` control button. */
  protected controlUi(): { root: string } {
    return { root: this.part('control') };
  }
}

/** All HellPagination directives and components, for convenient bulk import. */
export const HELL_PAGINATION_DIRECTIVES = [
  HellPagination,
  HellPageLink,
  HellPaginationStrip,
] as const;
