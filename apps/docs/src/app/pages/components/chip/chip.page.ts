import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { ChipBasicExample } from './examples/basic.example';
import chipBasicExampleCodeRaw from './examples/basic.example.ts?raw' with { loader: 'text' };
import { ChipClickableExample } from './examples/clickable.example';
import chipClickableExampleCodeRaw from './examples/clickable.example.ts?raw' with {
  loader: 'text',
};
import { ChipDisabledExample } from './examples/disabled.example';
import chipDisabledExampleCodeRaw from './examples/disabled.example.ts?raw' with {
  loader: 'text',
};
import { ChipSizesExample } from './examples/sizes.example';
import chipSizesExampleCodeRaw from './examples/sizes.example.ts?raw' with { loader: 'text' };
import { ChipStylingExample } from './examples/styling.example';
import chipStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};
import { ChipVariantsExample } from './examples/variants.example';
import chipVariantsExampleCodeRaw from './examples/variants.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    ChipBasicExample,
    ChipVariantsExample,
    ChipSizesExample,
    ChipClickableExample,
    ChipDisabledExample,
    ChipStylingExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Chip"
        icon="faSolidTags"
        category="Mixed entry point"
        importPath="@hell-ui/angular/chip"
        stylesPath="@hell-ui/angular/chip/styles.css"
      >
        Interactive, token-shaped chips with an optional leading icon, a label, and an optional
        remove button — grouped in a chip set with roving keyboard focus and keyboard removal.
      </hd-page-header>

      <p>
        <code>@hell-ui/angular/chip</code> provides three directives: <code>hellChip</code> for the
        chip host (a <code>&lt;span&gt;</code>, <code>&lt;button&gt;</code>, or
        <code>&lt;a&gt;</code>), <code>hellChipRemove</code> for a real sibling remove button, and
        <code>hellChipSet</code> for a container that manages roving focus and keyboard removal.
        For static, non-interactive labels reach for
        <a href="/components/tag"><code>hellTag</code></a> instead — chip is for tokens the user can
        focus, activate, or remove.
      </p>
      <p>
        Removal is event-only: a chip emits <code>(remove)</code> and you own the collection, so
        chips work with any state shape. Variants and sizes match <code>hellTag</code> so
        interactive and static tokens share one visual language.
      </p>

      <h2>Basic</h2>
      <p>
        A chip set of removable chips. Tab moves into the set once; arrow keys move between chips;
        <code>Delete</code> or <code>Backspace</code> removes the focused chip and keeps focus in
        the set. Each remove button is a real <code>&lt;button&gt;</code> named
        <code>Remove {{ '{' }}label{{ '}' }}</code> through the Label Contract.
      </p>
      <hd-example-tabs [code]="chipBasicExampleCode">
        <app-chip-basic-example />
      </hd-example-tabs>

      <h2>Variants</h2>
      <p>
        <code>variant</code> shares the <code>hellTag</code> palette: <code>default</code>,
        <code>primary</code>, <code>info</code>, <code>success</code>, <code>warning</code>, and
        <code>danger</code>.
      </p>
      <hd-example-tabs [code]="chipVariantsExampleCode" previewClass="flex flex-wrap gap-2">
        <app-chip-variants-example />
      </hd-example-tabs>

      <h2>Sizes</h2>
      <p>
        <code>size</code> uses the shared control scale (<code>xs</code> through <code>xl</code>),
        defaulting to <code>md</code>.
      </p>
      <hd-example-tabs [code]="chipSizesExampleCode" previewClass="flex flex-wrap items-center gap-2">
        <app-chip-sizes-example />
      </hd-example-tabs>

      <h2>Clickable chips</h2>
      <p>
        Interactive semantics apply only on interactive hosts. A <code>&lt;button hellChip&gt;</code>
        becomes a real button (a filter-summary pill), and an <code>&lt;a hellChip&gt;</code> stays a
        link (a copyable value). A plain <code>&lt;span hellChip&gt;</code> is a non-interactive
        token and never looks clickable.
      </p>
      <hd-example-tabs [code]="chipClickableExampleCode" previewClass="flex flex-wrap items-center gap-2">
        <app-chip-clickable-example />
      </hd-example-tabs>

      <h2>Disabled</h2>
      <p>
        A disabled chip dims itself and disables its remove button, and it is skipped by roving
        focus and keyboard removal.
      </p>
      <hd-example-tabs [code]="chipDisabledExampleCode">
        <app-chip-disabled-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        Each directive exposes a single Public Part, <code>root</code>, refined through its own
        <code>ui</code> input. The chip set styles its own container; the chip and its remove button
        each carry their own Part Style Map, so pass classes to whichever directive owns the DOM you
        want to change.
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
            <td><code>HellChipSet</code></td>
            <td><code>root</code></td>
            <td>The set container — layout, gap, and wrapping of the chips.</td>
          </tr>
          <tr>
            <td><code>HellChip</code></td>
            <td><code>root</code></td>
            <td>The chip host — shape, the variant color pair, size, and interactive states.</td>
          </tr>
          <tr>
            <td><code>HellChipRemove</code></td>
            <td><code>root</code></td>
            <td>The remove button — size, hover surface, and focus ring.</td>
          </tr>
        </tbody>
      </table>
      <hd-example-tabs [code]="chipStylingExampleCode" previewClass="flex flex-wrap items-center gap-3">
        <app-chip-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <p><code>hellChipSet</code></p>
      <ul>
        <li>
          <code>orientation</code>: <code>HellOrientation</code> —
          <code>horizontal | vertical</code>. Drives roving arrow keys and the layout data
          attribute. Defaults to <code>horizontal</code>.
        </li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;HellChipSetPart&gt;</code> — refines the
          <code>root</code> part.
        </li>
      </ul>
      <p><code>hellChip</code> (selector <code>[hellChip]</code> on span, button, or anchor)</p>
      <ul>
        <li><code>variant</code>: <code>HellTagVariant</code>. Defaults to <code>default</code>.</li>
        <li><code>size</code>: <code>HellSize</code>. Defaults to <code>md</code>.</li>
        <li>
          <code>disabled</code>: <code>boolean</code> — disables the chip and its remove button.
        </li>
        <li>
          <code>label</code>: <code>string</code> — the chip's human label, used to name its remove
          button.
        </li>
        <li><code>(remove)</code>: <code>void</code> — emitted on remove-button click or on
          <code>Delete</code>/<code>Backspace</code> when focused.</li>
        <li><code>ui</code>: <code>HellUiInput&lt;HellChipPart&gt;</code>.</li>
      </ul>
      <p><code>hellChipRemove</code> (selector <code>button[hellChipRemove]</code>)</p>
      <ul>
        <li>Renders a real, sibling <code>&lt;button type="button"&gt;</code> — never nest it as an
          interactive child of a <code>&lt;button&gt;</code> chip host.</li>
        <li>Named <code>Remove {{ '{' }}label{{ '}' }}</code> via <code>HELL_CHIP_LABELS</code> /
          <code>provideHellChipLabels</code>.</li>
        <li><code>ui</code>: <code>HellUiInput&lt;HellChipRemovePart&gt;</code>.</li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          The chip set is a single tab stop: <code>Tab</code> enters it, arrow keys and
          <code>Home</code>/<code>End</code> move between chips, and focus never falls out of the
          set during keyboard use.
        </li>
        <li>
          <code>Delete</code> and <code>Backspace</code> remove the focused chip; focus then moves
          to the next chip, the previous one, or the set itself, so you are never dropped out of
          context.
        </li>
        <li>
          The remove affordance is its own button with an explicit <code>Remove {{ '{' }}label{{ '}' }}</code>
          name, so screen-reader users can find and describe it unambiguously.
        </li>
        <li>
          Interactive semantics attach only to interactive hosts; a <code>&lt;span&gt;</code> chip
          carries no button role and never pretends to be clickable.
        </li>
        <li>
          A disabled chip exposes <code>aria-disabled</code>, disables its remove button, and is
          skipped by roving focus and keyboard removal.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Give the chip set an accessible name (<code>aria-label</code> or
          <code>aria-labelledby</code>) describing the collection.</li>
        <li>Set <code>label</code> on each removable chip so its remove button is clearly named.</li>
        <li>Handle <code>(remove)</code> by updating your own collection.</li>
        <li>Use a <code>&lt;button&gt;</code> or <code>&lt;a&gt;</code> host when the whole chip is
          clickable.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't put <code>hellChipRemove</code> as an interactive child inside a
          <code>&lt;button hellChip&gt;</code> — nested buttons are invalid; use a span host with a
          sibling remove button.</li>
        <li>Don't reach for chip when a static label will do — use <code>hellTag</code>.</li>
        <li>Don't rely on color alone to convey a chip's meaning.</li>
      </ul>
    </article>
  `,
})
export class ChipPage {
  protected readonly chipBasicExampleCode = chipBasicExampleCodeRaw;
  protected readonly chipVariantsExampleCode = chipVariantsExampleCodeRaw;
  protected readonly chipSizesExampleCode = chipSizesExampleCodeRaw;
  protected readonly chipClickableExampleCode = chipClickableExampleCodeRaw;
  protected readonly chipDisabledExampleCode = chipDisabledExampleCodeRaw;
  protected readonly chipStylingExampleCode = chipStylingExampleCodeRaw;
}
