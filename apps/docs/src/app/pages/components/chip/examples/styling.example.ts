import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  HellChip,
  HellChipRemove,
  HellChipSet,
  type HellChipRemoveUi,
  type HellChipUi,
} from '@hell-ui/angular/chip';

@Component({
  selector: 'app-chip-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellChipSet, HellChip, HellChipRemove],
  template: `
    <div hellChipSet ui="gap-hell-3" aria-label="Tags">
      <span hellChip [ui]="chipUi" [label]="'Design'">
        Design
        <button hellChipRemove [ui]="removeUi">×</button>
      </span>
      <span hellChip [ui]="chipUi" [label]="'Research'">
        Research
        <button hellChipRemove [ui]="removeUi">×</button>
      </span>
    </div>
  `,
})
export class ChipStylingExample {
  protected readonly chipUi = {
    root: 'rounded-hell-md bg-hell-primary text-hell-primary-foreground',
  } satisfies HellChipUi;

  protected readonly removeUi = {
    root: 'hover:bg-white/25',
  } satisfies HellChipRemoveUi;
}
