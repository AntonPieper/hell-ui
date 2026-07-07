import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellToggle } from '@hell-ui/angular/toggle';

@Component({
  selector: 'app-toggle-sizes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellToggle],
  template: `
    <button hellToggle size="xs" type="button" [selected]="selected()" (selectedChange)="selected.set($event)">
      XS
    </button>
    <button hellToggle size="sm" type="button" [selected]="selected()" (selectedChange)="selected.set($event)">
      Small
    </button>
    <button hellToggle size="md" type="button" [selected]="selected()" (selectedChange)="selected.set($event)">
      Medium
    </button>
    <button hellToggle size="lg" type="button" [selected]="selected()" (selectedChange)="selected.set($event)">
      Large
    </button>
    <button hellToggle size="xl" type="button" [selected]="selected()" (selectedChange)="selected.set($event)">
      XL
    </button>
  `,
})
export class ToggleSizesExample {
  protected readonly selected = signal(true);
}
