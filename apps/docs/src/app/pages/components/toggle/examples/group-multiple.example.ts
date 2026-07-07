import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellToggleGroup, HellToggleGroupItem } from '@hell-ui/angular/toggle';

@Component({
  selector: 'app-toggle-group-multiple-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellToggleGroup, HellToggleGroupItem],
  template: `
    <div hellToggleGroup type="multiple" [value]="tools()" (valueChange)="tools.set($event)" aria-label="Text formatting">
      <button hellToggleGroupItem value="bold" type="button"><strong>B</strong></button>
      <button hellToggleGroupItem value="italic" type="button"><em>I</em></button>
      <button hellToggleGroupItem value="underline" type="button"><u>U</u></button>
    </div>
    <p class="mt-2 text-sm text-hell-foreground-muted">
      Active: <code>{{ tools().join(', ') || 'none' }}</code>
    </p>
  `,
})
export class ToggleGroupMultipleExample {
  protected readonly tools = signal<string[]>(['bold']);
}
