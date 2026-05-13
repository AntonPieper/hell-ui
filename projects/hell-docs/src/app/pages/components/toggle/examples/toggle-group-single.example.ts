import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellToggle, HellToggleGroup, HellToggleGroupItem } from '@hell-ui/angular/primitives';

@Component({
  selector: 'app-toggle-toggle-group-single-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellToggleGroup, HellToggleGroupItem],
  template: `
    <div hellToggleGroup type="single" [value]="align()" (valueChange)="align.set($event)">
      <button hellToggleGroupItem value="left" type="button">Left</button>
      <button hellToggleGroupItem value="center" type="button">Center</button>
      <button hellToggleGroupItem value="right" type="button">Right</button>
    </div>
    <p class="mt-2">
      Selected: <code>{{ align().join(', ') || 'none' }}</code>
    </p>
  `,
})
export class ToggleToggleGroupSingleExample {
  protected readonly bold = signal(false);
  protected readonly italic = signal(false);
  protected readonly underline = signal(false);
  protected readonly align = signal<string[]>(['left']);
  protected readonly tools = signal<string[]>(['bold']);
}
