import { Directive, input } from '@angular/core';
import { NgpSearch, NgpSearchClear } from 'ng-primitives/search';
import { hellPartStyler, type HellRecipe, type HellUi, type HellUiInput } from '@hell-ui/angular/core';

/** Public parts of the HellSearch module, styleable through its Part Style Map. */
export type HellSearchPart = 'root';
/** Part Style Map accepted by the HellSearch `ui` input. */
export type HellSearchUi = HellUi<HellSearchPart>;

/** Public parts of the HellSearchClear module, styleable through its Part Style Map. */
export type HellSearchClearPart = 'root';
/** Part Style Map accepted by the HellSearchClear `ui` input. */
export type HellSearchClearUi = HellUi<HellSearchClearPart>;

const HELL_SEARCH_RECIPE = {
  root: '',
} satisfies HellRecipe<HellSearchPart>;

const HELL_SEARCH_CLEAR_RECIPE = {
  root: '',
} satisfies HellRecipe<HellSearchClearPart>;

@Directive({
  selector: '[hellSearch]',
  hostDirectives: [NgpSearch],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellSearch {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellSearchPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellSearchPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_SEARCH_RECIPE,
  });
}

@Directive({
  selector: 'button[hellSearchClear]',
  hostDirectives: [NgpSearchClear],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    type: 'button',
  },
})
export class HellSearchClear {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellSearchClearPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellSearchClearPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_SEARCH_CLEAR_RECIPE,
  });
}

export const HELL_SEARCH_DIRECTIVES = [HellSearch, HellSearchClear] as const;
