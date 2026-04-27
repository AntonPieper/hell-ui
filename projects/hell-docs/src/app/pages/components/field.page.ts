import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import {
  HELL_FIELD_DIRECTIVES,
  HellCheckbox,
  HellDateInput,
  HellInput,
  HellSelect,
  HellSwitch,
} from 'hell';

@Component({
  selector: 'hd-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...HELL_FIELD_DIRECTIVES,
    HellInput,
    HellSelect,
    HellCheckbox,
    HellSwitch,
    HellDateInput,
  ],
  template: `
    <article class="hd-prose">
      <h1>Field</h1>
      <p>A form-field shell that wires <code>label</code>,
        <code>description</code> and <code>error</code> elements to the
        control inside it via the underlying form-field primitive — no manual
        <code>id</code>/<code>for</code> matching needed. Use it around
        <em>every</em> control in your forms; it gives you a clickable label,
        accessible description / error wiring, and consistent spacing for
        free.</p>

      <h2>Vertical (default)</h2>
      <div class="hd-example grid max-w-md gap-4">
        <div hellField>
          <label hellFieldLabel>Email</label>
          <input hellInput type="email" placeholder="you@company.com" />
          <div hellFieldDescription>We never share this.</div>
        </div>

        <div hellField>
          <label hellFieldLabel>Password</label>
          <input hellInput type="password" invalid placeholder="••••••••" />
          <div hellFieldError>Password must be at least 8 characters.</div>
        </div>

        <div hellField>
          <label hellFieldLabel>Role</label>
          <select hellSelect>
            <option>Admin</option>
            <option>Editor</option>
            <option>Viewer</option>
          </select>
          <div hellFieldDescription>Native selects use the same field wiring.</div>
        </div>

        <div hellField>
          <label hellFieldLabel>Birthday</label>
          <hell-date-input
            [date]="birthday()"
            (dateChange)="birthday.set($event)"
          />
          <div hellFieldDescription>Type or pick from the calendar.</div>
        </div>
      </div>

      <h2>Horizontal</h2>
      <p>For checkboxes, switches, or any control that pairs naturally with
        a single inline label.</p>
      <div class="hd-example grid max-w-md gap-2">
        <div hellField orientation="horizontal">
          <button
            hellCheckbox
            [checked]="agree()"
            (checkedChange)="agree.set($event)"
          ></button>
          <label hellFieldLabel>I agree to the terms</label>
          <div hellFieldDescription>You can revoke at any time.</div>
        </div>

        <div hellField orientation="horizontal">
          <button
            hellSwitch
            [checked]="notify()"
            (checkedChange)="notify.set($event)"
          ></button>
          <label hellFieldLabel>Email notifications</label>
        </div>
      </div>

      <h2>API</h2>
      <ul>
        <li><code>hellField</code>: wrapper. <code>orientation</code> is <code>vertical | horizontal</code>; <code>unstyled</code> opts out of spacing.</li>
        <li><code>hellFieldLabel</code>: visible label, auto-linked to the control. Clicking it focuses or toggles the control.</li>
        <li><code>hellFieldDescription</code>: neutral helper text announced by assistive tech.</li>
        <li><code>hellFieldError</code>: error text announced by assistive tech when present.</li>
        <li>Import the bundle via <code>HELL_FIELD_DIRECTIVES</code>.</li>
      </ul>
    </article>
  `,
})
export class FieldPage {
  protected readonly birthday = signal<Date | null>(null);
  protected readonly agree = signal(false);
  protected readonly notify = signal(true);
}
