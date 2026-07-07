import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellProgress, HellProgressBar } from '@hell-ui/angular/progress';

@Component({
  selector: 'app-progress-indeterminate-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellProgress, HellProgressBar],
  template: `
    <div class="grid gap-1">
      <span class="text-sm font-medium">Connecting to server…</span>
      <!-- Omitting value (or passing null) drops aria-valuenow and sets -->
      <!-- data-indeterminate, for tasks with no known completion percentage. -->
      <div hellProgress aria-label="Connecting to server" [value]="null">
        <div hellProgressBar class="w-1/3 animate-pulse"></div>
      </div>
    </div>
  `,
})
export class ProgressIndeterminateExample {}
