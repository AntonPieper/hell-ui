import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_ACCORDION_IMPORTS } from '@hell-ui/angular/accordion';

@Component({
  selector: 'app-accordion-all-parts-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_ACCORDION_IMPORTS],
  template: `
    <!-- Every accordion module owns a single 'root' part — refine each -->
    <!-- module's own ui input rather than styling descendants from hellAccordion. -->
    <div
      hellAccordion
      type="single"
      collapsible
      value="install"
      ui="rounded-hell-lg border-hell-primary bg-hell-primary-soft"
    >
      <div hellAccordionItem value="install" ui="border-hell-primary">
        <h3 class="m-0">
          <button
            hellAccordionTrigger
            type="button"
            ui="text-hell-primary-soft-foreground data-hover:bg-hell-primary/10"
          >
            Installation
          </button>
        </h3>
        <div hellAccordionContent ui="text-hell-primary-soft-foreground">
          <div>Install with your package manager of choice.</div>
        </div>
      </div>
      <div hellAccordionItem value="theming" [ui]="{ root: 'border-hell-primary' }">
        <h3 class="m-0">
          <button
            hellAccordionTrigger
            type="button"
            [ui]="{ root: 'text-hell-primary-soft-foreground data-hover:bg-hell-primary/10' }"
          >
            Theming
          </button>
        </h3>
        <div hellAccordionContent [ui]="{ root: 'text-hell-primary-soft-foreground' }">
          <div>Override semantic tokens to retheme the entire library.</div>
        </div>
      </div>
    </div>
  `,
})
export class AccordionAllPartsStylingExample {}
