import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_CARD_DIRECTIVES, HellButton } from 'hell';

@Component({
  selector: 'app-card-without-header-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_CARD_DIRECTIVES, HellButton],
  template: `
    <div hellCard>
      <div hellCardBody>
        A plain body. No header, no footer — just a surface that groups content.
      </div>
    </div>
    <div hellCard [elevation]="2">
      <div hellCardBody class="flex flex-col gap-2">
        <strong>Quick stat</strong>
        <span class="text-3xl font-semibold">128</span>
        <span class="hd-muted text-xs">Active sessions</span>
      </div>
    </div>
    <div hellCard>
      <div hellCardBody class="flex items-center justify-between gap-3">
        <span>Enable analytics</span>
        <button hellButton variant="primary" size="sm">Enable</button>
      </div>
    </div>
  `,
})
export class CardWithoutHeaderExample {}
