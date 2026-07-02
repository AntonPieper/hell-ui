import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_ACCORDION_DIRECTIVES } from '@hell-ui/angular/accordion';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { AccordionMultipleExample } from './examples/multiple.example';
import accordionMultipleExampleCodeRaw from './examples/multiple.example.ts?raw' with {
  loader: 'text',
};
import { AccordionSingleCollapsibleExample } from './examples/single-collapsible.example';
import accordionSingleCollapsibleExampleCodeRaw from './examples/single-collapsible.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-accordion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    ...HELL_ACCORDION_DIRECTIVES,
    AccordionSingleCollapsibleExample,
    AccordionMultipleExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Accordion"
        icon="faSolidLayerGroup"
        category="Styled primitive"
        importPath="@hell-ui/angular/accordion"
        stylesPath="@hell-ui/angular/accordion/styles.css"
      >
        Vertically stacked disclosure sections for progressively revealing dense content. One panel or several can stay open; consumers own the heading and panel markup.
      </hd-page-header>
      <p>
        Reveal sections of content one (or several) at a time. Set <code>type="single"</code> to
        allow only one open item, or <code>type="multiple"</code> for several.
      </p>

      <h2>Single, collapsible</h2>
      <hd-example-tabs [code]="accordionSingleCollapsibleExampleCode">
        <app-accordion-single-collapsible-example />
      </hd-example-tabs>

      <h2>Multiple</h2>
      <hd-example-tabs [code]="accordionMultipleExampleCode">
        <app-accordion-multiple-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>hellAccordion</code>: <code>value</code>, <code>valueChange</code>,
          <code>type</code>, <code>collapsible</code>, <code>disabled</code>,
          <code>orientation</code>, <code>ui</code>
        </li>
        <li>
          <code>hellAccordionItem</code>: <code>value</code>, <code>disabled</code>,
          <code>ui</code>.
        </li>
        <li>
          <code>hellAccordionTrigger</code>, <code>hellAccordionContent</code>: local
          <code>root</code> <code>ui</code>.
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>Triggers are native buttons wired to their panels with <code>aria-expanded</code> and <code>aria-controls</code>.</li>
        <li>Wrap each trigger in a real heading (<code>h3</code> in these examples) so the outline stays navigable.</li>
        <li>Collapsed panel content is removed from the tab order.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>
          Use <code>single</code> for navigation-like disclosure and <code>multiple</code> for
          reference content.
        </li>
        <li>Keep trigger text short and descriptive.</li>
        <li>Put padding inside <code>hellAccordionContent</code>, not on the animated host.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't hide critical errors inside a collapsed item.</li>
        <li>Don't nest accordions unless hierarchy is unavoidable.</li>
      </ul>
    </article>
  `,
})
export class AccordionPage {
  protected readonly accordionSingleCollapsibleExampleCode =
    accordionSingleCollapsibleExampleCodeRaw;
  protected readonly accordionMultipleExampleCode = accordionMultipleExampleCodeRaw;
}
