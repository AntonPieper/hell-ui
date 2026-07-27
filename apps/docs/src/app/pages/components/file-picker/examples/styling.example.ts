import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidPaperclip } from '@ng-icons/font-awesome/solid';

import { HellFilePicker } from 'hell-ui/file-picker';
import { HellIcon } from 'hell-ui/icon';

@Component({
  selector: 'app-file-picker-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellFilePicker, HellIcon],
  providers: [provideIcons({ faSolidPaperclip })],
  template: `
    <!-- before:hidden drops the built-in drop glyph so this host can project
         its own icon; every other refinement is ordinary root styling. -->
    <div
      hellFilePicker
      aria-label="Add compact attachments"
      ui="min-h-hell-20 flex-row items-center justify-start gap-hell-3 rounded-hell-md border-hell-info bg-hell-info-soft p-hell-4 text-left text-hell-info-strong before:hidden data-[dragging=true]:border-hell-primary data-[dragging=true]:bg-hell-primary-soft"
    >
      <hell-icon name="faSolidPaperclip" size="20px" class="shrink-0" />
      <span class="grid gap-hell-1">
        <strong>Compact attachment target</strong>
        <span class="hd-muted">The host remains the only Public Part.</span>
      </span>
    </div>
  `,
})
export class FilePickerStylingExample {}
