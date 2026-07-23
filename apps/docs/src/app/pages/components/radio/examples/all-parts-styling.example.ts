import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellNativeRadio, HellNativeRadioGroup, HellRadio, HellRadioGroup, HellRadioIndicator } from 'hell-ui/radio';

@Component({
  selector: 'app-radio-all-parts-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellRadioGroup,
    HellRadio,
    HellRadioIndicator,
    HellNativeRadioGroup,
    HellNativeRadio,
  ],
  template: `
    <!-- HellRadioGroup + HellRadio: each module's sole 'root' part. -->
    <div
      hellRadioGroup
      aria-label="Custom radios"
      orientation="horizontal"
      [ui]="groupUi"
      [value]="value()"
      (valueChange)="value.set($event!)"
    >
      <button
        hellRadio
        value="a"
        type="button"
        class="inline-flex items-center gap-2"
        ui="rounded-hell-md bg-hell-primary-soft px-hell-3 py-hell-2 data-checked:bg-hell-primary data-checked:text-hell-primary-foreground"
      >
        <span ngpRadioIndicator></span> A
      </button>
      <button
        hellRadio
        value="b"
        type="button"
        class="inline-flex items-center gap-2"
        ui="rounded-hell-md bg-hell-primary-soft px-hell-3 py-hell-2 data-checked:bg-hell-primary data-checked:text-hell-primary-foreground"
      >
        <span ngpRadioIndicator></span> B
      </button>
    </div>

    <!-- HellNativeRadioGroup + HellNativeRadio: each module's sole 'root' part. -->
    <div hellNativeRadioGroup aria-label="Native radios" orientation="horizontal" [ui]="nativeGroupUi">
      <label class="inline-flex items-center gap-2">
        <input
          type="radio"
          hellNativeRadio
          name="all-parts-native"
          checked
          ui="size-hell-6 border-hell-success bg-hell-success-soft"
        />
        Yes
      </label>
      <label class="inline-flex items-center gap-2">
        <input
          type="radio"
          hellNativeRadio
          name="all-parts-native"
          ui="size-hell-6 border-hell-success bg-hell-success-soft"
        />
        No
      </label>
    </div>
  `,
})
export class RadioAllPartsStylingExample {
  protected readonly value = signal('a');
  protected readonly groupUi = {
    root: 'gap-hell-2 rounded-hell-lg border border-hell-border bg-hell-surface-subtle p-hell-2',
  };
  protected readonly nativeGroupUi = {
    root: 'gap-hell-4',
  };
}
