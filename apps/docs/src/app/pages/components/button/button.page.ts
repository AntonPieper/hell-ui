import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidChevronDown,
  faSolidDownload,
  faSolidGear,
  faSolidPenToSquare,
  faSolidPlus,
  faSolidUpload,
  faSolidXmark,
} from '@ng-icons/font-awesome/solid';
import { ExampleTabs } from '../../../shared/example-tabs';
import { ButtonBlockExample } from './examples/block.example';
import buttonBlockExampleCodeRaw from './examples/block.example.ts?raw' with {
  loader: 'text',
};
import { ButtonCustomizationExample } from './examples/customization.example';
import buttonCustomizationExampleCodeRaw from './examples/customization.example.ts?raw' with {
  loader: 'text',
};
import { ButtonIconOnlyExample } from './examples/icon-only.example';
import buttonIconOnlyExampleCodeRaw from './examples/icon-only.example.ts?raw' with {
  loader: 'text',
};
import { ButtonSizesExample } from './examples/sizes.example';
import buttonSizesExampleCodeRaw from './examples/sizes.example.ts?raw' with {
  loader: 'text',
};
import { ButtonVariantsExample } from './examples/variants.example';
import buttonVariantsExampleCodeRaw from './examples/variants.example.ts?raw' with {
  loader: 'text',
};
import { ButtonWithIconsExample } from './examples/with-icons.example';
import buttonWithIconsExampleCodeRaw from './examples/with-icons.example.ts?raw' with {
  loader: 'text',
};

const HD_BUTTON_PAGE_ICONS = {
  faSolidChevronDown,
  faSolidDownload,
  faSolidGear,
  faSolidPenToSquare,
  faSolidPlus,
  faSolidUpload,
  faSolidXmark,
};

@Component({
  selector: 'hd-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons(HD_BUTTON_PAGE_ICONS)],
  imports: [
    ExampleTabs,
    ButtonVariantsExample,
    ButtonSizesExample,
    ButtonWithIconsExample,
    ButtonIconOnlyExample,
    ButtonBlockExample,
    ButtonCustomizationExample,
  ],
  template: `
    <article class="hd-prose">
      <h1>Button</h1>
      <p>
        Trigger an action or navigate. Built on the <code>NgpButton</code> primitive for keyboard,
        focus and disabled handling. Anchor buttons expose <code>aria-disabled</code> and prevent
        activation when disabled. Use the <code>variant</code> input for visual emphasis and
        <code>size</code> for density.
      </p>

      <h2>Variants</h2>
      <hd-example-tabs [code]="buttonVariantsExampleCode" previewClass="flex flex-wrap gap-2">
        <app-button-variants-example />
      </hd-example-tabs>

      <h2>Sizes</h2>
      <hd-example-tabs
        [code]="buttonSizesExampleCode"
        previewClass="flex flex-wrap items-center gap-2"
      >
        <app-button-sizes-example />
      </hd-example-tabs>

      <h2>With icons</h2>
      <hd-example-tabs
        [code]="buttonWithIconsExampleCode"
        previewClass="flex flex-wrap items-center gap-2"
      >
        <app-button-with-icons-example />
      </hd-example-tabs>

      <h2>Icon-only</h2>
      <p>
        Add the <code>iconOnly</code> attribute to render a square button. Always provide an
        <code>aria-label</code> so screen readers describe the action.
      </p>
      <hd-example-tabs
        [code]="buttonIconOnlyExampleCode"
        previewClass="flex flex-wrap items-center gap-2"
      >
        <app-button-icon-only-example />
      </hd-example-tabs>

      <h2>Block</h2>
      <hd-example-tabs [code]="buttonBlockExampleCode">
        <app-button-block-example />
      </hd-example-tabs>

      <h2>Part style map</h2>
      <p>
        Pass <code>ui="..."</code> to refine the default <code>root</code> part while keeping
        <code>NgpButton</code> behavior and Button state attributes. The equivalent explicit map
        form is <code>[ui]="&#123; root: '...' &#125;"</code>.
      </p>
      <p>
        Template <code>class</code> remains useful for layout hooks and non-conflicting classes, but
        use <code>ui</code> for deterministic Tailwind utility overrides.
      </p>
      <hd-example-tabs
        [code]="buttonCustomizationExampleCode"
        previewClass="flex flex-wrap items-center gap-2"
      >
        <app-button-customization-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>variant</code>:
          <code>default | primary | soft | ghost | link | danger | success</code>
        </li>
        <li><code>size</code>: <code>xs | sm | md | lg | xl</code></li>
        <li><code>iconOnly</code>: square button for a single icon</li>
        <li><code>block</code>: stretches to container width</li>
        <li>
          <code>disabled</code>: native <code>disabled</code> on buttons, guarded
          <code>aria-disabled</code> on anchors
        </li>
        <li>
          <code>ui</code>: shorthand string or part style map for the <code>root</code> public part
        </li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use <code>primary</code> sparingly — one per region.</li>
        <li>Use <code>ghost</code> for low-emphasis actions in toolbars.</li>
        <li>Always pair <code>iconOnly</code> with an <code>aria-label</code>.</li>
        <li>
          Use <code>ui</code> instead of conflicting <code>class</code> utilities for visual
          refinements.
        </li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't put two <code>danger</code> buttons next to each other.</li>
        <li>Don't target private descendants; refine the <code>root</code> part instead.</li>
        <li>Don't rely on <code>class</code> order to beat recipe utilities.</li>
      </ul>
    </article>
  `,
})
export class ButtonPage {
  protected readonly buttonVariantsExampleCode = buttonVariantsExampleCodeRaw;
  protected readonly buttonSizesExampleCode = buttonSizesExampleCodeRaw;
  protected readonly buttonWithIconsExampleCode = buttonWithIconsExampleCodeRaw;
  protected readonly buttonIconOnlyExampleCode = buttonIconOnlyExampleCodeRaw;
  protected readonly buttonBlockExampleCode = buttonBlockExampleCodeRaw;
  protected readonly buttonCustomizationExampleCode = buttonCustomizationExampleCodeRaw;
}
