import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidAlignCenter,
  faSolidAlignLeft,
  faSolidAlignRight,
  faSolidBold,
  faSolidItalic,
} from '@ng-icons/font-awesome/solid';
import { HellButton } from '@hell-ui/angular/button';
import { HellIcon } from '@hell-ui/angular/icon';
import { HELL_TOOLBAR_IMPORTS } from '@hell-ui/angular/toolbar';
import { HellTooltip, HellTooltipSurface } from '@hell-ui/angular/tooltip';

@Component({
  selector: 'app-toolbar-icon-only-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      faSolidBold,
      faSolidItalic,
      faSolidAlignLeft,
      faSolidAlignCenter,
      faSolidAlignRight,
    }),
  ],
  imports: [HellButton, HellIcon, HellTooltip, HellTooltipSurface, ...HELL_TOOLBAR_IMPORTS],
  template: `
    <div class="flex flex-col gap-hell-3">
      <div hellToolbar label="Text formatting">
        <button
          hellButton
          hellToolbarItem
          iconOnly
          size="sm"
          type="button"
          aria-label="Bold"
          [hellTooltip]="boldHint"
          (click)="run('bold')"
        >
          <hell-icon name="faSolidBold" size="13px" />
        </button>
        <button
          hellButton
          hellToolbarItem
          iconOnly
          size="sm"
          type="button"
          aria-label="Italic"
          [hellTooltip]="italicHint"
          (click)="run('italic')"
        >
          <hell-icon name="faSolidItalic" size="13px" />
        </button>

        <span
          class="mx-hell-1 h-5 w-px bg-hell-border"
          role="separator"
          aria-orientation="vertical"
        ></span>

        <button
          hellButton
          hellToolbarItem
          iconOnly
          size="sm"
          type="button"
          aria-label="Align left"
          [hellTooltip]="alignLeftHint"
          (click)="run('align-left')"
        >
          <hell-icon name="faSolidAlignLeft" size="13px" />
        </button>
        <button
          hellButton
          hellToolbarItem
          iconOnly
          size="sm"
          type="button"
          aria-label="Align center"
          [hellTooltip]="alignCenterHint"
          (click)="run('align-center')"
        >
          <hell-icon name="faSolidAlignCenter" size="13px" />
        </button>
        <button
          hellButton
          hellToolbarItem
          iconOnly
          size="sm"
          type="button"
          aria-label="Align right"
          [hellTooltip]="alignRightHint"
          (click)="run('align-right')"
        >
          <hell-icon name="faSolidAlignRight" size="13px" />
        </button>
      </div>

      <ng-template #boldHint><span hellTooltipSurface>Bold</span></ng-template>
      <ng-template #italicHint><span hellTooltipSurface>Italic</span></ng-template>
      <ng-template #alignLeftHint><span hellTooltipSurface>Align left</span></ng-template>
      <ng-template #alignCenterHint><span hellTooltipSurface>Align center</span></ng-template>
      <ng-template #alignRightHint><span hellTooltipSurface>Align right</span></ng-template>

      <p class="m-0 text-sm text-hell-foreground-muted">
        Each item is the same consumer-owned <code>hellButton</code>, Tooltip trigger, and click
        handler it would be outside the toolbar. <code>hellToolbarItem</code> adds only focus
        registration, so the richer tooltip and button classes compose without competing bindings.
        Last action: <strong>{{ lastAction() }}</strong>.
      </p>
    </div>
  `,
})
export class ToolbarIconOnlyExample {
  protected readonly lastAction = signal('none yet');

  protected run(action: string): void {
    this.lastAction.set(action);
  }
}
