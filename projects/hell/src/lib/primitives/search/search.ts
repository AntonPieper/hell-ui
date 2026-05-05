import { Directive, booleanAttribute, input } from '@angular/core';
import { NgpSearch, NgpSearchClear } from 'ng-primitives/search';
import { HellStyleable } from '../../core/styleable';

@Directive({
  selector: '[hellSearch]',
  hostDirectives: [NgpSearch],
  host: {
    '[class.hell-search]': '!unstyled()',
  },
})
export class HellSearch extends HellStyleable {}

@Directive({
  selector: 'button[hellSearchClear]',
  hostDirectives: [NgpSearchClear],
  host: {
    '[class.hell-search-clear]': '!unstyled()',
  },
})
export class HellSearchClear extends HellStyleable {}

export const HELL_SEARCH_DIRECTIVES = [HellSearch, HellSearchClear] as const;
