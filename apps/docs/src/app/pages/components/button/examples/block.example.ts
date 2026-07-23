import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellButton } from 'hell-ui/button';

@Component({
  selector: 'app-button-block-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton],
  template: `
    <div class="grid max-w-xs gap-2">
      <button hellButton variant="primary" type="button" block>Continue</button>
      <button hellButton variant="ghost" type="button" block>Cancel</button>
    </div>
  `,
})
export class ButtonBlockExample {}
