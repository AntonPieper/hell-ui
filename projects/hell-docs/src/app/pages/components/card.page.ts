import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_CARD_DIRECTIVES, HellButton } from 'hell';
import { ExampleTabs } from '../../shared/example-tabs';

@Component({
  selector: 'hd-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, ...HELL_CARD_DIRECTIVES, HellButton],
  template: `
    <article class="hd-prose">
      <h1>Card</h1>
      <p>
        A surface that groups related content. Compose with <code>hellCardHeader</code>,
        <code>hellCardBody</code> and <code>hellCardFooter</code>. Use <code>elevation</code> to
        control shadow depth.
      </p>

      <h2>Examples</h2>
      <hd-example-tabs
        [code]="exampleCodes[0]"
        previewClass="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]"
      >
        <div hellCard [elevation]="0">
          <div hellCardHeader><strong>Flat</strong></div>
          <div hellCardBody>elevation = 0</div>
        </div>
        <div hellCard [elevation]="1">
          <div hellCardHeader><strong>Default</strong></div>
          <div hellCardBody>elevation = 1</div>
        </div>
        <div hellCard [elevation]="2">
          <div hellCardHeader><strong>Raised</strong></div>
          <div hellCardBody>elevation = 2</div>
        </div>
        <div hellCard [elevation]="3">
          <div hellCardHeader><strong>Floating</strong></div>
          <div hellCardBody>elevation = 3</div>
        </div>
      </hd-example-tabs>

      <h2>Without header</h2>
      <p>Cards are composable — drop the header (and footer) when the body speaks for itself.</p>
      <hd-example-tabs
        [code]="exampleCodes[1]"
        previewClass="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]"
      >
        <div hellCard>
          <div hellCardBody>
            A plain body. No header, no footer — just a surface that groups content.
          </div>
        </div>
        <div hellCard [elevation]="2">
          <div hellCardBody class="flex flex-col gap-2">
            <strong>Quick stat</strong>
            <span class="text-3xl font-semibold">128</span>
            <span class="hd-muted text-xs">Active sessions</span>
          </div>
        </div>
        <div hellCard>
          <div hellCardBody class="flex items-center justify-between gap-3">
            <span>Enable analytics</span>
            <button hellButton variant="primary" size="sm">Enable</button>
          </div>
        </div>
      </hd-example-tabs>

      <h2>With footer</h2>
      <hd-example-tabs [code]="exampleCodes[2]">
        <div hellCard class="max-w-95">
          <div hellCardHeader><strong>Delete project</strong></div>
          <div hellCardBody>This action is permanent. All data and history will be removed.</div>
          <div hellCardFooter>
            <button hellButton variant="ghost">Cancel</button>
            <button hellButton variant="danger">Delete</button>
          </div>
        </div>
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>elevation</code>: <code>0 | 1 | 2 | 3</code></li>
        <li><code>unstyled</code>: opt out of all styling</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use cards to group one idea, object or workflow.</li>
        <li>
          Prefer <code>hellCardHeader</code>, <code>hellCardBody</code> and
          <code>hellCardFooter</code> for consistent spacing.
        </li>
        <li>Use elevation only to show layering.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't turn every list row into a card.</li>
        <li>Don't put unrelated actions in a card footer.</li>
      </ul>
    </article>
  `,
})
export class CardPage {
  protected readonly exampleCodes = [
    '<div hellCard [elevation]="0">\n  <div hellCardHeader><strong>Flat</strong></div>\n  <div hellCardBody>elevation = 0</div>\n</div>\n<div hellCard [elevation]="1">\n  <div hellCardHeader><strong>Default</strong></div>\n  <div hellCardBody>elevation = 1</div>\n</div>\n<div hellCard [elevation]="2">\n  <div hellCardHeader><strong>Raised</strong></div>\n  <div hellCardBody>elevation = 2</div>\n</div>\n<div hellCard [elevation]="3">\n  <div hellCardHeader><strong>Floating</strong></div>\n  <div hellCardBody>elevation = 3</div>\n</div>\n',
    '<div hellCard>\n  <div hellCardBody>\n    A plain body. No header, no footer \u2014 just a surface that groups\n    content.\n  </div>\n</div>\n<div hellCard [elevation]="2">\n  <div hellCardBody class="flex flex-col gap-2">\n    <strong>Quick stat</strong>\n    <span class="text-3xl font-semibold">128</span>\n    <span class="hd-muted text-xs">Active sessions</span>\n  </div>\n</div>\n<div hellCard>\n  <div hellCardBody class="flex items-center justify-between gap-3">\n    <span>Enable analytics</span>\n    <button hellButton variant="primary" size="sm">Enable</button>\n  </div>\n</div>\n',
    '<div hellCard class="max-w-95">\n  <div hellCardHeader><strong>Delete project</strong></div>\n  <div hellCardBody>\n    This action is permanent. All data and history will be removed.\n  </div>\n  <div hellCardFooter>\n    <button hellButton variant="ghost">Cancel</button>\n    <button hellButton variant="danger">Delete</button>\n  </div>\n</div>\n',
  ] as const;
}
