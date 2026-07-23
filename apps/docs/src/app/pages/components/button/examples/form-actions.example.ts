import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellButton } from 'hell-ui/button';
import { HELL_FIELD_IMPORTS } from 'hell-ui/field';
import { HellInput } from 'hell-ui/input';

@Component({
  selector: 'app-button-form-actions-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellInput, ...HELL_FIELD_IMPORTS],
  template: `
    <form class="grid max-w-sm gap-4" (submit)="$event.preventDefault(); saving.set(true)">
      <div hellField>
        <label hellFieldLabel for="team-name">Team name</label>
        <input id="team-name" hellInput [value]="teamName()" (input)="teamName.set($any($event.target).value)" />
        <div hellFieldDescription>Shown on invoices and shared reports.</div>
      </div>

      <div class="flex justify-end gap-2">
        <button hellButton variant="ghost" type="button">Cancel</button>
        <button hellButton variant="primary" type="submit" [disabled]="saving()">
          {{ saving() ? 'Saving…' : 'Save changes' }}
        </button>
      </div>
    </form>
  `,
})
export class ButtonFormActionsExample {
  protected readonly teamName = signal('Acme Logistics');
  protected readonly saving = signal(false);
}
