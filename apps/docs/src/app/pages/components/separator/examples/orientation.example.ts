import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellSeparator } from 'hell-ui/separator';

@Component({
  selector: 'app-separator-orientation-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSeparator],
  template: `
    <p class="m-0">Section A</p>
    <div hellSeparator orientation="horizontal"></div>
    <p class="m-0">Section B</p>

    <div class="mt-4 flex h-8 items-center">
      <span>Left</span>
      <div hellSeparator orientation="vertical"></div>
      <span>Middle</span>
      <div hellSeparator orientation="vertical"></div>
      <span>Right</span>
    </div>
  `,
})
export class SeparatorOrientationExample {}
