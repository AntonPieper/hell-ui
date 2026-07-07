import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellProgress, HellProgressBar } from '@hell-ui/angular/progress';

@Component({
  selector: 'app-progress-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellProgress, HellProgressBar],
  template: `
    <div hellProgress aria-label="Upload progress" [value]="66">
      <div hellProgressBar></div>
    </div>
  `,
})
export class ProgressBasicExample {}
