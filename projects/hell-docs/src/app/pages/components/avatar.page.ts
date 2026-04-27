import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellAvatar } from 'hell';
import { ExampleTabs } from '../../shared/example-tabs';

@Component({
  selector: 'hd-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, HellAvatar],
  template: `
    <article class="hd-prose">
      <h1>Avatar</h1>
      <p>
        Identifies a user. Displays an image when available, otherwise the provided
        <code>fallback</code> initials.
      </p>

      <h2>Sizes</h2>
      <hd-example-tabs [code]="exampleCodes[0]" previewClass="flex items-center gap-3">
        <hell-avatar size="xs" fallback="XS" />
        <hell-avatar size="sm" fallback="SM" />
        <hell-avatar size="md" fallback="MD" />
        <hell-avatar size="lg" fallback="LG" />
        <hell-avatar size="xl" fallback="XL" />
      </hd-example-tabs>

      <h2>With image</h2>
      <hd-example-tabs [code]="exampleCodes[1]" previewClass="flex gap-3">
        <hell-avatar image="https://i.pravatar.cc/64?img=11" fallback="HK" alt="Heinrich K." />
        <hell-avatar image="https://i.pravatar.cc/64?img=12" fallback="AP" alt="Anna P." />
        <hell-avatar image="https://i.pravatar.cc/64?img=13" fallback="BS" alt="Bjorn S." />
      </hd-example-tabs>

      <h2>Square shape</h2>
      <hd-example-tabs [code]="exampleCodes[2]" previewClass="flex gap-3">
        <hell-avatar shape="square" fallback="CO" />
        <hell-avatar shape="square" image="https://i.pravatar.cc/64?img=15" fallback="ID" />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>image</code>, <code>fallback</code>, <code>alt</code></li>
        <li><code>size</code>: <code>xs | sm | md | lg | xl</code></li>
        <li><code>shape</code>: <code>round | square</code></li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Provide <code>alt</code> when the image identifies a person.</li>
        <li>Use initials in <code>fallback</code> for broken or missing images.</li>
        <li>Use square shape for entities, round for people.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't use decorative avatars without nearby text.</li>
        <li>Don't encode status only through avatar color.</li>
      </ul>
    </article>
  `,
})
export class AvatarPage {
  protected readonly exampleCodes = [
    '<hell-avatar size="xs" fallback="XS" />\n<hell-avatar size="sm" fallback="SM" />\n<hell-avatar size="md" fallback="MD" />\n<hell-avatar size="lg" fallback="LG" />\n<hell-avatar size="xl" fallback="XL" />\n',
    '<hell-avatar\n  image="https://i.pravatar.cc/64?img=11"\n  fallback="HK"\n  alt="Heinrich K."\n/>\n<hell-avatar\n  image="https://i.pravatar.cc/64?img=12"\n  fallback="AP"\n  alt="Anna P."\n/>\n<hell-avatar\n  image="https://i.pravatar.cc/64?img=13"\n  fallback="BS"\n  alt="Bjorn S."\n/>\n',
    '<hell-avatar shape="square" fallback="CO" />\n<hell-avatar shape="square" image="https://i.pravatar.cc/64?img=15" fallback="ID" />\n',
  ] as const;
}
