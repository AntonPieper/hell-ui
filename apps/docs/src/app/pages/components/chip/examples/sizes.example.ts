import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellChip } from 'hell-ui/chip';

@Component({
  selector: 'app-chip-sizes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellChip],
  template: `
    <span hellChip size="xs" variant="primary">xs</span>
    <span hellChip size="sm" variant="primary">sm</span>
    <span hellChip size="md" variant="primary">md</span>
    <span hellChip size="lg" variant="primary">lg</span>
    <span hellChip size="xl" variant="primary">xl</span>
  `,
})
export class ChipSizesExample {}
