import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_TABS_DIRECTIVES, type HellTabsetUi } from '@hell-ui/angular/tabs';

@Component({
  selector: 'app-tabs-vertical-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_TABS_DIRECTIVES],
  template: `
    <div hellTabset value="a" orientation="vertical" [activateOnFocus]="false" [ui]="tabsetUi">
      <div hellTabList aria-label="Manual content sections">
        <button hellTab value="a">Section A</button>
        <button hellTab value="b">Section B</button>
        <button hellTab value="c">Section C</button>
      </div>
      <div class="hd-fill">
        <div hellTabPanel value="a">Content A</div>
        <div hellTabPanel value="b">Content B</div>
        <div hellTabPanel value="c">Content C</div>
      </div>
    </div>
  `,
})
export class TabsVerticalExample {
  protected readonly tabsetUi = {
    root: 'gap-hell-6',
  } satisfies HellTabsetUi;
}
