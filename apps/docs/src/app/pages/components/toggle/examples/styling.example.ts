import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellToggle, HellToggleGroup, HellToggleGroupItem, type HellToggleGroupValue } from '@hell-ui/angular/toggle';

@Component({
  selector: 'app-toggle-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellToggle, HellToggleGroup, HellToggleGroupItem],
  template: `
    <!-- HellToggle: ui shorthand refines its sole "root" part. -->
    <button
      hellToggle
      type="button"
      ui="rounded-hell-pill bg-hell-primary-soft px-hell-5 text-hell-primary-soft-foreground data-selected:bg-hell-danger data-selected:text-hell-foreground-inverse"
      [selected]="pill()"
      (selectedChange)="pill.set($event)"
    >
      Pill toggle
    </button>

    <!-- Equivalent explicit map form. -->
    <button hellToggle type="button" [ui]="toggleUi" [selected]="mapped()" (selectedChange)="mapped.set($event)">
      Map form
    </button>

    <!-- HellToggleGroup ("root") wrapping HellToggleGroupItem ("root") refinements. -->
    <div hellToggleGroup type="single" [(value)]="align" [ui]="groupUi">
      <button hellToggleGroupItem value="left" type="button" [ui]="itemUi">Left</button>
      <button hellToggleGroupItem value="center" type="button" [ui]="itemUi">Center</button>
      <button hellToggleGroupItem value="right" type="button" [ui]="itemUi">Right</button>
    </div>
  `,
})
export class ToggleStylingExample {
  protected readonly pill = signal(true);
  protected readonly mapped = signal(false);
  protected readonly align = signal<HellToggleGroupValue>('left');

  protected readonly toggleUi = {
    root: 'rounded-hell-xs border-hell-border-strong px-hell-6',
  };
  protected readonly groupUi = {
    root: 'gap-hell-2 rounded-hell-lg border-hell-primary bg-hell-primary-soft p-hell-2',
  };
  protected readonly itemUi = {
    root: 'rounded-hell-md text-hell-primary-soft-foreground data-selected:bg-hell-primary data-selected:text-hell-primary-foreground',
  };
}
