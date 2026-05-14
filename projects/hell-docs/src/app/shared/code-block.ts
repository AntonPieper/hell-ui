import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  ViewEncapsulation,
  computed,
  input,
  signal,
} from '@angular/core';
import { type Extension } from '@codemirror/state';
import { provideIcons } from '@ng-icons/core';
import { faSolidCheck, faSolidCopy } from '@ng-icons/font-awesome/solid';
import { HellButton, HellIcon } from '@hell-ui/angular/primitives';
import { HellCodeEditor } from '@hell-ui/angular/features/code-editor';
import { hdCodeExtensions, hdCopyTextToClipboard } from './code-tools';

const CODE_BLOCK_ICONS = { faSolidCopy, faSolidCheck };

@Component({
  selector: 'hd-code-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: [`@import '@hell-ui/angular/styles/features/code-editor';`],
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
    <hell-code-editor
      class="hd-doc-code"
      readOnly
      [value]="code()"
      [extensions]="codeExtensions()"
    />
  `,
})
export class CodeBlock {
  readonly code = input.required<string>();

  protected readonly codeExtensions: Signal<Extension> = computed(() =>
    hdCodeExtensions(this.code()),
  );
  protected readonly copied = signal(false);

  protected async copyCode(): Promise<void> {
    await hdCopyTextToClipboard(this.code());
    this.copied.set(true);
    window.setTimeout(() => this.copied.set(false), 1200);
  }
}
