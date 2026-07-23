import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellSeparator } from 'hell-ui/separator';

@Component({
  selector: 'app-separator-all-parts-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSeparator],
  template: `
    <!-- HellSeparator exposes a single 'root' part — the hairline itself. -->
    <p class="m-0">Default hairline</p>
    <div hellSeparator></div>

    <p class="m-0">Accent divider via the <code>ui</code> shorthand</p>
    <div hellSeparator ui="h-[3px] rounded-hell-full bg-hell-primary"></div>

    <p class="m-0">Danger divider via the explicit part map</p>
    <div hellSeparator [ui]="{ root: 'h-[3px] rounded-hell-full bg-hell-danger' }"></div>
  `,
})
export class SeparatorAllPartsStylingExample {}
