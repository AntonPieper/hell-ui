import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_ACCORDION_DIRECTIVES } from '@hell-ui/angular/primitives';

@Component({
  selector: 'app-accordion-single-collapsible-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_ACCORDION_DIRECTIVES],
  template: `
    <div hellAccordion type="single" collapsible value="install">
      <div hellAccordionItem value="install">
        <button hellAccordionTrigger type="button">Installation</button>
        <div hellAccordionContent>
          <div>
            <p class="my-2">Install via your package manager:</p>
            <pre><code>pnpm add hell ng-primitives</code></pre>
          </div>
        </div>
      </div>
      <div hellAccordionItem value="theming">
        <button hellAccordionTrigger type="button">Theming</button>
        <div hellAccordionContent>
          <div>
            Override CSS custom properties under <code>--color-hell-*</code>
            to retheme the entire library.
          </div>
        </div>
      </div>
      <div hellAccordionItem value="ssr">
        <button hellAccordionTrigger type="button">SSR</button>
        <div hellAccordionContent>
          <div>hell is fully SSR-safe — no direct DOM access at module load.</div>
        </div>
      </div>
    </div>
  `,
})
export class AccordionSingleCollapsibleExample {}
