import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellButton, HellProgress, HellProgressBar } from '@hell-ui/angular/primitives';

@Component({
  selector: 'app-progress-examples-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellProgress, HellProgressBar],
  template: `
    <div hellProgress [value]="0"><div hellProgressBar></div></div>
    <div hellProgress [value]="33"><div hellProgressBar></div></div>
    <div hellProgress [value]="66"><div hellProgressBar></div></div>
    <div hellProgress [value]="100"><div hellProgressBar></div></div>
  `,
})
export class ProgressExamplesExample {
  protected readonly value = signal(40);
  protected step(d: number) {
    this.value.update((v) => Math.max(0, Math.min(100, v + d)));
  }
}
