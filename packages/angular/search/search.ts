import { Directive } from '@angular/core';
import { NgpSearch, NgpSearchClear } from 'ng-primitives/search';
import { HellPartStyleable, type HellRecipe, type HellUi } from '@hell-ui/angular/core';

export type HellSearchPart = 'root';
export type HellSearchUi = HellUi<HellSearchPart>;

export type HellSearchClearPart = 'root';
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
export class HellSearch extends HellPartStyleable<HellSearchPart> {
  protected readonly recipe = HELL_SEARCH_RECIPE;
  protected readonly defaultUiPart = 'root';
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
export class HellSearchClear extends HellPartStyleable<HellSearchClearPart> {
  protected readonly recipe = HELL_SEARCH_CLEAR_RECIPE;
  protected readonly defaultUiPart = 'root';
}

export const HELL_SEARCH_DIRECTIVES = [HellSearch, HellSearchClear] as const;
