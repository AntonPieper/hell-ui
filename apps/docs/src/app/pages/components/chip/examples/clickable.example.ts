import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellChip } from 'hell-ui/chip';

@Component({
  selector: 'app-chip-clickable-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellChip],
  template: `
    <button type="button" hellChip variant="info" (click)="toggle()">
      {{ open() ? 'Filters: 3 active' : 'Filters: off' }}
    </button>
    <a hellChip variant="primary" href="#chip-clickable">+49 30 123456</a>
  `,
})
export class ChipClickableExample {
  protected readonly open = signal(true);

  protected toggle(): void {
    this.open.update((open) => !open);
  }
}
