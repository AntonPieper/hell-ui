import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_CARD_DIRECTIVES, HellSeparator } from 'hell/primitives';

@Component({
  selector: 'app-separator-spacing-options-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSeparator],
  template: `
    @for (s of ['none', 'xs', 'sm', 'md', 'lg', 'xl']; track s) {
      <div class="hd-muted text-xs">{{ s }}</div>
      <div hellSeparator [spacing]="$any(s)"></div>
    }
  `,
})
export class SeparatorSpacingOptionsExample {}
