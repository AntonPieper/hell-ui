import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { IconBasicExample } from './examples/basic.example';
import iconBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { IconColorsExample } from './examples/colors.example';
import iconColorsExampleCodeRaw from './examples/colors.example.ts?raw' with {
  loader: 'text',
};
import { IconSizesExample } from './examples/sizes.example';
import iconSizesExampleCodeRaw from './examples/sizes.example.ts?raw' with { loader: 'text' };
import { IconStylingExample } from './examples/styling.example';
import iconStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};
import { IconWithButtonAndTagExample } from './examples/with-button-and-tag.example';
import iconWithButtonAndTagExampleCodeRaw from './examples/with-button-and-tag.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    IconBasicExample,
    IconSizesExample,
    IconColorsExample,
    IconWithButtonAndTagExample,
    IconStylingExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Icon"
        icon="faSolidStar"
        category="Styled primitive"
        importPath="hell-ui/icon"
        stylesPath="hell-ui/icon/styles.css"
      >
        Renders a registered SVG glyph that scales and colors with the surrounding text.
      </hd-page-header>
      <p>
        <code>hell-icon</code> is a thin styled wrapper around <code>&lt;ng-icon&gt;</code> from
        <code>&#64;ng-icons/core</code>. It adds a single Public Part (<code>root</code>), a
        <code>ui</code> Part Style Map, and two conveniences on top of the raw primitive: a
        <code>size</code> input that defaults to <code>1em</code> so glyphs scale with the
        surrounding font size, and a <code>decorative</code> input that hides the icon from
        assistive technology by default.
      </p>
      <p>
        Consumer apps register the icons they use via <code>provideIcons({{ '{' }} faChevronDown,
        ... {{ '}' }})</code>, ideally in the component that renders them rather than at
        application bootstrap — this keeps icon sets tree-shakeable per feature. In a dense
        business app, <code>hell-icon</code> is the default way to add status glyphs, leading
        icons on buttons, and small inline affordances without hand-rolling SVG markup.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="iconBasicExampleCode">
        <app-icon-basic-example />
      </hd-example-tabs>

      <h2>Sizes</h2>
      <p>
        <code>size</code> accepts any CSS length and defaults to <code>1em</code>, so an icon
        placed inside running text tracks the surrounding font size automatically. Pass an
        explicit length to size it independently of the parent's <code>font-size</code>.
      </p>
      <hd-example-tabs [code]="iconSizesExampleCode" previewClass="flex items-center gap-4">
        <app-icon-sizes-example />
      </hd-example-tabs>

      <h2>Color</h2>
      <p>
        Without a <code>color</code> input, the glyph inherits <code>currentColor</code>, so
        wrapping it in an element with a text color utility such as <code>text-hell-danger</code>
        is usually enough. Pass <code>color</code> directly when the glyph's color must differ
        from the surrounding text, for example a status dot inside a neutral-colored row.
      </p>
      <hd-example-tabs [code]="iconColorsExampleCode" previewClass="flex items-center gap-4 text-lg">
        <app-icon-colors-example />
      </hd-example-tabs>

      <h2>With button and tag</h2>
      <p>
        A status row combining <code>hellChip</code> for the connection state, <code>hell-icon</code>
        for the status glyph and the leading call icon, and <code>hellButton</code> for the
        action. The disabled button communicates why the action is unavailable without any extra
        state plumbing — the <code>hellButton</code> directive handles the disabled semantics.
      </p>
      <hd-example-tabs [code]="iconWithButtonAndTagExampleCode" previewClass="flex flex-col gap-hell-3">
        <app-icon-with-button-and-tag-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        <code>hell-ui/icon</code> exports one module, <code>HellIcon</code>, with one
        Public Part.
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
            <td>The <code>hell-icon</code> host element — layout, text color, size variables.</td>
          </tr>
        </tbody>
      </table>
      <p>
        Pass <code>ui="..."</code> as shorthand to refine <code>root</code>, or
        <code>[ui]="&#123; root: '...' &#125;"</code> for the equivalent explicit
        <code>&#123; root?: string &#125;</code> map. Both forms merge on top of the default recipe through Hell's
        Tailwind merge, so a conflicting utility like <code>text-hell-primary</code> wins
        deterministically over the inherited-color default.
      </p>
      <hd-example-tabs [code]="iconStylingExampleCode" previewClass="flex items-center gap-3">
        <app-icon-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>name</code>: <code>string</code> (required). Name of the registered icon, as passed to <code>provideIcons</code>.</li>
        <li><code>size</code>: <code>string</code>. Any CSS length. Default <code>'1em'</code>.</li>
        <li><code>color</code>: <code>string | null</code>. Any CSS color. Default <code>null</code>, which inherits <code>currentColor</code>.</li>
        <li><code>decorative</code>: <code>boolean</code>. Hides the icon from assistive technology when <code>true</code>. Default <code>true</code>.</li>
        <li><code>aria-label</code>: <code>string | null</code> (input alias for <code>ariaLabel</code>). Accessible name used when <code>decorative</code> is <code>false</code>. Default <code>null</code>.</li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code> — a shorthand class string
          or a <code>&#123; root?: string &#125;</code> map that refines
          the <code>root</code> public part.
        </li>
        <li>
          </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          When <code>decorative</code> is <code>true</code> (the default), the host gets
          <code>aria-hidden="true"</code> and no <code>role</code> or <code>aria-label</code> —
          assistive technology skips it entirely.
        </li>
        <li>
          When <code>decorative</code> is <code>false</code>, the host gets
          <code>role="img"</code> and <code>aria-label</code> from the <code>aria-label</code>
          input, so the icon is announced as a labeled image.
        </li>
        <li>
          The inner <code>&lt;ng-icon&gt;</code> element always carries
          <code>aria-hidden="true"</code>, regardless of <code>decorative</code>, so the SVG
          itself is never independently exposed to assistive tech — only the host's role/label
          state matters.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Register only the icon packs a component actually renders, close to where they're used.</li>
        <li>Prefer visible text; use <code>decorative="false"</code> with an <code>aria-label</code> only for standalone meaningful icons.</li>
        <li>Rely on the default <code>1em</code> size to keep icons aligned with surrounding text rhythm.</li>
        <li>Use <code>ui</code> instead of a conflicting <code>class</code> utility when a refinement must beat the recipe.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't use a bare icon as the only content of an interactive element without an accessible name.</li>
        <li>Don't set <code>decorative="false"</code> without also providing <code>aria-label</code>.</li>
        <li>Don't mix icon styles (solid, regular, brand) in the same toolbar without intent.</li>
      </ul>
    </article>
  `,
})
export class IconPage {
  protected readonly iconBasicExampleCode = iconBasicExampleCodeRaw;
  protected readonly iconSizesExampleCode = iconSizesExampleCodeRaw;
  protected readonly iconColorsExampleCode = iconColorsExampleCodeRaw;
  protected readonly iconWithButtonAndTagExampleCode = iconWithButtonAndTagExampleCodeRaw;
  protected readonly iconStylingExampleCode = iconStylingExampleCodeRaw;
}
