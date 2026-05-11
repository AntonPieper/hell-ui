import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellToggle, HellToggleGroup, HellToggleGroupItem } from 'hell/primitives';

@Component({
  selector: 'app-toggle-single-toggle-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellToggle],
  template: `
    <button hellToggle [selected]="bold()" (selectedChange)="bold.set($event)" type="button">
      <strong>B</strong>
    </button>
    <button hellToggle [selected]="italic()" (selectedChange)="italic.set($event)" type="button">
      <em>I</em>
    </button>
    <button
      hellToggle
      [selected]="underline()"
      (selectedChange)="underline.set($event)"
      type="button"
    >
      <u>U</u>
    </button>
    <p>State: bold={{ bold() }} italic={{ italic() }} underline={{ underline() }}</p>
  `,
})
export class ToggleSingleToggleExample {
  protected readonly bold = signal(false);
  protected readonly italic = signal(false);
  protected readonly underline = signal(false);
  protected readonly align = signal<string[]>(['left']);
  protected readonly tools = signal<string[]>(['bold']);
}
