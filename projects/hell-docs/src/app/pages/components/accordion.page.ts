import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_ACCORDION_DIRECTIVES } from 'hell';

@Component({
  selector: 'hd-accordion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_ACCORDION_DIRECTIVES],
  template: `
    <article class="hd-prose">
      <h1>Accordion</h1>
      <p>Reveal sections of content one (or several) at a time. Set
        <code>type="single"</code> to allow only one open item, or
        <code>type="multiple"</code> for several.</p>

      <h2>Single, collapsible</h2>
      <div class="hd-example">
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
                Override CSS custom properties under <code>--hell-color-*</code>
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
      </div>

      <h2>Multiple</h2>
      <div class="hd-example">
        <div hellAccordion type="multiple">
          <div hellAccordionItem value="a">
            <button hellAccordionTrigger type="button">First</button>
            <div hellAccordionContent>
              <div>You can open me…</div>
            </div>
          </div>
          <div hellAccordionItem value="b">
            <button hellAccordionTrigger type="button">Second</button>
            <div hellAccordionContent>
              <div>…and me at the same time.</div>
            </div>
          </div>
        </div>
      </div>

      <h2>API</h2>
      <ul>
        <li><code>hellAccordion</code>: <code>value</code>, <code>valueChange</code>, <code>type</code>, <code>collapsible</code>, <code>disabled</code>, <code>orientation</code></li>
        <li><code>hellAccordionItem</code>: <code>value</code>, <code>disabled</code></li>
        <li><code>hellAccordionTrigger</code>, <code>hellAccordionContent</code></li>
      </ul>
    </article>
  `,
})
export class AccordionPage {}
