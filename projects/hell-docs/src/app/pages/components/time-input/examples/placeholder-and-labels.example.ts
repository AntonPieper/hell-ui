import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellTimeInput } from '@hell-ui/angular/time-input';

@Component({
  selector: 'app-time-input-placeholder-and-labels-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellTimeInput],
  template: `
    <hell-time-input placeholder="09:00" aria-label="Start time" />
    <p class="hd-note">
      Use <code>aria-label</code> when no visible <code>hellFieldLabel</code> is present.
    </p>
  `,
})
export class TimeInputPlaceholderAndLabelsExample {}
