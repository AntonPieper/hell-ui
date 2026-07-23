import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  HellTimePicker,
  type HellTimePickerUi,
  type HellTimeValue,
} from 'hell-ui/time-picker';

@Component({
  selector: 'app-time-picker-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellTimePicker],
  template: `<hell-time-picker seconds [(value)]="value" [ui]="ui" />`,
})
export class TimePickerStylingExample {
  protected readonly value = signal<HellTimeValue | null>({
    hour: 9,
    minute: 30,
    second: 0,
  });

  protected readonly ui: HellTimePickerUi = {
    root: 'rounded-hell-lg border-hell-primary bg-hell-surface-subtle',
    header: 'justify-center border-b border-hell-border pb-hell-2',
    readout: 'text-hell-primary',
    units: 'gap-hell-3',
    unit: 'gap-hell-2',
    unitLabel: 'text-hell-primary',
    unitControl: 'rounded-hell-md border-hell-primary',
    unitValue: 'text-hell-primary',
    unitStep: 'text-hell-primary hover:bg-hell-primary/10',
    minutePresets: 'gap-hell-2',
    minutePreset: 'rounded-hell-md border-hell-primary data-[selected=true]:bg-hell-primary',
  };
}
