import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { AvatarSizesExample } from './examples/sizes.example';
import avatarSizesExampleCodeRaw from './examples/sizes.example.ts?raw' with {
  loader: 'text',
};
import { AvatarSquareShapeExample } from './examples/square-shape.example';
import avatarSquareShapeExampleCodeRaw from './examples/square-shape.example.ts?raw' with {
  loader: 'text',
};
import { AvatarWithImageExample } from './examples/with-image.example';
import avatarWithImageExampleCodeRaw from './examples/with-image.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, AvatarSizesExample, AvatarWithImageExample, AvatarSquareShapeExample],
  template: `
    <article class="hd-prose">
      <h1>Avatar</h1>
      <p>
        Identifies a user. Displays an image when available, otherwise the provided
        <code>fallback</code> initials.
      </p>

      <h2>Sizes</h2>
      <hd-example-tabs [code]="avatarSizesExampleCode" previewClass="flex items-center gap-3">
        <app-avatar-sizes-example />
      </hd-example-tabs>

      <h2>With image</h2>
      <hd-example-tabs [code]="avatarWithImageExampleCode" previewClass="flex gap-3">
        <app-avatar-with-image-example />
      </hd-example-tabs>

      <h2>Square shape</h2>
      <hd-example-tabs [code]="avatarSquareShapeExampleCode" previewClass="flex gap-3">
        <app-avatar-square-shape-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>image</code>, <code>fallback</code>, <code>alt</code></li>
        <li><code>size</code>: <code>xs | sm | md | lg | xl</code></li>
        <li><code>shape</code>: <code>round | square</code></li>
        <li><code>ui</code>: string or <code>{{ '{' }} root: string {{ '}' }}</code> map</li>
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
  protected readonly avatarSizesExampleCode = avatarSizesExampleCodeRaw;
  protected readonly avatarWithImageExampleCode = avatarWithImageExampleCodeRaw;
  protected readonly avatarSquareShapeExampleCode = avatarSquareShapeExampleCodeRaw;
}
