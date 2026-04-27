import { Component, ChangeDetectionStrategy } from '@angular/core';
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
import { HellButton, HellIcon } from 'hell';
import { ExampleTabs } from '../../shared/example-tabs';

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
  imports: [ExampleTabs, HellButton, HellIcon],
  template: `
    <article class="hd-prose">
      <h1>Button</h1>
      <p>
        Trigger an action or navigate. Built on the <code>NgpButton</code> primitive for keyboard,
        focus and disabled handling. Use the <code>variant</code> input for visual emphasis and
        <code>size</code> for density.
      </p>

      <h2>Variants</h2>
      <hd-example-tabs [code]="exampleCodes[0]" previewClass="flex flex-wrap gap-2">
        <button hellButton variant="primary">Primary</button>
        <button hellButton variant="default">Default</button>
        <button hellButton variant="soft">Soft</button>
        <button hellButton variant="ghost">Ghost</button>
        <a hellButton variant="link" href="#" (click)="$event.preventDefault()">Link</a>
        <button hellButton variant="danger">Danger</button>
        <button hellButton variant="success">Success</button>
        <button hellButton variant="primary" disabled>Disabled</button>
      </hd-example-tabs>

      <h2>Sizes</h2>
      <hd-example-tabs [code]="exampleCodes[1]" previewClass="flex flex-wrap items-center gap-2">
        <button hellButton size="xs">XS</button>
        <button hellButton size="sm">Small</button>
        <button hellButton size="md">Medium</button>
        <button hellButton size="lg">Large</button>
        <button hellButton size="xl">XL</button>
      </hd-example-tabs>

      <h2>With icons</h2>
      <hd-example-tabs [code]="exampleCodes[2]" previewClass="flex flex-wrap items-center gap-2">
        <button hellButton variant="primary">
          <hell-icon name="faSolidUpload" />
          Upload
        </button>
        <button hellButton>
          <hell-icon name="faSolidDownload" />
          Download
        </button>
        <button hellButton variant="ghost">
          More
          <hell-icon name="faSolidChevronDown" />
        </button>
      </hd-example-tabs>

      <h2>Icon-only</h2>
      <p>
        Add the <code>iconOnly</code> attribute to render a square button. Always provide an
        <code>aria-label</code> so screen readers describe the action.
      </p>
      <hd-example-tabs [code]="exampleCodes[3]" previewClass="flex flex-wrap items-center gap-2">
        @for (size of ['xs', 'sm', 'md', 'lg', 'xl']; track size) {
          <button hellButton iconOnly [size]="$any(size)" aria-label="Settings">
            <hell-icon name="faSolidGear" />
          </button>
        }
        <button hellButton iconOnly variant="primary" aria-label="Add">
          <hell-icon name="faSolidPlus" />
        </button>
        <button hellButton iconOnly variant="soft" aria-label="Edit">
          <hell-icon name="faSolidPenToSquare" />
        </button>
        <button hellButton iconOnly variant="ghost" aria-label="Delete">
          <hell-icon name="faSolidXmark" />
        </button>
        <button hellButton iconOnly variant="danger" aria-label="Delete">
          <hell-icon name="faSolidXmark" />
        </button>
      </hd-example-tabs>

      <h2>Block</h2>
      <hd-example-tabs [code]="exampleCodes[4]">
        <button hellButton variant="primary" block>Continue</button>
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
        <li><code>unstyled</code>: opt out of all styling, keep behaviour</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use <code>primary</code> sparingly — one per region.</li>
        <li>Use <code>ghost</code> for low-emphasis actions in toolbars.</li>
        <li>Always pair <code>iconOnly</code> with an <code>aria-label</code>.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't put two <code>danger</code> buttons next to each other.</li>
        <li>Don't override colours via class — use CSS variables instead.</li>
      </ul>
    </article>
  `,
})
export class ButtonPage {
  protected readonly exampleCodes = [
    '<button hellButton variant="primary">Primary</button>\n<button hellButton variant="default">Default</button>\n<button hellButton variant="soft">Soft</button>\n<button hellButton variant="ghost">Ghost</button>\n<a hellButton variant="link" href="#" (click)="$event.preventDefault()">Link</a>\n<button hellButton variant="danger">Danger</button>\n<button hellButton variant="success">Success</button>\n<button hellButton variant="primary" disabled>Disabled</button>\n',
    '<button hellButton size="xs">XS</button>\n<button hellButton size="sm">Small</button>\n<button hellButton size="md">Medium</button>\n<button hellButton size="lg">Large</button>\n<button hellButton size="xl">XL</button>\n',
    '<button hellButton variant="primary">\n  <hell-icon name="faSolidUpload" />\n  Upload\n</button>\n<button hellButton>\n  <hell-icon name="faSolidDownload" />\n  Download\n</button>\n<button hellButton variant="ghost">\n  More\n  <hell-icon name="faSolidChevronDown" />\n</button>\n',
    '@for (size of [\'xs\', \'sm\', \'md\', \'lg\', \'xl\']; track size) {\n  <button hellButton iconOnly [size]="$any(size)" aria-label="Settings">\n    <hell-icon name="faSolidGear" />\n  </button>\n}\n<button hellButton iconOnly variant="primary" aria-label="Add">\n  <hell-icon name="faSolidPlus" />\n</button>\n<button hellButton iconOnly variant="soft" aria-label="Edit">\n  <hell-icon name="faSolidPenToSquare" />\n</button>\n<button hellButton iconOnly variant="ghost" aria-label="Delete">\n  <hell-icon name="faSolidXmark" />\n</button>\n<button hellButton iconOnly variant="danger" aria-label="Delete">\n  <hell-icon name="faSolidXmark" />\n</button>\n',
    '<button hellButton variant="primary" block>Continue</button>\n',
  ] as const;
}
