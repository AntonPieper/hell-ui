import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidAlignCenter,
  faSolidAlignLeft,
  faSolidAlignRight,
  faSolidBold,
  faSolidCopy,
  faSolidDownload,
  faSolidFilter,
  faSolidGear,
  faSolidItalic,
  faSolidLock,
  faSolidMagnifyingGlass,
  faSolidPenToSquare,
  faSolidPlus,
  faSolidShareNodes,
  faSolidTableColumns,
  faSolidXmark,
} from '@ng-icons/font-awesome/solid';
import { HellButton } from '@hell-ui/angular/button';
import { HellIcon } from '@hell-ui/angular/icon';
import { HELL_TOOLBAR_IMPORTS } from '@hell-ui/angular/toolbar';
import { HellTooltip } from '@hell-ui/angular/tooltip';

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
      faSolidBold,
      faSolidItalic,
      faSolidAlignLeft,
      faSolidAlignCenter,
      faSolidAlignRight,
      faSolidFilter,
      faSolidTableColumns,
      faSolidXmark,
      faSolidMagnifyingGlass,
    }),
  ],
  imports: [HellButton, HellIcon, HellTooltip, ...HELL_TOOLBAR_IMPORTS],
  template: `
    <section class="grid gap-6 p-6" data-testid="toolbar-contract-harness">
      <h1>Toolbar contract harness</h1>

      <h2>Plain Toolbar</h2>

      <div hellToolbar label="Formatting actions" data-testid="plain-toolbar" ui="w-fit">
        <button
          hellButton
          hellToolbarItem
          iconOnly
          size="sm"
          type="button"
          aria-label="Bold"
          data-testid="plain-toolbar-bold"
          (click)="run('Bold')"
        >
          <hell-icon name="faSolidBold" size="13px" />
        </button>
        <button
          hellButton
          hellToolbarItem
          iconOnly
          size="sm"
          type="button"
          aria-label="Locked"
          data-testid="plain-toolbar-disabled"
          disabled
          (click)="run('Locked')"
        >
          <hell-icon name="faSolidLock" size="13px" />
        </button>
        <button
          hellButton
          hellToolbarItem
          iconOnly
          size="sm"
          type="button"
          aria-label="Share"
          data-testid="plain-toolbar-share"
          hellTooltip="Share formatting"
          (click)="run('Share')"
        >
          <hell-icon name="faSolidShareNodes" size="13px" />
        </button>
      </div>

      <div
        hellToolbar
        orientation="vertical"
        label="Text alignment"
        data-testid="plain-toolbar-vertical"
        ui="w-fit"
      >
        <button hellButton hellToolbarItem size="sm" type="button">Align left</button>
        <button hellButton hellToolbarItem size="sm" type="button" disabled>Align center</button>
        <button hellButton hellToolbarItem size="sm" type="button">Align right</button>
      </div>

      <h2>Overflow Toolbar</h2>

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
        <hell-overflow-toolbar label="Harness actions" data-testid="toolbar">
          <ng-template hellToolbarAction label="New" overflow="never" (activated)="run('New')">
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
            overflow="always"
            (activated)="run('Settings')"
          >
            <hell-icon name="faSolidGear" size="13px" />
          </ng-template>
        </hell-overflow-toolbar>
      </div>

      <p>
        Last action:
        <strong data-testid="toolbar-last-action">{{ lastAction() }}</strong>
      </p>

      <h2>Capabilities harness</h2>

      <div class="flex flex-wrap gap-hell-2">
        @for (width of capWidths; track width) {
          <button
            hellButton
            size="sm"
            type="button"
            [attr.data-testid]="'toolbar-cap-width-' + width"
            (click)="capWidth.set(width)"
          >
            {{ width }}px
          </button>
        }
      </div>

      <div
        data-testid="toolbar-cap-container"
        [style.width.px]="capWidth()"
        class="rounded-hell-md border border-hell-border bg-hell-surface p-hell-2"
      >
        <hell-overflow-toolbar label="Formatting" data-testid="toolbar-cap">
          <ng-template
            hellToolbarAction
            label="Insert"
            overflow="never"
            variant="primary"
            (activated)="run('Insert')"
          >
            <hell-icon name="faSolidPlus" size="13px" />
          </ng-template>
          <ng-template hellToolbarSeparator></ng-template>
          <ng-template hellToolbarAction label="Bold" iconOnly (activated)="run('Bold')">
            <hell-icon name="faSolidBold" size="13px" />
          </ng-template>
          <ng-template hellToolbarAction label="Italic" iconOnly (activated)="run('Italic')">
            <hell-icon name="faSolidItalic" size="13px" />
          </ng-template>
          <ng-template hellToolbarSeparator></ng-template>
          <ng-template hellToolbarAction label="Align left" iconOnly (activated)="run('Align left')">
            <hell-icon name="faSolidAlignLeft" size="13px" />
          </ng-template>
          <ng-template
            hellToolbarAction
            label="Align center"
            iconOnly
            (activated)="run('Align center')"
          >
            <hell-icon name="faSolidAlignCenter" size="13px" />
          </ng-template>
          <ng-template
            hellToolbarAction
            label="Align right"
            iconOnly
            (activated)="run('Align right')"
          >
            <hell-icon name="faSolidAlignRight" size="13px" />
          </ng-template>
          <ng-template hellToolbarWidget>
            <label
              class="flex items-center gap-hell-2 rounded-hell-md border border-hell-border bg-hell-surface px-hell-2 py-hell-1 text-hell-foreground-muted focus-within:border-hell-border-strong"
            >
              <hell-icon name="faSolidMagnifyingGlass" size="12px" aria-hidden="true" />
              <input
                type="search"
                data-testid="toolbar-cap-search"
                aria-label="Search formatting"
                placeholder="Search"
                class="w-28 border-0 bg-transparent text-sm text-hell-foreground outline-none placeholder:text-hell-foreground-subtle"
              />
            </label>
          </ng-template>
          <ng-template
            hellToolbarAction
            label="Clear formatting"
            overflow="always"
            (activated)="run('Clear formatting')"
          >
            <hell-icon name="faSolidXmark" size="13px" />
          </ng-template>
        </hell-overflow-toolbar>
      </div>
    </section>
  `,
})
export class ToolbarContractHarnessPage {
  protected readonly widths = [960, 640, 420, 220] as const;
  protected readonly capWidths = [720, 420, 240] as const;
  protected readonly containerWidth = signal<number>(640);
  protected readonly capWidth = signal<number>(720);
  protected readonly lastAction = signal('none');

  protected run(action: string): void {
    this.lastAction.set(action);
  }
}
