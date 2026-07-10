import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidCopy,
  faSolidDownload,
  faSolidGear,
  faSolidLock,
  faSolidPenToSquare,
  faSolidPlus,
  faSolidShareNodes,
} from '@ng-icons/font-awesome/solid';
import { HellButton } from '@hell-ui/angular/button';
import { HellIcon } from '@hell-ui/angular/icon';
import { HELL_TOOLBAR_DIRECTIVES } from '@hell-ui/angular/toolbar';

/**
 * Query-param-only browser contract harness for the toolbar. Rendered on
 * `/components/toolbar?toolbarHarness=1` so e2e specs can drive overflow at
 * chosen container widths and exercise roving focus across the button↔menu
 * boundary without depending on documentation copy or example layout.
 */
@Component({
  selector: 'hd-toolbar-contract-harness',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      faSolidPlus,
      faSolidPenToSquare,
      faSolidCopy,
      faSolidShareNodes,
      faSolidDownload,
      faSolidLock,
      faSolidGear,
    }),
  ],
  imports: [HellButton, HellIcon, ...HELL_TOOLBAR_DIRECTIVES],
  template: `
    <section class="grid gap-6 p-6" data-testid="toolbar-contract-harness">
      <h1>Toolbar contract harness</h1>

      <div class="flex flex-wrap gap-hell-2">
        @for (width of widths; track width) {
          <button
            hellButton
            size="sm"
            type="button"
            [attr.data-testid]="'toolbar-width-' + width"
            (click)="containerWidth.set(width)"
          >
            {{ width }}px
          </button>
        }
      </div>

      <div
        data-testid="toolbar-container"
        [style.width.px]="containerWidth()"
        class="rounded-hell-md border border-hell-border bg-hell-surface p-hell-2"
      >
        <hell-toolbar label="Harness actions" data-testid="toolbar">
          <ng-template hellToolbarAction label="New" priority="primary" (activated)="run('New')">
            <hell-icon name="faSolidPlus" size="13px" />
          </ng-template>
          <ng-template hellToolbarAction label="Edit" (activated)="run('Edit')">
            <hell-icon name="faSolidPenToSquare" size="13px" />
          </ng-template>
          <ng-template hellToolbarAction label="Duplicate" (activated)="run('Duplicate')">
            <hell-icon name="faSolidCopy" size="13px" />
          </ng-template>
          <ng-template hellToolbarAction label="Share" (activated)="run('Share')">
            <hell-icon name="faSolidShareNodes" size="13px" />
          </ng-template>
          <ng-template hellToolbarAction label="Download" (activated)="run('Download')">
            <hell-icon name="faSolidDownload" size="13px" />
          </ng-template>
          <ng-template hellToolbarAction label="Locked" disabled (activated)="run('Locked')">
            <hell-icon name="faSolidLock" size="13px" />
          </ng-template>
          <ng-template
            hellToolbarAction
            label="Settings"
            priority="overflowOnly"
            (activated)="run('Settings')"
          >
            <hell-icon name="faSolidGear" size="13px" />
          </ng-template>
        </hell-toolbar>
      </div>

      <p>
        Last action:
        <strong data-testid="toolbar-last-action">{{ lastAction() }}</strong>
      </p>
    </section>
  `,
})
export class ToolbarContractHarnessPage {
  protected readonly widths = [640, 420, 220] as const;
  protected readonly containerWidth = signal<number>(640);
  protected readonly lastAction = signal('none');

  protected run(action: string): void {
    this.lastAction.set(action);
  }
}
