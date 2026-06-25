import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellInput, HellNativeSelect, HellTextarea } from '@hell-ui/angular/input';

@Component({
  selector: 'app-input-customization-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellInput, HellNativeSelect, HellTextarea],
  template: `
    <input
      hellInput
      ui="rounded-hell-pill border-hell-info bg-hell-info-soft px-hell-5"
      placeholder="Search tickets"
      aria-label="Search tickets"
    />

    <select
      hellNativeSelect
      ui="rounded-hell-pill border-hell-primary bg-hell-primary-soft"
      aria-label="Priority"
    >
      <option>Priority</option>
      <option>Urgent</option>
      <option>Routine</option>
    </select>

    <textarea
      hellTextarea
      ui="min-h-28 rounded-hell-lg border-hell-success bg-hell-success-soft resize-none"
      rows="3"
      placeholder="Internal note"
      aria-label="Internal note"
    ></textarea>
  `,
})
export class InputCustomizationExample {}
