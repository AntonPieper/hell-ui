import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellSeparator } from '@hell-ui/angular/separator';

@Component({
  selector: 'app-separator-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSeparator],
  template: `
    <p class="m-0">Default hairline</p>
    <div hellSeparator></div>
    <p class="m-0">Accent divider via <code>ui</code> shorthand</p>
    <div hellSeparator ui="h-[2px] rounded-full bg-hell-primary"></div>
    <p class="m-0">Strong divider via the part map</p>
    <div hellSeparator [ui]="{ root: 'h-[2px] bg-hell-border-strong' }"></div>
  `,
})
export class SeparatorStylingExample {}
