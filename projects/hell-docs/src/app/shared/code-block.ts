import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidCheck, faSolidCopy } from '@ng-icons/font-awesome/solid';
import { HellButton, HellIcon } from '@hell-ui/angular/primitives';
import { hdCopyTextToClipboard } from './code-tools';

const CODE_BLOCK_ICONS = { faSolidCopy, faSolidCheck };

@Component({
  selector: 'hd-code-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [provideIcons(CODE_BLOCK_ICONS)],
  imports: [HellButton, HellIcon],
  template: `
    <div class="hd-example-code-toolbar hd-doc-code-toolbar">
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
    <pre class="hd-doc-code"><code [textContent]="code()"></code></pre>
  `,
})
export class CodeBlock {
  readonly code = input.required<string>();

  protected readonly copied = signal(false);

  protected async copyCode(): Promise<void> {
    await hdCopyTextToClipboard(this.code());
    this.copied.set(true);
    window.setTimeout(() => this.copied.set(false), 1200);
  }
}
