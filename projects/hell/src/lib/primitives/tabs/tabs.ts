import { Directive, booleanAttribute, input } from '@angular/core';
import {
  NgpTabset,
  NgpTabList,
  NgpTabButton,
  NgpTabPanel,
} from 'ng-primitives/tabs';
import { HellOrientation } from '../../core/types';

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
    '[class.hell-tabs]': '!unstyled()',
    '[attr.data-orientation]': 'orientation()',
  },
})
export class HellTabset {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly orientation = input<HellOrientation>('horizontal');
}

@Directive({
  selector: '[hellTabList]',
  hostDirectives: [NgpTabList],
  host: { '[class.hell-tab-list]': '!unstyled()' },
})
export class HellTabList {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: 'button[hellTab]',
  hostDirectives: [
    {
      directive: NgpTabButton,
      inputs: ['ngpTabButtonValue:value', 'ngpTabButtonDisabled:disabled'],
    },
  ],
  host: {
    '[class.hell-tab]': '!unstyled()',
    type: 'button',
  },
})
export class HellTab {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: '[hellTabPanel]',
  hostDirectives: [{ directive: NgpTabPanel, inputs: ['ngpTabPanelValue:value'] }],
  host: { '[class.hell-tab-panel]': '!unstyled()' },
})
export class HellTabPanel {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

export const HELL_TABS_DIRECTIVES = [
  HellTabset,
  HellTabList,
  HellTab,
  HellTabPanel,
] as const;
