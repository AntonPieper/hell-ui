import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { SeparatorAllPartsStylingExample } from './examples/all-parts-styling.example';
import separatorAllPartsStylingExampleCodeRaw from './examples/all-parts-styling.example.ts?raw' with {
  loader: 'text',
};
import { SeparatorBasicExample } from './examples/basic.example';
import separatorBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { SeparatorOrientationExample } from './examples/orientation.example';
import separatorOrientationExampleCodeRaw from './examples/orientation.example.ts?raw' with {
  loader: 'text',
};
import { SeparatorSpacingExample } from './examples/spacing.example';
import separatorSpacingExampleCodeRaw from './examples/spacing.example.ts?raw' with {
  loader: 'text',
};
import { SeparatorWithCardExample } from './examples/with-card.example';
import separatorWithCardExampleCodeRaw from './examples/with-card.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-separator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    SeparatorAllPartsStylingExample,
    SeparatorBasicExample,
    SeparatorOrientationExample,
    SeparatorSpacingExample,
    SeparatorWithCardExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Separator"
        icon="faSolidGripLines"
        category="Styled primitive"
        importPath="hell-ui/separator"
        stylesPath="hell-ui/separator/styles.css"
      >
        A thin, ARIA-correct rule that divides content without borrowing margin from its neighbours.
      </hd-page-header>
      <p>
        <code>hellSeparator</code> is a directive you attach to any host element — typically an
        <code>&lt;hr&gt;</code> or a plain <code>&lt;div&gt;</code> — built on the
        <code>NgpSeparator</code> primitive from <code>ng-primitives</code> for orientation state and
        the <code>separator</code> role. It adds <code>spacing</code>, a symmetric margin preset on
        the separator's main axis, plus a single-part <code>ui</code> Part Style Map.
      </p>
      <p>
        Because spacing is a first-class input instead of a utility class you re-type at every call
        site, separators stay consistent across a dense app: the same <code>spacing="sm"</code>
        reads identically inside a settings list, a card body, or a filter panel. Use
        <code>spacing="none"</code> for flush dividers where the parent already owns padding.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="separatorBasicExampleCode">
        <app-separator-basic-example />
      </hd-example-tabs>

      <h2>Orientation</h2>
      <p>
        Set <code>orientation</code> to <code>horizontal</code> (default) or <code>vertical</code>.
        Vertical separators need an ancestor with an explicit height — they stretch to fill it via
        <code>self-stretch</code>, so a bare inline context collapses to zero height.
      </p>
      <hd-example-tabs [code]="separatorOrientationExampleCode">
        <app-separator-orientation-example />
      </hd-example-tabs>

      <h2>Spacing</h2>
      <p>
        <code>spacing</code> maps to symmetric margin on the separator's main axis — vertical margin
        when horizontal, horizontal margin when vertical. The default is <code>md</code>;
        <code>none</code> removes margin entirely for dividers that sit flush against a container's
        own padding.
      </p>
      <hd-example-tabs [code]="separatorSpacingExampleCode">
        <app-separator-spacing-example />
      </hd-example-tabs>

      <h2>With card</h2>
      <p>
        A settings card where <code>spacing="sm"</code> separates stacked rows without adding margin
        to the paragraphs themselves — the card's own padding handles the outer inset.
      </p>
      <hd-example-tabs [code]="separatorWithCardExampleCode">
        <app-separator-with-card-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        The <code>ui</code> input refines the separator's only Public Part, <code>root</code> —
        the hairline element itself. Pass <code>ui="..."</code> as shorthand, or
        <code>[ui]="&#123; root: '...' &#125;"</code> for the equivalent explicit
        <code>&#123; root?: string &#125;</code> map. Both forms merge on top of the orientation/spacing recipe
        through Hell's Tailwind merge, so conflicting height, width, and background utilities
        deterministically replace the hairline defaults.
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
            <td>The divider element — thickness, color, radius, and margin.</td>
          </tr>
        </tbody>
      </table>
      <hd-example-tabs [code]="separatorAllPartsStylingExampleCode">
        <app-separator-all-parts-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>orientation</code>: <code>HellOrientation</code> —
          <code>horizontal | vertical</code>. Default <code>horizontal</code>.
        </li>
        <li>
          <code>spacing</code>: <code>HellSize | 'none'</code> —
          <code>none | xs | sm | md | lg | xl</code>. Symmetric margin on the main axis. Default
          <code>md</code>.
        </li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code> — a shorthand class
          string or a <code>&#123; root?: string &#125;</code> map that
          refines the <code>root</code> public part.
        </li>
        <li>
          </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          The host always renders <code>role="separator"</code> — there is no
          <code>decorative</code> escape hatch, so a purely visual rule should not use this
          directive if it must be hidden from assistive tech (use a plain styled element instead).
        </li>
        <li>
          <code>data-orientation</code> reflects the current <code>orientation</code> input, which
          screen readers use to announce the divider's axis.
        </li>
        <li>
          The separator is not focusable and carries no keyboard interaction — it is a static
          landmark, not a control.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use separators to clarify groups, not to decorate empty space.</li>
        <li>Choose a <code>spacing</code> value that matches the surrounding density.</li>
        <li>Use <code>spacing="none"</code> when the parent already provides padding.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't use a separator as a section heading — pair it with a real heading instead.</li>
        <li>Don't stack multiple separators to fake a thicker border.</li>
        <li>Don't add margin utilities to neighbouring elements — that doubles up with <code>spacing</code>.</li>
      </ul>
    </article>
  `,
})
export class SeparatorPage {
  protected readonly separatorAllPartsStylingExampleCode = separatorAllPartsStylingExampleCodeRaw;
  protected readonly separatorBasicExampleCode = separatorBasicExampleCodeRaw;
  protected readonly separatorOrientationExampleCode = separatorOrientationExampleCodeRaw;
  protected readonly separatorSpacingExampleCode = separatorSpacingExampleCodeRaw;
  protected readonly separatorWithCardExampleCode = separatorWithCardExampleCodeRaw;
}
