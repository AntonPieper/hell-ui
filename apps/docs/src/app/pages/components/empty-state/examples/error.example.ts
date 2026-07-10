import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_EMPTY_STATE_DIRECTIVES } from '@hell-ui/angular/empty-state';
import { HellButton } from '@hell-ui/angular/button';

@Component({
  selector: 'app-empty-state-error-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_EMPTY_STATE_DIRECTIVES, HellButton],
  template: `
    <div class="h-72 rounded-hell-lg border border-hell-border bg-hell-surface">
      <hell-empty-state preset="error">
        <span hellEmptyStateDescription>
          We could not load your reports. Check your connection and try again.
        </span>
        <button hellEmptyStateActions hellButton type="button">Retry</button>
      </hell-empty-state>
    </div>
  `,
})
export class EmptyStateErrorExample {}
