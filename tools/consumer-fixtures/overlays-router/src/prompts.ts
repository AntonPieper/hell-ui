import { Component, signal } from '@angular/core';
import {
  HELL_CONFIRM_LABELS,
  injectHellPrompt,
  type HellConfirmLabels,
  type HellPrompt,
  type HellPromptAction,
} from 'hell-ui/confirm';
import { provideHellLabels } from 'hell-ui/core';
import {
  HELL_TIME_PICKER_LABELS,
  HellTimePicker,
  type HellTimePickerLabels,
  type HellTimePickerUi,
  type HellTimeValue,
} from 'hell-ui/time-picker';

type Decision = 'save' | 'discard' | 'stay';

const actions = [
  { value: 'save', label: 'Save', variant: 'primary' },
  { value: 'discard', label: 'Discard', variant: 'danger', countdownSeconds: 1 },
  { value: 'stay', label: 'Keep editing', dismissEquivalent: true },
] as const satisfies readonly HellPromptAction<Decision>[];

const confirmLabels = {
  confirm: 'Continue',
  cancel: 'Go back',
  countdown: (remainingSeconds: number) => ' (' + remainingSeconds + ')',
} satisfies Partial<HellConfirmLabels>;

const timePickerLabels = {
  selectedTime: (time: string) => 'Consumer fixture selected ' + time,
  minutePresets: 'Consumer fixture minute presets',
} satisfies Partial<HellTimePickerLabels>;

// Unified modal and anchored HellPrompt flows plus the standalone Time Picker
// prove the anchored-overlay boundary with the router peer installed.
@Component({
  selector: 'app-overlay-prompts',
  imports: [HellTimePicker],
  providers: [
    provideHellLabels(HELL_CONFIRM_LABELS, confirmLabels),
    provideHellLabels(HELL_TIME_PICKER_LABELS, timePickerLabels),
  ],
  template: `
    <button type="button" (click)="openModal()">Open modal prompt</button>
    <button #anchor type="button" (click)="openAnchored(anchor)">Open anchored prompt</button>
    <button type="button" (click)="openChoice()">Open choice prompt</button>
    <p>{{ result() }}</p>
    <hell-time-picker seconds [(value)]="time" [ui]="timePickerUi" />
  `,
})
export class OverlayPrompts {
  private readonly prompt: HellPrompt = injectHellPrompt();
  protected readonly result = signal<boolean | Decision | null>(null);
  protected readonly time = signal<HellTimeValue | null>({ hour: 14, minute: 30, second: 45 });
  protected readonly timePickerUi = {
    root: 'border-hell-primary',
    readout: 'text-hell-primary',
    minutePreset: 'rounded-hell-md',
  } satisfies HellTimePickerUi;

  protected async openModal(): Promise<void> {
    this.result.set(
      await this.prompt.confirm(
        { title: 'Publish?', description: 'This is the packed modal flow.' },
        { action: { label: 'Publish', variant: 'primary' } },
      ),
    );
  }

  protected async openAnchored(anchor: HTMLElement): Promise<void> {
    this.result.set(
      await this.prompt.confirm('Delete this row?', {
        anchor,
        placement: 'bottom-end',
        action: { label: 'Delete', variant: 'danger' },
      }),
    );
  }

  protected async openChoice(): Promise<void> {
    this.result.set(await this.prompt.choose<Decision>('Unsaved changes', actions));
  }
}
