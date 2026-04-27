import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_CARD_DIRECTIVES, HellSeparator } from 'hell';
import { ExampleTabs } from '../../shared/example-tabs';

@Component({
  selector: 'hd-separator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, HellSeparator, ...HELL_CARD_DIRECTIVES],
  template: `
    <article class="hd-prose">
      <h1>Separator</h1>
      <p>
        A thin divider with the correct ARIA role for both axes. Configure breathing room via
        <code>spacing</code>, or set it to <code>none</code> for flush dividers (e.g. inside cards).
      </p>

      <h2>Horizontal</h2>
      <hd-example-tabs [code]="exampleCodes[0]">
        <p class="m-0">Section A</p>
        <div hellSeparator></div>
        <p class="m-0">Section B</p>
        <div hellSeparator spacing="lg"></div>
        <p class="m-0">Section C — generous spacing</p>
      </hd-example-tabs>

      <h2>Spacing options</h2>
      <hd-example-tabs [code]="exampleCodes[1]">
        @for (s of ['none', 'xs', 'sm', 'md', 'lg', 'xl']; track s) {
          <div class="hd-muted text-xs">{{ s }}</div>
          <div hellSeparator [spacing]="$any(s)"></div>
        }
      </hd-example-tabs>

      <h2>Vertical</h2>
      <hd-example-tabs [code]="exampleCodes[2]" previewClass="flex h-[60px] items-center">
        <span>Left</span>
        <div hellSeparator orientation="vertical" spacing="md"></div>
        <span>Middle</span>
        <div hellSeparator orientation="vertical" spacing="md"></div>
        <span>Right</span>
      </hd-example-tabs>

      <h2>Flush (inside a card)</h2>
      <hd-example-tabs [code]="exampleCodes[3]">
        <div hellCard class="max-w-95">
          <div hellCardHeader><strong>Settings</strong></div>
          <div hellCardBody>
            <p class="m-0">General</p>
            <div hellSeparator spacing="sm"></div>
            <p class="m-0">Notifications</p>
            <div hellSeparator spacing="sm"></div>
            <p class="m-0">Privacy</p>
          </div>
        </div>
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>orientation</code>: <code>horizontal | vertical</code></li>
        <li>
          <code>spacing</code>: <code>none | xs | sm | md | lg | xl</code> — symmetric margin on the
          main axis
        </li>
        <li><code>unstyled</code></li>
      </ul>

      <h2>Best practice</h2>
      <ul>
        <li>
          Default <code>md</code> spacing works for most prose. Tighten to <code>sm</code> for dense
          lists, drop to <code>none</code> when the parent already provides padding (cards, menus,
          toolbars).
        </li>
        <li>
          Don't combine separators with margins on neighbouring elements — double-spacing reads as a
          layout bug.
        </li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use separators to clarify groups, not decorate empty space.</li>
        <li>Choose spacing that matches surrounding density.</li>
        <li>Use vertical separators only in horizontal layouts with enough height.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't use separators as section headings.</li>
        <li>Don't stack multiple separators to create borders.</li>
      </ul>
    </article>
  `,
})
export class SeparatorPage {
  protected readonly exampleCodes = [
    '<p class="m-0">Section A</p>\n<div hellSeparator></div>\n<p class="m-0">Section B</p>\n<div hellSeparator spacing="lg"></div>\n<p class="m-0">Section C \u2014 generous spacing</p>\n',
    "@for (s of ['none', 'xs', 'sm', 'md', 'lg', 'xl']; track s) {\n  <div class=\"hd-muted text-xs\">{{ s }}</div>\n  <div hellSeparator [spacing]=\"$any(s)\"></div>\n}\n",
    '<span>Left</span>\n<div hellSeparator orientation="vertical" spacing="md"></div>\n<span>Middle</span>\n<div hellSeparator orientation="vertical" spacing="md"></div>\n<span>Right</span>\n',
    '<div hellCard class="max-w-95">\n  <div hellCardHeader><strong>Settings</strong></div>\n  <div hellCardBody>\n    <p class="m-0">General</p>\n    <div hellSeparator spacing="sm"></div>\n    <p class="m-0">Notifications</p>\n    <div hellSeparator spacing="sm"></div>\n    <p class="m-0">Privacy</p>\n  </div>\n</div>\n',
  ] as const;
}
