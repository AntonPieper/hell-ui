import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { RadioAllPartsStylingExample } from './examples/all-parts-styling.example';
import radioAllPartsStylingExampleCodeRaw from './examples/all-parts-styling.example.ts?raw' with {
  loader: 'text',
};
import { RadioBasicExample } from './examples/basic.example';
import radioBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { RadioHorizontalExample } from './examples/horizontal.example';
import radioHorizontalExampleCodeRaw from './examples/horizontal.example.ts?raw' with {
  loader: 'text',
};
import { RadioNativeExample } from './examples/native.example';
import radioNativeExampleCodeRaw from './examples/native.example.ts?raw' with {
  loader: 'text',
};
import { RadioPlanPickerExample } from './examples/plan-picker.example';
import radioPlanPickerExampleCodeRaw from './examples/plan-picker.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-radio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    RouterLink,
    RadioBasicExample,
    RadioHorizontalExample,
    RadioNativeExample,
    RadioPlanPickerExample,
    RadioAllPartsStylingExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Radio"
        icon="faSolidCircleDot"
        category="Styled primitive"
        importPath="@hell-ui/angular/radio"
        stylesPath="@hell-ui/angular/radio/styles.css"
      >
        Exactly one choice from a visible set of options, as roving-focus buttons or native inputs.
      </hd-page-header>
      <p>
        <code>[hellRadioGroup]</code> and <code>button[hellRadio]</code> build a custom radio group
        on top of <code>ngpRadioGroup</code>/<code>ngpRadioItem</code> from
        <code>ng-primitives</code>. The group owns roving <code>tabindex</code>, Arrow/Home/End
        keyboard movement between items, and Angular's <code>ControlValueAccessor</code> and
        <code>Validator</code>, so it drops into template-driven or reactive forms without extra
        wiring. Hell layers a compatibility bridge on top so form writes stay in sync with
        <code>ng-primitives</code> until upstream exposes public setters for its signal state.
      </p>
      <p>
        Because each item renders as <code>role="radio"</code> on a native
        <code>&lt;button&gt;</code>, you keep full control over markup — icons, descriptions, price
        tags — while the directive handles focus and selection. When native form semantics,
        autofill, or a real <code>&lt;input type="radio"&gt;</code> group by shared
        <code>name</code> matter more than custom markup, use
        <code>[hellNativeRadioGroup]</code> / <code>input[hellNativeRadio]</code> instead — a
        purely presentational layout wrapper around native radios that coordinate their own
        checked state through the browser.
      </p>
      <p>
        Reach for Radio when a small set of mutually exclusive options should stay visible at
        once, such as a plan tier, shipping method, or priority level. For more than about five
        options, or when screen space is tight, prefer a
        <a routerLink="/components/select">Select</a> instead.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="radioBasicExampleCode">
        <app-radio-basic-example />
      </hd-example-tabs>

      <h2>Orientation and disabled options</h2>
      <p>
        <code>orientation</code> switches the group's roving-focus axis and Tailwind
        <code>data-orientation</code> attribute between <code>vertical</code> (default, Up/Down)
        and <code>horizontal</code> (Left/Right). Either axis also accepts Home/End to jump to the
        first or last enabled item. Disable an individual <code>hellRadio</code> to remove it from
        keyboard navigation and mouse selection while leaving the rest of the group interactive.
      </p>
      <hd-example-tabs [code]="radioHorizontalExampleCode">
        <app-radio-horizontal-example />
      </hd-example-tabs>

      <h2>Native path</h2>
      <p>
        <code>input[hellNativeRadio]</code> is a thin styling directive over a real
        <code>&lt;input type="radio"&gt;</code>. It does not manage checked state itself — native
        radios sharing a <code>name</code> already coordinate that through the browser — so pair it
        with a template binding or reactive form control the same way you would an unstyled radio
        input. <code>[hellNativeRadioGroup]</code> only supplies layout and
        <code>role="radiogroup"</code>; it carries no group value or keyboard logic of its own.
      </p>
      <hd-example-tabs [code]="radioNativeExampleCode">
        <app-radio-native-example />
      </hd-example-tabs>

      <h2>With field and card</h2>
      <p>
        A plan chooser combines <code>hellCard</code> for the container,
        <code>hellField</code> in horizontal orientation to pair each radio with its label and
        description, and a <code>hellTag</code> to call out the recommended tier. The
        <code>required</code> input keeps the group invalid until a plan is picked.
      </p>
      <hd-example-tabs [code]="radioPlanPickerExampleCode">
        <app-radio-plan-picker-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        All four radio modules expose a single Public Part, <code>root</code> — pass
        <code>ui="..."</code> as shorthand, or the equivalent explicit
        <code>{{ '{ root: ' + "'...'" + ' }' }}</code> map, to refine it. Refinements merge on top
        of the default recipe through Hell's Tailwind merge, so a conflicting utility such as
        <code>gap-hell-2</code> wins deterministically over the recipe's own gap class. State
        attributes such as <code>data-checked</code>, <code>data-disabled</code>, and
        <code>data-orientation</code> let <code>ui</code> target selected, disabled, or
        orientation-specific styling without touching internals like the indicator.
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
            <td><code>HellRadioGroup</code></td>
            <td><code>root</code></td>
            <td>The group container — layout direction, gap, and orientation-driven flex-row switch.</td>
          </tr>
          <tr>
            <td><code>HellRadio</code></td>
            <td><code>root</code></td>
            <td>Each option's button host — spacing, cursor, focus ring, disabled/checked states.</td>
          </tr>
          <tr>
            <td><code>HellNativeRadioGroup</code></td>
            <td><code>root</code></td>
            <td>The native group's layout wrapper — same gap/orientation styling as the custom group.</td>
          </tr>
          <tr>
            <td><code>HellNativeRadio</code></td>
            <td><code>root</code></td>
            <td>The native <code>&lt;input&gt;</code> host — size, border, background, checked dot, focus ring.</td>
          </tr>
        </tbody>
      </table>
      <p>
        <code>[ngpRadioIndicator]</code> (re-exported as <code>HellRadioIndicator</code>) renders
        the selected dot inside a custom <code>hellRadio</code>. It is a plain
        <code>ng-primitives</code> directive rather than a Hell Public Part, so refine it with
        ordinary template <code>class</code> instead of a <code>ui</code> map.
      </p>
      <hd-example-tabs [code]="radioAllPartsStylingExampleCode" previewClass="grid gap-4">
        <app-radio-all-parts-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <p><code>[hellRadioGroup]</code> (<code>HellRadioGroup&lt;T&gt;</code>):</p>
      <ul>
        <li><code>value</code>: <code>T | null</code>. The selected item's value.</li>
        <li><code>valueChange</code>: <code>OutputEmitterRef&lt;T&gt;</code>, emitted when selection changes.</li>
        <li><code>orientation</code>: <code>HellOrientation</code> — <code>'vertical' | 'horizontal'</code>. Default <code>'vertical'</code>.</li>
        <li><code>disabled</code>: <code>boolean</code>. Disables the whole group. Default <code>false</code>.</li>
        <li><code>compareWith</code>: <code>(a: T, b: T) =&gt; boolean</code>, forwarded from <code>ngpRadioGroup</code> for non-primitive values.</li>
        <li>
          <code>required</code>: <code>boolean</code>. Default <code>false</code>. Reflected as
          <code>aria-required</code>/<code>data-required</code> and enforced through the
          directive's <code>Validator</code> implementation (a <code>{{ '{ required: true }' }}</code> error when unset).
        </li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code> — shorthand string or
          <code>&#123; root?: string &#125;</code> map (<code>{{ '{ root?: string }' }}</code>).
        </li>
        <li>Implements Angular's <code>ControlValueAccessor</code> and <code>Validator</code> for forms integration.</li>
      </ul>
      <p><code>button[hellRadio]</code> (<code>HellRadio</code>):</p>
      <ul>
        <li><code>value</code>: the item's value, compared against the group's <code>value</code>.</li>
        <li><code>disabled</code>: <code>boolean</code>. Disables this item only. Default <code>false</code>.</li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code> — shorthand string or
          <code>&#123; root?: string &#125;</code> map (<code>{{ '{ root?: string }' }}</code>).
        </li>
      </ul>
      <p><code>[hellNativeRadioGroup]</code> (<code>HellNativeRadioGroup</code>):</p>
      <ul>
        <li><code>orientation</code>: <code>HellOrientation</code>. Default <code>'vertical'</code>. Layout only — carries no value or keyboard behavior.</li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code> — shorthand
          string or <code>&#123; root?: string &#125;</code> map (<code>{{ '{ root?: string }' }}</code>).
        </li>
      </ul>
      <p><code>input[type="radio"][hellNativeRadio]</code> (<code>HellNativeRadio</code>):</p>
      <ul>
        <li>
          <code>required</code>: <code>boolean</code>. Default <code>false</code>. Reflected as the
          native <code>required</code> attribute plus <code>aria-required</code>/<code>data-required</code>.
        </li>
        <li><code>checkedChange</code>: <code>OutputEmitterRef&lt;boolean&gt;</code>, emitted on native <code>change</code>.</li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code> — shorthand string or
          <code>&#123; root?: string &#125;</code> map (<code>{{ '{ root?: string }' }}</code>).
        </li>
        <li>Native <code>checked</code>/<code>disabled</code> and Angular Forms come from the underlying <code>&lt;input&gt;</code> directly.</li>
      </ul>
      <ul>
        <li><code>HellRadioIndicator</code>: re-export of <code>NgpRadioIndicator</code>, the selected-dot marker for custom items.</li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          <code>[hellRadioGroup]</code> renders <code>role="radiogroup"</code>; each
          <code>hellRadio</code> renders <code>role="radio"</code> with
          <code>aria-checked="true"|"false"</code>.
        </li>
        <li>
          Only the checked item (or the first enabled item, if none is checked) is a Tab stop;
          Arrow keys move both focus and selection among enabled items, Home/End jump to the first
          or last enabled item — standard roving-tabindex radio group behavior.
        </li>
        <li>
          Disabled items get the native <code>disabled</code> attribute and
          <code>aria-disabled="true"</code>, and are skipped entirely by keyboard movement and the
          disabled-items query used for roving focus.
        </li>
        <li>
          <code>required</code> reflects as <code>aria-required="true"</code> and
          <code>data-required="true"</code> on the group; the group is marked touched (for forms
          validation display) once focus leaves it entirely.
        </li>
        <li>
          Name every group with a concise <code>aria-label</code> or a visible heading referenced
          by <code>aria-labelledby</code> — the group has no visible label of its own.
        </li>
        <li>
          <code>input[hellNativeRadio]</code> relies entirely on native radio semantics: a shared
          <code>name</code> attribute groups inputs, the browser manages
          <code>aria-checked</code> equivalents, and Space/click toggle selection.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use radio for exactly one choice from a small, fully visible set of options.</li>
        <li>Give every group an <code>aria-label</code> or labelled heading.</li>
        <li>Use horizontal orientation only for short labels that still wrap cleanly.</li>
        <li>Prefer <code>input[hellNativeRadio]</code> when native form submission or autofill matters more than custom markup.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't use radio for independent, non-exclusive toggles — use <a routerLink="/components/checkbox">Checkbox</a>.</li>
        <li>Don't hide most options behind a menu; that's what <a routerLink="/components/select">Select</a> is for.</li>
        <li>Don't leave a group without a default selection unless it is genuinely optional — pair <code>required</code> with a validation message otherwise.</li>
      </ul>
    </article>
  `,
})
export class RadioPage {
  protected readonly radioBasicExampleCode = radioBasicExampleCodeRaw;
  protected readonly radioHorizontalExampleCode = radioHorizontalExampleCodeRaw;
  protected readonly radioNativeExampleCode = radioNativeExampleCodeRaw;
  protected readonly radioPlanPickerExampleCode = radioPlanPickerExampleCodeRaw;
  protected readonly radioAllPartsStylingExampleCode = radioAllPartsStylingExampleCodeRaw;
}
