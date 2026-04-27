import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellTag, HellBadge, HellKbd } from 'hell';
import { ExampleTabs } from '../../shared/example-tabs';

@Component({
  selector: 'hd-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, HellTag, HellBadge, HellKbd],
  template: `
    <article class="hd-prose">
      <h1>Tag, Badge, Kbd</h1>
      <p>Inline status and metadata indicators.</p>

      <h2>Tag variants</h2>
      <hd-example-tabs [code]="exampleCodes[0]" previewClass="flex flex-wrap gap-2">
        <span hellTag>default</span>
        <span hellTag variant="primary">primary</span>
        <span hellTag variant="info">info</span>
        <span hellTag variant="success">success</span>
        <span hellTag variant="warning">warning</span>
        <span hellTag variant="danger">danger</span>
      </hd-example-tabs>

      <h2>Badge</h2>
      <hd-example-tabs [code]="exampleCodes[1]" previewClass="flex items-center gap-3">
        <span class="relative pr-6">
          Inbox
          <span hellBadge class="absolute -top-1 right-0">3</span>
        </span>
        <span class="relative pr-6">
          Notifications
          <span hellBadge class="absolute -top-1 right-0">99+</span>
        </span>
      </hd-example-tabs>

      <h2>Keyboard hint</h2>
      <hd-example-tabs [code]="exampleCodes[2]">
        Press <kbd hellKbd>⌘</kbd> + <kbd hellKbd>K</kbd> to open the command palette.
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>hellTag variant</code>:
          <code>default | primary | info | success | warning | danger</code>
        </li>
        <li><code>hellBadge</code>: small numeric counter</li>
        <li><code>hellKbd</code>: keyboard key indicator</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use tags for status, category or compact metadata.</li>
        <li>Use badges for counts and keyboard hints for shortcuts.</li>
        <li>Keep variant meaning consistent across pages.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't make tags look clickable unless they are interactive.</li>
        <li>Don't encode critical status by color alone.</li>
      </ul>
    </article>
  `,
})
export class TagPage {
  protected readonly exampleCodes = [
    '<span hellTag>default</span>\n<span hellTag variant="primary">primary</span>\n<span hellTag variant="info">info</span>\n<span hellTag variant="success">success</span>\n<span hellTag variant="warning">warning</span>\n<span hellTag variant="danger">danger</span>\n',
    '<span class="relative pr-6">\n  Inbox\n  <span hellBadge class="absolute -top-1 right-0">3</span>\n</span>\n<span class="relative pr-6">\n  Notifications\n  <span hellBadge class="absolute -top-1 right-0">99+</span>\n</span>\n',
    'Press <kbd hellKbd>\u2318</kbd> + <kbd hellKbd>K</kbd> to open the command palette.\n',
  ] as const;
}
