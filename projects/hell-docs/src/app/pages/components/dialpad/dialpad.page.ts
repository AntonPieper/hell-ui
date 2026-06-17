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
        Telephony dialpad with key letters, used in CTI / VoIP applications. Users can tap, click,
        focus the number field, or type digits from the keyboard.
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
        <li><code>disabled</code>: disables the dial pad controls</li>
        <li><code>readOnly</code>: keeps the value readable and callable while preventing edits</li>
        <li><code>invalid</code>: marks the value invalid with <code>aria-invalid</code></li>
        <li>
          <code>showCallButton</code>: render the primary call action (default <code>true</code>)
        </li>
        <li><code>(digit)</code>: emits the pressed key</li>
        <li><code>(valueChange)</code>: emits the running number</li>
        <li><code>(call)</code>: emits current number when the call button is pressed</li>
      </ul>

      <h2>Keyboard</h2>
      <ul>
        <li>Digit keys, <code>*</code>, <code>#</code>, and <code>+</code> append to the value.</li>
        <li><code>Backspace</code> removes one character; <code>Delete</code> clears the value.</li>
        <li><code>Enter</code> emits <code>(call)</code> when the number field has focus.</li>
        <li>Press and hold <code>0</code> with touch or pointer input to enter <code>+</code>.</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use for phone-like numeric entry and DTMF flows.</li>
        <li>Listen to <code>digit</code> for tones and <code>valueChange</code> for form state.</li>
        <li>Keep call, clear, and delete actions visually separated from number entry.</li>
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
