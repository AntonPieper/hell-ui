import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellToggle } from '@hell-ui/angular/toggle';

@Component({
  selector: 'app-toggle-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellToggle],
  template: `
    <!-- ui shorthand: conflicting radius/padding utilities beat the recipe. -->
    <button
      hellToggle
      type="button"
      ui="rounded-hell-pill px-hell-4"
      [selected]="pill()"
      (selectedChange)="pill.set($event)"
    >
      Pill toggle
    </button>
    <!-- Equivalent explicit part map for the root part. -->
    <button
      hellToggle
      type="button"
      [ui]="{ root: 'rounded-hell-pill px-hell-4' }"
      [selected]="wide()"
      (selectedChange)="wide.set($event)"
    >
      Map form
    </button>
  `,
})
export class ToggleStylingExample {
  protected readonly pill = signal(true);
  protected readonly wide = signal(false);
}
