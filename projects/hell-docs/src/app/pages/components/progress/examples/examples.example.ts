import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellProgress, HellProgressBar } from '@hell-ui/angular/progress';

@Component({
  selector: 'app-progress-examples-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellProgress, HellProgressBar],
  template: `
    <div class="grid gap-1">
      <span id="progress-empty-label" class="text-sm font-medium">Queued migration</span>
      <div hellProgress aria-labelledby="progress-empty-label" [value]="0">
        <div hellProgressBar></div>
      </div>
    </div>

    <div class="grid gap-1">
      <span id="progress-third-label" class="text-sm font-medium">Profile import</span>
      <div hellProgress aria-labelledby="progress-third-label" [value]="33">
        <div hellProgressBar></div>
      </div>
    </div>

    <div class="grid gap-1">
      <span id="progress-two-thirds-label" class="text-sm font-medium">Media processing</span>
      <div hellProgress aria-labelledby="progress-two-thirds-label" [value]="66">
        <div hellProgressBar></div>
      </div>
    </div>

    <div class="grid gap-1">
      <span id="progress-complete-label" class="text-sm font-medium">Backup complete</span>
      <div hellProgress aria-labelledby="progress-complete-label" [value]="100">
        <div hellProgressBar></div>
      </div>
    </div>
  `,
})
export class ProgressExamplesExample {}
