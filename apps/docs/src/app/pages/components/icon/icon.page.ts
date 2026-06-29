import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidArrowDown,
  faSolidCircleCheck,
  faSolidCircleInfo,
  faSolidPhone,
  faSolidTriangleExclamation,
  faSolidXmark,
} from '@ng-icons/font-awesome/solid';
import { HellIcon } from '@hell-ui/angular/icon';
import { ExampleTabs } from '../../../shared/example-tabs';
import { IconExampleExample } from './examples/example.example';
import iconExampleExampleCodeRaw from './examples/example.example.ts?raw' with {
  loader: 'text',
};
import { IconRegisteringIconsExample } from './examples/registering-icons.example';
import iconRegisteringIconsExampleCodeRaw from './examples/registering-icons.example.ts?raw' with {
  loader: 'text',
};
import { IconSizesExample } from './examples/sizes.example';
import iconSizesExampleCodeRaw from './examples/sizes.example.ts?raw' with { loader: 'text' };

const HD_ICON_PAGE_ICONS = {
  faSolidArrowDown,
  faSolidCircleCheck,
  faSolidCircleInfo,
  faSolidPhone,
  faSolidTriangleExclamation,
  faSolidXmark,
};

@Component({
  selector: 'hd-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons(HD_ICON_PAGE_ICONS)],
  imports: [
    ExampleTabs,
    HellIcon,
    IconExampleExample,
    IconSizesExample,
    IconRegisteringIconsExample,
  ],
  template: `
    <article class="hd-prose">
      <h1>Icon</h1>
      <p>
        Thin wrapper around <code>&lt;ng-icon&gt;</code> from <code>&#64;ng-icons/core</code>.
        Consumer apps must register the icons they use via <code>provideIcons()</code>, ideally in
        the component that renders them. Icons are decorative by default and hidden from assistive
        technology; set <code>decorative="false"</code> with an <code>aria-label</code> only when the
        icon itself conveys meaning without adjacent text.
      </p>

      <h2>Example</h2>
      <hd-example-tabs
        [code]="iconExampleExampleCode"
        previewClass="flex items-center gap-4 text-base"
      >
        <app-icon-example-example />
      </hd-example-tabs>

      <h2>Sizes</h2>
      <hd-example-tabs [code]="iconSizesExampleCode" previewClass="flex items-center gap-4">
        <app-icon-sizes-example />
      </hd-example-tabs>

      <h2>Inherits text colour and size</h2>
      <p class="text-hell-primary text-[1.25rem]">
        I am text with an icon
        <hell-icon name="faSolidArrowDown" />
        — both share the parent's font-size and colour.
      </p>

      <h2>API</h2>
      <ul>
        <li><code>name</code>: registered icon name (e.g. <code>faSolidCheck</code>)</li>
        <li><code>size</code>: any CSS length, defaults to <code>1em</code></li>
        <li><code>color</code>: any CSS colour, defaults to <code>currentColor</code></li>
        <li>
          <code>decorative</code>: defaults to <code>true</code> and hides the icon from assistive
          tech
        </li>
        <li><code>aria-label</code>: required when <code>decorative="false"</code></li>
        <li><code>ui</code>: string or <code>{{ '{' }} root: string {{ '}' }}</code> map</li>
      </ul>

      <h2>Registering icons</h2>
      <hd-example-tabs
        [code]="iconRegisteringIconsExampleCode"
        previewClass="flex items-center gap-3"
      >
        <app-icon-registering-icons-example />
      </hd-example-tabs>

      <h2>Do</h2>
      <ul>
        <li>Register only the icon packs needed by the page.</li>
        <li>
          Prefer visible text; use <code>decorative="false" aria-label="…"</code> only for
          standalone meaningful icons.
        </li>
        <li>Use <code>size</code> to align icons with text rhythm.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't use icons as unlabeled buttons.</li>
        <li>Don't mix icon styles in the same toolbar without intent.</li>
      </ul>
    </article>
  `,
})
export class IconPage {
  protected readonly iconExampleExampleCode = iconExampleExampleCodeRaw;
  protected readonly iconSizesExampleCode = iconSizesExampleCodeRaw;
  protected readonly iconRegisteringIconsExampleCode = iconRegisteringIconsExampleCodeRaw;
}
