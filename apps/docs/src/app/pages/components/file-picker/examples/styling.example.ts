import { ChangeDetectionStrategy, Component } from '@angular/core';

import { HellFilePicker } from 'hell-ui/file-picker';

@Component({
  selector: 'app-file-picker-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellFilePicker],
  template: `
    <div
      hellFilePicker
      aria-label="Add compact attachments"
      ui="min-h-hell-20 items-start rounded-hell-md border-hell-info bg-hell-info-soft p-hell-4 text-left text-hell-info-strong data-[dragging=true]:border-hell-primary data-[dragging=true]:bg-hell-primary-soft"
    >
      <strong>Compact attachment target</strong>
      <span class="hd-muted">The host remains the only Public Part.</span>
    </div>
  `,
})
export class FilePickerStylingExample {}
