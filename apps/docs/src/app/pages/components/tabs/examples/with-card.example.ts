import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_CARD_IMPORTS } from '@hell-ui/angular/card';
import { HellChip } from '@hell-ui/angular/chip';
import { HELL_TABS_IMPORTS } from '@hell-ui/angular/tabs';

@Component({
  selector: 'app-tabs-with-card-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_CARD_IMPORTS, HellChip, ...HELL_TABS_IMPORTS],
  template: `
    <div hellCard>
      <div hellCardHeader>
        Server-04
        <span hellChip variant="success">Running</span>
      </div>
      <div hellCardBody>
        <div hellTabset value="metrics">
          <div hellTabList aria-label="Server detail sections">
            <button hellTab value="metrics">Metrics</button>
            <button hellTab value="processes">Processes</button>
            <button hellTab value="logs">Logs</button>
          </div>
          <div hellTabPanel value="metrics" class="pt-4">
            CPU 34%, memory 61%, disk 128 GB free.
          </div>
          <div hellTabPanel value="processes" class="pt-4">
            12 processes running, 0 zombie, load average 1.2.
          </div>
          <div hellTabPanel value="logs" class="pt-4">
            Last error 3 days ago. Showing the most recent 200 lines.
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TabsWithCardExample {}
