import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellButton, HELL_MENU_DIRECTIVES } from 'hell';

@Component({
  selector: 'hd-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, ...HELL_MENU_DIRECTIVES],
  template: `
    <article class="hd-prose">
      <h1>Menu</h1>
      <p>A floating list of actions, anchored to a trigger. Use for overflow
        menus and contextual actions; use <code>tabs</code> for navigation
        between sibling views.</p>

      <h2>Example</h2>
      <div class="hd-example">
        <button hellButton [hellMenuTrigger]="m" placement="bottom-start">
          Actions
        </button>

        <ng-template #m>
          <div hellMenu>
            <button hellMenuItem type="button" (click)="onAction('rename')">Rename</button>
            <button hellMenuItem type="button" (click)="onAction('duplicate')">Duplicate</button>
            <div hellMenuSeparator></div>
            <button hellMenuItem type="button" disabled>Move (disabled)</button>
            <button hellMenuItem type="button" (click)="onAction('archive')">Archive</button>
            <div hellMenuSeparator></div>
            <button hellMenuItem type="button" style="color:var(--hell-color-danger)" (click)="onAction('delete')">
              Delete
            </button>
          </div>
        </ng-template>
      </div>

      <h2>API</h2>
      <ul>
        <li><code>hellMenuTrigger</code>: bind to a <code>&lt;ng-template&gt;</code></li>
        <li><code>placement</code>, <code>offset</code>, <code>disabled</code></li>
        <li><code>hellMenuItem</code>: <code>disabled</code></li>
        <li><code>hellMenuSeparator</code></li>
      </ul>
    </article>
  `,
})
export class MenuPage {
  protected onAction(name: string) {
    console.log('menu action:', name);
  }
}
