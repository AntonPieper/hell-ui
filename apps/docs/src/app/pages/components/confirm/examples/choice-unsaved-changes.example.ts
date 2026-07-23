import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellButton } from 'hell-ui/button';
import { injectHellPrompt } from 'hell-ui/confirm';
import { HellInput } from 'hell-ui/input';

@Component({
  selector: 'app-confirm-choice-unsaved-changes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellInput],
  template: `
    <div class="flex w-full max-w-[360px] flex-col items-start gap-hell-3">
      <label class="flex w-full flex-col gap-hell-1 text-[13px] text-hell-foreground">
        Release note
        <input
          hellInput
          type="text"
          [value]="draft()"
          (input)="draft.set($any($event.target).value)"
        />
      </label>
      <button hellButton type="button" (click)="closeEditor()">Close editor</button>
      <p class="text-[13px] text-hell-foreground-muted" aria-live="polite">{{ status() }}</p>
    </div>
  `,
})
export class ConfirmChoiceUnsavedChangesExample {
  private readonly prompt = injectHellPrompt();

  private savedValue = 'Ship dark mode';
  protected readonly draft = signal(this.savedValue);
  protected readonly status = signal('Editor open.');

  protected async closeEditor(): Promise<void> {
    if (this.draft() === this.savedValue) {
      this.status.set('Editor closed — no changes.');
      return;
    }

    const decision = await this.prompt.choose<'save' | 'discard' | 'stay'>(
      {
        title: 'You have unsaved changes',
        description: 'Save them, discard them, or keep editing.',
      },
      [
        { value: 'save', label: 'Save and close', variant: 'primary' },
        { value: 'discard', label: 'Discard changes', variant: 'danger' },
        { value: 'stay', label: 'Keep editing', dismissEquivalent: true },
      ],
    );

    switch (decision) {
      case 'save':
        this.savedValue = this.draft();
        this.status.set('Changes saved — editor closed.');
        break;
      case 'discard':
        this.draft.set(this.savedValue);
        this.status.set('Changes discarded — editor closed.');
        break;
      default:
        this.status.set('Still editing.'); // 'stay' — Escape and backdrop land here too
    }
  }
}
