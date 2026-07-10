import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_EMPTY_STATE_DIRECTIVES } from '@hell-ui/angular/empty-state';
import { HellButton } from '@hell-ui/angular/button';

@Component({
  selector: 'app-empty-state-forbidden-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_EMPTY_STATE_DIRECTIVES, HellButton],
  template: `
    <div class="h-72 rounded-hell-lg border border-hell-border bg-hell-surface">
      <hell-empty-state preset="forbidden">
        <span hellEmptyStateDescription>
          You do not have access to the billing workspace. Ask an administrator for the Billing
          role.
        </span>
        <button hellEmptyStateActions hellButton variant="ghost" type="button">
          Request access
        </button>
      </hell-empty-state>
    </div>
  `,
})
export class EmptyStateForbiddenExample {}
