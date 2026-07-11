import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HellSaveBar } from '@hell-ui/angular/save-bar';
import {
  hellDestructiveAction,
  hellSecondaryAction,
  injectHellConfirm,
} from '@hell-ui/angular/confirm';
import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/field';
import { HellInput } from '@hell-ui/angular/input';

@Component({
  selector: 'app-save-bar-confirm-discard-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ...HELL_FIELD_DIRECTIVES, HellInput, HellSaveBar],
  template: `
    <div class="flex flex-col gap-hell-4">
      <div hellField>
        <label hellFieldLabel for="announcement-text">Announcement</label>
        <input
          hellInput
          id="announcement-text"
          type="text"
          [formControl]="form.controls.announcement"
        />
        <div hellFieldDescription>
          Edit the text, then press Discard — the confirm function guards the reset.
        </div>
      </div>

      <hell-save-bar
        [dirty]="form.dirty"
        [busy]="saving()"
        (saved)="save()"
        (discarded)="confirmDiscard()"
      />
    </div>
  `,
})
export class SaveBarConfirmDiscardExample {
  private readonly confirm = injectHellConfirm();
  private readonly initialValue = { announcement: 'Maintenance window on Friday 22:00' };

  protected readonly form = new FormGroup({
    announcement: new FormControl(this.initialValue.announcement, { nonNullable: true }),
  });

  protected readonly saving = signal(false);

  protected save(): void {
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.form.markAsPristine();
    }, 900);
  }

  protected async confirmDiscard(): Promise<void> {
    const confirmed = await this.confirm(
      {
        title: 'Discard unsaved changes?',
        description: 'Your edits to this announcement will be lost.',
      },
      hellDestructiveAction('Discard changes'),
      hellSecondaryAction('Keep editing'),
    );
    if (confirmed) this.form.reset(this.initialValue);
  }
}
