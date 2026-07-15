import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { HELL_CONTROL_GROUP_DIRECTIVES } from '@hell-ui/angular/control-group';
import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/field';
import { HellInput } from '@hell-ui/angular/input';

@Component({
  selector: 'app-control-group-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellInput, ...HELL_CONTROL_GROUP_DIRECTIVES, ...HELL_FIELD_DIRECTIVES],
  template: `
    <div hellField>
      <label id="workspace-url-label" hellFieldLabel for="workspace-url">Workspace URL</label>
      <div hellControlGroup aria-label="Workspace URL controls">
        <span hellControlGroupPrefix>https://</span>
        <input
          id="workspace-url"
          hellInput
          [ui]="controlUi"
          value="acme"
        />
        <span hellControlGroupSuffix>.hell.app</span>
        <button hellControlGroupAction (click)="copied.set(true)">
          {{ copied() ? 'Copied' : 'Copy' }}
        </button>
      </div>
      <div hellFieldDescription>
        {{ copied() ? 'The workspace URL is ready to paste.' : 'Choose the subdomain shared with your team.' }}
      </div>
    </div>
  `,
})
export class ControlGroupBasicExample {
  protected readonly copied = signal(false);
  protected readonly controlUi =
    'h-auto min-h-0 min-w-0 flex-1 rounded-none border-0 bg-transparent px-hell-2 shadow-none focus:border-transparent focus:shadow-none data-focus:border-transparent data-focus:shadow-none disabled:bg-transparent data-disabled:bg-transparent';
}
