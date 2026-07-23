import { Directive, input } from '@angular/core';
import { NgpTabset, NgpTabList, NgpTabButton, NgpTabPanel } from 'ng-primitives/tabs';
import { hellPartStyler, HellOrientation, type HellRecipe, type HellUiInput } from 'hell-ui/core';

const HELL_TABSET_RECIPE = {
  root: 'flex min-w-0 flex-col data-[orientation=vertical]:flex-row data-[orientation=vertical]:items-start data-[orientation=vertical]:gap-hell-4 max-[640px]:data-[orientation=vertical]:flex-col max-[640px]:data-[orientation=vertical]:items-stretch',
} satisfies HellRecipe<'root'>;

const HELL_TAB_LIST_RECIPE = {
  root: 'flex min-h-9 max-w-full min-w-0 items-stretch gap-0.5 overflow-x-auto overflow-y-hidden border-b border-hell-border px-hell-2 data-[orientation=vertical]:min-h-0 data-[orientation=vertical]:min-w-[200px] data-[orientation=vertical]:flex-col data-[orientation=vertical]:gap-1 data-[orientation=vertical]:overflow-visible data-[orientation=vertical]:rounded-hell-lg data-[orientation=vertical]:border-0 data-[orientation=vertical]:bg-hell-surface-subtle data-[orientation=vertical]:p-hell-2 max-[640px]:data-[orientation=vertical]:min-h-9 max-[640px]:data-[orientation=vertical]:min-w-0 max-[640px]:data-[orientation=vertical]:flex-row max-[640px]:data-[orientation=vertical]:items-stretch max-[640px]:data-[orientation=vertical]:overflow-x-auto max-[640px]:data-[orientation=vertical]:overflow-y-hidden max-[640px]:data-[orientation=vertical]:rounded-hell-lg max-[640px]:data-[orientation=vertical]:border-b max-[640px]:data-[orientation=vertical]:border-hell-border',
} satisfies HellRecipe<'root'>;

const HELL_TAB_RECIPE = {
  root: 'relative mb-[-1px] inline-flex h-9 flex-[0_0_auto] cursor-pointer items-center gap-hell-2 border-0 border-b-2 border-solid border-transparent bg-transparent px-hell-4 font-[family-name:inherit] text-[13px] font-medium text-hell-foreground-muted transition-[color,border-color,background-color] duration-[var(--hell-duration-fast)] ease-hell-out data-hover:bg-hell-surface-subtle data-hover:text-hell-foreground data-active:border-hell-primary data-active:text-hell-primary data-disabled:cursor-not-allowed data-disabled:opacity-50 data-focus-visible:outline-2 data-focus-visible:outline-hell-focus-ring data-focus-visible:outline-offset-[-2px] data-[orientation=vertical]:m-0 data-[orientation=vertical]:h-[38px] data-[orientation=vertical]:justify-start data-[orientation=vertical]:rounded-hell-md data-[orientation=vertical]:border-0 data-[orientation=vertical]:ps-[calc(var(--spacing-hell-3)+8px)] data-[orientation=vertical]:pe-hell-3 data-[orientation=vertical]:text-hell-foreground-muted data-[orientation=vertical]:data-hover:bg-hell-surface-subtle data-[orientation=vertical]:data-active:bg-hell-surface-elevated data-[orientation=vertical]:data-active:font-semibold data-[orientation=vertical]:data-active:text-hell-foreground data-[orientation=vertical]:data-active:shadow-[0_1px_2px_rgb(0_0_0_/_0.05),0_0_0_1px_var(--color-hell-border)] data-[orientation=vertical]:data-focus-visible:outline-offset-2',
} satisfies HellRecipe<'root'>;

const HELL_TAB_PANEL_RECIPE = {
  root: 'min-w-0 px-hell-2 py-hell-6 outline-none aria-hidden:hidden animate-[hell-tab-fade-in_var(--hell-duration-base)_var(--ease-hell-out)]',
} satisfies HellRecipe<'root'>;

/**
 * Styled tabs system. Compose:
 *   <div hellTabset value="general">
 *     <div hellTabList>
 *       <button hellTab value="general">General</button>
 *       <button hellTab value="security">Security</button>
 *     </div>
 *     <div hellTabPanel value="general">…</div>
 *     <div hellTabPanel value="security">…</div>
 *   </div>
 */
@Directive({
  selector: '[hellTabset]',
  hostDirectives: [
    {
      directive: NgpTabset,
      inputs: [
        'ngpTabsetValue:value',
        'ngpTabsetOrientation:orientation',
        'ngpTabsetActivateOnFocus:activateOnFocus',
      ],
      outputs: ['ngpTabsetValueChange:valueChange'],
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-orientation]': 'orientation()',
  },
})
export class HellTabset {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TABSET_RECIPE,
  });

  /** Layout direction of the tab list. Defaults to `horizontal`. */
  readonly orientation = input<HellOrientation>('horizontal');
}

/** List element wrapping the tab buttons. */
@Directive({
  selector: '[hellTabList]',
  hostDirectives: [NgpTabList],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellTabList {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TAB_LIST_RECIPE,
  });
}

/** Button that selects its associated tab panel when activated. */
@Directive({
  selector: 'button[hellTab]',
  hostDirectives: [
    {
      directive: NgpTabButton,
      inputs: ['ngpTabButtonValue:value', 'ngpTabButtonDisabled:disabled'],
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    type: 'button',
  },
})
export class HellTab {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TAB_RECIPE,
  });
}

/** Content panel shown when its associated tab is selected. */
@Directive({
  selector: '[hellTabPanel]',
  hostDirectives: [{ directive: NgpTabPanel, inputs: ['ngpTabPanelValue:value'] }],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellTabPanel {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TAB_PANEL_RECIPE,
  });
}

/** All directives that make up the tabs entry point, for bulk `imports`. */
export const HELL_TABS_IMPORTS = [HellTabset, HellTabList, HellTab, HellTabPanel] as const;
