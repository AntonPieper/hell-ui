import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormField, form, required, validate } from '@angular/forms/signals';

import { HellTimeInput, type HellTimeValue } from 'hell-ui/time-input';
import { HELL_FIELD_IMPORTS } from 'hell-ui/field';

@Component({
  selector: 'app-time-input-forms-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_IMPORTS, FormField, HellTimeInput],
  template: `
    <div hellField>
      <label hellFieldLabel for="forms-start-time">Start time</label>
      <input
        id="forms-start-time"
        hellTimeInput
        placeholder="HH:mm"
        [formField]="scheduleForm.start"
      />
      <div hellFieldDescription>
        Service window 08:00–18:00: the schema's <code>validate</code> rule owns range policy,
        and a committed unparseable draft reports an <code>invalidTimeInputDraft</code> parse
        error to this field.
      </div>
    </div>
    <p class="hd-note" data-time-input-forms-state>
      Committed: {{ format(scheduleForm.start().value()) }} · touched:
      {{ scheduleForm.start().touched() }} · errors: {{ errorKinds() || 'none' }}
    </p>
  `,
})
export class TimeInputFormsExample {
  protected readonly model = signal<{ start: HellTimeValue | null }>({
    start: { hour: 9, minute: 30, second: 0 },
  });
  protected readonly scheduleForm = form(this.model, (path) => {
    required(path.start);
    // Structured times have no minDate()/maxDate() equivalent, so range policy
    // stays a form-owned schema rule instead of reserved min/max metadata.
    validate(path.start, ({ value }) => {
      const committed = value();
      if (!committed) return undefined;
      return committed.hour >= 8 && committed.hour < 18
        ? undefined
        : { kind: 'outOfRangeTime' };
    });
  });
  protected readonly errorKinds = computed(() =>
    this.scheduleForm
      .start()
      .errors()
      .map((error) => error.kind)
      .join(', '),
  );

  protected format(value: HellTimeValue | null): string {
    if (!value) return 'null';
    const pad = (part: number) => part.toString().padStart(2, '0');
    return `${pad(value.hour)}:${pad(value.minute)}`;
  }
}
