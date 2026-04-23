import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellAvatar } from 'hell';

@Component({
  selector: 'hd-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellAvatar],
  template: `
    <article class="hd-prose">
      <h1>Avatar</h1>
      <p>Identifies a user. Displays an image when available, otherwise the
        provided <code>fallback</code> initials.</p>

      <h2>Sizes</h2>
      <div class="hd-example flex items-center gap-3">
        <hell-avatar size="xs" fallback="XS" />
        <hell-avatar size="sm" fallback="SM" />
        <hell-avatar size="md" fallback="MD" />
        <hell-avatar size="lg" fallback="LG" />
        <hell-avatar size="xl" fallback="XL" />
      </div>

      <h2>With image</h2>
      <div class="hd-example flex gap-3">
        <hell-avatar
          image="https://i.pravatar.cc/64?img=11"
          fallback="HK"
          alt="Heinrich K."
        />
        <hell-avatar
          image="https://i.pravatar.cc/64?img=12"
          fallback="AP"
          alt="Anna P."
        />
        <hell-avatar
          image="https://i.pravatar.cc/64?img=13"
          fallback="BS"
          alt="Bjorn S."
        />
      </div>

      <h2>Square shape</h2>
      <div class="hd-example flex gap-3">
        <hell-avatar shape="square" fallback="CO" />
        <hell-avatar shape="square" image="https://i.pravatar.cc/64?img=15" fallback="ID" />
      </div>

      <h2>API</h2>
      <ul>
        <li><code>image</code>, <code>fallback</code>, <code>alt</code></li>
        <li><code>size</code>: <code>xs | sm | md | lg | xl</code></li>
        <li><code>shape</code>: <code>round | square</code></li>
      </ul>
    </article>
  `,
})
export class AvatarPage {}
