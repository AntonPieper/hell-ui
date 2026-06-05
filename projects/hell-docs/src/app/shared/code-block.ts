import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Type,
  afterNextRender,
  computed,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidCheck, faSolidCopy } from '@ng-icons/font-awesome/solid';
import { HellButton } from '@hell-ui/angular/button';
import { HellIcon } from '@hell-ui/angular/icon';
import { hdCopyTextToClipboard } from './code-tools';

const CODE_BLOCK_ICONS = { faSolidCopy, faSolidCheck };

@Component({
  selector: 'hd-code-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [provideIcons(CODE_BLOCK_ICONS)],
  imports: [NgComponentOutlet, HellButton, HellIcon],
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
    @if (codeViewer(); as viewer) {
      <ng-container *ngComponentOutlet="viewer; inputs: codeViewerInputs()" />
    } @else {
      <div class="hd-code-viewer-placeholder hd-doc-code" aria-hidden="true">
        Loading code viewer…
      </div>
    }
  `,
})
export class CodeBlock {
  readonly code = input.required<string>();

  protected readonly copied = signal(false);
  protected readonly codeViewer = signal<Type<unknown> | null>(null);
  protected readonly codeViewerInputs = computed(() => ({
    code: this.code(),
    variant: 'block',
    label: 'Documentation code sample',
  }));

  constructor() {
    afterNextRender(() => void this.loadCodeViewer());
  }

  protected async copyCode(): Promise<void> {
    await hdCopyTextToClipboard(this.code());
    this.copied.set(true);
    window.setTimeout(() => this.copied.set(false), 1200);
  }

  private codeViewerLoad: Promise<void> | null = null;

  private loadCodeViewer(): Promise<void> {
    return (this.codeViewerLoad ??= import('./docs-code-viewer').then((module) => {
      this.codeViewer.set(module.DocsCodeViewer);
    }));
  }
}
