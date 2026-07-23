import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellProgress, HellProgressBar } from 'hell-ui/progress';

@Component({
  selector: 'app-progress-all-parts-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellProgress, HellProgressBar],
  template: `
    <!-- HellProgress and HellProgressBar each own a single 'root' part — -->
    <!-- refine the track through hellProgress's ui and the fill through hellProgressBar's ui. -->
    <div
      hellProgress
      aria-label="Deployment progress"
      [value]="80"
      ui="h-hell-3 rounded-hell-md bg-hell-primary-soft"
    >
      <div hellProgressBar [ui]="{ root: 'bg-hell-success' }"></div>
    </div>
  `,
})
export class ProgressAllPartsStylingExample {}
