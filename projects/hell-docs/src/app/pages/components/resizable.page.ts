import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_RESIZABLE_DIRECTIVES } from 'hell';

@Component({
  selector: 'hd-resizable',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_RESIZABLE_DIRECTIVES],
  template: `
    <article class="hd-prose">
      <h1>Resizable</h1>
      <p>Pointer-driven resizable panes. Place
        <code>hellResizableHandle</code> between sibling
        <code>hellResizablePane</code> elements; the handle drags both at
        once.</p>

      <h2>Horizontal split</h2>
      <div class="hd-example" style="padding:0">
        <div hellResizable orientation="horizontal" style="height:240px">
          <div hellResizablePane [initialFlex]="2" style="background:var(--hell-color-bg-elevated); padding:1rem">
            Left pane
          </div>
          <div hellResizableHandle></div>
          <div hellResizablePane [initialFlex]="3" style="background:var(--hell-color-bg-subtle); padding:1rem">
            Right pane
          </div>
        </div>
      </div>

      <h2>Three panes</h2>
      <div class="hd-example" style="padding:0">
        <div hellResizable orientation="horizontal" style="height:200px">
          <div hellResizablePane [initialFlex]="1" style="background:var(--hell-color-bg-elevated); padding:1rem">
            Sidebar
          </div>
          <div hellResizableHandle></div>
          <div hellResizablePane [initialFlex]="3" style="background:var(--hell-color-bg-subtle); padding:1rem">
            Main
          </div>
          <div hellResizableHandle></div>
          <div hellResizablePane [initialFlex]="2" style="background:var(--hell-color-bg-elevated); padding:1rem">
            Inspector
          </div>
        </div>
      </div>

      <h2>Vertical split</h2>
      <div class="hd-example" style="padding:0">
        <div hellResizable orientation="vertical" style="height:280px; display:flex; flex-direction:column">
          <div hellResizablePane [initialFlex]="2" style="background:var(--hell-color-bg-elevated); padding:1rem">
            Top pane
          </div>
          <div hellResizableHandle></div>
          <div hellResizablePane [initialFlex]="1" style="background:var(--hell-color-bg-subtle); padding:1rem">
            Bottom pane
          </div>
        </div>
      </div>

      <h2>API</h2>
      <ul>
        <li><code>hellResizable</code>: <code>orientation</code> (<code>horizontal | vertical</code>)</li>
        <li><code>hellResizablePane</code>: <code>initialFlex</code>, <code>minSize</code> (px)</li>
        <li><code>hellResizableHandle</code>: place between two panes</li>
      </ul>
    </article>
  `,
})
export class ResizablePage {}
