import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_CARD_DIRECTIVES } from '@hell-ui/angular/card';
import { HellProgress, HellProgressBar } from '@hell-ui/angular/progress';
import { HellTag } from '@hell-ui/angular/tag';

@Component({
  selector: 'app-progress-with-job-status-card-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_CARD_DIRECTIVES, HellProgress, HellProgressBar, HellTag],
  template: `
    <div hellCard class="max-w-95" [elevation]="1">
      <div hellCardHeader>
        <span>Nightly export</span>
        <span hellTag variant="info">Running</span>
      </div>
      <div hellCardBody class="flex flex-col gap-2">
        <p class="hd-muted text-sm">Exporting 42,000 invoices to the warehouse bucket.</p>
        <div class="flex justify-between text-sm font-medium">
          <span id="export-label">Rows exported</span>
          <span>72%</span>
        </div>
        <div hellProgress aria-labelledby="export-label" [value]="72">
          <div hellProgressBar></div>
        </div>
      </div>
    </div>
  `,
})
export class ProgressWithJobStatusCardExample {}
