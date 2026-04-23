import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellTag, HellBadge, HellKbd } from 'hell';

@Component({
  selector: 'hd-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellTag, HellBadge, HellKbd],
  template: `
    <article class="hd-prose">
      <h1>Tag, Badge, Kbd</h1>
      <p>Inline status and metadata indicators.</p>

      <h2>Tag variants</h2>
      <div class="hd-example flex flex-wrap gap-2">
        <span hellTag>default</span>
        <span hellTag variant="info">info</span>
        <span hellTag variant="success">success</span>
        <span hellTag variant="warning">warning</span>
        <span hellTag variant="danger">danger</span>
      </div>

      <h2>Badge</h2>
      <div class="hd-example flex items-center gap-3">
        <span class="relative pr-6">
          Inbox
          <span hellBadge class="absolute -top-1 right-0">3</span>
        </span>
        <span class="relative pr-6">
          Notifications
          <span hellBadge class="absolute -top-1 right-0">99+</span>
        </span>
      </div>

      <h2>Keyboard hint</h2>
      <div class="hd-example">
        Press <kbd hellKbd>⌘</kbd> + <kbd hellKbd>K</kbd> to open the command palette.
      </div>

      <h2>API</h2>
      <ul>
        <li><code>hellTag variant</code>: <code>default | info | success | warning | danger</code></li>
        <li><code>hellBadge</code>: small numeric counter</li>
        <li><code>hellKbd</code>: keyboard key indicator</li>
      </ul>
    </article>
  `,
})
export class TagPage {}
