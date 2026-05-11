import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_CARD_DIRECTIVES, HellButton } from 'hell/primitives';

@Component({
  selector: 'app-card-examples-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_CARD_DIRECTIVES],
  template: `
    <div hellCard [elevation]="0">
      <div hellCardHeader><strong>Flat</strong></div>
      <div hellCardBody>elevation = 0</div>
    </div>
    <div hellCard [elevation]="1">
      <div hellCardHeader><strong>Default</strong></div>
      <div hellCardBody>elevation = 1</div>
    </div>
    <div hellCard [elevation]="2">
      <div hellCardHeader><strong>Raised</strong></div>
      <div hellCardBody>elevation = 2</div>
    </div>
    <div hellCard [elevation]="3">
      <div hellCardHeader><strong>Floating</strong></div>
      <div hellCardBody>elevation = 3</div>
    </div>
  `,
})
export class CardExamplesExample {}
