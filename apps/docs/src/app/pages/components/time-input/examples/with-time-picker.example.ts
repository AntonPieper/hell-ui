import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import { faSolidClock } from '@ng-icons/font-awesome/solid';

import { HellButton } from '@hell-ui/angular/button';
import { HELL_CONTROL_GROUP_IMPORTS } from '@hell-ui/angular/control-group';
import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';
import { HellIcon } from '@hell-ui/angular/icon';
import { HellPopover, HellPopoverTrigger } from '@hell-ui/angular/popover';
import { HellTimeInput, type HellTimeValue } from '@hell-ui/angular/time-input';
import { HellTimePicker } from '@hell-ui/angular/time-picker';

@Component({
  selector: 'app-time-input-with-time-picker-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    HellButton,
    HellIcon,
    HellPopover,
    HellPopoverTrigger,
    HellTimeInput,
    HellTimePicker,
    ...HELL_CONTROL_GROUP_IMPORTS,
    ...HELL_FIELD_IMPORTS,
  ],
  providers: [provideIcons({ faSolidClock })],
  template: `
    <div class="min-h-[360px] w-full max-w-sm" hellField>
      <label id="picker-time-label" hellFieldLabel for="picker-time">Start time</label>
      <div
        hellControlGroup
        aria-labelledby="picker-time-label"
        [invalid]="control.invalid"
        [disabled]="control.disabled"
      >
        <input
          #timeField
          id="picker-time"
          hellTimeInput
          placeholder="HH:mm"
          [formControl]="control"
          [invalid]="control.invalid"
          [ui]="controlUi"
        />
        <button
          #timeTrigger="hellPopoverTrigger"
          hellControlGroupAction
          type="button"
          aria-label="Choose time"
          [hellPopoverTrigger]="picker"
          placement="bottom-end"
          [shift]="pickerShift"
          [disabled]="control.disabled"
        >
          <hell-icon name="faSolidClock" />
        </button>
      </div>
      <div hellFieldDescription>
        Type a time, or use the explicitly composed picker and its Done action.
      </div>
    </div>

    <ng-template #picker>
      <div
        hellPopover
        data-testid="time-picker-panel"
        aria-label="Choose time"
        ui="w-auto max-w-none p-0"
      >
        <hell-time-picker
          ui="max-w-none rounded-none border-0 shadow-none"
          [value]="control.value"
          (valueChange)="selectTime($event)"
        />
        <div class="flex justify-end border-t border-hell-border p-hell-2">
          <button hellButton type="button" size="sm" variant="primary" (click)="finishPicking()">
            Done
          </button>
        </div>
      </div>
    </ng-template>
  `,
})
export class TimeInputWithTimePickerExample {
  protected readonly control = new FormControl<HellTimeValue | null>({
    hour: 9,
    minute: 30,
    second: 0,
  });
  protected readonly pickerShift = { padding: 8 } as const;
  protected readonly controlUi =
    'h-auto min-h-0 min-w-0 max-w-none flex-1 rounded-none border-0 bg-transparent shadow-none focus:border-transparent focus:shadow-none data-focus:border-transparent data-focus:shadow-none disabled:bg-transparent data-disabled:bg-transparent';

  private readonly timeField = viewChild.required<ElementRef<HTMLInputElement>>('timeField');
  private readonly timeTrigger = viewChild<HellPopoverTrigger>('timeTrigger');
  private focusInputAfterClose = false;

  constructor() {
    effect(() => {
      const trigger = this.timeTrigger();
      // `open` becomes false after overlay teardown and trigger-focus restoration,
      // so the explicit Done focus policy wins without a timing shim.
      const open = trigger?.open() ?? false;
      if (!trigger || open || !this.focusInputAfterClose) return;

      this.focusInputAfterClose = false;
      this.timeField().nativeElement.focus();
    });
  }

  protected selectTime(value: HellTimeValue | null): void {
    this.control.setValue(value);
    this.control.markAsDirty();
  }

  protected finishPicking(): void {
    this.control.markAsTouched();
    this.focusInputAfterClose = true;
    void this.timeTrigger()?.hide();
  }
}
