import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { SpinnerColourExample } from './examples/colour.example';
import spinnerColourExampleCodeRaw from './examples/colour.example.ts?raw' with {
  loader: 'text',
};
import { SpinnerInsideAButtonExample } from './examples/inside-a-button.example';
import spinnerInsideAButtonExampleCodeRaw from './examples/inside-a-button.example.ts?raw' with {
  loader: 'text',
};
import { SpinnerSizesExample } from './examples/sizes.example';
import spinnerSizesExampleCodeRaw from './examples/sizes.example.ts?raw' with {
  loader: 'text',
};
import { SpinnerVariantsExample } from './examples/variants.example';
import spinnerVariantsExampleCodeRaw from './examples/variants.example.ts?raw' with {
  loader: 'text',
};
import { SpinnerStylingExample } from './examples/styling.example';
import spinnerStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    RouterLink,
    SpinnerVariantsExample,
    SpinnerSizesExample,
    SpinnerColourExample,
    SpinnerInsideAButtonExample, SpinnerStylingExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Spinner"
        icon="faSolidSpinner"
        category="Styled primitive"
        importPath="@hell-ui/angular/skeleton"
        stylesPath="@hell-ui/angular/skeleton/styles.css"
      >
        An indeterminate activity indicator that follows text size and color — for short, unquantifiable waits.
      </hd-page-header>
      <p>
        Indeterminate loading indicator. Use for short, in-flight operations — submit buttons,
        refresh, polling. For layout-preserving placeholders prefer
        <a routerLink="/components/skeleton">Skeleton</a>.
      </p>

      <h2>Variants</h2>
      <p>
        Four built-in variants. All inherit <code>currentColor</code>, so they adapt to surrounding
        text and themed buttons automatically.
      </p>
      <hd-example-tabs
        [code]="spinnerVariantsExampleCode"
        previewClass="flex flex-wrap items-center gap-8"
      >
        <app-spinner-variants-example />
      </hd-example-tabs>

      <h2>Sizes</h2>
      <p>
        Five preset sizes (<code>xs sm md lg xl</code>). Or set any <code>font-size</code>: spinners
        are sized in <code>em</code>.
      </p>
      <hd-example-tabs
        [code]="spinnerSizesExampleCode"
        previewClass="flex flex-wrap items-end gap-6"
      >
        <app-spinner-sizes-example />
      </hd-example-tabs>

      <h2>Colour</h2>
      <p>Inherits <code>currentColor</code>. Wrap in any text utility.</p>
      <hd-example-tabs
        [code]="spinnerColourExampleCode"
        previewClass="flex flex-wrap items-center gap-6"
      >
        <app-spinner-colour-example />
      </hd-example-tabs>

      <h2>Inside a button</h2>
      <hd-example-tabs
        [code]="spinnerInsideAButtonExampleCode"
        previewClass="flex flex-wrap items-center gap-3"
      >
        <app-spinner-inside-a-button-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        <code>HellSpinnerUi</code> refines the spinner's <code>root</code> Public Part. The recipe sets font-size per <code>size</code> variant; a conflicting <code>ui</code> font-size wins through the Part-Class Pipeline.
      </p>
      <hd-example-tabs [code]="spinnerStylingExampleCode" previewClass="flex items-center gap-4">
        <app-spinner-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>variant</code>: <code>ring | dots | bars | pulse</code></li>
        <li><code>size</code>: <code>xs | sm | md | lg | xl</code></li>
        <li><code>ui</code>: string or <code>{{ '{' }} root: string {{ '}' }}</code> map</li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>Ships a Label Contract loading label; override it per instance when the context is more specific.</li>
        <li>For longer operations prefer Progress with real values.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>
          Pair the spinner with a label when the action is non-trivial (e.g. <em>Saving…</em>).
        </li>
        <li>
          Match the spinner colour to the button it sits inside — <code>currentColor</code> handles
          this automatically.
        </li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>
          Don't use a spinner where the result will arrive in &lt; 200 ms; flicker is worse than no
          feedback.
        </li>
        <li>Don't use a spinner to mask a layout shift — use a Skeleton.</li>
      </ul>
    </article>
  `,
})
export class SpinnerPage {
  protected readonly spinnerVariantsExampleCode = spinnerVariantsExampleCodeRaw;
  protected readonly spinnerSizesExampleCode = spinnerSizesExampleCodeRaw;
  protected readonly spinnerColourExampleCode = spinnerColourExampleCodeRaw;
  protected readonly spinnerInsideAButtonExampleCode = spinnerInsideAButtonExampleCodeRaw;
  protected readonly spinnerStylingExampleCode = spinnerStylingExampleCodeRaw;
}
