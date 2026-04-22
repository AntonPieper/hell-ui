import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_CARD_DIRECTIVES, HellButton } from 'hell';

@Component({
  selector: 'hd-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_CARD_DIRECTIVES, HellButton],
  template: `
    <article class="hd-prose">
      <h1>Card</h1>
      <p>A surface that groups related content. Compose with
        <code>hellCardHeader</code>, <code>hellCardBody</code> and
        <code>hellCardFooter</code>. Use <code>elevation</code> to control
        shadow depth.</p>

      <h2>Examples</h2>
      <div class="hd-example" style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:1rem">
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
      </div>

      <h2>With footer</h2>
      <div class="hd-example">
        <div hellCard style="max-width:380px">
          <div hellCardHeader><strong>Delete project</strong></div>
          <div hellCardBody>
            This action is permanent. All data and history will be removed.
          </div>
          <div hellCardFooter>
            <button hellButton variant="ghost">Cancel</button>
            <button hellButton variant="danger">Delete</button>
          </div>
        </div>
      </div>

      <h2>API</h2>
      <ul>
        <li><code>elevation</code>: <code>0 | 1 | 2 | 3</code></li>
        <li><code>unstyled</code>: opt out of all styling</li>
      </ul>
    </article>
  `,
})
export class CardPage {}
