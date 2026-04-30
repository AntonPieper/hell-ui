import { Directive, booleanAttribute, input } from '@angular/core';
import { NgpSearch, NgpSearchClear } from 'ng-primitives/search';

@Directive({
  selector: '[hellSearch]',
  hostDirectives: [NgpSearch],
  host: {
    '[class.hell-search]': '!unstyled()',
  },
})
export class HellSearch {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: 'button[hellSearchClear], [hellSearchClear]',
  hostDirectives: [NgpSearchClear],
  host: {
    '[class.hell-search-clear]': '!unstyled()',
  },
})
export class HellSearchClear {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

export const HELL_SEARCH_DIRECTIVES = [HellSearch, HellSearchClear] as const;
