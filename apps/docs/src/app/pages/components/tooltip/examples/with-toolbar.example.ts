import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidBold,
  faSolidItalic,
  faSolidUnderline,
} from '@ng-icons/font-awesome/solid';
import { HellButton } from 'hell-ui/button';
import { HellIcon } from 'hell-ui/icon';
import { HellKbd } from 'hell-ui/chip';
import {
  HellTooltip,
  HellTooltipSurface,
  provideHellTooltipDefaults,
} from 'hell-ui/tooltip';

const TOOLBAR_ICONS = { faSolidBold, faSolidItalic, faSolidUnderline };

@Component({
  selector: 'app-tooltip-with-toolbar-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons(TOOLBAR_ICONS),
    // One eager policy for the whole toolbar instead of a [showDelay] per button.
    provideHellTooltipDefaults({ showDelay: 300 }),
  ],
  imports: [HellButton, HellIcon, HellKbd, HellTooltip, HellTooltipSurface],
  template: `
    <div class="inline-flex gap-1 rounded-hell-md border border-hell-border p-1">
      <button
        hellButton
        iconOnly
        variant="ghost"
        size="sm"
        type="button"
        aria-label="Bold"
        [hellTooltip]="boldHint"
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
        [hellTooltip]="italicHint"
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
        [hellTooltip]="underlineHint"
      >
        <hell-icon name="faSolidUnderline" />
      </button>
    </div>

    <!-- Rich markup earns a template: each hint is a consumer-authored surface. -->
    <ng-template #boldHint>
      <span hellTooltipSurface class="flex items-center gap-2">
        Bold
        <kbd hellKbd ui="border-white/20 bg-white/10 text-white">Ctrl</kbd>
        <kbd hellKbd ui="border-white/20 bg-white/10 text-white">B</kbd>
      </span>
    </ng-template>
    <ng-template #italicHint>
      <span hellTooltipSurface class="flex items-center gap-2">
        Italic
        <kbd hellKbd ui="border-white/20 bg-white/10 text-white">Ctrl</kbd>
        <kbd hellKbd ui="border-white/20 bg-white/10 text-white">I</kbd>
      </span>
    </ng-template>
    <ng-template #underlineHint>
      <span hellTooltipSurface class="flex items-center gap-2">
        Underline
        <kbd hellKbd ui="border-white/20 bg-white/10 text-white">Ctrl</kbd>
        <kbd hellKbd ui="border-white/20 bg-white/10 text-white">U</kbd>
      </span>
    </ng-template>
  `,
})
export class TooltipWithToolbarExample {}
