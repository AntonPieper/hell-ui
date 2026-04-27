import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_ACCORDION_DIRECTIVES } from 'hell';
import { ExampleTabs } from '../../shared/example-tabs';

@Component({
  selector: 'hd-accordion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, ...HELL_ACCORDION_DIRECTIVES],
  template: `
    <article class="hd-prose">
      <h1>Accordion</h1>
      <p>
        Reveal sections of content one (or several) at a time. Set <code>type="single"</code> to
        allow only one open item, or <code>type="multiple"</code> for several.
      </p>

      <h2>Single, collapsible</h2>
      <hd-example-tabs [code]="exampleCodes[0]">
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
      </hd-example-tabs>

      <h2>Multiple</h2>
      <hd-example-tabs [code]="exampleCodes[1]">
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
  protected readonly exampleCodes = [
    '<div hellAccordion type="single" collapsible value="install">\n  <div hellAccordionItem value="install">\n    <button hellAccordionTrigger type="button">Installation</button>\n    <div hellAccordionContent>\n      <div>\n        <p class="my-2">Install via your package manager:</p>\n        <pre><code>pnpm add hell ng-primitives</code></pre>\n      </div>\n    </div>\n  </div>\n  <div hellAccordionItem value="theming">\n    <button hellAccordionTrigger type="button">Theming</button>\n    <div hellAccordionContent>\n      <div>\n        Override CSS custom properties under <code>--color-hell-*</code>\n        to retheme the entire library.\n      </div>\n    </div>\n  </div>\n  <div hellAccordionItem value="ssr">\n    <button hellAccordionTrigger type="button">SSR</button>\n    <div hellAccordionContent>\n      <div>hell is fully SSR-safe \u2014 no direct DOM access at module load.</div>\n    </div>\n  </div>\n</div>\n',
    '<div hellAccordion type="multiple">\n  <div hellAccordionItem value="a">\n    <button hellAccordionTrigger type="button">First</button>\n    <div hellAccordionContent>\n      <div>You can open me\u2026</div>\n    </div>\n  </div>\n  <div hellAccordionItem value="b">\n    <button hellAccordionTrigger type="button">Second</button>\n    <div hellAccordionContent>\n      <div>\u2026and me at the same time.</div>\n    </div>\n  </div>\n</div>\n',
  ] as const;
}
