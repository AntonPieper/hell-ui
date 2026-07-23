import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidBold, faSolidItalic, faSolidUnderline } from '@ng-icons/font-awesome/solid';
import { HellIcon } from '@hell-ui/angular/icon';
import { HellToggleGroup, HellToggleGroupItem, type HellToggleGroupValue } from '@hell-ui/angular/toggle';
import { HellTooltip } from '@hell-ui/angular/tooltip';

@Component({
  selector: 'app-toggle-with-tooltip-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellToggleGroup, HellToggleGroupItem, HellIcon, HellTooltip],
  providers: [provideIcons({ faSolidBold, faSolidItalic, faSolidUnderline })],
  template: `
    <div hellToggleGroup type="multiple" [(value)]="tools" aria-label="Text formatting">
      <button hellToggleGroupItem value="bold" type="button" hellTooltip="Bold (Ctrl+B)" aria-label="Bold">
        <hell-icon name="faSolidBold" />
      </button>
      <button hellToggleGroupItem value="italic" type="button" hellTooltip="Italic (Ctrl+I)" aria-label="Italic">
        <hell-icon name="faSolidItalic" />
      </button>
      <button
        hellToggleGroupItem
        value="underline"
        type="button"
        hellTooltip="Underline (Ctrl+U)"
        aria-label="Underline"
      >
        <hell-icon name="faSolidUnderline" />
      </button>
    </div>
  `,
})
export class ToggleWithTooltipExample {
  protected readonly tools = signal<HellToggleGroupValue>(['bold']);
}
