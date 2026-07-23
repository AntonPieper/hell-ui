import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { CheckboxAllPartsStylingExample } from './examples/all-parts-styling.example';
import checkboxAllPartsStylingExampleCodeRaw from './examples/all-parts-styling.example.ts?raw' with {
  loader: 'text',
};
import { CheckboxBasicExample } from './examples/basic.example';
import checkboxBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { CheckboxFormsExample } from './examples/forms.example';
import checkboxFormsExampleCodeRaw from './examples/forms.example.ts?raw' with {
  loader: 'text',
};
import { CheckboxGroupExample } from './examples/group.example';
import checkboxGroupExampleCodeRaw from './examples/group.example.ts?raw' with {
  loader: 'text',
};
import { CheckboxNativeExample } from './examples/native.example';
import checkboxNativeExampleCodeRaw from './examples/native.example.ts?raw' with {
  loader: 'text',
};
import { CheckboxSettingsListExample } from './examples/settings-list.example';
import checkboxSettingsListExampleCodeRaw from './examples/settings-list.example.ts?raw' with {
  loader: 'text',
};
import { CheckboxStatesExample } from './examples/states.example';
import checkboxStatesExampleCodeRaw from './examples/states.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    RouterLink,
    CheckboxBasicExample,
    CheckboxStatesExample,
    CheckboxFormsExample,
    CheckboxGroupExample,
    CheckboxNativeExample,
    CheckboxSettingsListExample,
    CheckboxAllPartsStylingExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Checkbox"
        icon="faSolidSquareCheck"
        category="Styled primitive"
        importPath="@hell-ui/angular/checkbox"
        stylesPath="@hell-ui/angular/checkbox/styles.css"
      >
        A two- or three-state boolean control, as a styled ARIA button or a native form input.
      </hd-page-header>
      <p>
        <code>button[hellCheckbox]</code> is a styled checkbox built on <code>ngpCheckbox</code>
        from <code>ng-primitives</code>. Its <code>checked</code> state is one Angular model —
        bind it directly (<code>[checked]</code> plus <code>(checkedChange)</code>), two-way
        (<code>[(checked)]</code>), or through forms: it implements Signal Forms'
        <code>FormCheckboxControl</code> contract for <code>[formField]</code>, and the same
        model drives <code>formControl</code> and <code>ngModel</code> through Angular's built-in
        interoperability. <code>indeterminate</code>, <code>disabled</code>, and
        <code>required</code> remain ordinary inputs.
      </p>
      <p>
        Because it renders as <code>role="checkbox"</code> on a native
        <code>&lt;button&gt;</code> rather than <code>&lt;input type="checkbox"&gt;</code>, it gets
        full control over its markup and indicator glyph but does not inherit native input
        semantics such as form submission as a checkbox value or browser autofill. When those
        matter more than custom styling, use <code>input[hellNativeCheckbox]</code> instead — the
        same visual language on a real native input. Reach for Checkbox for deferred, submit-time
        boolean choices in a dense form or settings list; for a setting that takes effect
        immediately, use <a routerLink="/components/switch">Switch</a>.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="checkboxBasicExampleCode">
        <app-checkbox-basic-example />
      </hd-example-tabs>

      <h2>States</h2>
      <p>
        <code>checked</code>, <code>indeterminate</code>, and <code>disabled</code> combine freely.
        Indeterminate is a visual-only mixed state — it does not change what
        <code>checkedChange</code> emits on click.
      </p>
      <hd-example-tabs [code]="checkboxStatesExampleCode" previewClass="grid gap-2">
        <app-checkbox-states-example />
      </hd-example-tabs>

      <h2>Forms</h2>
      <p>
        The <code>checked</code> model is the checkbox's single committed-value authority, so all
        binding styles observe the same boolean. With Signal Forms, bind a field via
        <code>[formField]</code>: the field writes into <code>checked</code>, each user toggle
        updates the field exactly once, focus leaving the checkbox marks it touched, and the
        field's <code>disabled()</code> and <code>required()</code> rules flow into the matching
        inputs. <code>formControl</code> and <code>[(ngModel)]</code> keep working against the
        same model through Angular's Signal Forms interoperability — no
        <code>ControlValueAccessor</code> is involved anymore.
      </p>
      <p>
        Because <code>checked</code> is a model input, it no longer coerces static attribute
        strings: write <code>[checked]="true"</code> (a boolean binding), not a bare
        <code>checked</code> attribute. Configuration inputs (<code>indeterminate</code>,
        <code>disabled</code>, <code>required</code>) keep their attribute coercion. Required
        policy is form-owned: use a <code>required()</code> schema rule with Signal Forms or
        <code>Validators.requiredTrue</code> with reactive forms — the <code>required</code>
        input only reflects <code>required</code>/<code>aria-required</code>/
        <code>data-required</code> for assistive technology.
      </p>
      <hd-example-tabs [code]="checkboxFormsExampleCode">
        <app-checkbox-forms-example />
      </hd-example-tabs>

      <h2>Parent/child group</h2>
      <p>
        A common use of <code>indeterminate</code>: a "select all" checkbox reflects
        <code>indeterminate</code> when some but not all children are checked, and toggling it sets
        every child at once.
      </p>
      <hd-example-tabs [code]="checkboxGroupExampleCode">
        <app-checkbox-group-example />
      </hd-example-tabs>

      <h2>Native path</h2>
      <p>
        <code>input[hellNativeCheckbox]</code> is a directive on a real
        <code>&lt;input type="checkbox"&gt;</code>. It leans on browser and Angular Forms semantics
        directly instead of the Hell-owned model the button path uses, so use it when native form
        submission, autofill, or browser-level checkbox behavior matters more than owning the
        markup.
      </p>
      <hd-example-tabs [code]="checkboxNativeExampleCode">
        <app-checkbox-native-example />
      </hd-example-tabs>

      <h2>With field and card</h2>
      <p>
        A settings list combines <code>hellCard</code> for the container,
        <code>hellField</code> in horizontal orientation to pair each checkbox with its label and
        description, and a disabled, always-checked row to show a non-negotiable setting.
      </p>
      <hd-example-tabs [code]="checkboxSettingsListExampleCode">
        <app-checkbox-settings-list-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        Both modules follow Hell's Part Style Map contract: pass <code>ui</code> as a string
        shorthand to refine the default <code>root</code> part, or pass a <code>[ui]</code> map to
        target named parts individually. Refinements merge on top of the default recipe through
        Hell's Tailwind merge, so a conflicting utility such as <code>rounded-hell-pill</code> wins
        deterministically over the recipe's own radius class.
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
            <td><code>HellCheckbox</code></td>
            <td><code>root</code></td>
            <td>The button host — background, border, radius, focus ring, checked/indeterminate/disabled states.</td>
          </tr>
          <tr>
            <td><code>HellCheckbox</code></td>
            <td><code>indicator</code></td>
            <td>The checkmark/dash SVG glyph, rendered only while checked or indeterminate.</td>
          </tr>
          <tr>
            <td><code>HellNativeCheckbox</code></td>
            <td><code>root</code></td>
            <td>The native <code>&lt;input&gt;</code> host — background, border, radius, focus ring, checked/indeterminate/disabled states.</td>
          </tr>
        </tbody>
      </table>
      <hd-example-tabs [code]="checkboxAllPartsStylingExampleCode">
        <app-checkbox-all-parts-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <p><code>button[hellCheckbox]</code> (<code>HellCheckbox</code>):</p>
      <ul>
        <li>
          <code>checked</code>: <code>ModelSignal&lt;boolean&gt;</code>. Default
          <code>false</code>. Supports <code>[checked]</code>, <code>[(checked)]</code>, and
          <code>(checkedChange)</code>; requires a boolean binding (no static-attribute string
          coercion).
        </li>
        <li><code>indeterminate</code>: <code>boolean</code>. Default <code>false</code>.</li>
        <li>
          <code>disabled</code>: <code>boolean</code>. Default <code>false</code>. Also driven by
          bound forms.
        </li>
        <li>
          <code>required</code>: <code>boolean</code>. Default <code>false</code>. Reflected as
          the native <code>required</code> attribute and <code>aria-required</code>/
          <code>data-required</code>; also driven by a bound Signal Forms field's
          <code>required()</code> metadata. Required policy itself belongs to the form.
        </li>
        <li><code>indeterminateChange</code>: <code>OutputEmitterRef&lt;boolean&gt;</code>.</li>
        <li>
          <code>(touch)</code>: emits when focus leaves the checkbox; Angular forms use it to
          mark the control touched.
        </li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;HellCheckboxPart&gt;</code> — shorthand string
          refines <code>root</code>; a <code>HellCheckboxUi</code> map
          (<code>&#123; root?: string; indicator?: string &#125;</code>) targets parts
          individually.
        </li>
        <li>
          Implements Signal Forms' <code>FormCheckboxControl</code>; <code>formControl</code> and
          <code>ngModel</code> bind through Angular's built-in interoperability.
        </li>
      </ul>
      <p><code>input[type="checkbox"][hellNativeCheckbox]</code> (<code>HellNativeCheckbox</code>):</p>
      <ul>
        <li><code>required</code>: <code>boolean</code>. Default <code>false</code>.</li>
        <li>
          <code>indeterminate</code>: <code>boolean</code>. Default <code>false</code>. Sets the
          native <code>indeterminate</code> DOM property (not a reflected attribute) and mirrors it
          to <code>data-indeterminate</code>.
        </li>
        <li><code>checkedChange</code>: <code>OutputEmitterRef&lt;boolean&gt;</code>, emitted on native <code>change</code>.</li>
        <li><code>indeterminateChange</code>: <code>OutputEmitterRef&lt;boolean&gt;</code>, emitted on native <code>change</code>.</li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code> — shorthand
          string or <code>&#123; root?: string &#125;</code> map.
        </li>
        <li>
          Native <code>checked</code>/<code>disabled</code> and Angular Forms come from the
          underlying <code>&lt;input&gt;</code> directly — no Hell-owned model involved.
        </li>
      </ul>
      <ul>
        <li>
          Exported types: <code>HellCheckboxPart</code> (<code>'root' | 'indicator'</code>),
          <code>HellCheckboxUi</code>.
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          <code>button[hellCheckbox]</code> renders <code>role="checkbox"</code> with
          <code>aria-checked</code> set to <code>"true"</code>, <code>"false"</code>, or
          <code>"mixed"</code> while indeterminate.
        </li>
        <li>
          <code>required</code> reflects as the native <code>required</code> attribute plus
          <code>aria-required="true"</code> and <code>data-required="true"</code> on both the
          styled and native variants.
        </li>
        <li>
          <code>input[hellNativeCheckbox]</code> sets the DOM <code>indeterminate</code> property
          and <code>data-indeterminate</code>, but native checkboxes have no
          <code>aria-checked="mixed"</code> equivalent — assistive tech announces indeterminate
          native inputs as unchecked, so pair it with visible or <code>aria-describedby</code> text
          when the mixed state matters.
        </li>
        <li>
          Space toggles both variants when focused; disabled state is exposed through the native
          <code>disabled</code> attribute, not only through visual styling.
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
        <li>Use checkboxes for independent boolean choices, including inside a form that commits on submit.</li>
        <li>Write labels that still read correctly once checked, e.g. "Email digests" rather than "Enable email digests".</li>
        <li>Use <code>indeterminate</code> on a parent checkbox when only some of its children are checked.</li>
        <li>Prefer <code>input[hellNativeCheckbox]</code> when you need native form submission or autofill behavior.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't use checkboxes for mutually exclusive choices — use <a routerLink="/components/radio">Radio</a>.</li>
        <li>Don't use checkboxes for settings that must apply immediately — use <a routerLink="/components/switch">Switch</a>.</li>
        <li>Don't omit a visible label or accessible name; "select all" still needs one.</li>
        <li>Don't expect <code>indeterminate</code> to change the value <code>checkedChange</code> emits — it is purely visual.</li>
      </ul>
    </article>
  `,
})
export class CheckboxPage {
  protected readonly checkboxBasicExampleCode = checkboxBasicExampleCodeRaw;
  protected readonly checkboxStatesExampleCode = checkboxStatesExampleCodeRaw;
  protected readonly checkboxFormsExampleCode = checkboxFormsExampleCodeRaw;
  protected readonly checkboxGroupExampleCode = checkboxGroupExampleCodeRaw;
  protected readonly checkboxNativeExampleCode = checkboxNativeExampleCodeRaw;
  protected readonly checkboxSettingsListExampleCode = checkboxSettingsListExampleCodeRaw;
  protected readonly checkboxAllPartsStylingExampleCode = checkboxAllPartsStylingExampleCodeRaw;
}
