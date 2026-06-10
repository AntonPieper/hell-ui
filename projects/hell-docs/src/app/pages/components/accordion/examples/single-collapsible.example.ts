import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_ACCORDION_DIRECTIVES } from '@hell-ui/angular/accordion';

@Component({
  selector: 'app-accordion-single-collapsible-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_ACCORDION_DIRECTIVES],
  template: `
    <div hellAccordion type="single" collapsible value="install">
      <div hellAccordionItem value="install">
        <h3 class="m-0">
          <button hellAccordionTrigger type="button">Installation</button>
        </h3>
        <div hellAccordionContent>
          <div>
            <p class="my-2">Install via your package manager:</p>
            <pre><code>pnpm add @hell-ui/angular ng-primitives</code></pre>
          </div>
        </div>
      </div>
      <div hellAccordionItem value="theming">
        <h3 class="m-0">
          <button hellAccordionTrigger type="button">Theming</button>
        </h3>
        <div hellAccordionContent>
          <div>
            Override CSS custom properties under <code>--color-hell-*</code>
            to retheme the entire library.
          </div>
        </div>
      </div>
      <div hellAccordionItem value="ssr">
        <h3 class="m-0">
          <button hellAccordionTrigger type="button">SSR</button>
        </h3>
        <div hellAccordionContent>
          <div>
            hell avoids DOM access at module load; browser-only features document their client-only
            boundaries.
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AccordionSingleCollapsibleExample {}
