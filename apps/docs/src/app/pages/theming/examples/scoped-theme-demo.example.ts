import { Component } from '@angular/core';
import { HELL_CARD_IMPORTS } from 'hell-ui/card';
import { HellButton } from 'hell-ui/button';
import { HellChip } from 'hell-ui/chip';

@Component({
  selector: 'app-themed-panel-demo',
  imports: [HellButton, HellChip, ...HELL_CARD_IMPORTS],
  template: `
    <section
      hellCard
      class="grid gap-3"
      style="
        --color-hell-primary: #155e75;
        --color-hell-primary-hover: #164e63;
        --color-hell-primary-active: #083344;
        --color-hell-primary-soft: #cffafe;
        --color-hell-primary-soft-foreground: #164e63;
        --radius-hell-md: 10px;
      "
    >
      <div hellCardHeader>
        <div class="flex items-center justify-between gap-3">
          <strong>Billing panel</strong>
          <span hellChip variant="info">Scoped theme</span>
        </div>
      </div>
      <div hellCardBody class="grid gap-3">
        <p class="m-0 text-sm text-hell-foreground-muted">
          Local CSS variables retheme children without changing global tokens.
        </p>
        <div class="flex gap-2">
          <button hellButton variant="primary">Approve</button>
          <button hellButton variant="soft">Review</button>
        </div>
      </div>
    </section>
  `,
})
export class ThemedPanelDemo {}
