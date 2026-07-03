import { Directive, ElementRef, booleanAttribute, inject, input } from '@angular/core';
import { NgpButton, injectButtonState } from 'ng-primitives/button';
import { hellPartStyler, type HellRecipe, type HellUi, type HellUiInput } from '@hell-ui/angular/core';
import { HellButtonVariant, HellSize } from '@hell-ui/angular/core';

/** Public parts of the HellButton module, styleable through its Part Style Map. */
export type HellButtonPart = 'root';

/** Part Style Map accepted by the HellButton `ui` input. */
export type HellButtonUi = HellUi<HellButtonPart>;

const HELL_BUTTON_BASE_RECIPE =
  'inline-flex cursor-pointer select-none items-center justify-center gap-hell-2 whitespace-nowrap rounded-hell-md border border-solid font-[inherit] font-medium leading-none shadow-hell-xs transition-[background-color,border-color,color,box-shadow] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] data-focus-visible:outline-2 data-focus-visible:outline-hell-focus-ring data-focus-visible:outline-offset-1 data-disabled:cursor-not-allowed data-disabled:opacity-50 data-disabled:shadow-none data-disabled:saturate-[0.65]';

const HELL_BUTTON_VARIANT_RECIPE: Record<HellButtonVariant, string> = {
  default:
    'border-hell-border bg-hell-surface-elevated text-hell-foreground data-hover:bg-hell-surface-muted data-press:bg-hell-surface-muted',
  primary:
    'border-hell-primary bg-hell-primary text-hell-primary-foreground data-hover:bg-hell-primary-hover data-press:bg-hell-primary-active',
  soft: 'border-transparent bg-hell-primary-soft text-hell-primary-soft-foreground shadow-none data-hover:bg-hell-surface-muted data-press:bg-hell-surface-muted',
  ghost:
    'border-transparent bg-transparent text-hell-foreground shadow-none data-hover:bg-hell-surface-muted data-press:bg-hell-surface-muted',
  link: 'h-auto border-transparent bg-transparent p-0 text-hell-primary underline underline-offset-[3px] shadow-none data-hover:bg-transparent data-press:bg-transparent',
  danger:
    'border-hell-danger bg-hell-danger text-hell-foreground-inverse data-hover:bg-hell-danger-hover data-press:bg-hell-danger-active',
  success:
    'border-hell-success-strong bg-hell-success-strong text-hell-foreground-inverse data-hover:bg-hell-success-hover data-press:bg-hell-success-active',
};

const HELL_BUTTON_SIZE_RECIPE: Record<HellSize, string> = {
  xs: 'h-hell-control-xs px-hell-3 text-xs',
  sm: 'h-hell-control-sm px-hell-4 text-[13px]',
  md: 'h-hell-control-md px-hell-5 text-[13px]',
  lg: 'h-hell-control-lg px-hell-6 text-sm',
  xl: 'h-hell-control-xl px-hell-7 text-[15px]',
};

const HELL_BUTTON_ICON_ONLY_RECIPE: Record<HellSize, string> = {
  xs: 'w-hell-control-xs shrink-0 px-0',
  sm: 'w-hell-control-sm shrink-0 px-0',
  md: 'w-hell-control-md shrink-0 px-0',
  lg: 'w-hell-control-lg shrink-0 px-0',
  xl: 'w-hell-control-xl shrink-0 px-0',
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
export class HellButton {
  /** Visual style of the button. Defaults to `default`. */
  readonly variant = input<HellButtonVariant>('default');
  /** Size of the button. Defaults to `md`. */
  readonly size = input<HellSize>('md');
  /** Renders a square icon-only shape when `true`. Defaults to `false`. */
  readonly iconOnly = input(false, { transform: booleanAttribute });
  /** Stretches the button to fill its container's width when `true`. Defaults to `false`. */
  readonly block = input(false, { transform: booleanAttribute });

  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellButtonPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellButtonPart>(this.ui, {
    defaultPart: 'root',
    recipe: (): HellRecipe<HellButtonPart> => ({ root: this.rootRecipe() }),
  });

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly buttonState = injectButtonState();

  /** `"true"` when the host is a disabled anchor, so assistive tech announces it as disabled. */
  protected anchorAriaDisabled(): 'true' | null {
    return this.isAnchor() && this.buttonState().disabled() ? 'true' : null;
  }

  /** Removes the disabled anchor from the tab order by returning `-1`. */
  protected disabledAnchorTabIndex(): -1 | null {
    return this.isAnchor() && this.buttonState().disabled() ? -1 : null;
  }

  /** Blocks click and Enter-key activation while the host is a disabled anchor. */
  protected preventDisabledAnchor(event: Event): void {
    if (!this.isAnchor() || !this.buttonState().disabled()) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
  }

  /** Native `type` attribute to apply when the host is a `<button>` element. */
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
      HELL_BUTTON_SIZE_RECIPE[size],
      HELL_BUTTON_VARIANT_RECIPE[this.variant()],
    ];

    if (this.iconOnly()) classes.push(HELL_BUTTON_ICON_ONLY_RECIPE[size]);
    if (this.block()) classes.push('w-full');

    return classes.join(' ');
  }
}
