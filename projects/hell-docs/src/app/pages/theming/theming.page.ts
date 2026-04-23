import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'hd-theming',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="hd-prose">
      <h1>Theming</h1>
      <p>hell uses two layers of design tokens defined as CSS custom
        properties on <code>:root</code>. The <em>palette</em> layer exposes
        stepped brand scales via <code>--color-hell-&#60;family&#62;-&#60;weight&#62;</code>.
        The <em>semantic</em> layer maps those onto roles like
        <code>--hell-color-bg</code>, <code>--hell-color-fg</code>,
        <code>--hell-color-primary</code>, etc.</p>

      <h2>Brand anchors</h2>
      <ul>
        <li><code>primary</code> — <code>--color-hell-primary-900</code> → <code>--hell-color-primary</code></li>
        <li><code>success</code> — <code>--color-hell-success-500</code> → <code>--hell-color-success</code></li>
        <li><code>info</code> — <code>--color-hell-info-400</code> → <code>--hell-color-info</code></li>
        <li><code>danger</code> — <code>--color-hell-danger-500</code> → <code>--hell-color-danger</code></li>
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
  --hell-color-primary: #4f46e5;
  --hell-radius-md: 0.75rem;
&#125;</code></pre>
    </article>
  `,
})
export class ThemingPage {}
