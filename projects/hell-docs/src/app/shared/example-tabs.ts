import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  booleanAttribute,
  computed,
  input,
  signal,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { angular } from '@codemirror/lang-angular';
import { javascript } from '@codemirror/lang-javascript';
import { type Extension } from '@codemirror/state';
import { provideIcons } from '@ng-icons/core';
import { faSolidCheck, faSolidCopy } from '@ng-icons/font-awesome/solid';
import { HellButton, HellCodeEditor, HellIcon, HELL_TABS_DIRECTIVES } from 'hell';

const EXAMPLE_TABS_ICONS = { faSolidCopy, faSolidCheck };

@Component({
  selector: 'hd-example-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons(EXAMPLE_TABS_ICONS)],
  imports: [NgClass, HellButton, HellCodeEditor, HellIcon, ...HELL_TABS_DIRECTIVES],
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
        <hell-code-editor
          class="hd-example-code"
          readOnly
          [value]="code()"
          [extensions]="codeExtensions()"
        />
      </div>
    </div>
  `,
})
export class ExampleTabs {
  readonly code = input.required<string>();
  readonly previewClass = input<string>('');
  readonly flush = input(false, { transform: booleanAttribute });

  protected readonly codeExtensions: Signal<Extension> = computed(() => [
    this.code().startsWith('<') ? angular() : javascript({ typescript: true }),
  ]);
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
