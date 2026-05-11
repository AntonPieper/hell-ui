import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  computed,
  inject,
  input,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidAnglesLeft,
  faSolidAnglesRight,
  faSolidChevronLeft,
  faSolidChevronRight,
} from '@ng-icons/font-awesome/solid';
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
import { HELL_LABELS } from '../../core/labels';
import { HellStyleable } from '../../core/styleable';
import { HellNativeInteractiveDisabledGuard } from '../../core/native-interactive-disabled';

const HELL_PAGINATION_ICONS = {
  faSolidAnglesLeft,
  faSolidAnglesRight,
  faSolidChevronLeft,
  faSolidChevronRight,
};

abstract class HellPaginationDisabledGuard extends HellNativeInteractiveDisabledGuard {}

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
export class HellPagination extends HellStyleable {}

@Directive({
  selector: 'button[hellPaginationFirst], a[hellPaginationFirst]',
  hostDirectives: [
    { directive: NgpPaginationFirst, inputs: ['ngpPaginationFirstDisabled:disabled'] },
  ],
  host: {
    '[class.hell-button]': '!unstyled()',
    '[class.hell-pagination-item]': '!unstyled()',
    '[attr.type]': 'nativeButtonType()',
    '[attr.data-variant]': '"ghost"',
    '[attr.data-icon-only]': '""',
    '[attr.disabled]': 'nativeButtonDisabled(disabled())',
    '[attr.aria-disabled]': 'anchorAriaDisabled(disabled())',
    '[attr.tabindex]': 'disabledAnchorTabIndex(disabled())',
    '(click)': 'preventDisabledAnchor($event, disabled())',
    '(keydown.enter)': 'preventDisabledAnchor($event, disabled())',
  },
})
export class HellPaginationFirst extends HellPaginationDisabledGuard {
  protected readonly disabled = inject(NgpPaginationFirst).disabled;
}

@Directive({
  selector: 'button[hellPaginationPrev], a[hellPaginationPrev]',
  hostDirectives: [
    { directive: NgpPaginationPrevious, inputs: ['ngpPaginationPreviousDisabled:disabled'] },
  ],
  host: {
    '[class.hell-button]': '!unstyled()',
    '[class.hell-pagination-item]': '!unstyled()',
    '[attr.type]': 'nativeButtonType()',
    '[attr.data-variant]': '"ghost"',
    '[attr.data-icon-only]': '""',
    '[attr.disabled]': 'nativeButtonDisabled(disabled())',
    '[attr.aria-disabled]': 'anchorAriaDisabled(disabled())',
    '[attr.tabindex]': 'disabledAnchorTabIndex(disabled())',
    '(click)': 'preventDisabledAnchor($event, disabled())',
    '(keydown.enter)': 'preventDisabledAnchor($event, disabled())',
  },
})
export class HellPaginationPrev extends HellPaginationDisabledGuard {
  protected readonly disabled = inject(NgpPaginationPrevious).disabled;
}

@Directive({
  selector: 'button[hellPaginationNext], a[hellPaginationNext]',
  hostDirectives: [
    { directive: NgpPaginationNext, inputs: ['ngpPaginationNextDisabled:disabled'] },
  ],
  host: {
    '[class.hell-button]': '!unstyled()',
    '[class.hell-pagination-item]': '!unstyled()',
    '[attr.type]': 'nativeButtonType()',
    '[attr.data-variant]': '"ghost"',
    '[attr.data-icon-only]': '""',
    '[attr.disabled]': 'nativeButtonDisabled(disabled())',
    '[attr.aria-disabled]': 'anchorAriaDisabled(disabled())',
    '[attr.tabindex]': 'disabledAnchorTabIndex(disabled())',
    '(click)': 'preventDisabledAnchor($event, disabled())',
    '(keydown.enter)': 'preventDisabledAnchor($event, disabled())',
  },
})
export class HellPaginationNext extends HellPaginationDisabledGuard {
  protected readonly disabled = inject(NgpPaginationNext).disabled;
}

@Directive({
  selector: 'button[hellPaginationLast], a[hellPaginationLast]',
  hostDirectives: [
    { directive: NgpPaginationLast, inputs: ['ngpPaginationLastDisabled:disabled'] },
  ],
  host: {
    '[class.hell-button]': '!unstyled()',
    '[class.hell-pagination-item]': '!unstyled()',
    '[attr.type]': 'nativeButtonType()',
    '[attr.data-variant]': '"ghost"',
    '[attr.data-icon-only]': '""',
    '[attr.disabled]': 'nativeButtonDisabled(disabled())',
    '[attr.aria-disabled]': 'anchorAriaDisabled(disabled())',
    '[attr.tabindex]': 'disabledAnchorTabIndex(disabled())',
    '(click)': 'preventDisabledAnchor($event, disabled())',
    '(keydown.enter)': 'preventDisabledAnchor($event, disabled())',
  },
})
export class HellPaginationLast extends HellPaginationDisabledGuard {
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
    '[class.hell-button]': '!unstyled()',
    '[class.hell-pagination-item]': '!unstyled()',
    '[attr.type]': 'nativeButtonType()',
    '[attr.data-variant]': '"ghost"',
    '[attr.data-icon-only]': '""',
    '[attr.disabled]': 'nativeButtonDisabled(disabled())',
    '[attr.aria-disabled]': 'anchorAriaDisabled(disabled())',
    '[attr.tabindex]': 'disabledAnchorTabIndex(disabled())',
    '(click)': 'preventDisabledAnchor($event, disabled())',
    '(keydown.enter)': 'preventDisabledAnchor($event, disabled())',
  },
})
export class HellPaginationButton extends HellPaginationDisabledGuard {
  protected readonly disabled = inject(NgpPaginationButton).disabled;
}

/**
 * Ready-made pagination strip. Numbered buttons are clamped to a sliding
 * window of `siblingCount * 2 + 1` around the active page.
 */
@Component({
  selector: 'hell-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons(HELL_PAGINATION_ICONS)],
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
    '[attr.aria-label]': 'labels.pagination.navigation',
    role: 'navigation',
  },
  template: `
    <button hellPaginationFirst type="button" [attr.aria-label]="labels.pagination.firstPage">
      <hell-icon name="faSolidAnglesLeft" />
    </button>
    <button hellPaginationPrev type="button" [attr.aria-label]="labels.pagination.previousPage">
      <hell-icon name="faSolidChevronLeft" />
    </button>
    @for (p of pages(); track trackPage($index, p)) {
      <button hellPaginationButton [page]="p" type="button" [attr.aria-label]="labels.pagination.page(p)">
        {{ p }}
      </button>
    }
    <button hellPaginationNext type="button" [attr.aria-label]="labels.pagination.nextPage">
      <hell-icon name="faSolidChevronRight" />
    </button>
    <button hellPaginationLast type="button" [attr.aria-label]="labels.pagination.lastPage">
      <hell-icon name="faSolidAnglesRight" />
    </button>
  `,
})
export class HellPaginationStrip extends HellStyleable {
  readonly siblingCount = input<number>(2);

  protected readonly labels = inject(HELL_LABELS);

  private readonly state = injectPaginationState();

  protected readonly trackPage = (_: number, page: number) => page;

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
