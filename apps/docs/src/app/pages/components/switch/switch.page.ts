import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { SwitchExamplesExample } from './examples/examples.example';
import switchExamplesExampleCodeRaw from './examples/examples.example.ts?raw' with {
  loader: 'text',
};
import { SwitchNativeExample } from './examples/native.example';
import switchNativeExampleCodeRaw from './examples/native.example.ts?raw' with {
  loader: 'text',
};
import { SwitchStylingExample } from './examples/styling.example';
import switchStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, SwitchExamplesExample, SwitchNativeExample, SwitchStylingExample, PageHeader],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Switch"
        icon="faSolidToggleOff"
        category="Styled primitive"
        importPath="@hell-ui/angular/switch"
        stylesPath="@hell-ui/angular/switch/styles.css"
      >
        An on/off toggle for settings with immediate effect — styled control or native-input directive.
      </hd-page-header>
      <p>
        Use for binary on/off settings whose effect is applied immediately. For deferred values that
        are committed on submit, prefer <code>checkbox</code>. The styled
        <code>button[hellSwitch]</code> path is an Angular Forms-ready custom switch button that
        defaults to <code>type="button"</code>. Pair it with a visible <code>label</code> using
        <code>for</code>/<code>id</code>, or use <code>aria-labelledby</code>, so the switch name
        matches the text on screen; use <code>input[hellNativeSwitch]</code> when browser checkbox
        semantics, labels, and native form tooling are the priority.
      </p>

      <h2>Examples</h2>
      <hd-example-tabs [code]="switchExamplesExampleCode" previewClass="grid gap-2 max-w-md">
        <app-switch-examples-example />
      </hd-example-tabs>

      <h2>Native path</h2>
      <hd-example-tabs [code]="switchNativeExampleCode" previewClass="grid gap-2 max-w-md">
        <app-switch-native-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        <code>HellSwitchPart</code> is <code>root | thumb</code>. Use string shorthand for the default <code>root</code> part and the <code>[ui]</code> map when the thumb needs to change too.
      </p>
      <hd-example-tabs [code]="switchStylingExampleCode" previewClass="flex flex-col gap-3">
        <app-switch-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>button[hellSwitch]</code>: <code>checked</code>,
          <code>checkedChange</code>, <code>disabled</code>
        </li>
        <li>
          <code>input[type="checkbox"][hellNativeSwitch]</code>: native
          <code>checked</code> / <code>disabled</code> and Angular Forms behavior,
          <code>checkedChange</code>, <code>required</code>
        </li>
        <li>
          <code>ui</code>: string shorthand targets <code>root</code>; typed maps use
          <code>HellSwitchUi</code> with <code>root</code>/<code>thumb</code> parts or
          <code>HellNativeSwitchUi</code> with <code>root</code>.
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>Exposes <code>role="switch"</code> with <code>aria-checked</code>; Space toggles.</li>
        <li>Associate a visible label; avoid switches for actions that need a submit step (use Checkbox).</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use switches for immediate on/off settings.</li>
        <li>Keep labels visible and wire them as the accessible name.</li>
        <li>Use disabled only when the reason is clear nearby.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't use switches for submit-time choices; use Checkbox.</li>
        <li>Don't trigger destructive side effects without confirmation.</li>
      </ul>
    </article>
  `,
})
export class SwitchPage {
  protected readonly switchExamplesExampleCode = switchExamplesExampleCodeRaw;
  protected readonly switchNativeExampleCode = switchNativeExampleCodeRaw;
  protected readonly switchStylingExampleCode = switchStylingExampleCodeRaw;
}
