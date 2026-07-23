import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellSeparator } from 'hell-ui/separator';

@Component({
  selector: 'app-separator-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSeparator],
  template: `
    <p class="m-0">Section A</p>
    <div hellSeparator></div>
    <p class="m-0">Section B</p>
  `,
})
export class SeparatorBasicExample {}
