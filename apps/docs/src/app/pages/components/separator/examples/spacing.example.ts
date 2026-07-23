import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellSeparator } from 'hell-ui/separator';
import type { HellSize } from 'hell-ui/core';

const SPACING_OPTIONS: Array<HellSize | 'none'> = ['none', 'xs', 'sm', 'md', 'lg', 'xl'];

@Component({
  selector: 'app-separator-spacing-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSeparator],
  template: `
    @for (s of spacingOptions; track s) {
      <div class="hd-muted text-xs">{{ s }}</div>
      <div hellSeparator [spacing]="s"></div>
    }
  `,
})
export class SeparatorSpacingExample {
  protected readonly spacingOptions = SPACING_OPTIONS;
}
