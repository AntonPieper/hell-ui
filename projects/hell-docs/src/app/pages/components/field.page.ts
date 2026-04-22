import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_FIELD_DIRECTIVES, HellInput } from 'hell';

@Component({
  selector: 'hd-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_DIRECTIVES, HellInput],
  template: `
    <article class="hd-prose">
      <h1>Field</h1>
      <p>A form-field shell that wires <code>label</code>,
        <code>description</code> and <code>error</code> elements to the
        control inside it via the underlying form-field primitive — no manual
        <code>id</code>/<code>for</code> matching needed.</p>

      <h2>Example</h2>
      <div class="hd-example" style="display:grid; gap:1rem; max-width:380px">
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
      </div>

      <h2>Anatomy</h2>
      <ul>
        <li><code>hellField</code> — wrapper</li>
        <li><code>hellFieldLabel</code> — visible label, auto-linked to the control</li>
        <li><code>hellFieldDescription</code> — neutral helper text</li>
        <li><code>hellFieldError</code> — error message, only shown when applicable in your form layer</li>
      </ul>
    </article>
  `,
})
export class FieldPage {}
