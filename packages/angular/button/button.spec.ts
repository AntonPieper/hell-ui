import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { HellButtonVariant, HellSize } from 'hell-ui/core';

import { HellButton } from './button';
import { expectUiRouting, sortClasses } from '../spec-helpers';

/**
 * Button specs assert behavior and state attributes. Part-Class Pipeline merge
 * semantics are owned centrally by `internal/core/part-class-pipeline.spec.ts`;
 * ui routing asserts that consumer classes reach the part and that nothing
 * outside the default render and the consumer's ui appears, instead of
 * asserting individual recipe classes. Part Recipes stay package-private per
 * ADR 0002, so the recipe snapshots below pin the rendered class surface per
 * variant and size.
 */
const BUTTON_UI_SHORTHAND = 'bg-hell-danger px-hell-7 shadow-hell-lg data-hover:bg-hell-danger-hover';

const BUTTON_VARIANTS: readonly HellButtonVariant[] = [
  'default',
  'primary',
  'soft',
  'ghost',
  'link',
  'danger',
  'success',
];

const BUTTON_SIZES: readonly HellSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

@Component({
  imports: [HellButton],
  template: `
    <button id="native" hellButton [disabled]="disabled()">Native</button>
    <button id="submit" hellButton type="submit">Submit</button>
    <a id="anchor" hellButton href="#next" [disabled]="disabled()">Anchor</a>
    <button id="styled" hellButton variant="primary" size="sm" iconOnly block type="button">
      Styled
    </button>
    <button
      id="custom-string"
      hellButton
      ui="bg-hell-danger px-hell-7 shadow-hell-lg data-hover:bg-hell-danger-hover"
      type="button"
    >
      Custom string
    </button>
    <button id="custom-map" hellButton [ui]="customUi" type="button">Custom map</button>
    <button id="dynamic-map" hellButton [ui]="dynamicUi()" type="button">Dynamic map</button>
    <button id="class-hook" hellButton class="mt-4 bg-hell-danger" type="button">Class hook</button>
    <button
      id="recipe"
      hellButton
      [variant]="variant()"
      [size]="size()"
      [iconOnly]="iconOnly()"
      [block]="block()"
      type="button"
    >
      Recipe
    </button>
  `,
})
class ButtonHost {
  readonly disabled = signal(false);
  readonly customUi = {
    root: BUTTON_UI_SHORTHAND,
  };
  readonly dynamicUi = signal<{ root?: string }>({
    root: 'bg-hell-danger px-hell-7',
  });
  readonly variant = signal<HellButtonVariant>('default');
  readonly size = signal<HellSize>('md');
  readonly iconOnly = signal(false);
  readonly block = signal(false);
}

