import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'hd-theming',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="hd-prose">
      <h1>Theming</h1>
      <p>hell uses two layers of design tokens defined as CSS custom
        properties on <code>:root</code>. The <em>palette</em> layer holds
        brand colours; the <em>semantic</em> layer maps those onto roles like
        <code>--hell-color-bg</code>, <code>--hell-color-fg</code>,
        <code>--hell-color-primary</code>, etc.</p>

      <h2>Brand palette</h2>
      <ul>
        <li><code>--hell-color-primary</code> — <code>#313A46</code></li>
        <li><code>--hell-color-success</code> — <code>#64b22c</code></li>
        <li><code>--hell-color-info</code> — <code>#0DCAF0</code></li>
        <li><code>--hell-color-danger</code> — <code>#da564d</code></li>
      </ul>

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
