import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellProgress, HellProgressBar } from '@hell-ui/angular/progress';

@Component({
  selector: 'app-progress-examples-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellProgress, HellProgressBar],
  template: `
    <div class="grid gap-1">
      <span class="text-sm font-medium">Queued migration</span>
      <div hellProgress aria-label="Queued migration" [value]="0">
        <div hellProgressBar></div>
      </div>
    </div>

    <div class="grid gap-1">
      <span class="text-sm font-medium">Profile import</span>
      <div hellProgress aria-label="Profile import" [value]="33">
        <div hellProgressBar></div>
      </div>
    </div>

    <div class="grid gap-1">
      <span class="text-sm font-medium">Media processing</span>
      <div hellProgress aria-label="Media processing" [value]="66">
        <div hellProgressBar></div>
      </div>
    </div>

    <div class="grid gap-1">
      <span class="text-sm font-medium">Backup complete</span>
      <div hellProgress aria-label="Backup complete" [value]="100">
        <div hellProgressBar></div>
      </div>
    </div>
  `,
})
export class ProgressExamplesExample {}