describe('HellButton', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ButtonHost] }).compileComponents();
  });

  it('defaults button hosts to non-submit without overriding explicit submit', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();

    expect(query<HTMLButtonElement>(fixture.nativeElement, '#native').type).toBe('button');
    expect(query<HTMLButtonElement>(fixture.nativeElement, '#submit').type).toBe('submit');
  });

  it('marks the root part and reflects variant, size, icon-only, and block state attributes', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();

    const button = query<HTMLButtonElement>(fixture.nativeElement, '#styled');

    expect(button.getAttribute('data-slot')).toBe('root');
    expect(button.getAttribute('data-variant')).toBe('primary');
    expect(button.getAttribute('data-size')).toBe('sm');
    expect(button.getAttribute('data-icon-only')).toBe('');
    expect(button.getAttribute('data-block')).toBe('');
  });

  it('routes ui string shorthand through the shared Part-Class Pipeline', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();

    expectUiRouting(
      className(fixture, '#native'),
      className(fixture, '#custom-string'),
      BUTTON_UI_SHORTHAND,
    );
  });

  it('routes ui part maps through the shared Part-Class Pipeline', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();

    expectUiRouting(
      className(fixture, '#native'),
      className(fixture, '#custom-map'),
      BUTTON_UI_SHORTHAND,
    );
  });

  it('reacts to ui signal input updates through the public binding', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();

    expectUiRouting(
      className(fixture, '#native'),
      className(fixture, '#dynamic-map'),
      'bg-hell-danger px-hell-7',
    );

    fixture.componentInstance.dynamicUi.set({
      root: 'bg-hell-success-strong px-hell-3',
    });
    fixture.detectChanges();

    expectUiRouting(
      className(fixture, '#native'),
      className(fixture, '#dynamic-map'),
      'bg-hell-success-strong px-hell-3',
    );
  });

  it('keeps template class additive but outside the Tailwind merge path', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();

    expect(renderedClasses(fixture, '#class-hook')).toEqual(
      sortClasses(`${className(fixture, '#native')} mt-4 bg-hell-danger`),
    );
  });

  it('keeps anchor disabled semantics explicit', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();

    const anchor = query<HTMLAnchorElement>(fixture.nativeElement, '#anchor');
    const enabledClick = new MouseEvent('click', { bubbles: true, cancelable: true });

    expect(anchor.getAttribute('aria-disabled')).toBeNull();
    expect(anchor.getAttribute('tabindex')).toBeNull();
    expect(anchor.dispatchEvent(enabledClick)).toBe(true);
    expect(enabledClick.defaultPrevented).toBe(false);

    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    const disabledClick = new MouseEvent('click', { bubbles: true, cancelable: true });
    const disabledEnter = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });

    expect(anchor.getAttribute('aria-disabled')).toBe('true');
    expect(anchor.getAttribute('tabindex')).toBe('-1');
    expect(anchor.dispatchEvent(disabledClick)).toBe(false);
    expect(disabledClick.defaultPrevented).toBe(true);
    expect(anchor.dispatchEvent(disabledEnter)).toBe(false);
    expect(disabledEnter.defaultPrevented).toBe(true);
  });

  it('keeps native disabled for button hosts', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    const button = query<HTMLButtonElement>(fixture.nativeElement, '#native');

    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-disabled')).toBeNull();
  });

  describe('recipes', () => {
    it('keeps the variant recipes stable', () => {
      const fixture = TestBed.createComponent(ButtonHost);
      const byVariant: Record<string, string[]> = {};

      for (const variant of BUTTON_VARIANTS) {
        fixture.componentInstance.variant.set(variant);
        fixture.detectChanges();
        byVariant[variant] = renderedClasses(fixture, '#recipe');
      }

      expect(byVariant).toMatchSnapshot('button variants');
    });

    it('keeps the size and icon-only recipes stable', () => {
      const fixture = TestBed.createComponent(ButtonHost);
      const bySize: Record<string, string[]> = {};

      for (const size of BUTTON_SIZES) {
        fixture.componentInstance.size.set(size);
        fixture.componentInstance.iconOnly.set(false);
        fixture.detectChanges();
        bySize[size] = renderedClasses(fixture, '#recipe');

        fixture.componentInstance.iconOnly.set(true);
        fixture.detectChanges();
        bySize[`${size} icon-only`] = renderedClasses(fixture, '#recipe');
        fixture.componentInstance.iconOnly.set(false);
      }

      fixture.componentInstance.size.set('md');
      fixture.componentInstance.block.set(true);
      fixture.detectChanges();
      bySize['md block'] = renderedClasses(fixture, '#recipe');

      expect(bySize).toMatchSnapshot('button sizes');
    });
  });
});

function className(fixture: { nativeElement: HTMLElement }, selector: string): string {
  return query(fixture.nativeElement, selector).className;
}

/** Rendered classes as a sorted list; class attribute order carries no styling meaning. */
function renderedClasses(fixture: { nativeElement: HTMLElement }, selector: string): string[] {
  return sortClasses(className(fixture, selector));
}

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
