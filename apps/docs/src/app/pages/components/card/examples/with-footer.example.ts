import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_CARD_DIRECTIVES, type HellCardUi } from '@hell-ui/angular/card';
import { HellButton } from '@hell-ui/angular/button';

@Component({
  selector: 'app-card-with-footer-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_CARD_DIRECTIVES, HellButton],
  template: `
    <div hellCard class="max-w-95" [ui]="cardUi">
      <div hellCardHeader><strong>Delete project</strong></div>
      <div hellCardBody>This action is permanent. All data and history will be removed.</div>
      <div hellCardFooter>
        <button hellButton variant="ghost">Cancel</button>
        <button hellButton variant="danger">Delete</button>
      </div>
    </div>
  `,
})
export class CardWithFooterExample {
  protected readonly cardUi = {
    root: 'rounded-hell-xl',
  } satisfies HellCardUi;
}
