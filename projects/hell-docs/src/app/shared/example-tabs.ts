import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { provideIcons } from '@ng-icons/core';
import { faSolidCheck, faSolidCopy } from '@ng-icons/font-awesome/solid';
import { HELL_TABS_DIRECTIVES, HellButton, HellIcon } from '@hell-ui/angular/primitives';
import { hdCopyTextToClipboard } from './code-tools';

const EXAMPLE_TABS_ICONS = { faSolidCopy, faSolidCheck };

@Component({
  selector: 'hd-example-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [provideIcons(EXAMPLE_TABS_ICONS)],
  imports: [NgClass, HellButton, HellIcon, ...HELL_TABS_DIRECTIVES],
  template: `
    <div class="hd-example-tabs" hellTabset value="preview">
      <div hellTabList aria-label="Example view">
        <button hellTab value="preview" type="button">Preview</button>
        <button hellTab value="code" type="button">Code</button>
      </div>

      <div hellTabPanel value="preview" class="hd-example-tab-panel">
        <div class="hd-example" [class.hd-example-flush]="flush()" [ngClass]="previewClass()">
          <ng-content />
        </div>
      </div>

      <div hellTabPanel value="code" class="hd-example-tab-panel">
        <div class="hd-example-code-toolbar">
          <button
            hellButton
            iconOnly
            variant="ghost"
            size="xs"
            type="button"
            [attr.aria-label]="copied() ? 'Copied' : 'Copy code'"
            (click)="copyCode()"
          >
            <hell-icon [name]="copied() ? 'faSolidCheck' : 'faSolidCopy'" />
          </button>
        </div>
        <pre class="hd-example-code"><code [textContent]="code()"></code></pre>
      </div>
    </div>
  `,
})
export class ExampleTabs {
  readonly code = input.required<string>();
  readonly previewClass = input<string>('');
  readonly flush = input(false, { transform: booleanAttribute });

  protected readonly copied = signal(false);

  protected async copyCode(): Promise<void> {
    await hdCopyTextToClipboard(this.code());
    this.copied.set(true);
    window.setTimeout(() => this.copied.set(false), 1200);
  }
}
