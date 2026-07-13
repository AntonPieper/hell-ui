import { Directive, input } from '@angular/core';
import { NgpSearch, NgpSearchClear } from 'ng-primitives/search';
import { hellPartStyler, type HellRecipe, type HellUiInput } from '@hell-ui/angular/core';

const HELL_SEARCH_RECIPE = {
  root: '',
} satisfies HellRecipe<'root'>;

const HELL_SEARCH_CLEAR_RECIPE = {
  root: '',
} satisfies HellRecipe<'root'>;

/** Root container for a search field, coordinating its clear control. */
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
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_SEARCH_RECIPE,
  });
}

/** Button that clears the value of an enclosing `hellSearch` field. */
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
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_SEARCH_CLEAR_RECIPE,
  });
}

/** All directives exported by the search entry point, for bulk `imports`. */
export const HELL_SEARCH_DIRECTIVES = [HellSearch, HellSearchClear] as const;
