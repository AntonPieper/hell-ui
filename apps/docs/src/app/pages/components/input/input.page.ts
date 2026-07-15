import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { InputAllPartsStylingExample } from './examples/all-parts-styling.example';
import inputAllPartsStylingExampleCodeRaw from './examples/all-parts-styling.example.ts?raw' with {
  loader: 'text',
};
import { InputAutoGrowExample } from './examples/auto-grow.example';
import inputAutoGrowExampleCodeRaw from './examples/auto-grow.example.ts?raw' with {
  loader: 'text',
};
import { InputBasicExample } from './examples/basic.example';
import inputBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { InputSelectExample } from './examples/select.example';
import inputSelectExampleCodeRaw from './examples/select.example.ts?raw' with {
  loader: 'text',
};
import { InputSizesExample } from './examples/sizes.example';
import inputSizesExampleCodeRaw from './examples/sizes.example.ts?raw' with {
  loader: 'text',
};
import { InputTextareaExample } from './examples/textarea.example';
import inputTextareaExampleCodeRaw from './examples/textarea.example.ts?raw' with {
  loader: 'text',
};
import { InputWithSearchIconExample } from './examples/with-search-icon.example';
import inputWithSearchIconExampleCodeRaw from './examples/with-search-icon.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    InputAllPartsStylingExample,
    InputAutoGrowExample,
    InputBasicExample,
    InputSelectExample,
    InputSizesExample,
    InputTextareaExample,
    InputWithSearchIconExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Input, Select &amp; Textarea"
        icon="faSolidICursor"
        category="Styled primitive"
        importPath="@hell-ui/angular/input"
        stylesPath="@hell-ui/angular/input/styles.css"
      >
        <code>hellInput</code> and <code>hellTextarea</code> style native text controls without
        hiding them behind a component; the search-field pair
        (<code>hellSearch</code>/<code>hellSearchClear</code>) ships from here too, and
        <code>hellNativeSelect</code> lives in the select entry point.
      </hd-page-header>
      <p>
        This entry point styles native form controls in place instead of wrapping them: attach
        <code>hellInput</code> to a native <code>&lt;input&gt;</code> and
        <code>hellTextarea</code> to a <code>&lt;textarea&gt;</code>;
        <code>hellNativeSelect</code> (imported from <code>&#64;hell-ui/angular/select</code>,
        shown here for the shared field styling) does the same for a <code>&lt;select&gt;</code>. Each is a thin directive over the matching
        <code>ng-primitives</code> primitive (<code>NgpInput</code> or <code>NgpTextarea</code>) —
        you keep the real element, so native behavior like autofill, IME composition, spellcheck,
        <code>type</code> switching, and browser autocomplete all keep working exactly as they do
        without Hell.
      </p>
      <p>
        Reach for these three whenever a dense business app needs a plain text field, a small
        fixed-choice dropdown, or a multi-line note — search boxes, filter rows, settings forms,
        and inline edit cells. All three share the same <code>size</code> scale and
        <code>invalid</code> state, and all three read label/description/error wiring from an
        enclosing <code>hellField</code> for free.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="inputBasicExampleCode" previewClass="grid max-w-sm gap-2">
        <app-input-basic-example />
      </hd-example-tabs>

      <h2>Sizes and states</h2>
      <p>
        <code>size</code> is <code>sm</code>, <code>md</code> (default), or <code>lg</code> —
        note this is a narrower scale than <code>HellSize</code>; there is no <code>xs</code> or
        <code>xl</code> text control. Set <code>invalid</code> to flag failed validation, which
        also sets <code>aria-invalid="true"</code>; <code>disabled</code> comes from the underlying
        primitive and applies the native <code>disabled</code> attribute.
      </p>
      <hd-example-tabs [code]="inputSizesExampleCode" previewClass="flex flex-wrap gap-2">
        <app-input-sizes-example />
      </hd-example-tabs>

      <h2>Select</h2>
      <p>
        <code>hellNativeSelect</code> styles a real <code>&lt;select&gt;</code>, including a
        CSS-drawn chevron, rather than reimplementing listbox behavior. Use it for short, fixed
        option lists where native platform behavior (keyboard type-ahead, mobile picker UI) is
        exactly what you want; reach for Combobox when you need search, multi-select, or custom
        option rendering.
      </p>
      <hd-example-tabs [code]="inputSelectExampleCode" previewClass="grid max-w-md gap-2">
        <app-input-select-example />
      </hd-example-tabs>

      <h2>Textarea</h2>
      <p>
        <code>hellTextarea</code> styles a native, vertically resizable
        <code>&lt;textarea&gt;</code> for short free-text notes and comments. It shares the same
        <code>size</code>, <code>invalid</code>, and Part Style Map shape as the other two
        directives.
      </p>
      <hd-example-tabs [code]="inputTextareaExampleCode" previewClass="grid gap-2">
        <app-input-textarea-example />
      </hd-example-tabs>

      <h2>Auto-grow</h2>
      <p>
        Add <code>autoGrow</code> to let the <code>&lt;textarea&gt;</code> grow with its content.
        It applies CSS <code>field-sizing: content</code> — no resize observers, no per-keystroke
        JavaScript measurement, no animated height — and disables the native resize handle while
        active, since a self-sizing field and a drag handle are conflicting affordances. Control
        the bounds entirely in CSS: with <code>field-sizing: content</code> the <code>rows</code>
        attribute is <em>not</em> a floor, so set a minimum with <code>min-block-size</code>, then
        <code>max-block-size</code> plus <code>overflow-y: auto</code> caps the growth so a long
        paste scrolls internally instead of pushing the page around.
      </p>
      <p>
        Auto-grow is progressive enhancement: browsers without
        <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/field-sizing"><code>field-sizing</code></a>
        support keep the standard fixed-size textarea (with its resize handle intact) and nothing
        breaks — Hell ships no JavaScript polyfill for it.
      </p>
      <hd-example-tabs [code]="inputAutoGrowExampleCode" previewClass="grid max-w-md gap-2">
        <app-input-auto-grow-example />
      </hd-example-tabs>

      <h2>With field and icon</h2>
      <p>
        A search box pairs <code>hellField</code> for label wiring, <code>hell-icon</code> for a
        leading glyph, and the Control Group primitive for one focus-aware frame with a clear
        action. The real <code>hellInput</code> still owns the search value and native input
        behavior; the group contributes only the prefix/action composition and shared visual
        state.
      </p>
      <hd-example-tabs [code]="inputWithSearchIconExampleCode" previewClass="grid max-w-sm gap-2">
        <app-input-with-search-icon-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        All three directives follow the same Part Style Map shape: each owns exactly one public
        part, <code>root</code> — the native element itself — so its <code>ui</code> input takes
        either a shorthand class string or an explicit <code>{{ '{' }} root: string {{ '}' }}</code>
        map. Refinement classes merge deterministically on top of the size/state recipe through
        Hell's Tailwind merge, so they win over conflicting recipe utilities like
        <code>rounded-hell-md</code> or <code>bg-hell-surface-elevated</code>.
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
            <td><code>HellInput</code></td>
            <td><code>root</code></td>
            <td>The <code>&lt;input&gt;</code> element — border, background, text, focus ring, invalid/disabled state.</td>
          </tr>
          <tr>
            <td><code>HellNativeSelect</code></td>
            <td><code>root</code></td>
            <td>The <code>&lt;select&gt;</code> element — same states plus the CSS-drawn chevron background.</td>
          </tr>
          <tr>
            <td><code>HellTextarea</code></td>
            <td><code>root</code></td>
            <td>The <code>&lt;textarea&gt;</code> element — same states, plus min-height and resize behavior.</td>
          </tr>
        </tbody>
      </table>
      <p>The example below refines the <code>root</code> part of all three modules:</p>
      <hd-example-tabs
        [code]="inputAllPartsStylingExampleCode"
        previewClass="grid max-w-lg gap-2"
      >
        <app-input-all-parts-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <p>
        Every directive below accepts <code>ui</code>: a shorthand class string or a
        <code>{{ '{' }} root: string {{ '}' }}</code> map.
      </p>
      <ul>
        <li>
          <code>input[hellInput]</code> — host directive <code>NgpInput</code> (forwards
          <code>disabled</code>, <code>id</code>).
          <ul>
            <li><code>size</code>: <code>'sm' | 'md' | 'lg'</code>. Default <code>'md'</code>.</li>
            <li>
              <code>invalid</code>: <code>boolean</code> (accepts the bare attribute). Default
              <code>false</code>. Sets <code>aria-invalid="true"</code> when <code>true</code>,
              otherwise omits the attribute.
            </li>
            <li>
              <code>ui: HellUiInput&lt;'root'&gt;</code>.
            </li>
          </ul>
        </li>
        <li>
          <code>select[hellNativeSelect]</code> — exported from
          <code>&#64;hell-ui/angular/select</code>; host directive <code>NgpInput</code> (forwards
          <code>disabled</code>, <code>id</code>).
          <ul>
            <li><code>size</code>: <code>'sm' | 'md' | 'lg'</code>. Default <code>'md'</code>.</li>
            <li><code>invalid</code>: <code>boolean</code>. Default <code>false</code>.</li>
            <li>
              <code>ui: HellUiInput&lt;'root'&gt;</code>.
            </li>
          </ul>
        </li>
        <li>
          <code>textarea[hellTextarea]</code> — host directive <code>NgpTextarea</code> (forwards
          <code>disabled</code>, <code>id</code>).
          <ul>
            <li><code>size</code>: <code>'sm' | 'md' | 'lg'</code>. Default <code>'md'</code>.</li>
            <li><code>invalid</code>: <code>boolean</code>. Default <code>false</code>.</li>
            <li>
              <code>autoGrow</code>: <code>boolean</code> (accepts the bare attribute). Default
              <code>false</code>. Applies <code>field-sizing: content</code>, reflects
              <code>data-auto-grow</code>, and disables the native resize handle while active;
              cap height in CSS with <code>max-block-size</code> + <code>overflow-y: auto</code>.
            </li>
            <li>
              <code>ui: HellUiInput&lt;'root'&gt;</code>.
            </li>
          </ul>
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          These are directives on real native elements, so browser-native semantics stay intact:
          autofill, spellcheck, IME composition, mobile keyboard hints from <code>type</code>/
          <code>inputmode</code>, and native <code>&lt;select&gt;</code> keyboard type-ahead all
          keep working with no extra wiring.
        </li>
        <li>
          Wrap controls in <code>hellField</code> with a <code>hellFieldLabel</code> so the
          underlying form-field primitive sets <code>aria-labelledby</code> and
          <code>aria-describedby</code> automatically; placeholders disappear on input and are
          never a substitute for a label.
        </li>
        <li>
          <code>invalid</code> sets <code>aria-invalid="true"</code> directly on the control; pair
          it with a <code>hellFieldError</code> so assistive tech also gets the error text through
          <code>aria-describedby</code>.
        </li>
        <li>
          <code>disabled</code> applies the native <code>disabled</code> attribute (via
          <code>NgpInput</code> / <code>NgpTextarea</code>), which removes the control from the tab
          order and from form submission — not just a visual style.
        </li>
        <li>
          Hover, press, and focus states are reflected as <code>data-hover</code>,
          <code>data-press</code>, and <code>data-focus</code> attributes by the underlying
          primitive, which the recipe's focus-ring and hover-border styling reads.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Wrap every control in <code>hellField</code> for label, description, and error wiring.</li>
        <li>Choose <code>sm</code>, <code>md</code>, or <code>lg</code> based on the surrounding row density.</li>
        <li>Use <code>hellNativeSelect</code> for short fixed lists; reach for Combobox when you need search or multi-select.</li>
        <li>Set <code>invalid</code> together with a <code>hellFieldError</code>, not on its own.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't rely on placeholder text as the only label — it vanishes the moment the user types.</li>
        <li>Don't mark a field <code>invalid</code> before the user has had a chance to fill it in.</li>
        <li>Don't fight the recipe with plain <code>class</code> utilities; use <code>ui</code> for conflicting styles.</li>
      </ul>
    </article>
  `,
})
export class InputPage {
  protected readonly inputAllPartsStylingExampleCode = inputAllPartsStylingExampleCodeRaw;
  protected readonly inputAutoGrowExampleCode = inputAutoGrowExampleCodeRaw;
  protected readonly inputBasicExampleCode = inputBasicExampleCodeRaw;
  protected readonly inputSelectExampleCode = inputSelectExampleCodeRaw;
  protected readonly inputSizesExampleCode = inputSizesExampleCodeRaw;
  protected readonly inputTextareaExampleCode = inputTextareaExampleCodeRaw;
  protected readonly inputWithSearchIconExampleCode = inputWithSearchIconExampleCodeRaw;
}
