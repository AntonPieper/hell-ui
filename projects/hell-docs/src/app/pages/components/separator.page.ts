import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellSeparator } from 'hell';

@Component({
  selector: 'hd-separator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSeparator],
  template: `
    <article class="hd-prose">
      <h1>Separator</h1>
      <p>A thin divider with the correct ARIA role for both axes. Configure
        breathing room via <code>spacing</code>, or set it to
        <code>none</code> for flush dividers (e.g. inside cards).</p>

      <h2>Horizontal</h2>
      <div class="hd-example">
        <p class="m-0">Section A</p>
        <div hellSeparator></div>
        <p class="m-0">Section B</p>
        <div hellSeparator spacing="lg"></div>
        <p class="m-0">Section C — generous spacing</p>
      </div>

      <h2>Spacing options</h2>
      <div class="hd-example">
        @for (s of ['none', 'xs', 'sm', 'md', 'lg', 'xl']; track s) {
          <div class="hd-muted text-xs">{{ s }}</div>
          <div hellSeparator [spacing]="$any(s)"></div>
        }
      </div>

      <h2>Vertical</h2>
      <div class="hd-example flex h-[60px] items-center">
        <span>Left</span>
        <div hellSeparator orientation="vertical" spacing="md"></div>
        <span>Middle</span>
        <div hellSeparator orientation="vertical" spacing="md"></div>
        <span>Right</span>
      </div>

      <h2>Flush (inside a card)</h2>
      <div class="hd-example">
        <div class="hell-card max-w-95">
          <div class="hell-card-header"><strong>Settings</strong></div>
          <div class="hell-card-body">
            <p class="m-0">General</p>
            <div hellSeparator spacing="sm"></div>
            <p class="m-0">Notifications</p>
            <div hellSeparator spacing="sm"></div>
            <p class="m-0">Privacy</p>
          </div>
        </div>
      </div>

      <h2>API</h2>
      <ul>
        <li><code>orientation</code>: <code>horizontal | vertical</code></li>
        <li><code>spacing</code>: <code>none | xs | sm | md | lg | xl</code> — symmetric margin on the main axis</li>
        <li><code>unstyled</code></li>
      </ul>

      <h2>Best practice</h2>
      <ul>
        <li>Default <code>md</code> spacing works for most prose. Tighten to
          <code>sm</code> for dense lists, drop to <code>none</code> when the
          parent already provides padding (cards, menus, toolbars).</li>
        <li>Don't combine separators with margins on neighbouring elements —
          double-spacing reads as a layout bug.</li>
      </ul>
    </article>
  `,
})
export class SeparatorPage {}
