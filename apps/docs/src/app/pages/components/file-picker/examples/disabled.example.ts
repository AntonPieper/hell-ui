import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidBan, faSolidCloudArrowUp } from '@ng-icons/font-awesome/solid';

import { HellButton } from 'hell-ui/button';
import { HellFilePicker } from 'hell-ui/file-picker';
import { HellIcon } from 'hell-ui/icon';

@Component({
  selector: 'app-file-picker-disabled-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellFilePicker, HellIcon],
  providers: [provideIcons({ faSolidBan, faSolidCloudArrowUp })],
  template: `
    <button
      hellButton
      type="button"
      size="sm"
      class="justify-self-start"
      (click)="disabled.set(!disabled())"
    >
      <hell-icon [name]="disabled() ? 'faSolidCloudArrowUp' : 'faSolidBan'" />
      {{ disabled() ? 'Enable' : 'Disable' }} picker
    </button>

    <div
      hellFilePicker
      [disabled]="disabled()"
      aria-label="Add files"
      (selection)="selectionCount.set(selectionCount() + 1)"
    >
      <strong class="text-hell-foreground">
        {{ disabled() ? 'File selection is disabled' : 'Drop or browse' }}
      </strong>
      <span class="hd-muted">Selection events: {{ selectionCount() }}</span>
    </div>
  `,
})
export class FilePickerDisabledExample {
  protected readonly disabled = signal(true);
  protected readonly selectionCount = signal(0);
}
