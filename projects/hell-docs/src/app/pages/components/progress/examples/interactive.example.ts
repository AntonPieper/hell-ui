import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellButton, HellProgress, HellProgressBar } from 'hell';

@Component({
  selector: 'app-progress-interactive-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellProgress, HellProgressBar],
  template: `
    <div hellProgress [value]="value()"><div hellProgressBar></div></div>
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
