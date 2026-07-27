import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidFileImage,
  faSolidFileLines,
  faSolidFilePdf,
  faSolidFileZipper,
  faSolidFolderOpen,
} from '@ng-icons/font-awesome/solid';

import { HellButton } from 'hell-ui/button';
import {
  HellFilePicker,
  type HellFileSelection,
} from 'hell-ui/file-picker';
import { HellIcon } from 'hell-ui/icon';

const FILE_PICKER_BASIC_ICONS = {
  faSolidFileImage,
  faSolidFileLines,
  faSolidFilePdf,
  faSolidFileZipper,
  faSolidFolderOpen,
};

@Component({
  selector: 'app-file-picker-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellFilePicker, HellIcon],
  providers: [provideIcons(FILE_PICKER_BASIC_ICONS)],
  template: `
    <!-- The picker root renders its own decorative drop glyph, so the projected
         copy only has to carry the two acquisition affordances. -->
    <div
      hellFilePicker
      #picker="hellFilePicker"
      aria-label="Add attachments"
      aria-describedby="file-picker-basic-hint"
      (selection)="selection.set($event)"
    >
      <strong class="text-hell-foreground">Drop attachments here</strong>
      <span id="file-picker-basic-hint" class="hd-muted">or activate this area to browse</span>
    </div>

    <button hellButton type="button" size="sm" class="justify-self-start" (click)="picker.open()">
      <hell-icon name="faSolidFolderOpen" />
      Browse from a separate action
    </button>

    @if (selection(); as result) {
      <div class="grid gap-hell-2 text-sm" data-file-picker-result>
        <strong>{{ result.accepted.length }} accepted</strong>
        @if (result.accepted.length) {
          <ul class="m-0 grid list-none gap-hell-1 p-0">
            @for (file of result.accepted; track file) {
              <li
                class="flex min-w-0 items-center gap-hell-2 rounded-hell-md border border-solid border-hell-border bg-hell-surface-subtle px-hell-3 py-hell-2"
              >
                <hell-icon
                  [name]="fileIcon(file)"
                  size="16px"
                  class="shrink-0 text-hell-foreground-muted"
                />
                <span class="min-w-0 flex-1 truncate">{{ file.name }}</span>
                <span class="shrink-0 text-xs text-hell-foreground-muted">
                  {{ file.size }} bytes
                </span>
              </li>
            }
          </ul>
        }
      </div>
    }
  `,
})
export class FilePickerBasicExample {
  protected readonly selection = signal<HellFileSelection | null>(null);

  /** Picks a decorative glyph from the browser-reported type and the name. */
  protected fileIcon(file: File): string {
    const name = file.name.toLowerCase();
    if (file.type.startsWith('image/')) return 'faSolidFileImage';
    if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'faSolidFilePdf';
    if (/\.(zip|tar|gz|7z|rar)$/.test(name)) return 'faSolidFileZipper';
    return 'faSolidFileLines';
  }
}
