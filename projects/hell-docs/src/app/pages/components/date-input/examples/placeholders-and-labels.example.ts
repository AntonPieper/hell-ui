import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellDateInput } from 'hell/composites';

@Component({
  selector: 'app-date-input-placeholders-and-labels-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDateInput],
  template: `
    <hell-date-input placeholder="2026-04-22" aria-label="Invoice date" [date]="null" />
    <p class="hd-note">
      Use <code>aria-label</code> when no visible <code>hellFieldLabel</code> is present.
    </p>
  `,
})
export class DateInputPlaceholdersAndLabelsExample {}
