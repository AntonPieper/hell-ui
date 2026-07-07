import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidBold, faSolidItalic, faSolidUnderline } from '@ng-icons/font-awesome/solid';
import { HellIcon } from '@hell-ui/angular/icon';
import { HellToggleGroup, HellToggleGroupItem } from '@hell-ui/angular/toggle';
import { HellTooltip, HellTooltipTrigger } from '@hell-ui/angular/tooltip';

@Component({
  selector: 'app-toggle-with-tooltip-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellToggleGroup, HellToggleGroupItem, HellIcon, HellTooltip, HellTooltipTrigger],
  providers: [provideIcons({ faSolidBold, faSolidItalic, faSolidUnderline })],
  template: `
    <div hellToggleGroup type="multiple" [value]="tools()" (valueChange)="tools.set($event)" aria-label="Text formatting">
      <button hellToggleGroupItem value="bold" type="button" [hellTooltipTrigger]="boldTip" aria-label="Bold">
        <hell-icon name="faSolidBold" />
      </button>
      <button hellToggleGroupItem value="italic" type="button" [hellTooltipTrigger]="italicTip" aria-label="Italic">
        <hell-icon name="faSolidItalic" />
      </button>
      <button
        hellToggleGroupItem
        value="underline"
        type="button"
        [hellTooltipTrigger]="underlineTip"
        aria-label="Underline"
      >
        <hell-icon name="faSolidUnderline" />
      </button>
    </div>

    <ng-template #boldTip><span hellTooltip>Bold (Ctrl+B)</span></ng-template>
    <ng-template #italicTip><span hellTooltip>Italic (Ctrl+I)</span></ng-template>
    <ng-template #underlineTip><span hellTooltip>Underline (Ctrl+U)</span></ng-template>
  `,
})
export class ToggleWithTooltipExample {
  protected readonly tools = signal<string[]>(['bold']);
}
