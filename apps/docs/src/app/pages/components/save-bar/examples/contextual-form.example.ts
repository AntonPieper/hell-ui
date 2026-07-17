import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  type AbstractControl,
  type ValidationErrors,
} from '@angular/forms';
import { HellSaveBar } from '@hell-ui/angular/save-bar';
import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';
import { HellInput } from '@hell-ui/angular/input';

const required = (control: AbstractControl): ValidationErrors | null =>
  String(control.value ?? '').trim() ? null : { required: true };

const email = (control: AbstractControl): ValidationErrors | null =>
  /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(control.value ?? '')) ? null : { email: true };

@Component({
  selector: 'app-save-bar-contextual-form-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ...HELL_FIELD_IMPORTS, HellInput, HellSaveBar],
  template: `
    <!-- Even inside a <form>, the default Save (type="button") emits (saved)
         without submitting — no double-fire, no ngSubmit needed. -->
    <form [formGroup]="form" class="flex flex-col gap-hell-4">
      <div hellField>
        <label hellFieldLabel for="profile-name">Display name</label>
        <input hellInput id="profile-name" type="text" [formControl]="form.controls.name" />
      </div>
      <div hellField>
        <label hellFieldLabel for="profile-email">Email</label>
        <input hellInput id="profile-email" type="email" [formControl]="form.controls.email" />
        <div hellFieldDescription>Start typing — the save bar appears once the form is dirty.</div>
      </div>

      <!-- The one-line reactive-form binding: dirty, invalid/pending, busy. -->
      <hell-save-bar
        [dirty]="form.dirty"
        [disabled]="form.invalid || form.pending"
        [busy]="saving()"
        (saved)="save()"
        (discarded)="discard()"
      />
    </form>
  `,
})
export class SaveBarContextualFormExample {
  private readonly initialValue = { name: 'Mara Voss', email: 'mara.voss@example.com' };

  protected readonly form = new FormGroup({
    name: new FormControl(this.initialValue.name, { nonNullable: true, validators: [required] }),
    email: new FormControl(this.initialValue.email, {
      nonNullable: true,
      validators: [required, email],
    }),
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
