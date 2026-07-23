import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellChip, HellChipRemove, HellChipSet } from 'hell-ui/chip';

@Component({
  selector: 'app-chip-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellChipSet, HellChip, HellChipRemove],
  template: `
    <div hellChipSet ui="gap-hell-3" aria-label="Tags">
      <span hellChip [ui]="chipUi">
        Design
        <button hellChipRemove [ui]="removeUi"></button>
      </span>
      <span hellChip [ui]="chipUi">
        Research
        <button hellChipRemove [ui]="removeUi"></button>
      </span>
    </div>
  `,
})
export class ChipStylingExample {
  protected readonly chipUi = {
    root: 'rounded-hell-md bg-hell-primary text-hell-primary-foreground',
  };

  protected readonly removeUi = {
    root: 'hover:bg-white/25',
  };
}
