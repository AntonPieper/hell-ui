import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { TagBadgeExample } from './examples/badge.example';
import tagBadgeExampleCodeRaw from './examples/badge.example.ts?raw' with { loader: 'text' };
import { TagBasicExample } from './examples/basic.example';
import tagBasicExampleCodeRaw from './examples/basic.example.ts?raw' with { loader: 'text' };
import { TagKeyboardHintExample } from './examples/keyboard-hint.example';
import tagKeyboardHintExampleCodeRaw from './examples/keyboard-hint.example.ts?raw' with {
  loader: 'text',
};
import { TagStylingExample } from './examples/styling.example';
import tagStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};
import { TagVariantsExample } from './examples/variants.example';
import tagVariantsExampleCodeRaw from './examples/variants.example.ts?raw' with {
  loader: 'text',
};
import { TagWithTableExample } from './examples/with-table.example';
import tagWithTableExampleCodeRaw from './examples/with-table.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    TagBasicExample,
    TagVariantsExample,
    TagBadgeExample,
    TagKeyboardHintExample,
    TagWithTableExample,
    TagStylingExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Tag, Badge, Kbd"
        icon="faSolidTag"
        category="Styled primitive"
        importPath="@hell-ui/angular/tag"
        stylesPath="@hell-ui/angular/tag/styles.css"
      >
        Three compact, single-part directives — status tags, numeric badges, and keyboard hints —
        for annotating content without adding a component wrapper.
      </hd-page-header>

      <p>
        <code>@hell-ui/angular/tag</code> bundles three unrelated but similarly-shaped directives:
        <code>hellTag</code> for a colored status or category label, <code>hellBadge</code> for a
        small numeric or dot indicator, and <code>hellKbd</code> for a styled keyboard key. None of
        them wrap ng-primitives — they are pure styling directives with no behavior, no keyboard
        handling, and no ARIA role of their own, because none of them are interactive.
      </p>
      <p>
        Each directive attaches to whatever host element you already have — typically a
        <code>&lt;span&gt;</code> for tag and badge, a <code>&lt;kbd&gt;</code> for the keyboard
        hint — so it never gets between you and the DOM. Reach for them in table status columns,
        list metadata, toolbar counters, and shortcut hints throughout a dense business app.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="tagBasicExampleCode">
        <app-tag-basic-example />
      </hd-example-tabs>

      <h2>Variants</h2>
      <p>
        <code>variant</code> on <code>hellTag</code> picks the semantic color: <code>default</code>
        for neutral metadata, <code>primary</code> for a highlighted category, <code>info</code>,
        <code>success</code>, and <code>warning</code> for status, and <code>danger</code> for
        errors or destructive states. Badge and kbd have no variants — badge is always the danger
        color for attention, and kbd always matches the neutral keycap look.
      </p>
      <hd-example-tabs [code]="tagVariantsExampleCode" previewClass="flex flex-wrap gap-2">
        <app-tag-variants-example />
      </hd-example-tabs>

      <h2>Badge</h2>
      <p>
        <code>hellBadge</code> is a small counter, typically absolutely positioned over another
        element such as a nav icon or inbox label. It carries no variant input — position it with
        your own layout classes and pass the count or short label as content.
      </p>
      <hd-example-tabs [code]="tagBadgeExampleCode" previewClass="flex items-center gap-6">
        <app-tag-badge-example />
      </hd-example-tabs>

      <h2>Keyboard hint</h2>
      <p>
        <code>hellKbd</code> renders a real <code>&lt;kbd&gt;</code> element (or attaches to one you
        provide) styled as a keycap, for documenting shortcuts inline in menus, tooltips, or help
        text.
      </p>
      <hd-example-tabs [code]="tagKeyboardHintExampleCode">
        <app-tag-keyboard-hint-example />
      </hd-example-tabs>

      <h2>With table and avatar</h2>
      <p>
        A realistic status column: <code>hell-avatar</code> from
        <code>@hell-ui/angular/avatar</code> identifies each row's person, and
        <code>hellTag</code> reports their current status without adding a second visual language
        for state. The table itself is built from
        <code>@hell-ui/angular/table</code>'s primitives.
      </p>
      <hd-example-tabs [code]="tagWithTableExampleCode">
        <app-tag-with-table-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        All three directives expose exactly one Public Part, <code>root</code> — there's no owned
        anatomy beyond the host element itself. Pass a plain string to <code>ui</code> as shorthand
        for <code>root</code>, or pass the equivalent <code>&#123; root: '...' &#125;</code> map.
        Either form merges your Tailwind classes on top of the variant recipe through Hell's
        deterministic Tailwind merge, so a conflicting utility such as <code>bg-hell-primary</code>
        reliably wins over the built-in background.
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
            <td><code>HellTag</code></td>
            <td><code>root</code></td>
            <td>The tag host — pill background, text color, padding, and the variant-driven color pair.</td>
          </tr>
          <tr>
            <td><code>HellBadge</code></td>
            <td><code>root</code></td>
            <td>The badge host — size, shape, background, and text color.</td>
          </tr>
          <tr>
            <td><code>HellKbd</code></td>
            <td><code>root</code></td>
            <td>The keycap host — size, border, background, and monospace text.</td>
          </tr>
        </tbody>
      </table>
      <hd-example-tabs [code]="tagStylingExampleCode" previewClass="flex flex-wrap items-center gap-3">
        <app-tag-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <p><code>hellTag</code></p>
      <ul>
        <li>
          <code>variant</code>: <code>HellTagVariant</code> —
          <code>default | primary | info | success | warning | danger</code>. Defaults to
          <code>default</code>.
        </li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;HellTagPart&gt;</code> — string shorthand or a
          <code>HellTagUi</code> map that refines the <code>root</code> part.
        </li>
        <li>
          Exported types: <code>HellTagPart</code> (<code>'root'</code>), <code>HellTagUi</code>
          (<code>HellUi&lt;HellTagPart&gt;</code>).
        </li>
      </ul>
      <p><code>hellBadge</code></p>
      <ul>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;HellBadgePart&gt;</code> — string shorthand or a
          <code>HellBadgeUi</code> map that refines the <code>root</code> part. No other inputs.
        </li>
        <li>
          Exported types: <code>HellBadgePart</code> (<code>'root'</code>),
          <code>HellBadgeUi</code> (<code>HellUi&lt;HellBadgePart&gt;</code>).
        </li>
      </ul>
      <p><code>hellKbd</code> (selector <code>kbd[hellKbd], [hellKbd]</code>)</p>
      <ul>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;HellKbdPart&gt;</code> — string shorthand or a
          <code>HellKbdUi</code> map that refines the <code>root</code> part. No other inputs.
        </li>
        <li>
          Exported types: <code>HellKbdPart</code> (<code>'root'</code>), <code>HellKbdUi</code>
          (<code>HellUi&lt;HellKbdPart&gt;</code>).
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          All three directives are plain styling wrappers with no ARIA role, keyboard handling, or
          focus management — they inherit whatever semantics their host element already has.
        </li>
        <li>
          Tag and badge render as ordinary inline text to assistive tech; never encode a status
          distinction (paid vs. overdue, online vs. away) through color alone — pair the variant
          with a readable label, as every example on this page does.
        </li>
        <li>
          <code>hellKbd</code> selects <code>kbd[hellKbd]</code> or any <code>[hellKbd]</code> host,
          so attaching it to a real <code>&lt;kbd&gt;</code> element keeps the correct semantic
          meaning for assistive tech that announces keyboard notation specially.
        </li>
        <li>
          A badge placed over another element (like a nav icon) is visually decorative; give the
          surrounding control its own accessible name that already communicates the count, or
          include the count in that name, since the badge text alone has no programmatic
          association with it.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use <code>hellTag</code> for status, category, or other short classification metadata.</li>
        <li>Use <code>hellBadge</code> for counts and <code>hellKbd</code> for keyboard shortcuts.</li>
        <li>Keep variant-to-meaning mapping consistent across a page (for example, <code>success</code> always means the positive state).</li>
        <li>Pair a tag's color with a text label — never rely on color alone to convey status.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't make a tag look clickable (hover/press styling) unless it actually is one.</li>
        <li>Don't nest interactive controls inside a tag, badge, or kbd — they're not focusable containers.</li>
        <li>Don't use a badge as a replacement for a real notification count announced to assistive tech.</li>
      </ul>
    </article>
  `,
})
export class TagPage {
  protected readonly tagBasicExampleCode = tagBasicExampleCodeRaw;
  protected readonly tagVariantsExampleCode = tagVariantsExampleCodeRaw;
  protected readonly tagBadgeExampleCode = tagBadgeExampleCodeRaw;
  protected readonly tagKeyboardHintExampleCode = tagKeyboardHintExampleCodeRaw;
  protected readonly tagWithTableExampleCode = tagWithTableExampleCodeRaw;
  protected readonly tagStylingExampleCode = tagStylingExampleCodeRaw;
}
