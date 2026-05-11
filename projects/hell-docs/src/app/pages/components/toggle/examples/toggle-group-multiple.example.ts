import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellToggle, HellToggleGroup, HellToggleGroupItem } from 'hell/primitives';

@Component({
  selector: 'app-toggle-toggle-group-multiple-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellToggleGroup, HellToggleGroupItem],
  template: `
    <div hellToggleGroup type="multiple" [value]="tools()" (valueChange)="tools.set($event)">
      <button hellToggleGroupItem value="bold" type="button">Bold</button>
      <button hellToggleGroupItem value="italic" type="button">Italic</button>
      <button hellToggleGroupItem value="underline" type="button">Underline</button>
    </div>
    <p class="mt-2">
      Selected: <code>{{ tools().join(', ') || 'none' }}</code>
    </p>
  `,
})
export class ToggleToggleGroupMultipleExample {
  protected readonly bold = signal(false);
  protected readonly italic = signal(false);
  protected readonly underline = signal(false);
  protected readonly align = signal<string[]>(['left']);
  protected readonly tools = signal<string[]>(['bold']);
}
