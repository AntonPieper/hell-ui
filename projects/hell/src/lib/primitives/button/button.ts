import { Directive, ElementRef, booleanAttribute, inject, input } from '@angular/core';
import { NgpButton, injectButtonState } from 'ng-primitives/button';
import { hellMergePartClasses } from '../../core/part-style-merge';
import {
  HellPartStyleable,
  type HellPartClassMerger,
  type HellRecipe,
  type HellUi,
} from '../../core/styleable';
import { HellButtonVariant, HellSize } from '../../core/types';

export type HellButtonPart = 'root';

export type HellButtonUi = HellUi<HellButtonPart>;

const HELL_BUTTON_BASE_RECIPE =
  'inline-flex h-hell-control-md cursor-pointer select-none items-center justify-center gap-hell-2 whitespace-nowrap rounded-hell-md border border-solid px-hell-5 font-[inherit] text-[13px] font-medium leading-none shadow-[var(--shadow-hell-xs)] transition-[background-color,border-color,color,box-shadow] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] data-focus-visible:outline-2 data-focus-visible:outline-hell-focus-ring data-focus-visible:outline-offset-1 data-disabled:cursor-not-allowed data-disabled:opacity-50 data-disabled:shadow-none data-disabled:saturate-[0.65]';

const HELL_BUTTON_VARIANT_RECIPE: Record<HellButtonVariant, string> = {
  default:
    'border-[color:var(--hell-button-border-color,var(--color-hell-border))] bg-[var(--hell-button-background,var(--color-hell-surface-elevated))] text-[color:var(--hell-button-color,var(--color-hell-foreground))] data-hover:bg-[var(--hell-button-background-hover,var(--color-hell-surface-muted))] data-press:bg-[var(--hell-button-background-active,var(--color-hell-surface-muted))]',
  primary:
    'border-[color:var(--hell-button-border-color,var(--color-hell-primary))] bg-[var(--hell-button-background,var(--color-hell-primary))] text-[color:var(--hell-button-color,var(--color-hell-primary-foreground))] data-hover:bg-[var(--hell-button-background-hover,var(--color-hell-primary-hover))] data-press:bg-[var(--hell-button-background-active,var(--color-hell-primary-active))]',
  soft:
    'border-[color:var(--hell-button-border-color,transparent)] bg-[var(--hell-button-background,var(--color-hell-primary-soft))] text-[color:var(--hell-button-color,var(--color-hell-primary-soft-foreground))] shadow-none data-hover:bg-[var(--hell-button-background-hover,var(--color-hell-surface-muted))] data-press:bg-[var(--hell-button-background-active,var(--color-hell-surface-muted))]',
  ghost:
    'border-[color:var(--hell-button-border-color,transparent)] bg-[var(--hell-button-background,transparent)] text-[color:var(--hell-button-color,var(--color-hell-foreground))] shadow-none data-hover:bg-[var(--hell-button-background-hover,var(--color-hell-surface-muted))] data-press:bg-[var(--hell-button-background-active,var(--color-hell-surface-muted))]',
  link:
    'h-auto border-[color:var(--hell-button-border-color,transparent)] bg-[var(--hell-button-background,transparent)] p-0 text-[color:var(--hell-button-color,var(--color-hell-primary))] underline underline-offset-[3px] shadow-none data-hover:bg-[var(--hell-button-background-hover,transparent)] data-press:bg-[var(--hell-button-background-active,transparent)]',
  danger:
    'border-[color:var(--hell-button-border-color,var(--color-hell-danger))] bg-[var(--hell-button-background,var(--color-hell-danger))] text-[color:var(--hell-button-color,var(--color-hell-foreground-inverse))] data-hover:bg-[var(--hell-button-background-hover,var(--color-hell-danger-hover))] data-press:bg-[var(--hell-button-background-active,var(--color-hell-danger-active))]',
  success:
    'border-[color:var(--hell-button-border-color,var(--color-hell-success-strong))] bg-[var(--hell-button-background,var(--color-hell-success-strong))] text-[color:var(--hell-button-color,var(--color-hell-foreground-inverse))] data-hover:bg-[var(--hell-button-background-hover,var(--color-hell-success-hover))] data-press:bg-[var(--hell-button-background-active,var(--color-hell-success-active))]',
};

