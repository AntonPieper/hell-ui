import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidBold, faSolidItalic, faSolidUnderline } from '@ng-icons/font-awesome/solid';
import { HellIcon } from '@hell-ui/angular/icon';
import { HellToggleGroup, HellToggleGroupItem } from '@hell-ui/angular/toggle';
import { HellTooltip, HellTooltipSurface } from '@hell-ui/angular/tooltip';

@Component({
  selector: 'app-toggle-with-tooltip-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellToggleGroup, HellToggleGroupItem, HellIcon, HellTooltip, HellTooltipSurface],
  providers: [provideIcons({ faSolidBold, faSolidItalic, faSolidUnderline })],
  template: `
    <div hellToggleGroup type="multiple" [value]="tools()" (valueChange)="tools.set($event)" aria-label="Text formatting">
      <button hellToggleGroupItem value="bold" type="button" [hellTooltip]="boldTip" aria-label="Bold">
        <hell-icon name="faSolidBold" />
      </button>
      <button hellToggleGroupItem value="italic" type="button" [hellTooltip]="italicTip" aria-label="Italic">
        <hell-icon name="faSolidItalic" />
      </button>
      <button
        hellToggleGroupItem
        value="underline"
        type="button"
        [hellTooltip]="underlineTip"
        aria-label="Underline"
      >
        <hell-icon name="faSolidUnderline" />
      </button>
    </div>

    <ng-template #boldTip><span hellTooltipSurface>Bold (Ctrl+B)</span></ng-template>
    <ng-template #italicTip><span hellTooltipSurface>Italic (Ctrl+I)</span></ng-template>
    <ng-template #underlineTip><span hellTooltipSurface>Underline (Ctrl+U)</span></ng-template>
  `,
})
export class ToggleWithTooltipExample {
  protected readonly tools = signal<string[]>(['bold']);
}
