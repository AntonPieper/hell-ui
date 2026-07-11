import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HellSaveBar } from '@hell-ui/angular/save-bar';
import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/field';
import { HellInput } from '@hell-ui/angular/input';

@Component({
  selector: 'app-save-bar-form-submit-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ...HELL_FIELD_DIRECTIVES, HellInput, HellSaveBar],
  template: `
    <!-- saveType="submit" wires the built-in Save to native form submission, so
         pressing Enter in a field also saves. Handle (ngSubmit), not (saved).
         message overrides the Label Contract for this one surface. -->
    <form [formGroup]="form" (ngSubmit)="save()" class="flex flex-col gap-hell-4">
      <div hellField>
        <label hellFieldLabel for="fax-recipient">Recipient</label>
        <input hellInput id="fax-recipient" type="text" [formControl]="form.controls.recipient" />
      </div>
      <div hellField>
        <label hellFieldLabel for="fax-subject">Subject</label>
        <input hellInput id="fax-subject" type="text" [formControl]="form.controls.subject" />
        <div hellFieldDescription>Edit a field, then press Enter — the bar's Save submits the form.</div>
      </div>

      <hell-save-bar
        saveType="submit"
        size="md"
        message="You have an unsent fax"
        [dirty]="form.dirty"
        [disabled]="form.invalid || form.pending"
        [busy]="saving()"
        (discarded)="discard()"
      />
    </form>
  `,
})
export class SaveBarFormSubmitExample {
  private readonly initialValue = { recipient: '+1 555 0100', subject: 'Monthly invoice' };

  protected readonly form = new FormGroup({
    recipient: new FormControl(this.initialValue.recipient, { nonNullable: true }),
    subject: new FormControl(this.initialValue.subject, { nonNullable: true }),
  });

  protected readonly saving = signal(false);

  protected save(): void {
    this.saving.set(true);
    // Simulated request; the consumer owns the mutation and clears busy/dirty.
    setTimeout(() => {
      this.saving.set(false);
      this.form.markAsPristine();
    }, 900);
  }

  protected discard(): void {
    this.form.reset(this.initialValue);
  }
}
