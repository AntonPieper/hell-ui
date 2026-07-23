import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_CARD_IMPORTS } from 'hell-ui/card';

@Component({
  selector: 'app-card-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_CARD_IMPORTS],
  template: `
    <div hellCard class="max-w-80">
      <div hellCardHeader><strong>Invoice #4821</strong></div>
      <div hellCardBody>Due August 14 · Net 30 terms.</div>
    </div>
  `,
})
export class CardBasicExample {}
