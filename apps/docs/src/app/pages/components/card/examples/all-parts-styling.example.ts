import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_CARD_IMPORTS } from '@hell-ui/angular/card';

@Component({
  selector: 'app-card-all-parts-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_CARD_IMPORTS],
  template: `
    <!-- Every card directive owns a single 'root' part — refine each -->
    <!-- directive's own ui input rather than styling descendants from hellCard. -->
    <div
      hellCard
      class="max-w-95"
      [elevation]="2"
      ui="rounded-hell-xl border-hell-primary bg-hell-primary-soft"
    >
      <div
        hellCardHeader
        ui="rounded-t-hell-xl border-hell-primary bg-hell-primary text-hell-foreground-inverse"
      >
        <strong>Deployment pipeline</strong>
      </div>
      <div hellCardBody [ui]="{ root: 'bg-hell-surface-elevated text-hell-foreground' }">
        Three environments are currently green. Staging has been queued for 4 minutes.
      </div>
      <div
        hellCardFooter
        ui="rounded-b-hell-xl border-hell-primary bg-hell-primary-soft justify-between"
      >
        <span class="text-hell-primary text-xs font-semibold">Updated 2m ago</span>
        <span class="text-hell-primary text-xs font-semibold">3 / 4 healthy</span>
      </div>
    </div>
  `,
})
export class CardAllPartsStylingExample {}
