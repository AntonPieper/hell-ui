import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { SwitchExamplesExample } from './examples/examples.example';
import switchExamplesExampleCodeRaw from './examples/examples.example.ts?raw' with {
  loader: 'text',
};
import { SwitchNativeExample } from './examples/native.example';
import switchNativeExampleCodeRaw from './examples/native.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, SwitchExamplesExample, SwitchNativeExample],
  template: `
    <article class="hd-prose">
      <h1>Switch</h1>
      <p>
        Use for binary on/off settings whose effect is applied immediately. For deferred values that
        are committed on submit, prefer <code>checkbox</code>. The host is a
        <code>&lt;button&gt;</code>, so wrapping in a <code>&lt;label&gt;</code> toggles it
        natively.
      </p>

      <h2>Examples</h2>
      <hd-example-tabs [code]="switchExamplesExampleCode" previewClass="grid gap-2 max-w-md">
        <app-switch-examples-example />
      </hd-example-tabs>

      <h2>Native path</h2>
      <hd-example-tabs [code]="switchNativeExampleCode" previewClass="grid gap-2 max-w-md">
        <app-switch-native-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>checked</code>, <code>checkedChange</code>, <code>disabled</code></li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use switches for immediate on/off settings.</li>
        <li>Keep labels outside the control and always visible.</li>
        <li>Use disabled only when the reason is clear nearby.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't use switches for submit-time choices; use Checkbox.</li>
        <li>Don't trigger destructive side effects without confirmation.</li>
      </ul>
    </article>
  `,
})
export class SwitchPage {
  protected readonly switchExamplesExampleCode = switchExamplesExampleCodeRaw;
  protected readonly switchNativeExampleCode = switchNativeExampleCodeRaw;
}
