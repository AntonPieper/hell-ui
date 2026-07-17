import { ChangeDetectionStrategy, Component } from '@angular/core';

import { HELL_CONTROL_GROUP_IMPORTS } from '@hell-ui/angular/control-group';
import { HellInput } from '@hell-ui/angular/input';

@Component({
  selector: 'app-control-group-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellInput, ...HELL_CONTROL_GROUP_IMPORTS],
  template: `
    <div
      hellControlGroup
      aria-label="Deployment tag"
      ui="max-w-lg rounded-hell-pill border-hell-primary bg-hell-primary-soft"
    >
      <span
        hellControlGroupPrefix
        ui="bg-hell-primary px-hell-4 font-semibold text-hell-primary-foreground"
      >
        release/
      </span>
      <input
        hellInput
        aria-label="Deployment tag name"
        [ui]="controlUi"
        value="control-group"
      />
      <span hellControlGroupSuffix ui="font-mono text-hell-primary-soft-foreground">v2</span>
      <button
        hellControlGroupAction
        ui="border-hell-primary px-hell-5 text-hell-primary-soft-foreground hover:bg-hell-primary hover:text-hell-primary-foreground"
      >
        Apply
      </button>
    </div>
  `,
})
export class ControlGroupStylingExample {
  protected readonly controlUi =
    'h-auto min-h-0 min-w-0 flex-1 rounded-none border-0 bg-transparent px-hell-3 text-hell-primary-soft-foreground shadow-none focus:border-transparent focus:shadow-none data-focus:border-transparent data-focus:shadow-none';
}
