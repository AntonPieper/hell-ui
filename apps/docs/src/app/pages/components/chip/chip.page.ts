import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { ChipBadgeExample } from './examples/badge.example';
import chipBadgeExampleCodeRaw from './examples/badge.example.ts?raw' with { loader: 'text' };
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
import { ChipKeyboardHintExample } from './examples/keyboard-hint.example';
import chipKeyboardHintExampleCodeRaw from './examples/keyboard-hint.example.ts?raw' with {
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
    ChipBadgeExample,
    ChipKeyboardHintExample,
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
        One pill module: token-shaped chips — static or interactive, with an optional remove
        button and roving-focus chip sets — plus compact numeric badges and keyboard-key hints.
      </hd-page-header>

      <p>
        <code>@hell-ui/angular/chip</code> is the home for every pill-shaped token.
        <code>hellChip</code> is the chip host (a <code>&lt;span&gt;</code>,
        <code>&lt;button&gt;</code>, or <code>&lt;a&gt;</code>): on a plain <code>&lt;span&gt;</code>
        it is a static, non-interactive label; add a sibling <code>hellChipRemove</code> button or
        drop it inside a <code>hellChipSet</code> and the same host becomes an interactive, removable
        token with roving keyboard focus. The entry point also ships <code>hellBadge</code> for a
        small numeric or dot indicator and <code>hellKbd</code> for a styled keyboard key.
      </p>
      <p>
        Removal is event-only: a chip emits <code>(remove)</code> and you own the collection, so
        chips work with any state shape. Static and interactive chips share one <code>variant</code>
        palette and <code>size</code> scale, so a status label and a removable filter pill never
        drift apart visually.
      </p>
      <p class="hd-note">
        <strong>Migrating from Tag.</strong> The former <code>@hell-ui/angular/tag</code> entry point
        has been folded into this one. Replace a <code>hellTag</code> with a static
        <code>&lt;span hellChip&gt;</code> — the six <code>variant</code> values
        (<code>default</code>, <code>primary</code>, <code>info</code>, <code>success</code>,
        <code>warning</code>, <code>danger</code>) are unchanged — and import
        <code>HellBadge</code> and <code>HellKbd</code> from <code>@hell-ui/angular/chip</code>
        instead of the old tag path.
      </p>

      <h2>Basic</h2>
      <p>
        A chip set of removable chips. Tab moves into the set once; arrow keys move between chips;
        <code>Delete</code> or <code>Backspace</code> removes the focused chip and keeps focus in
        the set. Each remove button is an empty <code>&lt;button hellChipRemove&gt;</code>: it ships
        a built-in × glyph and is named <code>Remove {{ '{' }}label{{ '}' }}</code> — derived from
        the chip's own text through the Label Contract — so you never write the label twice.
      </p>
      <hd-example-tabs [code]="chipBasicExampleCode">
        <app-chip-basic-example />
      </hd-example-tabs>

      <h2>Variants</h2>
      <p>
        <code>variant</code> picks the semantic color: <code>default</code>, <code>primary</code>,
        <code>info</code>, <code>success</code>, <code>warning</code>, and <code>danger</code>. These
        static <code>&lt;span hellChip&gt;</code> pills are the direct replacement for the old
        <code>hellTag</code> — same six variants, no interactive semantics.
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

      <h2>Badge</h2>
      <p>
        <code>hellBadge</code> is a small counter, typically absolutely positioned over another
        element such as a nav icon or inbox label. It carries no variant input — position it with
        your own layout classes and pass the count or short label as content.
      </p>
      <hd-example-tabs [code]="chipBadgeExampleCode" previewClass="flex items-center gap-6">
        <app-chip-badge-example />
      </hd-example-tabs>

      <h2>Keyboard hint</h2>
      <p>
        <code>hellKbd</code> renders a real <code>&lt;kbd&gt;</code> element (or attaches to one you
        provide) styled as a keycap, for documenting shortcuts inline in menus, tooltips, or help
        text.
      </p>
      <hd-example-tabs [code]="chipKeyboardHintExampleCode">
        <app-chip-keyboard-hint-example />
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
          <code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code> — refines the
          <code>root</code> part.
        </li>
      </ul>
      <p><code>hellChip</code> (selector <code>[hellChip]</code> on span, button, or anchor)</p>
      <ul>
        <li><code>variant</code>: <code>HellChipVariant</code>. Defaults to <code>default</code>.</li>
        <li><code>size</code>: <code>HellSize</code>. Defaults to <code>md</code>.</li>
        <li>
          <code>disabled</code>: <code>boolean</code> — disables the chip and its remove button.
        </li>
        <li>
          <code>label</code>: <code>string</code> — optional override for the chip's human label.
          The remove button's name is derived from the chip's text content by default; set this
          only when the visible text is not a good accessible name.
        </li>
        <li><code>(remove)</code>: <code>void</code> — emitted on remove-button click or on
          <code>Delete</code>/<code>Backspace</code> when focused.</li>
        <li><code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code>.</li>
      </ul>
      <p><code>hellChipRemove</code> (selector <code>button[hellChipRemove]</code>)</p>
      <ul>
        <li>Renders a real, sibling <code>&lt;button type="button"&gt;</code> — never nest it as an
          interactive child of a <code>&lt;button&gt;</code> chip host.</li>
        <li>Ships a built-in × glyph on the empty button; project any content to replace it.</li>
        <li>Named <code>Remove {{ '{' }}label{{ '}' }}</code> via <code>HELL_CHIP_LABELS</code> /
          <code>HELL_CHIP_LABELS</code>, with the label taken from the chip's text content.</li>
        <li><code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code>.</li>
      </ul>
      <p>
        <code>HELL_CHIP_DIRECTIVES</code> — array of <code>HellChipSet</code>, <code>HellChip</code>,
        and <code>HellChipRemove</code>, for bulk <code>imports</code>.
      </p>
      <p><code>hellBadge</code> (selector <code>[hellBadge]</code>)</p>
      <ul>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code> — string shorthand or a
          <code>&#123; root?: string &#125;</code> map that refines the <code>root</code> part. No
          other inputs.
        </li>
      </ul>
      <p><code>hellKbd</code> (selector <code>kbd[hellKbd], [hellKbd]</code>)</p>
      <ul>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code> — string shorthand or a
          <code>&#123; root?: string &#125;</code> map that refines the <code>root</code> part. No
          other inputs.
        </li>
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
        <li>Give a removable chip visible text so its remove button is named automatically; reach
          for <code>label</code> only to override that name.</li>
        <li>Handle <code>(remove)</code> by updating your own collection.</li>
        <li>Use a <code>&lt;button&gt;</code> or <code>&lt;a&gt;</code> host when the whole chip is
          clickable.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't put <code>hellChipRemove</code> as an interactive child inside a
          <code>&lt;button hellChip&gt;</code> — nested buttons are invalid; use a span host with a
          sibling remove button.</li>
        <li>Don't make a static <code>&lt;span hellChip&gt;</code> look clickable (hover or press
          styling) unless it is really a <code>&lt;button&gt;</code> or <code>&lt;a&gt;</code>
          host.</li>
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
  protected readonly chipBadgeExampleCode = chipBadgeExampleCodeRaw;
  protected readonly chipKeyboardHintExampleCode = chipKeyboardHintExampleCodeRaw;
}
