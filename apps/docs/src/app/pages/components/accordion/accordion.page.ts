import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_ACCORDION_DIRECTIVES } from '@hell-ui/angular/accordion';
import { ExampleTabs } from '../../../shared/example-tabs';
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
  ],
  template: `
    <article class="hd-prose">
      <h1>Accordion</h1>
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
          <code>orientation</code>
        </li>
        <li><code>hellAccordionItem</code>: <code>value</code>, <code>disabled</code></li>
        <li><code>hellAccordionTrigger</code>, <code>hellAccordionContent</code></li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>
          Use <code>single</code> for navigation-like disclosure and <code>multiple</code> for
          reference content.
        </li>
        <li>Keep trigger text short and descriptive.</li>
        <li>Put padding inside <code>hellAccordionContent</code>, not on the animated host.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
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
