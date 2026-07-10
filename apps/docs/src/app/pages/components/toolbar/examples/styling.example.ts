import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidDownload,
  faSolidGear,
  faSolidPenToSquare,
  faSolidPlus,
  faSolidShareNodes,
} from '@ng-icons/font-awesome/solid';
import { HellIcon } from '@hell-ui/angular/icon';
import { HELL_TOOLBAR_DIRECTIVES, type HellToolbarUi } from '@hell-ui/angular/toolbar';

@Component({
  selector: 'app-toolbar-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      faSolidPlus,
      faSolidPenToSquare,
      faSolidShareNodes,
      faSolidDownload,
      faSolidGear,
    }),
  ],
  imports: [HellIcon, ...HELL_TOOLBAR_DIRECTIVES],
  template: `
    <div class="max-w-[420px]">
      <hell-toolbar label="Styled actions" [ui]="toolbarUi">
        <ng-template hellToolbarAction label="New" priority="primary" variant="primary">
          <hell-icon name="faSolidPlus" size="13px" />
        </ng-template>
        <ng-template hellToolbarAction label="Edit">
          <hell-icon name="faSolidPenToSquare" size="13px" />
        </ng-template>
        <ng-template hellToolbarAction label="Share">
          <hell-icon name="faSolidShareNodes" size="13px" />
        </ng-template>
        <ng-template hellToolbarAction label="Download">
          <hell-icon name="faSolidDownload" size="13px" />
        </ng-template>
        <ng-template hellToolbarAction label="Settings" priority="overflowOnly">
          <hell-icon name="faSolidGear" size="13px" />
        </ng-template>
      </hell-toolbar>
    </div>
  `,
})
export class ToolbarStylingExample {
  protected readonly toolbarUi = {
    root: 'gap-hell-3 rounded-hell-xl border border-hell-primary bg-hell-primary-soft p-hell-3',
    overflowMenu: 'rounded-hell-lg border-hell-primary',
    overflowItem: 'text-hell-primary-soft-foreground',
  } satisfies HellToolbarUi;
}
