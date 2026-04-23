import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellIcon } from 'hell';

@Component({
  selector: 'hd-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellIcon],
  template: `
    <article class="hd-prose">
      <h1>Icon</h1>
      <p>Thin wrapper around <code>&lt;ng-icon&gt;</code> from
        <code>&#64;ng-icons/core</code>. Consumer apps must register the icons
        they use via <code>provideIcons()</code> at bootstrap or per-component.</p>

      <h2>Example</h2>
      <div class="hd-example flex items-center gap-4 text-base">
        <span class="text-[var(--hell-color-success)]"><hell-icon name="faSolidCircleCheck" /></span>
        <span class="text-[var(--hell-color-info)]"><hell-icon name="faSolidCircleInfo" /></span>
        <span class="text-[var(--hell-color-warning)]"><hell-icon name="faSolidTriangleExclamation" /></span>
        <span class="text-[var(--hell-color-danger)]"><hell-icon name="faSolidXmark" /></span>
      </div>

      <h2>Sizes</h2>
      <div class="hd-example flex items-center gap-4">
        <span class="text-[14px]"><hell-icon name="faSolidPhone" /></span>
        <span class="text-[20px]"><hell-icon name="faSolidPhone" /></span>
        <span class="text-[32px]"><hell-icon name="faSolidPhone" /></span>
        <span class="text-[48px]"><hell-icon name="faSolidPhone" /></span>
      </div>

      <h2>Inherits text colour and size</h2>
      <p class="text-[1.25rem] text-[var(--hell-color-primary)]">
        I am text with an icon
        <hell-icon name="faSolidArrowDown" />
        — both share the parent's font-size and colour.
      </p>

      <h2>API</h2>
      <ul>
        <li><code>name</code>: registered icon name (e.g. <code>faSolidCheck</code>)</li>
        <li><code>size</code>: any CSS length, defaults to <code>1em</code></li>
        <li><code>color</code>: any CSS colour, defaults to <code>currentColor</code></li>
        <li><code>decorative</code>: when <code>false</code>, requires <code>aria-label</code></li>
      </ul>

      <h2>Registering icons</h2>
      <pre><code>import &#123; provideIcons &#125; from '&#64;ng-icons/core';
import &#123; faSolidCheck &#125; from '&#64;ng-icons/font-awesome/solid';

bootstrapApplication(AppComponent, &#123;
  providers: [provideIcons(&#123; faSolidCheck &#125;)],
&#125;);</code></pre>
    </article>
  `,
})
export class IconPage {}
