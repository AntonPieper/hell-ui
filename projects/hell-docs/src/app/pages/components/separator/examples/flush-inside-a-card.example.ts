import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_CARD_DIRECTIVES, HellSeparator } from 'hell';

@Component({
  selector: 'app-separator-flush-inside-a-card-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSeparator, ...HELL_CARD_DIRECTIVES],
  template: `
    <div hellCard class="max-w-95">
      <div hellCardHeader><strong>Settings</strong></div>
      <div hellCardBody>
        <p class="m-0">General</p>
        <div hellSeparator spacing="sm"></div>
        <p class="m-0">Notifications</p>
        <div hellSeparator spacing="sm"></div>
        <p class="m-0">Privacy</p>
      </div>
    </div>
  `,
})
export class SeparatorFlushInsideACardExample {}
