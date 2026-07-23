import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellChip, HellChipRemove, HellChipSet } from 'hell-ui/chip';

@Component({
  selector: 'app-chip-disabled-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellChipSet, HellChip, HellChipRemove],
  template: `
    <div hellChipSet aria-label="Capabilities">
      <span hellChip>
        Billing
        <button hellChipRemove></button>
      </span>
      <span hellChip disabled>
        Read only
        <button hellChipRemove></button>
      </span>
    </div>
  `,
})
export class ChipDisabledExample {}
