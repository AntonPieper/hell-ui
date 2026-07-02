import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { SeparatorFlushInsideACardExample } from './examples/flush-inside-a-card.example';
import separatorFlushInsideACardExampleCodeRaw from './examples/flush-inside-a-card.example.ts?raw' with {
  loader: 'text',
};
import { SeparatorHorizontalExample } from './examples/horizontal.example';
import separatorHorizontalExampleCodeRaw from './examples/horizontal.example.ts?raw' with {
  loader: 'text',
};
import { SeparatorSpacingOptionsExample } from './examples/spacing-options.example';
import separatorSpacingOptionsExampleCodeRaw from './examples/spacing-options.example.ts?raw' with {
  loader: 'text',
};
import { SeparatorVerticalExample } from './examples/vertical.example';
import separatorVerticalExampleCodeRaw from './examples/vertical.example.ts?raw' with {
  loader: 'text',
};
import { SeparatorStylingExample } from './examples/styling.example';
import separatorStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-separator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    SeparatorHorizontalExample,
    SeparatorSpacingOptionsExample,
    SeparatorVerticalExample,
    SeparatorFlushInsideACardExample, SeparatorStylingExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Separator"
        icon="faSolidGripLines"
        category="Styled primitive"
        importPath="@hell-ui/angular/separator"
        stylesPath="@hell-ui/angular/separator/styles.css"
      >
        A horizontal or vertical rule with spacing presets, for dividing dense regions without extra margin utilities.
      </hd-page-header>
      <p>
        A thin divider with the correct ARIA role for both axes. Configure breathing room via
        <code>spacing</code>, or set it to <code>none</code> for flush dividers (e.g. inside cards).
      </p>

      <h2>Horizontal</h2>
      <hd-example-tabs [code]="separatorHorizontalExampleCode">
        <app-separator-horizontal-example />
      </hd-example-tabs>

      <h2>Spacing options</h2>
      <hd-example-tabs [code]="separatorSpacingOptionsExampleCode">
        <app-separator-spacing-options-example />
      </hd-example-tabs>

      <h2>Vertical</h2>
      <hd-example-tabs
        [code]="separatorVerticalExampleCode"
        previewClass="flex h-[60px] items-center"
      >
        <app-separator-vertical-example />
      </hd-example-tabs>

      <h2>Flush (inside a card)</h2>
      <hd-example-tabs [code]="separatorFlushInsideACardExampleCode">
        <app-separator-flush-inside-a-card-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        <code>HellSeparatorUi</code> refines the separator's <code>root</code> Public Part. Conflicting height and background utilities deterministically replace the recipe's hairline defaults.
      </p>
      <hd-example-tabs [code]="separatorStylingExampleCode" previewClass="grid max-w-md gap-2">
        <app-separator-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>orientation</code>: <code>horizontal | vertical</code></li>
        <li>
          <code>spacing</code>: <code>none | xs | sm | md | lg | xl</code> — symmetric margin on the
          main axis
        </li>
        <li><code>ui</code>: string shorthand or <code>&#123; root: '...' &#125;</code></li>
      </ul>

      <h2>Best practice</h2>
      <ul>
        <li>
          Default <code>md</code> spacing works for most prose. Tighten to <code>sm</code> for dense
          lists, drop to <code>none</code> when the parent already provides padding (cards, menus,
          toolbars).
        </li>
        <li>
          Don't combine separators with margins on neighbouring elements — double-spacing reads as a
          layout bug.
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>Defaults to <code>role="separator"</code> with correct orientation; use <code>decorative</code> to remove it from the tree.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use separators to clarify groups, not decorate empty space.</li>
        <li>Choose spacing that matches surrounding density.</li>
        <li>Use vertical separators only in horizontal layouts with enough height.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't use separators as section headings.</li>
        <li>Don't stack multiple separators to create borders.</li>
      </ul>
    </article>
  `,
})
export class SeparatorPage {
  protected readonly separatorHorizontalExampleCode = separatorHorizontalExampleCodeRaw;
  protected readonly separatorSpacingOptionsExampleCode = separatorSpacingOptionsExampleCodeRaw;
  protected readonly separatorVerticalExampleCode = separatorVerticalExampleCodeRaw;
  protected readonly separatorFlushInsideACardExampleCode = separatorFlushInsideACardExampleCodeRaw;
  protected readonly separatorStylingExampleCode = separatorStylingExampleCodeRaw;
}
