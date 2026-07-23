import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellChip } from 'hell-ui/chip';

@Component({
  selector: 'app-chip-variants-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellChip],
  template: `
    <span hellChip>Default</span>
    <span hellChip variant="primary">Primary</span>
    <span hellChip variant="success">Success</span>
    <span hellChip variant="info">Info</span>
    <span hellChip variant="warning">Warning</span>
    <span hellChip variant="danger">Danger</span>
  `,
})
export class ChipVariantsExample {}
