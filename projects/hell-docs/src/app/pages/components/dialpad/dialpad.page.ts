import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { DialpadExampleExample } from './examples/example.example';
import dialpadExampleExampleCodeRaw from './examples/example.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-dialpad',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, DialpadExampleExample],
  template: `
    <article class="hd-prose">
      <h1>Dialpad</h1>
      <p>
        Telephony dialpad with key letters, used in CTI / VoIP applications. Emits
        <code>(digit)</code> on every key press and <code>(valueChange)</code> with the running
        number.
      </p>

      <h2>Example</h2>
      <hd-example-tabs
        [code]="dialpadExampleExampleCode"
        previewClass="flex flex-wrap items-start gap-6"
      >
        <app-dialpad-example-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>value</code>: controlled mode</li>
        <li>
          <code>showCallButton</code>: render the primary call action (default <code>true</code>)
        </li>
        <li><code>(digit)</code>: emits the pressed key</li>
        <li><code>(valueChange)</code>: emits the running number</li>
        <li><code>(call)</code>: emits current number when the call button is pressed</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use for phone-like numeric entry and DTMF flows.</li>
        <li>Listen to <code>digit</code> for tones and <code>valueChange</code> for form state.</li>
        <li>Keep call actions visually separated from number entry.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't use dialpad for arbitrary numeric forms.</li>
        <li>Don't hide entered digits when users must verify the number.</li>
      </ul>
    </article>
  `,
})
export class DialpadPage {
  protected readonly dialpadExampleExampleCode = dialpadExampleExampleCodeRaw;
}