const HELL_BUTTON_SIZE_RECIPE: Record<HellSize, string> = {
  xs: 'h-hell-control-xs px-hell-3 text-xs',
  sm: 'h-hell-control-sm px-hell-4 text-[13px]',
  md: 'h-hell-control-md px-hell-5 text-[13px]',
  lg: 'h-hell-control-lg px-hell-6 text-sm',
  xl: 'h-hell-control-xl px-hell-7 text-[15px]',
};

const HELL_BUTTON_ICON_ONLY_RECIPE: Record<HellSize, string> = {
  xs: 'w-hell-control-xs px-0',
  sm: 'w-hell-control-sm px-0',
  md: 'w-hell-control-md px-0',
  lg: 'w-hell-control-lg px-0',
  xl: 'w-hell-control-xl px-0',
};

/**
 * Styled button built on `NgpButton`.
 *
 * Adds:
 *   - `variant`  default | primary | soft | ghost | link | danger | success
 *   - `size`     xs | sm | md | lg | xl
 *   - `iconOnly` square icon-button shape
 *   - `block`    full width
 *   - `ui`       refines the root public part classes
 *
 * Styling reacts to `data-variant`, `data-size`, `data-icon-only`,
 * `data-block` and to ng-primitives state attrs (`data-hover`, `data-press`,
 * `data-focus-visible`, `data-disabled`).
 */
@Directive({
  selector: 'button[hellButton], a[hellButton]',
  hostDirectives: [{ directive: NgpButton, inputs: ['disabled'] }],
  host: {
    '[class]': "part('root')",
    '[attr.type]': 'nativeButtonType()',
    'data-slot': 'root',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    '[attr.data-icon-only]': 'iconOnly() ? "" : null',
    '[attr.data-block]': 'block() ? "" : null',
    '[attr.aria-disabled]': 'anchorAriaDisabled()',
    '[attr.tabindex]': 'disabledAnchorTabIndex()',
    '(click)': 'preventDisabledAnchor($event)',
    '(keydown.enter)': 'preventDisabledAnchor($event)',
  },
})
export class HellButton extends HellPartStyleable<HellButtonPart> {
  readonly variant = input<HellButtonVariant>('default');
  readonly size = input<HellSize>('md');
  readonly iconOnly = input(false, { transform: booleanAttribute });
  readonly block = input(false, { transform: booleanAttribute });

  protected get recipe(): HellRecipe<HellButtonPart> {
    return { root: this.rootRecipe() };
  }

  protected readonly mergePartClasses: HellPartClassMerger = hellMergePartClasses;

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly buttonState = injectButtonState();

  protected anchorAriaDisabled(): 'true' | null {
    return this.isAnchor() && this.buttonState().disabled() ? 'true' : null;
  }

  protected disabledAnchorTabIndex(): -1 | null {
    return this.isAnchor() && this.buttonState().disabled() ? -1 : null;
  }

  protected preventDisabledAnchor(event: Event): void {
    if (!this.isAnchor() || !this.buttonState().disabled()) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
  }

  protected nativeButtonType(): string | null {
    if (!this.isButton()) return null;
    return this.host.getAttribute('type') ?? 'button';
  }

  private isButton(): boolean {
    return this.host.tagName.toLowerCase() === 'button';
  }

  private isAnchor(): boolean {
    return this.host.tagName.toLowerCase() === 'a';
  }

  private rootRecipe(): string {
    const size = this.size();
    const classes = [
      HELL_BUTTON_BASE_RECIPE,
      HELL_BUTTON_VARIANT_RECIPE[this.variant()],
      HELL_BUTTON_SIZE_RECIPE[size],
    ];

    if (this.iconOnly()) classes.push(HELL_BUTTON_ICON_ONLY_RECIPE[size]);
    if (this.block()) classes.push('w-full');

    return classes.join(' ');
  }
}
