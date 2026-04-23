import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  booleanAttribute,
  computed,
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
import { HellIcon } from '../icon/icon';

/**
 * Wrappers around `ng-primitives/pagination`. Two ways to use:
 *
 *   1. Compose with the `[hellPagination*]` directives on plain `<button>`
 *      elements. Apply `hell-pagination-item` for the styled circular
 *      buttons. Useful when you want full control over the layout.
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
  host: { '[class.hell-pagination]': '!unstyled()' },
})
export class HellPagination {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: 'button[hellPaginationFirst], a[hellPaginationFirst]',
  hostDirectives: [NgpPaginationFirst],
  host: {
    '[class.hell-button]': '!unstyled()',
    '[class.hell-pagination-item]': '!unstyled()',
    '[attr.data-variant]': '"ghost"',
    '[attr.data-icon-only]': '""',
  },
})
export class HellPaginationFirst {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: 'button[hellPaginationPrev], a[hellPaginationPrev]',
  hostDirectives: [NgpPaginationPrevious],
  host: {
    '[class.hell-button]': '!unstyled()',
    '[class.hell-pagination-item]': '!unstyled()',
    '[attr.data-variant]': '"ghost"',
    '[attr.data-icon-only]': '""',
  },
})
export class HellPaginationPrev {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: 'button[hellPaginationNext], a[hellPaginationNext]',
  hostDirectives: [NgpPaginationNext],
  host: {
    '[class.hell-button]': '!unstyled()',
    '[class.hell-pagination-item]': '!unstyled()',
    '[attr.data-variant]': '"ghost"',
    '[attr.data-icon-only]': '""',
  },
})
export class HellPaginationNext {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: 'button[hellPaginationLast], a[hellPaginationLast]',
  hostDirectives: [NgpPaginationLast],
  host: {
    '[class.hell-button]': '!unstyled()',
    '[class.hell-pagination-item]': '!unstyled()',
    '[attr.data-variant]': '"ghost"',
    '[attr.data-icon-only]': '""',
  },
})
export class HellPaginationLast {
  readonly unstyled = input(false, { transform: booleanAttribute });
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
    '[class.hell-button]': '!unstyled()',
    '[class.hell-pagination-item]': '!unstyled()',
    '[attr.data-variant]': '"ghost"',
    '[attr.data-icon-only]': '""',
  },
})
export class HellPaginationButton {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

/**
 * Ready-made pagination strip. Numbered buttons are clamped to a sliding
 * window of `siblingCount * 2 + 1` around the active page.
 */
@Component({
  selector: 'hell-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellIcon,
    HellPaginationFirst,
    HellPaginationPrev,
    HellPaginationNext,
    HellPaginationLast,
    HellPaginationButton,
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
    '[class.hell-pagination]': '!unstyled()',
    role: 'navigation',
    'aria-label': 'Pagination',
  },
  template: `
    <button hellPaginationFirst type="button" aria-label="First page">
      <hell-icon name="faSolidAnglesLeft" />
    </button>
    <button hellPaginationPrev type="button" aria-label="Previous page">
      <hell-icon name="faSolidChevronLeft" />
    </button>
    @for (p of pages(); track p) {
      <button hellPaginationButton [page]="p" type="button" [attr.aria-label]="'Page ' + p">
        {{ p }}
      </button>
    }
    <button hellPaginationNext type="button" aria-label="Next page">
      <hell-icon name="faSolidChevronRight" />
    </button>
    <button hellPaginationLast type="button" aria-label="Last page">
      <hell-icon name="faSolidAnglesRight" />
    </button>
  `,
})
export class HellPaginationStrip {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly siblingCount = input<number>(2);

  private readonly state = injectPaginationState();

  protected readonly pages = computed(() => {
    const total = this.state().pageCount();
    const current = this.state().page();
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
