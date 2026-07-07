import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidBold,
  faSolidItalic,
  faSolidUnderline,
} from '@ng-icons/font-awesome/solid';
import { HellButton } from '@hell-ui/angular/button';
import { HellIcon } from '@hell-ui/angular/icon';
import { HellKbd } from '@hell-ui/angular/tag';
import { HellTooltip, HellTooltipTrigger } from '@hell-ui/angular/tooltip';

const TOOLBAR_ICONS = { faSolidBold, faSolidItalic, faSolidUnderline };

@Component({
  selector: 'app-tooltip-with-toolbar-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons(TOOLBAR_ICONS)],
  imports: [HellButton, HellIcon, HellKbd, HellTooltip, HellTooltipTrigger],
  template: `
    <div class="inline-flex gap-1 rounded-hell-md border border-hell-border p-1">
      <button
        hellButton
        iconOnly
        variant="ghost"
        size="sm"
        type="button"
        aria-label="Bold"
        [hellTooltipTrigger]="boldHint"
        [showDelay]="300"
      >
        <hell-icon name="faSolidBold" />
      </button>
      <button
        hellButton
        iconOnly
        variant="ghost"
        size="sm"
        type="button"
        aria-label="Italic"
        [hellTooltipTrigger]="italicHint"
        [showDelay]="300"
      >
        <hell-icon name="faSolidItalic" />
      </button>
      <button
        hellButton
        iconOnly
        variant="ghost"
        size="sm"
        type="button"
        aria-label="Underline"
        [hellTooltipTrigger]="underlineHint"
        [showDelay]="300"
      >
        <hell-icon name="faSolidUnderline" />
      </button>
    </div>

    <ng-template #boldHint>
      <span hellTooltip class="flex items-center gap-2">
        Bold
        <kbd hellKbd ui="border-white/20 bg-white/10 text-white">Ctrl</kbd>
        <kbd hellKbd ui="border-white/20 bg-white/10 text-white">B</kbd>
      </span>
    </ng-template>
    <ng-template #italicHint>
      <span hellTooltip class="flex items-center gap-2">
        Italic
        <kbd hellKbd ui="border-white/20 bg-white/10 text-white">Ctrl</kbd>
        <kbd hellKbd ui="border-white/20 bg-white/10 text-white">I</kbd>
      </span>
    </ng-template>
    <ng-template #underlineHint>
      <span hellTooltip class="flex items-center gap-2">
        Underline
        <kbd hellKbd ui="border-white/20 bg-white/10 text-white">Ctrl</kbd>
        <kbd hellKbd ui="border-white/20 bg-white/10 text-white">U</kbd>
      </span>
    </ng-template>
  `,
})
export class TooltipWithToolbarExample {}
