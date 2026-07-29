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
    columns: 'gap-hell-3',
    column: 'gap-hell-2',
    columnLabel: 'text-hell-primary',
    options: 'rounded-hell-md border-hell-primary',
    option: 'rounded-hell-md data-[selected=true]:bg-hell-primary',
  };
}
