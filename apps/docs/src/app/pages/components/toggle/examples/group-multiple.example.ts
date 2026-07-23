import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HellToggleGroup, HellToggleGroupItem, type HellToggleGroupValue } from '@hell-ui/angular/toggle';

@Component({
  selector: 'app-toggle-group-multiple-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellToggleGroup, HellToggleGroupItem],
  template: `
    <div hellToggleGroup type="multiple" [(value)]="tools" aria-label="Text formatting">
      <button hellToggleGroupItem value="bold" type="button"><strong>B</strong></button>
      <button hellToggleGroupItem value="italic" type="button"><em>I</em></button>
      <button hellToggleGroupItem value="underline" type="button"><u>U</u></button>
    </div>
    <p class="mt-2 text-sm text-hell-foreground-muted">
      Active: <code>{{ active() }}</code>
    </p>
  `,
})
export class ToggleGroupMultipleExample {
  // In type="multiple" mode the group always commits a readonly string array.
  protected readonly tools = signal<HellToggleGroupValue>(['bold']);
  protected readonly active = computed(() => {
    const tools = this.tools();
    return (Array.isArray(tools) ? tools.join(', ') : '') || 'none';
  });
}
