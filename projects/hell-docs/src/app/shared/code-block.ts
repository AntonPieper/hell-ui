import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { angular } from '@codemirror/lang-angular';
import { javascript } from '@codemirror/lang-javascript';
import { type Extension } from '@codemirror/state';
import { provideIcons } from '@ng-icons/core';
import { faSolidCheck, faSolidCopy } from '@ng-icons/font-awesome/solid';
import { HellButton, HellCodeEditor, HellIcon } from 'hell';

const CODE_BLOCK_ICONS = { faSolidCopy, faSolidCheck };

@Component({
  selector: 'hd-code-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons(CODE_BLOCK_ICONS)],
  imports: [HellButton, HellCodeEditor, HellIcon],
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
    <hell-code-editor class="hd-doc-code" readOnly [value]="code()" [extensions]="codeExtensions" />
  `,
})
export class CodeBlock {
  readonly code = input.required<string>();

  protected readonly codeExtensions: Extension = [angular(), javascript({ typescript: true })];
  protected readonly copied = signal(false);

  protected async copyCode(): Promise<void> {
    const text = this.code();
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.append(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    this.copied.set(true);
    window.setTimeout(() => this.copied.set(false), 1200);
  }
}
