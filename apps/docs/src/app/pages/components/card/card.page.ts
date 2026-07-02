import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { CardExamplesExample } from './examples/examples.example';
import cardExamplesExampleCodeRaw from './examples/examples.example.ts?raw' with {
  loader: 'text',
};
import { CardWithFooterExample } from './examples/with-footer.example';
import cardWithFooterExampleCodeRaw from './examples/with-footer.example.ts?raw' with {
  loader: 'text',
};
import { CardWithoutHeaderExample } from './examples/without-header.example';
import cardWithoutHeaderExampleCodeRaw from './examples/without-header.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, CardExamplesExample, CardWithoutHeaderExample, CardWithFooterExample, PageHeader],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Card"
        icon="faSolidIdCard"
        category="Styled primitive"
        importPath="@hell-ui/angular/card"
        stylesPath="@hell-ui/angular/card/styles.css"
      >
        A bordered surface with header, body, and footer regions for grouping related content in dense layouts.
      </hd-page-header>
      <p>
        A surface that groups related content. Compose with <code>hellCardHeader</code>,
        <code>hellCardBody</code> and <code>hellCardFooter</code>. Use <code>elevation</code> to
        control shadow depth.
      </p>

      <h2>Examples</h2>
      <hd-example-tabs
        [code]="cardExamplesExampleCode"
        previewClass="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]"
      >
        <app-card-examples-example />
      </hd-example-tabs>

      <h2>Without header</h2>
      <p>Cards are composable — drop the header (and footer) when the body speaks for itself.</p>
      <hd-example-tabs
        [code]="cardWithoutHeaderExampleCode"
        previewClass="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]"
      >
        <app-card-without-header-example />
      </hd-example-tabs>

      <h2>With footer</h2>
      <hd-example-tabs [code]="cardWithFooterExampleCode">
        <app-card-with-footer-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>hellCard</code>: <code>elevation</code> plus <code>ui</code> shorthand or map
          keyed by <code>root</code>.
        </li>
        <li>
          <code>hellCardHeader</code>, <code>hellCardBody</code>,
          <code>hellCardFooter</code>: each exposes its own local <code>root</code>
          <code>ui</code> part.
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>Cards are generic containers — add headings inside the header region to keep the page outline meaningful.</li>
        <li>Interactive content keeps its own semantics; the card itself is never a click target.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use cards to group one idea, object or workflow.</li>
        <li>
          Prefer <code>hellCardHeader</code>, <code>hellCardBody</code> and
          <code>hellCardFooter</code> for consistent spacing.
        </li>
        <li>Use elevation only to show layering.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't turn every list row into a card.</li>
        <li>Don't put unrelated actions in a card footer.</li>
      </ul>
    </article>
  `,
})
export class CardPage {
  protected readonly cardExamplesExampleCode = cardExamplesExampleCodeRaw;
  protected readonly cardWithoutHeaderExampleCode = cardWithoutHeaderExampleCodeRaw;
  protected readonly cardWithFooterExampleCode = cardWithFooterExampleCodeRaw;
}
