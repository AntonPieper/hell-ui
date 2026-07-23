import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { HellButton } from 'hell-ui/button';
import {
  HellFilePicker,
  type HellFileSelection,
} from 'hell-ui/file-picker';

@Component({
  selector: 'app-file-picker-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellFilePicker],
  template: `
    <div
      hellFilePicker
      #picker="hellFilePicker"
      aria-label="Add attachments"
      aria-describedby="file-picker-basic-hint"
      (selection)="selection.set($event)"
    >
      <strong>Drop attachments here</strong>
      <span id="file-picker-basic-hint" class="hd-muted">or activate this area to browse</span>
    </div>

    <button hellButton type="button" size="sm" (click)="picker.open()">
      Browse from a separate action
    </button>

    @if (selection(); as result) {
      <div class="grid gap-hell-2 text-sm" data-file-picker-result>
        <strong>{{ result.accepted.length }} accepted</strong>
        @if (result.accepted.length) {
          <ul class="hd-muted">
            @for (file of result.accepted; track file) {
              <li>{{ file.name }} &mdash; {{ file.size }} bytes</li>
            }
          </ul>
        }
      </div>
    }
  `,
})
export class FilePickerBasicExample {
  protected readonly selection = signal<HellFileSelection | null>(null);
}
