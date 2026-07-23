import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_FIELD_IMPORTS } from 'hell-ui/field';
import { HELL_CARD_IMPORTS } from 'hell-ui/card';
import { HellCheckbox } from 'hell-ui/checkbox';
import { HellInput } from 'hell-ui/input';
import { HellNativeSelect } from 'hell-ui/select';

@Component({
  selector: 'app-field-with-form-section-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_IMPORTS, ...HELL_CARD_IMPORTS, HellCheckbox, HellInput, HellNativeSelect],
  template: `
    <div hellCard class="max-w-md" [elevation]="0">
      <div hellCardHeader>Invite a teammate</div>
      <div hellCardBody class="grid gap-hell-4">
        <div hellField>
          <label hellFieldLabel for="section-email">Work email</label>
          <input id="section-email" hellInput type="email" placeholder="name@company.com" />
          <div hellFieldDescription>They'll get an invite link right away.</div>
        </div>

        <div hellField>
          <label hellFieldLabel for="section-role">Role</label>
          <select id="section-role" hellNativeSelect>
            <option>Member</option>
            <option>Admin</option>
            <option>Billing only</option>
          </select>
          <div hellFieldDescription>Controls what they can see and change.</div>
        </div>

        <div hellField orientation="horizontal">
          <button
            id="section-notify"
            hellCheckbox
            [checked]="notify()"
            (checkedChange)="notify.set($event)"
          ></button>
          <label hellFieldLabel for="section-notify">Notify them by email</label>
        </div>
      </div>
    </div>
  `,
})
export class FieldWithFormSectionExample {
  protected readonly notify = signal(true);
}
