import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellProgress, HellProgressBar } from '@hell-ui/angular/progress';

@Component({
  selector: 'app-progress-interactive-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellProgress, HellProgressBar],
  template: `
    <div class="grid gap-1">
      <span id="progress-storage-label" class="text-sm font-medium">Storage used</span>
      <div hellProgress aria-labelledby="progress-storage-label" [value]="value()">
        <div hellProgressBar></div>
      </div>
    </div>
    <div class="flex gap-2">
      <button hellButton size="sm" (click)="step(-10)">−10</button>
      <button hellButton size="sm" (click)="step(10)">+10</button>
      <span class="ml-auto">{{ value() }}%</span>
    </div>
  `,
})
export class ProgressInteractiveExample {
  protected readonly value = signal(40);
  protected step(d: number) {
    this.value.update((v) => Math.max(0, Math.min(100, v + d)));
  }
}
