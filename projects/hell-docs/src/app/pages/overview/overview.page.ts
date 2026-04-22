import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HellButton, HELL_CARD_DIRECTIVES } from 'hell';

@Component({
  selector: 'hd-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, HellButton, ...HELL_CARD_DIRECTIVES],
  template: `
    <article class="hd-prose">
      <h1>hell — Heinrich Element Library</h1>
      <p>
        A small, opinionated Angular component library for building business
        and ICT applications. Built on top of
        <a href="https://angularprimitives.com" target="_blank" rel="noreferrer">
          Angular Primitives
        </a>
        for behaviour and accessibility, with a Tailwind-v4-driven theming
        layer for a clean, business-oriented look.
      </p>

      <h2>Why this exists</h2>
      <ul>
        <li>Behaviour and accessibility are delegated to a primitive layer that
          is already battle-tested — we ship only the styling and composition.</li>
        <li>Every styled directive supports an <code>unstyled</code> input so
          consumers can opt out and bring their own CSS while keeping the
          underlying behaviour.</li>
        <li>Theming is driven entirely by CSS custom properties and
          <code>data-*</code> attributes — no JS theme objects, no runtime
          shadow-DOM gymnastics.</li>
      </ul>

      <div hellCard style="margin-top: 1rem">
        <div hellCardHeader><strong>Get started</strong></div>
        <div hellCardBody>
          <p>Install the library, register the icon set, and start composing.</p>
        </div>
        <div hellCardFooter>
          <a hellButton variant="primary" routerLink="/getting-started">Installation</a>
          <a hellButton variant="ghost" routerLink="/theming">Theming</a>
        </div>
      </div>
    </article>
  `,
})
export class OverviewPage {}
