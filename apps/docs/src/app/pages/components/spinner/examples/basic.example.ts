import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellSpinner } from '@hell-ui/angular/spinner';

@Component({
  selector: 'app-spinner-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSpinner],
  template: ` <span hellSpinner></span> `,
})
export class SpinnerBasicExample {}
