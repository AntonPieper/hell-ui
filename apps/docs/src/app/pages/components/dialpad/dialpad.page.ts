import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { DialpadAllPartsStylingExample } from './examples/all-parts-styling.example';
import dialpadAllPartsStylingExampleCodeRaw from './examples/all-parts-styling.example.ts?raw' with {
  loader: 'text',
};
import { DialpadBasicExample } from './examples/basic.example';
import dialpadBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { DialpadCallConsoleExample } from './examples/call-console.example';
import dialpadCallConsoleExampleCodeRaw from './examples/call-console.example.ts?raw' with {
  loader: 'text',
};
import { DialpadStatesExample } from './examples/states.example';
import dialpadStatesExampleCodeRaw from './examples/states.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-dialpad',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    PageHeader,
    DialpadBasicExample,
    DialpadStatesExample,
    DialpadCallConsoleExample,
    DialpadAllPartsStylingExample,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Dialpad"
        icon="faSolidPhone"
        category="Feature"
        importPath="@hell-ui/angular/features/dialpad"
        stylesPath="@hell-ui/angular/features/dialpad/styles.css"
      >
        A phone-style keypad for entering and calling a number, with owned display, key, and
        action anatomy end to end.
      </hd-page-header>
      <p>
        <code>HellDialpad</code> is a Composite for telephony and CTI/VoIP number entry: a
        read-only-capable display, a 1-9/*/0/# key grid with letter hints, backspace/clear
        controls, and an optional call action. It renders native buttons and a real
        <code>&lt;input type="tel"&gt;</code> internally rather than exposing a directive suite,
        because each control needs its own dedicated Public Part.
      </p>
      <p>
        Use it wherever an app needs numeric dial entry rather than a general-purpose numeric
        field: an outbound calling panel, an IVR test console, or a softphone widget. It works
        uncontrolled out of the box — tap keys or type on the keyboard and read
        <code>(valueChange)</code> — or controlled by binding <code>[value]</code> for scripted or
        externally-driven digits (for example, replaying a number from a call log).
      </p>
      <p>
        Like the code editor and PDF viewer, the dialpad ships behind an optional feature entry
        point (<code>&#64;hell-ui/angular/features/dialpad</code>), so telephony markup only travels
        with the apps that opt into it rather than the core import surface.
      </p>

      <h2>Basic</h2>
      <p>The default anatomy needs no configuration — drop in the component and listen to outputs.</p>
      <hd-example-tabs [code]="dialpadBasicExampleCode">
        <app-dialpad-basic-example />
      </hd-example-tabs>

      <h2>States</h2>
      <p>
        <code>disabled</code> blocks every control, <code>readOnly</code> keeps the number visible
        and callable while blocking edits, <code>invalid</code> marks the display for styling and
        <code>aria-invalid</code>, and <code>showCallButton</code> hides the call action for
        keypad-only usage such as DTMF tone entry during an active call.
      </p>
      <hd-example-tabs [code]="dialpadStatesExampleCode">
        <app-dialpad-states-example />
      </hd-example-tabs>

      <h2>With button and card</h2>
      <p>
        A small call console: the dialpad supplies the number, a <code>hellCard</code> gives it a
        titled surface with a status <code>hellTag</code>, and <code>hellButton</code> drives the
        dial/hang-up action. The dialpad switches to <code>readOnly</code> once a call starts so
        the number stays visible without accepting edits mid-call.
      </p>
      <hd-example-tabs [code]="dialpadCallConsoleExampleCode">
        <app-dialpad-call-console-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        <code>HellDialpad</code> is a single module with twelve Public Parts. Pass
        <code>ui="..."</code> as shorthand to refine the default <code>root</code> part, or
        <code>[ui]="&#123; ... &#125;"</code> with a <code>HellDialpadUi</code> map to target any
        combination of the named parts below. Refinements merge on top of the built-in Tailwind
        recipe through Hell's Tailwind merge, so they win deterministically over conflicting
        recipe classes.
      </p>
      <table class="hd-doc-table">
        <thead>
          <tr>
            <th>Part</th>
            <th>Styles</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>root</code></td>
            <td>The host element — max width, gap, and disabled/focus-ring styling.</td>
          </tr>
          <tr>
            <td><code>display</code></td>
            <td>The label+input wrapper rendered as a <code>&lt;label&gt;</code>.</td>
          </tr>
          <tr>
            <td><code>displayLabel</code></td>
            <td>The small "Number" caption above the entered digits.</td>
          </tr>
          <tr>
            <td><code>numberInput</code></td>
            <td>The <code>&lt;input type="tel"&gt;</code> showing the entered number.</td>
          </tr>
          <tr>
            <td><code>controls</code></td>
            <td>The row grouping the clear and backspace buttons above the key grid.</td>
          </tr>
          <tr>
            <td><code>clearButton</code></td>
            <td>The text button that clears the whole number.</td>
          </tr>
          <tr>
            <td><code>backspaceButton</code></td>
            <td>The icon-only button that removes the last digit.</td>
          </tr>
          <tr>
            <td><code>grid</code></td>
            <td>The 3-column grid holding the 1-9 key buttons.</td>
          </tr>
          <tr>
            <td><code>keyButton</code></td>
            <td>Every individual key button, in both the main grid and the lower row.</td>
          </tr>
          <tr>
            <td><code>digit</code></td>
            <td>The large digit glyph inside a key button.</td>
          </tr>
          <tr>
            <td><code>letters</code></td>
            <td>The small letter hint under a digit (for example "ABC" under 2).</td>
          </tr>
          <tr>
            <td><code>lowerGrid</code></td>
            <td>The 3-column grid holding the <code>*</code>, <code>0</code>, and <code>#</code> keys.</td>
          </tr>
          <tr>
            <td><code>callButton</code></td>
            <td>The primary call action rendered below the keys.</td>
          </tr>
        </tbody>
      </table>
      <p>
        Template <code>class</code> still works for layout hooks and non-conflicting utilities,
        but prefer <code>ui</code> whenever a refinement needs to win over a recipe class such as
        <code>bg-hell-surface-elevated</code> or <code>rounded-hell-md</code>.
      </p>
      <hd-example-tabs [code]="dialpadAllPartsStylingExampleCode">
        <app-dialpad-all-parts-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>value</code>: <code>string | null | undefined</code>. Controlled number; leave nullish to let the dialpad keep local state. Default <code>null</code>.</li>
        <li><code>disabled</code>: <code>boolean</code>. Disables every control and sets <code>aria-disabled</code>/<code>data-disabled</code>. Default <code>false</code>.</li>
        <li><code>readOnly</code>: <code>boolean</code>. Keeps the number visible and callable while blocking edits; sets <code>data-readonly</code>. Default <code>false</code>.</li>
        <li><code>invalid</code>: <code>boolean</code>. Marks the display invalid for styling and sets <code>aria-invalid</code>/<code>data-invalid</code>. Default <code>false</code>.</li>
        <li><code>showCallButton</code>: <code>boolean</code>. Renders the primary call action below the keys. Default <code>true</code>.</li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;HellDialpadPart&gt;</code> — a shorthand class
          string refining <code>root</code>, or a <code>HellDialpadUi</code> map keyed by any of
          the twelve public parts.
        </li>
        <li><code>(digit)</code>: <code>EventEmitter&lt;string&gt;</code>. Emits each pressed key, including <code>*</code>, <code>#</code>, and held <code>+</code>.</li>
        <li><code>(valueChange)</code>: <code>EventEmitter&lt;string&gt;</code>. Emits the full number after every edit.</li>
        <li><code>(call)</code>: <code>EventEmitter&lt;string&gt;</code>. Emits the current number when the call action fires (button click or Enter).</li>
        <li>
          Exported types: <code>HellDialpadPart</code> (the twelve parts above),
          <code>HellDialpadUi</code> (<code>HellUi&lt;HellDialpadPart&gt;</code>),
          <code>HellDialpadLabels</code>, <code>HELL_DIALPAD_LABELS</code> injection token, and
          <code>provideHellLabels(HELL_DIALPAD_LABELS, …)</code> for overriding the group, number, backspace,
          clear, call, and per-key accessible labels.
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>The host has <code>role="group"</code> and an <code>aria-label</code> from the Label Contract (default "Dial pad").</li>
        <li>The number display is a real <code>&lt;input type="tel"&gt;</code> with its own <code>aria-label</code>, so it accepts typing, paste, and screen-reader interaction like any text field.</li>
        <li>Every key, the clear/backspace controls, and the call button are native <code>&lt;button&gt;</code> elements with <code>aria-label</code>s — digit keys announce their letters (for example "Digit 2, ABC"), <code>*</code> announces "Star", <code>#</code> announces "Pound", and <code>0</code> announces the hold-for-plus affordance.</li>
        <li>Keyboard support works from the host or the number input: digits, <code>*</code>, <code>#</code>, and <code>+</code> append to the value; <code>Backspace</code> removes one character; <code>Delete</code> clears the value; <code>Enter</code> triggers <code>(call)</code> when the call button is shown and a value is present.</li>
        <li>Press-and-hold <code>0</code> with pointer or touch input enters <code>+</code> instead of <code>0</code>; there is no separate <code>+</code> key in the layout.</li>
        <li><code>disabled</code> sets <code>aria-disabled="true"</code> on the host and disables every native control; <code>invalid</code> sets <code>aria-invalid="true"</code> on both the host and the number input.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use for phone-style numeric entry and DTMF/dial flows, not general numeric forms.</li>
        <li>Listen to <code>(digit)</code> for per-key tones or logging, and <code>(valueChange)</code> for the running number in form state.</li>
        <li>Set <code>readOnly</code> instead of <code>disabled</code> once a call connects, so the number stays visible and callable.</li>
        <li>Override labels with <code>provideHellLabels(HELL_DIALPAD_LABELS, …)</code> for localized apps instead of restyling text nodes.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't use <code>disabled</code> to "pause" a live call — it also blocks the call action; use <code>readOnly</code> instead.</li>
        <li>Don't hide the entered digits when users must verify the number before dialing.</li>
        <li>Don't target undocumented descendants — style through the twelve named parts and their <code>data-slot</code> selectors.</li>
      </ul>
    </article>
  `,
})
export class DialpadPage {
  protected readonly dialpadBasicExampleCode = dialpadBasicExampleCodeRaw;
  protected readonly dialpadStatesExampleCode = dialpadStatesExampleCodeRaw;
  protected readonly dialpadCallConsoleExampleCode = dialpadCallConsoleExampleCodeRaw;
  protected readonly dialpadAllPartsStylingExampleCode = dialpadAllPartsStylingExampleCodeRaw;
}
