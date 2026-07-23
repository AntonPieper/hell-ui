import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { SwitchAllPartsStylingExample } from './examples/all-parts-styling.example';
import switchAllPartsStylingExampleCodeRaw from './examples/all-parts-styling.example.ts?raw' with {
  loader: 'text',
};
import { SwitchBasicExample } from './examples/basic.example';
import switchBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { SwitchFormsExample } from './examples/forms.example';
import switchFormsExampleCodeRaw from './examples/forms.example.ts?raw' with {
  loader: 'text',
};
import { SwitchNativeExample } from './examples/native.example';
import switchNativeExampleCodeRaw from './examples/native.example.ts?raw' with {
  loader: 'text',
};
import { SwitchSettingsListExample } from './examples/settings-list.example';
import switchSettingsListExampleCodeRaw from './examples/settings-list.example.ts?raw' with {
  loader: 'text',
};
import { SwitchStatesExample } from './examples/states.example';
import switchStatesExampleCodeRaw from './examples/states.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    RouterLink,
    SwitchBasicExample,
    SwitchStatesExample,
    SwitchFormsExample,
    SwitchNativeExample,
    SwitchSettingsListExample,
    SwitchAllPartsStylingExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Switch"
        icon="faSolidToggleOff"
        category="Styled primitive"
        importPath="hell-ui/switch"
        stylesPath="hell-ui/switch/styles.css"
      >
        A binary on/off control whose effect applies immediately — no submit step.
      </hd-page-header>
      <p>
        <code>button[hellSwitch]</code> is a styled switch built on <code>ngpSwitch</code> from
        <code>ng-primitives</code>. Its <code>checked</code> state is one Angular model — bind it
        directly (<code>[checked]</code> plus <code>(checkedChange)</code>), two-way
        (<code>[(checked)]</code>), or through forms: it implements Signal Forms'
        <code>FormCheckboxControl</code> contract for <code>[formField]</code>, and the same
        model drives <code>formControl</code> and <code>ngModel</code> through Angular's built-in
        interoperability. Because the host is a native button, it is labelable out of the box —
        wrap it in a <code>&lt;label&gt;</code> or pair it with <code>hellFieldLabel</code> via
        <code>for</code>/<code>id</code>, and clicking the label toggles the switch with no
        extra wiring.
      </p>
      <p>
        Reach for Switch when toggling the control changes something right away — Wi-Fi, dark mode,
        a live feature flag. When the choice is only applied once a form is submitted, use
        <a routerLink="/components/checkbox">Checkbox</a> instead; both share the same visual
        language and Angular Forms integration, so swapping between them is a drop-in change.
        <code>input[type=&quot;checkbox&quot;][hellNativeSwitch]</code> is the native-input
        counterpart for when browser checkbox semantics, labels, and form tooling should own the
        control instead of a styled button.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="switchBasicExampleCode">
        <app-switch-basic-example />
      </hd-example-tabs>

      <h2>States</h2>
      <p>
        <code>checked</code> and <code>disabled</code> combine freely. A disabled switch keeps its
        current value visible — it never resets to off just because it can't be toggled.
      </p>
      <hd-example-tabs [code]="switchStatesExampleCode" previewClass="grid gap-2">
        <app-switch-states-example />
      </hd-example-tabs>

      <h2>Forms</h2>
      <p>
        The <code>checked</code> model is the switch's single committed-value authority, so all
        binding styles observe the same boolean. With Signal Forms, bind a field via
        <code>[formField]</code>: the field writes into <code>checked</code>, each user toggle
        updates the field exactly once, focus leaving the switch marks it touched, and the field's
        <code>disabled()</code> rules flow into the <code>disabled</code> input.
        <code>formControl</code> and <code>[(ngModel)]</code> keep working against the same model
        through Angular's Signal Forms interoperability — no <code>ControlValueAccessor</code> is
        involved anymore.
      </p>
      <p>
        Because <code>checked</code> is a model input, it no longer coerces static attribute
        strings: write <code>[checked]="true"</code> (a boolean binding), not a bare
        <code>checked</code> attribute. The <code>disabled</code> configuration input keeps its
        attribute coercion.
      </p>
      <hd-example-tabs [code]="switchFormsExampleCode">
        <app-switch-forms-example />
      </hd-example-tabs>

      <h2>Native path</h2>
      <p>
        <code>input[hellNativeSwitch]</code> is a directive on a real
        <code>&lt;input type="checkbox"&gt;</code> with <code>role="switch"</code> layered on top.
        It leans on the browser's own <code>checked</code>/<code>disabled</code> and Angular's
        built-in <code>CheckboxControlValueAccessor</code> instead of custom CVA wiring, and adds a
        <code>required</code> input reflected as <code>required</code>,
        <code>aria-required</code>, and <code>data-required</code> for native form validation.
      </p>
      <hd-example-tabs [code]="switchNativeExampleCode">
        <app-switch-native-example />
      </hd-example-tabs>

      <h2>With field and card</h2>
      <p>
        A device settings list combines <code>hellCard</code> for the container,
        <code>hellField</code> in horizontal orientation to pair each switch with its label and
        description, and a disabled, always-on row to show a setting that is currently locked by
        something else in the system.
      </p>
      <hd-example-tabs [code]="switchSettingsListExampleCode">
        <app-switch-settings-list-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        Both modules follow Hell's Part Style Map contract: pass <code>ui</code> as a string
        shorthand to refine the default <code>root</code> part, or pass a <code>[ui]</code> map to
        target named parts individually. Refinements merge on top of the default recipe through
        Hell's Tailwind merge, so a conflicting utility such as <code>bg-hell-danger</code> wins
        deterministically over the recipe's own <code>bg-hell-border-strong</code>.
      </p>
      <table class="hd-doc-table">
        <thead>
          <tr>
            <th>Module</th>
            <th>Part</th>
            <th>Styles</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>HellSwitch</code></td>
            <td><code>root</code></td>
            <td>The button host — track background, radius, focus ring, checked/disabled states.</td>
          </tr>
          <tr>
            <td><code>HellSwitch</code></td>
            <td><code>thumb</code></td>
            <td>The sliding circle inside the track, including its checked-position transform.</td>
          </tr>
          <tr>
            <td><code>HellNativeSwitch</code></td>
            <td><code>root</code></td>
            <td>The native <code>&lt;input&gt;</code> host — track background, radius, focus ring, checked/disabled states, and the CSS-drawn thumb.</td>
          </tr>
        </tbody>
      </table>
      <hd-example-tabs [code]="switchAllPartsStylingExampleCode">
        <app-switch-all-parts-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <p><code>button[hellSwitch]</code> (<code>HellSwitch</code>):</p>
      <ul>
        <li>
          <code>checked</code>: <code>ModelSignal&lt;boolean&gt;</code>. Default
          <code>false</code>. Supports <code>[checked]</code>, <code>[(checked)]</code>, and
          <code>(checkedChange)</code>; requires a boolean binding (no static-attribute string
          coercion).
        </li>
        <li>
          <code>disabled</code>: <code>boolean</code>. Default <code>false</code>. Also driven by
          bound forms.
        </li>
        <li>
          <code>(touch)</code>: emits when focus leaves the switch; Angular forms use it to mark
          the control touched.
        </li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;HellSwitchPart&gt;</code> — shorthand string
          refines <code>root</code>; a <code>HellSwitchUi</code> map
          (<code>&#123; root?: string; thumb?: string &#125;</code>) targets parts individually.
        </li>
        <li>
          Implements Signal Forms' <code>FormCheckboxControl</code>; <code>formControl</code> and
          <code>ngModel</code> bind through Angular's built-in interoperability.
        </li>
      </ul>
      <p><code>input[type="checkbox"][hellNativeSwitch]</code> (<code>HellNativeSwitch</code>):</p>
      <ul>
        <li>
          <code>required</code>: <code>boolean</code>. Default <code>false</code>. Reflected as the
          native <code>required</code> attribute plus <code>aria-required="true"</code> and
          <code>data-required="true"</code>.
        </li>
        <li><code>checkedChange</code>: <code>OutputEmitterRef&lt;boolean&gt;</code>, emitted on native <code>change</code>.</li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code> — shorthand string
          or <code>&#123; root?: string &#125;</code> map.
        </li>
        <li>
          Native <code>checked</code>/<code>disabled</code> and Angular Forms come from the
          underlying <code>&lt;input&gt;</code> directly — no Hell-owned model involved.
        </li>
      </ul>
      <ul>
        <li>
          Exported types: <code>HellSwitchPart</code> (<code>'root' | 'thumb'</code>),
          <code>HellSwitchUi</code>.
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          <code>button[hellSwitch]</code> renders <code>role="switch"</code> with
          <code>aria-checked</code> reflecting <code>true</code>/<code>false</code>, via
          <code>ngpSwitch</code>.
        </li>
        <li>
          Space toggles the switch when it has focus; the handler runs during the capture phase and
          calls <code>preventDefault()</code> so the page never scrolls.
        </li>
        <li>
          <code>disabled</code> uses the native <code>disabled</code> attribute on the button, so
          it is unfocusable and unclickable, not merely styled as inactive.
        </li>
        <li>
          <code>input[hellNativeSwitch]</code> layers <code>role="switch"</code> onto a real
          checkbox input; <code>required</code> additionally reflects
          <code>aria-required</code> and <code>data-required</code> for native form validation
          messaging.
        </li>
        <li>
          Neither variant renders its own label. Wrap the control and a
          <code>label[hellFieldLabel]</code> in <code>hellField</code>, or associate a native
          <code>&lt;label for&gt;</code>; bare controls need <code>aria-label</code> or
          <code>aria-labelledby</code>.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use switches for settings that take effect immediately, without a save step.</li>
        <li>Keep a visible label wired as the accessible name, e.g. via <code>hellFieldLabel</code>.</li>
        <li>Show <em>why</em> a disabled switch is locked, such as an enforcing policy or event.</li>
        <li>Prefer <code>input[hellNativeSwitch]</code> when native form submission or autofill matters more than owning the markup.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't use switches for choices that should wait for a form submit — use <a routerLink="/components/checkbox">Checkbox</a>.</li>
        <li>Don't trigger destructive or hard-to-reverse side effects straight from a switch without confirmation.</li>
        <li>Don't omit a visible label; icon-only or bare switches need <code>aria-label</code> at minimum.</li>
      </ul>
    </article>
  `,
})
export class SwitchPage {
  protected readonly switchBasicExampleCode = switchBasicExampleCodeRaw;
  protected readonly switchStatesExampleCode = switchStatesExampleCodeRaw;
  protected readonly switchFormsExampleCode = switchFormsExampleCodeRaw;
  protected readonly switchNativeExampleCode = switchNativeExampleCodeRaw;
  protected readonly switchSettingsListExampleCode = switchSettingsListExampleCodeRaw;
  protected readonly switchAllPartsStylingExampleCode = switchAllPartsStylingExampleCodeRaw;
}
