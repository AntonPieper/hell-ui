import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HELL_ALERT_IMPORTS } from '@hell-ui/angular/alert';
import { HellButton } from '@hell-ui/angular/button';
import { HELL_CONTROL_GROUP_IMPORTS } from '@hell-ui/angular/control-group';
import {
  HELL_DEFAULT_DATE_INPUT_ADAPTER,
  HellDateInput,
  provideHellDateInputAdapter,
} from '@hell-ui/angular/date-input';
import {
  HellFilePicker,
  type HellFileRejection,
  type HellFileSelection,
  type HellFileValidator,
} from '@hell-ui/angular/file-picker';
import { HellInput } from '@hell-ui/angular/input';
import {
  HELL_DEFAULT_NUMBER_INPUT_ADAPTER,
  HELL_NUMBER_INPUT_IMPORTS,
  provideHellNumberInputAdapter,
  type HellNumberInputAdapter,
} from '@hell-ui/angular/number-input';
import { HellProgress, HellProgressBar } from '@hell-ui/angular/progress';
import {
  HELL_DEFAULT_TIME_INPUT_ADAPTER,
  HellTimeInput,
  provideHellTimeInputAdapter,
  type HellTimeInputAdapter,
  type HellTimeValue,
} from '@hell-ui/angular/time-input';

const consumerTimeAdapter: HellTimeInputAdapter = {
  ...HELL_DEFAULT_TIME_INPUT_ADAPTER,
  parseText: (text, context) =>
    text.trim().toLowerCase() === 'noon'
      ? { valid: true, value: { hour: 12, minute: 0, second: 0 } }
      : HELL_DEFAULT_TIME_INPUT_ADAPTER.parseText(text, context),
};

const consumerNumberAdapter: HellNumberInputAdapter = {
  ...HELL_DEFAULT_NUMBER_INPUT_ADAPTER,
  parseText: (text, context) =>
    text.trim().toLowerCase() === 'half'
      ? { valid: true, value: 0.5 }
      : HELL_DEFAULT_NUMBER_INPUT_ADAPTER.parseText(text, context),
};

interface UploadItem {
  readonly id: string;
  readonly file: File;
  readonly status: 'uploading' | 'done' | 'error';
}

@Component({
  selector: 'app-styled-inputs',
  imports: [
    ReactiveFormsModule,
    ...HELL_ALERT_IMPORTS,
    ...HELL_CONTROL_GROUP_IMPORTS,
    ...HELL_NUMBER_INPUT_IMPORTS,
    HellButton,
    HellDateInput,
    HellFilePicker,
    HellInput,
    HellProgress,
    HellProgressBar,
    HellTimeInput,
  ],
  providers: [
    provideHellDateInputAdapter(HELL_DEFAULT_DATE_INPUT_ADAPTER),
    provideHellTimeInputAdapter(consumerTimeAdapter),
    provideHellNumberInputAdapter(consumerNumberAdapter),
  ],
  template: `
    <div
      hellControlGroup
      size="lg"
      invalid
      aria-label="Release tag"
      ui="max-w-lg rounded-hell-pill border-hell-primary"
    >
      <span hellControlGroupPrefix ui="font-semibold">release/</span>
      <input
        hellInput
        size="lg"
        invalid
        aria-label="Release tag name"
        ui="h-auto min-h-0 min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none"
        value="styled-controls"
      />
      <span hellControlGroupSuffix ui="font-mono">v2</span>
      <button hellControlGroupAction ui="text-hell-primary">Apply</button>
    </div>

    <input
      hellDateInput
      name="controlledDate"
      aria-label="Controlled date"
      placeholder="YYYY-MM-DD"
      required
      [value]="date()"
      [min]="minDate"
      [max]="maxDate"
      (valueChange)="date.set($event)"
    />
    <input hellDateInput aria-label="Forms date" [formControl]="dateControl" />

    <input
      hellTimeInput
      name="controlledTime"
      aria-label="Controlled time"
      placeholder="HH:mm:ss"
      required
      seconds
      [value]="time()"
      (valueChange)="time.set($event)"
    />
    <input hellTimeInput aria-label="Forms time" [formControl]="timeControl" />

    <input
      #quantityInput="hellNumberInput"
      hellNumberInput
      name="controlledQuantity"
      aria-label="Controlled quantity"
      required
      [value]="quantity()"
      [min]="0"
      [max]="100"
      [step]="0.5"
      (valueChange)="quantity.set($event)"
    />
    <button hellNumberStep="decrement" [hellNumberStepFor]="quantityInput">−</button>
    <button hellNumberStep="increment" [hellNumberStepFor]="quantityInput">+</button>
    <input hellNumberInput aria-label="Forms quantity" integer [formControl]="quantityControl" />

    <div
      hellFilePicker
      #picker="hellFilePicker"
      accept=".pdf,image/*"
      [maxBytes]="5 * 1024 * 1024"
      [maxFiles]="2"
      [validate]="validate"
      aria-label="Add review files"
      ui="min-h-hell-20 border-hell-info"
      (selection)="enqueue($event)"
    >
      Drop review files
    </div>
    <button hellButton type="button" (click)="picker.open()">Browse</button>
    @if (rejections().length) {
      <hell-alert variant="danger">
        <h2 hellAlertTitle>File Picker rejected some files</h2>
        <ul hellAlertDescription>
          @for (rejection of rejections(); track rejection.file) {
            <li>{{ rejection.file.name }}: {{ rejection.reason }}</li>
          }
        </ul>
      </hell-alert>
    }
    <ul aria-label="Application upload queue">
      @for (item of items(); track item.id) {
        <li>
          <span>{{ item.file.name }} — {{ item.status }}</span>
          <div hellProgress [value]="25" [attr.aria-label]="item.file.name + ' progress'">
            <div hellProgressBar></div>
          </div>
        </li>
      }
    </ul>
  `,
})
export class StyledInputs {
  protected readonly date = signal<Date | null>(new Date(2026, 3, 22));
  protected readonly minDate = new Date(2026, 3, 1);
  protected readonly maxDate = new Date(2026, 3, 30);
  protected readonly dateControl = new FormControl<Date | null>(null);
  protected readonly time = signal<HellTimeValue | null>({ hour: 9, minute: 30, second: 15 });
  protected readonly timeControl = new FormControl<HellTimeValue | null>(null);
  protected readonly quantity = signal<number | null>(2.5);
  protected readonly quantityControl = new FormControl<number | null>(null);
  protected readonly items = signal<readonly UploadItem[]>([]);
  protected readonly rejections = signal<readonly HellFileRejection[]>([]);
  protected readonly validate: HellFileValidator = (file) =>
    file.name.toLowerCase().includes('draft') ? 'Draft files are not accepted' : null;

  private sequence = 0;

  protected enqueue(selection: HellFileSelection): void {
    this.rejections.set(selection.rejected);
    const additions = selection.accepted.map<UploadItem>((file) => ({
      id: `upload-${this.sequence++}-${file.name}`,
      file,
      status: 'uploading',
    }));
    this.items.update((current) => [...current, ...additions]);
  }
}
