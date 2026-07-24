import { ChangeDetectionStrategy, Component } from '@angular/core';

import { HELL_CONTROL_GROUP_IMPORTS } from 'hell-ui/control-group';
import { HellInput } from 'hell-ui/input';

@Component({
  selector: 'app-control-group-overflow-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellInput, ...HELL_CONTROL_GROUP_IMPORTS],
  template: `
    <div class="grid w-full max-w-lg gap-hell-4">
      <div>
        <label id="webhook-label" for="webhook" class="mb-hell-2 block text-xs font-semibold">
          Webhook endpoint
        </label>
        <div hellControlGroup aria-label="Webhook endpoint controls">
          <span hellControlGroupPrefix>https://</span>
          <input
            id="webhook"
            hellInput
            [ui]="controlUi"
            value="an-extraordinarily-long-unbroken-subdomain-that-outgrows-any-reasonable-frame"
          />
          <span hellControlGroupSuffix>.hell.app</span>
          <button hellControlGroupAction>Copy</button>
        </div>
      </div>

      <div class="max-w-60">
        <label id="cluster-label" for="cluster" class="mb-hell-2 block text-xs font-semibold">
          Cluster endpoint
        </label>
        <div hellControlGroup aria-label="Cluster endpoint controls">
          <span hellControlGroupPrefix ui="shrink-0">https://</span>
          <input id="cluster" hellInput [ui]="narrowControlUi" value="acme-workspace" />
          <span hellControlGroupSuffix>.eu-central.internal.hell.app</span>
          <button hellControlGroupAction>Copy</button>
        </div>
      </div>
    </div>
  `,
})
export class ControlGroupOverflowExample {
  protected readonly controlUi =
    'h-auto min-h-0 min-w-0 flex-1 rounded-none border-0 bg-transparent px-hell-3 shadow-none focus:border-transparent focus:shadow-none data-focus:border-transparent data-focus:shadow-none disabled:bg-transparent data-disabled:bg-transparent data-[size=sm]:px-hell-2 data-[size=lg]:px-hell-4';
  protected readonly narrowControlUi = `${this.controlUi} min-w-16`;
}
