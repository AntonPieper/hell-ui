import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Type,
  booleanAttribute,
  computed,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidCheck, faSolidCopy } from '@ng-icons/font-awesome/solid';
import { HellButton } from 'hell-ui/button';
import { HellIcon } from 'hell-ui/icon';
import { HELL_TABS_IMPORTS } from 'hell-ui/tabs';
import { hdCopyTextToClipboard } from './code-tools';

const EXAMPLE_TABS_ICONS = { faSolidCopy, faSolidCheck };

@Component({
  selector: 'hd-example-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [provideIcons(EXAMPLE_TABS_ICONS)],
  imports: [NgComponentOutlet, HellButton, HellIcon, ...HELL_TABS_IMPORTS],
  template: `
    <div
      class="hd-example-tabs"
      hellTabset
      [value]="selectedTab()"
      (valueChange)="onTabChange($event)"
    >
      <div hellTabList aria-label="Example view">
        <button hellTab value="preview" type="button">Preview</button>
        <button hellTab value="code" type="button">Code</button>
      </div>

      <div hellTabPanel value="preview" class="hd-example-tab-panel">
        <div [class]="previewClassValue()">
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
        @if (codeViewer(); as viewer) {
          <ng-container *ngComponentOutlet="viewer; inputs: codeViewerInputs()" />
        } @else {
          <div class="hd-code-viewer-placeholder hd-example-code" aria-hidden="true">
            Loading code viewer…
          </div>
        }
      </div>
    </div>
  `,
})
export class ExampleTabs {
  readonly code = input.required<string>();
  readonly previewClass = input<string>('');
  readonly flush = input(false, { transform: booleanAttribute });

  protected readonly selectedTab = signal('preview');
  protected readonly copied = signal(false);
  protected readonly codeViewer = signal<Type<unknown> | null>(null);
  protected readonly codeViewerInputs = computed(() => ({
    code: this.code(),
    label: 'Example source code',
  }));
  protected readonly previewClassValue = computed(() => {
    const classes = ['hd-example'];
    if (this.flush()) classes.push('hd-example-flush');

    const previewClass = this.previewClass().trim();
    if (previewClass) classes.push(previewClass);

    return classes.join(' ');
  });

  protected onTabChange(value: unknown): void {
    const tab = String(value);
    this.selectedTab.set(tab);
    if (tab === 'code') void this.loadCodeViewer();
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
