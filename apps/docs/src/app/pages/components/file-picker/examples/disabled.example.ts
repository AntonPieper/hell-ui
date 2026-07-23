import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { HellButton } from 'hell-ui/button';
import { HellFilePicker } from 'hell-ui/file-picker';

@Component({
  selector: 'app-file-picker-disabled-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellFilePicker],
  template: `
    <button hellButton type="button" size="sm" (click)="disabled.set(!disabled())">
      {{ disabled() ? 'Enable' : 'Disable' }} picker
    </button>

    <div
      hellFilePicker
      [disabled]="disabled()"
      aria-label="Add files"
      (selection)="selectionCount.set(selectionCount() + 1)"
    >
      <strong>{{ disabled() ? 'File selection is disabled' : 'Drop or browse' }}</strong>
      <span class="hd-muted">Selection events: {{ selectionCount() }}</span>
    </div>
  `,
})
export class FilePickerDisabledExample {
  protected readonly disabled = signal(true);
  protected readonly selectionCount = signal(0);
}
