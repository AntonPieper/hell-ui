import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellButton } from 'hell-ui/button';
import { HellProgress, HellProgressBar } from 'hell-ui/progress';

@Component({
  selector: 'app-progress-labeled-value-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellProgress, HellProgressBar],
  template: `
    <div class="grid gap-1">
      <div class="flex justify-between text-sm font-medium">
        <span id="storage-label">Storage used</span>
        <span>{{ value() }}%</span>
      </div>
      <div hellProgress aria-label="Storage used" [value]="value()">
        <div hellProgressBar></div>
      </div>
    </div>
    <div class="flex gap-2">
      <button hellButton size="sm" type="button" (click)="step(-10)">−10</button>
      <button hellButton size="sm" type="button" (click)="step(10)">+10</button>
    </div>
  `,
})
export class ProgressLabeledValueExample {
  protected readonly value = signal(40);

  protected step(delta: number) {
    this.value.update((current) => Math.max(0, Math.min(100, current + delta)));
  }
}
