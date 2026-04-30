import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HellButton, HELL_CARD_DIRECTIVES } from 'hell';

@Component({
  selector: 'hd-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, HellButton, ...HELL_CARD_DIRECTIVES],
  template: `
    <article class="hd-prose">
      <span class="hd-overview-logo" aria-hidden="true"></span>
      <h1>hell — Heinrich Element Library</h1>
      <p>
        A compact Angular component library for dense business software. hell pairs ng-primitives
        behavior with a restrained Tailwind v4 token layer: neutral surfaces, small radii, clear
        focus states, and no runtime theme object.
      </p>

      <p>
        The library is split into primitives, composites, and heavier feature components so apps can
        import exactly the interaction surface they need.
        <a href="https://angularprimitives.com" target="_blank" rel="noreferrer">
          Angular Primitives
        </a>
        provides low-level accessibility; hell owns the styling, density, and reusable app patterns.
      </p>

      <h2>Design goals</h2>
      <ul>
        <li>Keep controls calm, compact, and readable across repetitive admin workflows.</li>
        <li>
          Delegate behavior and accessibility to a primitive layer instead of reimplementing it.
        </li>
        <li>Expose an <code>unstyled</code> input everywhere styling should be optional.</li>
        <li>Use CSS custom properties and <code>data-hell-theme</code> for theming.</li>
      </ul>

      <h2>Architecture</h2>
      <ul>
        <li>
          <strong>Primitives</strong> are single-purpose controls like button, field, dialog, and
          menu.
        </li>
        <li>
          <strong>Composites</strong> combine primitives into repeated app patterns such as app
          shell and date input.
        </li>
        <li>
          <strong>Features</strong> wrap larger dependencies such as CodeMirror, TanStack Table, and
          PDF.js.
        </li>
      </ul>

      <div hellCard class="mt-4">
        <div hellCardHeader><strong>Start with the contract</strong></div>
        <div hellCardBody>
          <p>
            Import the CSS entry point once, register only the icons you use, and compose standalone
            components directly in each route or feature.
          </p>
        </div>
        <div hellCardFooter>
          <a hellButton variant="primary" routerLink="/getting-started">Getting started</a>
          <a hellButton variant="ghost" routerLink="/theming">Theming</a>
        </div>
      </div>
    </article>
  `,
})
export class OverviewPage {}
