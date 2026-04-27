import { Component, ChangeDetectionStrategy } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidArrowDown,
  faSolidCircleCheck,
  faSolidCircleInfo,
  faSolidPhone,
  faSolidTriangleExclamation,
  faSolidXmark,
} from '@ng-icons/font-awesome/solid';
import { HellIcon } from 'hell';
import { ExampleTabs } from '../../shared/example-tabs';

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
  imports: [ExampleTabs, HellIcon],
  template: `
    <article class="hd-prose">
      <h1>Icon</h1>
      <p>
        Thin wrapper around <code>&lt;ng-icon&gt;</code> from <code>&#64;ng-icons/core</code>.
        Consumer apps must register the icons they use via <code>provideIcons()</code>, ideally in
        the component that renders them.
      </p>

      <h2>Example</h2>
      <hd-example-tabs [code]="exampleCodes[0]" previewClass="flex items-center gap-4 text-base">
        <span class="text-hell-success"><hell-icon name="faSolidCircleCheck" /></span>
        <span class="text-hell-info"><hell-icon name="faSolidCircleInfo" /></span>
        <span class="text-hell-warning"><hell-icon name="faSolidTriangleExclamation" /></span>
        <span class="text-hell-danger"><hell-icon name="faSolidXmark" /></span>
      </hd-example-tabs>

      <h2>Sizes</h2>
      <hd-example-tabs [code]="exampleCodes[1]" previewClass="flex items-center gap-4">
        <span class="text-[14px]"><hell-icon name="faSolidPhone" /></span>
        <span class="text-[20px]"><hell-icon name="faSolidPhone" /></span>
        <span class="text-[32px]"><hell-icon name="faSolidPhone" /></span>
        <span class="text-[48px]"><hell-icon name="faSolidPhone" /></span>
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
        <li><code>decorative</code>: when <code>false</code>, requires <code>aria-label</code></li>
      </ul>

      <h2>Registering icons</h2>
      <hd-example-tabs [code]="exampleCodes[2]" previewClass="flex items-center gap-3">
        <hell-icon name="faSolidCircleCheck" size="20px" />
        <span class="text-sm text-hell-foreground-muted">
          Register icons close to the component that renders them.
        </span>
      </hd-example-tabs>

      <h2>Do</h2>
      <ul>
        <li>Register only the icon packs needed by the page.</li>
        <li>Set <code>decorative="false"</code> or add text when the icon carries meaning.</li>
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
  protected readonly exampleCodes = [
    '<span class="text-hell-success"><hell-icon name="faSolidCircleCheck" /></span>\n<span class="text-hell-info"><hell-icon name="faSolidCircleInfo" /></span>\n<span class="text-hell-warning"><hell-icon name="faSolidTriangleExclamation" /></span>\n<span class="text-hell-danger"><hell-icon name="faSolidXmark" /></span>\n',
    '<span class="text-[14px]"><hell-icon name="faSolidPhone" /></span>\n<span class="text-[20px]"><hell-icon name="faSolidPhone" /></span>\n<span class="text-[32px]"><hell-icon name="faSolidPhone" /></span>\n<span class="text-[48px]"><hell-icon name="faSolidPhone" /></span>\n',
    "import { Component } from '@angular/core';\nimport { provideIcons } from '@ng-icons/core';\nimport { faSolidCheck } from '@ng-icons/font-awesome/solid';\nimport { HellIcon } from 'hell';\n\n@Component({\n  imports: [HellIcon],\n  providers: [provideIcons({ faSolidCheck })],\n  template: '<hell-icon name=\"faSolidCheck\" />',\n})\nexport class ExampleComponent {}\n",
  ] as const;
}
