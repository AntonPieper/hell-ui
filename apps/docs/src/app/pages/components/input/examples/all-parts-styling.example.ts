import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellInput, HellTextarea } from '@hell-ui/angular/input';
import { HellNativeSelect } from '@hell-ui/angular/select';

@Component({
  selector: 'app-input-all-parts-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellInput, HellNativeSelect, HellTextarea],
  template: `
    <input
      hellInput
      ui="rounded-hell-pill border-hell-info bg-hell-info-soft px-hell-5 text-hell-info"
      placeholder="Search tickets"
      aria-label="Search tickets"
    />

    <select
      hellNativeSelect
      ui="rounded-hell-pill border-hell-primary bg-hell-primary-soft text-hell-primary"
      aria-label="Priority"
    >
      <option>Priority</option>
      <option>Urgent</option>
      <option>Routine</option>
    </select>

    <textarea
      hellTextarea
      ui="min-h-28 rounded-hell-lg border-hell-success bg-hell-success-soft text-hell-success resize-none"
      rows="3"
      placeholder="Internal note"
      aria-label="Internal note"
    ></textarea>
  `,
})
export class InputAllPartsStylingExample {}
