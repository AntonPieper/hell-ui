import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_CARD_DIRECTIVES } from '@hell-ui/angular/card';
import { HellSeparator } from '@hell-ui/angular/separator';

@Component({
  selector: 'app-separator-vertical-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSeparator],
  template: `
    <span>Left</span>
    <div hellSeparator orientation="vertical" spacing="md"></div>
    <span>Middle</span>
    <div hellSeparator orientation="vertical" spacing="md"></div>
    <span>Right</span>
  `,
})
export class SeparatorVerticalExample {}
