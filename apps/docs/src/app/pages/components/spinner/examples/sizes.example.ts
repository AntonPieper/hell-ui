import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellSpinner } from 'hell-ui/spinner';

@Component({
  selector: 'app-spinner-sizes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSpinner],
  template: `
    <span hellSpinner size="xs"></span>
    <span hellSpinner size="sm"></span>
    <span hellSpinner size="md"></span>
    <span hellSpinner size="lg"></span>
    <span hellSpinner size="xl"></span>
    <span hellSpinner class="text-[64px]"></span>
  `,
})
export class SpinnerSizesExample {}
