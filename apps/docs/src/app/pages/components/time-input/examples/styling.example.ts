import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellTimeInput, type HellTimeInputUi, type HellTimeValue } from '@hell-ui/angular/time-input';

@Component({
  selector: 'app-time-input-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellTimeInput],
  template: `
    <!-- Open the picker to see the refined panel, readout, unit controls, and minute presets. -->
    <hell-time-input
      aria-label="Styled time"
      seconds
      [value]="value()"
      [ui]="ui"
      (valueChange)="value.set($event)"
    />
  `,
})
export class TimeInputStylingExample {
  protected readonly value = signal<HellTimeValue | null>({ hour: 9, minute: 30, second: 0 });

  protected readonly ui: HellTimeInputUi = {
    root: 'rounded-hell-lg border-hell-primary bg-hell-surface-subtle',
    input: 'font-mono tabular-nums text-hell-primary',
    trigger: 'rounded-hell-sm bg-hell-primary/10 text-hell-primary',
    triggerIcon: 'text-hell-primary',
    pickerPanel: 'rounded-hell-lg border-hell-primary bg-hell-surface-subtle',
    pickerHeader: 'justify-center border-b border-hell-border pb-hell-2',
    pickerReadout: 'text-hell-primary',
    pickerUnits: 'gap-hell-3',
    pickerUnit: 'gap-hell-2',
    pickerUnitLabel: 'text-hell-primary',
    pickerUnitControl: 'rounded-hell-md border-hell-primary',
    pickerUnitValue: 'text-hell-primary',
    pickerUnitStep: 'text-hell-primary hover:bg-hell-primary/10',
    minutePresets: 'gap-hell-2',
    minutePreset: 'rounded-hell-md border-hell-primary data-[selected=true]:bg-hell-primary',
  };
}
