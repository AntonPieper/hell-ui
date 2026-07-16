import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { injectHellPrompt } from '@hell-ui/angular/confirm';
import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/field';
import { HellInput } from '@hell-ui/angular/input';
import { HellSaveBar } from '@hell-ui/angular/save-bar';

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
          Edit the text, then press Discard — the Prompt Interface guards the reset.
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
  private readonly prompt = injectHellPrompt();
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
    const confirmed = await this.prompt.confirm(
      {
        title: 'Discard unsaved changes?',
        description: 'Your edits to this announcement will be lost.',
      },
      {
        action: { label: 'Discard changes', variant: 'danger' },
        cancelAction: { label: 'Keep editing', variant: 'default' },
      },
    );
    if (confirmed) this.form.reset(this.initialValue);
  }
}
