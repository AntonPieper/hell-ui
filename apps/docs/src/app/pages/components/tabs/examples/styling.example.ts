import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_TABS_IMPORTS } from 'hell-ui/tabs';

@Component({
  selector: 'app-tabs-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_TABS_IMPORTS],
  template: `
    <!-- Every tabs directive owns a single 'root' part — refine each -->
    <!-- directive's own ui input rather than styling descendants from hellTabset. -->
    <div hellTabset value="open" [ui]="tabsetUi">
      <div hellTabList ui="rounded-hell-lg bg-hell-primary-soft p-hell-1" aria-label="Ticket queues">
        <button
          hellTab
          value="open"
          ui="rounded-hell-md text-hell-primary data-active:bg-hell-surface-elevated data-active:text-hell-primary data-active:border-transparent"
        >
          Open
        </button>
        <button
          hellTab
          value="closed"
          [ui]="{
            root: 'rounded-hell-md text-hell-primary data-active:bg-hell-surface-elevated data-active:text-hell-primary data-active:border-transparent',
          }"
        >
          Closed
        </button>
      </div>
      <div hellTabPanel value="open" ui="rounded-hell-md bg-hell-surface-subtle px-hell-4">
        14 tickets waiting on a response.
      </div>
      <div hellTabPanel value="closed" ui="rounded-hell-md bg-hell-surface-subtle px-hell-4">
        Resolved in the last 30 days.
      </div>
    </div>
  `,
})
export class TabsStylingExample {
  protected readonly tabsetUi = {
    root: 'gap-hell-3',
  };
}
