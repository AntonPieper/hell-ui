import { ChangeDetectionStrategy, Component } from '@angular/core';

import { HELL_CONTROL_GROUP_IMPORTS } from 'hell-ui/control-group';
import { HellInput } from 'hell-ui/input';

@Component({
  selector: 'app-control-group-states-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellInput, ...HELL_CONTROL_GROUP_IMPORTS],
  template: `
    <div class="grid w-full max-w-lg gap-hell-4">
      <div>
        <label id="small-id-label" for="small-id" class="mb-hell-2 block text-xs font-semibold">
          Small identifier
        </label>
        <div hellControlGroup size="sm" aria-labelledby="small-id-label">
          <span hellControlGroupPrefix>ID</span>
          <input id="small-id" hellInput size="sm" [ui]="controlUi" value="4821" />
          <button hellControlGroupAction>Copy</button>
        </div>
      </div>

      <div>
        <label id="invalid-amount-label" for="invalid-amount" class="mb-hell-2 block text-xs font-semibold">
          Amount in US dollars
        </label>
        <div hellControlGroup invalid aria-labelledby="invalid-amount-label">
          <span hellControlGroupPrefix>$</span>
          <input id="invalid-amount" hellInput invalid [ui]="controlUi" value="-12" />
          <span hellControlGroupSuffix>USD</span>
          <button hellControlGroupAction>Reset</button>
        </div>
      </div>

      <div>
        <label id="disabled-host-label" for="disabled-host" class="mb-hell-2 block text-xs font-semibold">
          Provisioning host
        </label>
        <div hellControlGroup size="lg" disabled aria-labelledby="disabled-host-label">
          <span hellControlGroupPrefix>ssh://</span>
          <input
            id="disabled-host"
            hellInput
            size="lg"
            disabled
            [ui]="controlUi"
            value="build.internal"
          />
          <button hellControlGroupAction>Test</button>
        </div>
      </div>
    </div>
  `,
})
export class ControlGroupStatesExample {
  protected readonly controlUi =
    'h-auto min-h-0 min-w-0 flex-1 rounded-none border-0 bg-transparent px-hell-2 shadow-none focus:border-transparent focus:shadow-none data-focus:border-transparent data-focus:shadow-none disabled:bg-transparent data-disabled:bg-transparent';
}
