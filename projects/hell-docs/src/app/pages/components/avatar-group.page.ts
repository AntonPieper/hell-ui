import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellAvatarGroup, HellAvatarItem } from 'hell';

@Component({
  selector: 'hd-avatar-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellAvatarGroup],
  template: `
    <article class="hd-prose">
      <h1>Avatar group</h1>
      <p>A stack of avatars with an overflow indicator. Set <code>max</code>
        to cap the number of avatars rendered — the rest collapse into
        <code>+N</code>.</p>

      <h2>Default (max 4)</h2>
      <div class="hd-example">
        <hell-avatar-group [items]="people" />
      </div>

      <h2>Cap at 3</h2>
      <div class="hd-example">
        <hell-avatar-group [items]="people" [max]="3" />
      </div>

      <h2>Sizes</h2>
      <div class="hd-example" style="display:grid; gap:0.75rem">
        <hell-avatar-group size="sm" [items]="people" [max]="4" />
        <hell-avatar-group size="md" [items]="people" [max]="4" />
        <hell-avatar-group size="lg" [items]="people" [max]="4" />
      </div>

      <h2>API</h2>
      <ul>
        <li><code>items</code>: <code>{{ '{ image?, fallback, alt? }' }}[]</code></li>
        <li><code>max</code>: visible count before overflow (default 4)</li>
        <li><code>size</code>: <code>xs | sm | md | lg | xl</code></li>
      </ul>
    </article>
  `,
})
export class AvatarGroupPage {
  protected readonly people: HellAvatarItem[] = [
    { fallback: 'HK', image: 'https://i.pravatar.cc/64?img=11' },
    { fallback: 'AP', image: 'https://i.pravatar.cc/64?img=12' },
    { fallback: 'BS', image: 'https://i.pravatar.cc/64?img=13' },
    { fallback: 'JD', image: 'https://i.pravatar.cc/64?img=14' },
    { fallback: 'MO', image: 'https://i.pravatar.cc/64?img=15' },
    { fallback: 'SK', image: 'https://i.pravatar.cc/64?img=16' },
    { fallback: 'RG', image: 'https://i.pravatar.cc/64?img=17' },
  ];
}
