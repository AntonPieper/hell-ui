import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidCheck, faSolidCopy } from '@ng-icons/font-awesome/solid';
import { HellButton } from '@hell-ui/angular/button';
import { HellIcon } from '@hell-ui/angular/icon';
import { HellTag } from '@hell-ui/angular/tag';
import { hdCopyTextToClipboard } from './code-tools';

const PAGE_HEADER_ICONS = { faSolidCheck, faSolidCopy };

type HdPageStatus = 'Experimental' | 'Beta';

/**
 * Shared docs page header: icon, H1, Module Category badge, optional status
 * badge, lead paragraph, and copyable import/style entry-point paths. The H1
 * text is a browser-test contract — pages must keep their canonical titles.
 */
@Component({
  selector: 'hd-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons(PAGE_HEADER_ICONS)],
  imports: [HellButton, HellIcon, HellTag],
  template: `
    <header class="hd-page-header">
      <div class="hd-page-header-row">
        @if (icon()) {
          <span class="hd-page-header-icon" aria-hidden="true">
            <hell-icon [name]="icon()" size="16px" />
          </span>
        }
        <h1 class="hd-page-header-title">{{ title() }}</h1>
        @if (category()) {
          <span hellTag class="hd-page-header-tag" variant="primary">{{ category() }}</span>
        }
        @if (status(); as s) {
          <span hellTag class="hd-page-header-tag" [variant]="s === 'Beta' ? 'info' : 'warning'">
            {{ s }}
          </span>
        }
      </div>
      <p class="hd-page-lead"><ng-content /></p>
      @if (importPath() || stylesPath()) {
        <div class="hd-page-imports">
          @if (importPath(); as ts) {
            <div class="hd-page-import-row">
              <span class="hd-page-import-label">Import</span>
              <code>{{ ts }}</code>
              <button
                hellButton
                iconOnly
                variant="ghost"
                size="xs"
                type="button"
                [attr.aria-label]="copiedPath() === ts ? 'Copied' : 'Copy import path'"
                (click)="copy(ts)"
              >
                <hell-icon [name]="copiedPath() === ts ? 'faSolidCheck' : 'faSolidCopy'" />
              </button>
            </div>
          }
          @if (stylesPath(); as css) {
            <div class="hd-page-import-row">
              <span class="hd-page-import-label">Styles</span>
              <code>{{ css }}</code>
              <button
                hellButton
                iconOnly
                variant="ghost"
                size="xs"
                type="button"
                [attr.aria-label]="copiedPath() === css ? 'Copied' : 'Copy stylesheet path'"
                (click)="copy(css)"
              >
                <hell-icon [name]="copiedPath() === css ? 'faSolidCheck' : 'faSolidCopy'" />
              </button>
            </div>
          }
        </div>
      }
    </header>
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly icon = input<string>('');
  readonly category = input<string>('');
  readonly status = input<HdPageStatus | ''>('');
  readonly importPath = input<string>('');
  readonly stylesPath = input<string>('');

  protected readonly copiedPath = signal<string | null>(null);

  private copiedTimer: number | undefined;

  protected async copy(text: string): Promise<void> {
    await hdCopyTextToClipboard(text);
    this.copiedPath.set(text);
    if (this.copiedTimer !== undefined) window.clearTimeout(this.copiedTimer);
    this.copiedTimer = window.setTimeout(() => this.copiedPath.set(null), 1200);
  }
}
