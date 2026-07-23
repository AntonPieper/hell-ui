import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellProgress, HellProgressBar } from 'hell-ui/progress';

@Component({
  selector: 'app-progress-thickness-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellProgress, HellProgressBar],
  template: `
    <div class="grid gap-3">
      <div hellProgress aria-label="Thin track" [value]="70" ui="h-hell-1">
        <div hellProgressBar></div>
      </div>
      <div hellProgress aria-label="Default track" [value]="70">
        <div hellProgressBar></div>
      </div>
      <div hellProgress aria-label="Thick track" [value]="70" ui="h-hell-3">
        <div hellProgressBar></div>
      </div>
    </div>
  `,
})
export class ProgressThicknessExample {}
