import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'hd-theming',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="hd-prose">
      <h1>Theming</h1>
      <p>hell publishes its design tokens through Tailwind theme variable
        namespaces. The <em>palette</em> layer exposes stepped brand scales via
        <code>--color-hell-&#60;family&#62;-&#60;weight&#62;</code>. The <em>semantic</em>
        layer maps those onto roles like <code>--color-hell-surface</code>,
        <code>--color-hell-foreground</code>, <code>--color-hell-primary</code>,
        and the other UI-facing color tokens.</p>

      <p>Spacing, control sizing, radii, shadows, and easing follow the same
        model with <code>--spacing-hell-*</code>,
        <code>--spacing-hell-control-*</code>, <code>--radius-hell-*</code>,
        <code>--shadow-hell-*</code>, and <code>--ease-hell-*</code>. Those
        theme variables are what components and generated utilities consume
        directly, so <code>bg-hell-surface</code>,
        <code>text-hell-foreground</code>, and <code>border-hell-border</code>
        work out of the box with no compatibility layer.</p>

      <h2>Brand anchors</h2>
      <ul>
        <li><code>primary</code> — <code>--color-hell-primary-900</code> → <code>--color-hell-primary</code></li>
        <li><code>success</code> — <code>--color-hell-success-500</code> → <code>--color-hell-success</code></li>
        <li><code>info</code> — <code>--color-hell-info-400</code> → <code>--color-hell-info</code></li>
        <li><code>danger</code> — <code>--color-hell-danger-500</code> → <code>--color-hell-danger</code></li>
      </ul>

      <p>Components should consume semantic tokens. That keeps rendered UI
        stable even when palette weights are reclassified or expanded.</p>

      <h2>Light vs dark</h2>
      <p>The library is light-mode-first. To switch themes, set
        <code>data-hell-theme="dark"</code> on a parent element (typically
        <code>&lt;html&gt;</code> or <code>&lt;body&gt;</code>).</p>

      <h2>Overriding tokens</h2>
      <p>Override any token at the scope you need it:</p>
<pre><code>.my-section &#123;
  --color-hell-primary: #4f46e5;
  --radius-hell-md: 0.75rem;
&#125;</code></pre>
    </article>
  `,
})
export class ThemingPage {}
