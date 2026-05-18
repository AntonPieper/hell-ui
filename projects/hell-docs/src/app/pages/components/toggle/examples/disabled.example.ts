import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellToggle, HellToggleGroup, HellToggleGroupItem } from '@hell-ui/angular/toggle';

@Component({
  selector: 'app-toggle-disabled-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellToggle, HellToggleGroup, HellToggleGroupItem],
  template: `
    <button hellToggle disabled type="button">Disabled</button>
    <div hellToggleGroup disabled>
      <button hellToggleGroupItem value="a" type="button">A</button>
      <button hellToggleGroupItem value="b" type="button">B</button>
    </div>
  `,
})
export class ToggleDisabledExample {
  protected readonly bold = signal(false);
  protected readonly italic = signal(false);
  protected readonly underline = signal(false);
  protected readonly align = signal<string[]>(['left']);
  protected readonly tools = signal<string[]>(['bold']);
}
