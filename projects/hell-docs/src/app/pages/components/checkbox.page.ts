import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellCheckbox } from 'hell';

@Component({
  selector: 'hd-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellCheckbox],
  template: `
    <article class="hd-prose">
      <h1>Checkbox</h1>
      <p>Two- or three-state checkbox. Bind <code>checked</code> and listen
        for <code>checkedChange</code>; <code>indeterminate</code> is also
        supported for parent/child group patterns.</p>

      <h2>Example</h2>
      <div class="hd-example" style="display:grid; gap:0.5rem">
        <label style="display:inline-flex; align-items:center; gap:0.5rem">
          <hell-checkbox
            [checked]="agree()"
            (checkedChange)="agree.set($event)"
          />
          I agree to the terms
        </label>
        <label style="display:inline-flex; align-items:center; gap:0.5rem">
          <hell-checkbox indeterminate />
          Indeterminate (parent of mixed children)
        </label>
        <label style="display:inline-flex; align-items:center; gap:0.5rem; opacity:0.6">
          <hell-checkbox disabled />
          Disabled
        </label>
        <label style="display:inline-flex; align-items:center; gap:0.5rem">
          <hell-checkbox checked disabled />
          Disabled, checked
        </label>
      </div>

      <p>Current value: <code>{{ agree() }}</code></p>

      <h2>API</h2>
      <ul>
        <li><code>checked</code>, <code>checkedChange</code></li>
        <li><code>indeterminate</code>, <code>indeterminateChange</code></li>
        <li><code>disabled</code>, <code>required</code></li>
      </ul>
    </article>
  `,
})
export class CheckboxPage {
  protected readonly agree = signal(false);
}
