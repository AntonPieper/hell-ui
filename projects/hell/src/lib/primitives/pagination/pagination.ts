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
import { HellNativeSelect } from '../input/input';
import { HELL_LABELS } from '../../core/labels';
import { HellStyleable } from '../../core/styleable';
import { HellNativeInteractiveDisabledGuard } from '../../core/native-interactive-disabled';

const HELL_PAGINATION_ICONS = {
  faSolidAnglesLeft,
  faSolidAnglesRight,
  faSolidChevronLeft,
  faSolidChevronRight,
};

export type HellPaginationMode = 'pages' | 'previous-next' | 'jump';

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
 * window of `siblingCount * 2 + 1` around the active page. Set `mode` to
 * `previous-next` for a compact previous/next-only control or `jump` for a
 * previous/select/next control.
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
    '[class.hell-pagination]': '!unstyled()',
    '[attr.data-mode]': 'mode()',
    '[attr.aria-label]': 'labels.pagination.navigation',
    role: 'navigation',
  },
  template: `
    @if (mode() === 'pages') {
      <button hellPaginationFirst type="button" [attr.aria-label]="labels.pagination.firstPage">
        <hell-icon [name]="'faSolidAnglesLeft'" />
      </button>
    }
    <button hellPaginationPrev type="button" [attr.aria-label]="labels.pagination.previousPage">
      <hell-icon [name]="'faSolidChevronLeft'" />
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
      <span data-slot="status" aria-live="polite">{{ pageStatusLabel() }}</span>
    }
    @if (mode() === 'jump' && pageCount() > 0) {
      <label data-slot="jump">
        <span data-slot="jump-label">{{ pageJumpLabel() }}</span>
        <select
          hellNativeSelect
          size="sm"
          data-slot="jump-select"
          [attr.aria-label]="pageJumpLabel()"
          [value]="currentPage()"
          [disabled]="paginationDisabled() || pageCount() < 2"
          (change)="goToSelectedPage($event)"
        >
          @for (p of pageOptions(); track trackPage($index, p)) {
            <option [value]="p" [selected]="p === currentPage()">{{ p }}</option>
          }
        </select>
        <span data-slot="jump-total">{{ pageTotalLabel() }}</span>
      </label>
    }
    <button hellPaginationNext type="button" [attr.aria-label]="labels.pagination.nextPage">
      <hell-icon [name]="'faSolidChevronRight'" />
    </button>
    @if (mode() === 'pages') {
      <button hellPaginationLast type="button" [attr.aria-label]="labels.pagination.lastPage">
        <hell-icon [name]="'faSolidAnglesRight'" />
      </button>
    }
  `,
})
export class HellPaginationStrip extends HellStyleable {
  readonly siblingCount = input<number>(2);
  readonly mode = input<HellPaginationMode>('pages');

  protected readonly labels = inject(HELL_LABELS);

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
