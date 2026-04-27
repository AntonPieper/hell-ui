import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HELL_FIELD_DIRECTIVES, HellTimeInput } from 'hell';

@Component({
  selector: 'app-time-input-placeholder-and-labels-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_DIRECTIVES, HellTimeInput],
  template: `
    <hell-time-input placeholder="09:00" aria-label="Start time" />
    <p class="hd-note">
      Use <code>aria-label</code> when no visible <code>hellFieldLabel</code> is present.
    </p>
  `,
})
export class TimeInputPlaceholderAndLabelsExample {
  protected readonly value = signal<string | null>('14:30');
  protected readonly small = signal<string | null>('09:00');
  protected readonly large = signal<string | null>('17:30');
  protected readonly precise = signal<string | null>('12:34:56');
}
