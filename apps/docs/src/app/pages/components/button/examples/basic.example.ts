import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';

@Component({
  selector: 'app-button-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton],
  template: ` <button hellButton type="button">Save changes</button> `,
})
export class ButtonBasicExample {}
