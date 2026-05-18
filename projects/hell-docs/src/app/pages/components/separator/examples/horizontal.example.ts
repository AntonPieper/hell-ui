import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_CARD_DIRECTIVES } from '@hell-ui/angular/card';
import { HellSeparator } from '@hell-ui/angular/separator';

@Component({
  selector: 'app-separator-horizontal-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSeparator],
  template: `
    <p class="m-0">Section A</p>
    <div hellSeparator></div>
    <p class="m-0">Section B</p>
    <div hellSeparator spacing="lg"></div>
    <p class="m-0">Section C — generous spacing</p>
  `,
})
export class SeparatorHorizontalExample {}
