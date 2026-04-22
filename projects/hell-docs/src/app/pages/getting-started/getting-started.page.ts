import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'hd-getting-started',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="hd-prose">
      <h1>Installation</h1>
      <p>hell is built as an Angular library that depends on Angular Primitives,
        Tailwind v4, and (optionally) a few specialised libraries for the
        feature components.</p>

      <h2>1. Install peers</h2>
<pre><code>pnpm add ng-primitives @&#64;ng-icons/core @&#64;ng-icons/font-awesome
pnpm add -D tailwindcss &#64;tailwindcss/postcss postcss</code></pre>

      <h2>2. Configure Tailwind v4</h2>
      <p>Add a <code>.postcssrc.json</code> at the root of your workspace:</p>
<pre><code>&#123;
  "plugins": &#123; "&#64;tailwindcss/postcss": &#123;&#125; &#125;
&#125;</code></pre>

      <h2>3. Import the styles</h2>
      <p>Add the following to your global stylesheet (typically
        <code>src/styles.css</code>):</p>
<pre><code>&#64;import 'tailwindcss';
&#64;import 'hell/styles';</code></pre>

      <h2>4. Use a directive</h2>
<pre><code>import &#123; HellButton &#125; from 'hell';

&#64;Component(&#123;
  selector: 'app-demo',
  imports: [HellButton],
  template: \`&lt;button hellButton variant="primary"&gt;Save&lt;/button&gt;\`,
&#125;)
export class DemoComponent &#123;&#125;</code></pre>
    </article>
  `,
})
export class GettingStartedPage {}
