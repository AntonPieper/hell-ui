import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidBan,
  faSolidCircleCheck,
  faSolidCircleExclamation,
  faSolidFileImage,
  faSolidFileLines,
  faSolidFilePdf,
  faSolidLayerGroup,
  faSolidTriangleExclamation,
  faSolidWeightHanging,
} from '@ng-icons/font-awesome/solid';

import {
  HellFilePicker,
  type HellFileRejectionReason,
  type HellFileSelection,
  type HellFileValidator,
} from 'hell-ui/file-picker';
import { HellIcon } from 'hell-ui/icon';

const FILE_PICKER_VALIDATION_ICONS = {
  faSolidBan,
  faSolidCircleCheck,
  faSolidCircleExclamation,
  faSolidFileImage,
  faSolidFileLines,
  faSolidFilePdf,
  faSolidLayerGroup,
  faSolidTriangleExclamation,
  faSolidWeightHanging,
};

@Component({
  selector: 'app-file-picker-validation-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellFilePicker, HellIcon],
  providers: [provideIcons(FILE_PICKER_VALIDATION_ICONS)],
  template: `
    <div
      hellFilePicker
      accept=".pdf,image/*"
      [maxBytes]="maxBytes"
      [maxFiles]="2"
      [validate]="validate"
      aria-label="Add review files"
      aria-describedby="file-picker-validation-hint"
      (selection)="selection.set($event)"
    >
      <strong class="text-hell-foreground">Choose up to two review files</strong>
      <span id="file-picker-validation-hint" class="hd-muted">
        PDF or image, at most 5 MB each; names containing “draft” are blocked
      </span>
    </div>

    @if (selection(); as result) {
      <div class="grid gap-hell-3 text-sm" data-file-picker-result>
        <section class="grid gap-hell-2">
          <strong class="flex items-center gap-hell-2">
            <hell-icon name="faSolidCircleCheck" size="16px" class="text-hell-success" />
            Accepted ({{ result.accepted.length }})
          </strong>
          @if (result.accepted.length) {
            <ul class="m-0 grid list-none gap-hell-1 p-0">
              @for (file of result.accepted; track file) {
                <li
                  class="flex min-w-0 items-center gap-hell-2 rounded-hell-md border border-solid border-hell-success/40 bg-hell-success-soft px-hell-3 py-hell-2"
                >
                  <hell-icon
                    [name]="fileIcon(file)"
                    size="16px"
                    class="shrink-0 text-hell-success-strong"
                  />
                  <span class="min-w-0 flex-1 truncate">{{ file.name }}</span>
                </li>
              }
            </ul>
          } @else {
            <p class="m-0 hd-muted">None</p>
          }
        </section>

        <section class="grid gap-hell-2">
          <strong class="flex items-center gap-hell-2">
            <hell-icon name="faSolidTriangleExclamation" size="16px" class="text-hell-danger" />
            Rejected ({{ result.rejected.length }})
          </strong>
          @if (result.rejected.length) {
            <ul class="m-0 grid list-none gap-hell-1 p-0" data-file-picker-rejections>
              @for (rejection of result.rejected; track rejection.file) {
                <li
                  class="flex min-w-0 items-start gap-hell-2 rounded-hell-md border border-solid border-hell-danger/40 bg-hell-danger-soft px-hell-3 py-hell-2"
                  [attr.data-reason]="rejection.reason"
                >
                  <hell-icon
                    [name]="reasonIcon(rejection.reason)"
                    size="16px"
                    class="mt-hell-1 shrink-0 text-hell-danger"
                  />
                  <span class="grid min-w-0 gap-hell-1">
                    <span class="truncate font-medium">{{ rejection.file.name }}</span>
                    <span class="hd-muted">{{ rejection.reason }}: {{ rejection.message }}</span>
                  </span>
                </li>
              }
            </ul>
          } @else {
            <p class="m-0 hd-muted">None</p>
          }
        </section>
      </div>
    }
  `,
})
export class FilePickerValidationExample {
  protected readonly maxBytes = 5 * 1024 * 1024;
  protected readonly selection = signal<HellFileSelection | null>(null);
  protected readonly validate: HellFileValidator = (file) =>
    file.name.toLowerCase().includes('draft') ? 'Draft files are not ready for review' : null;

  /** Picks a decorative glyph from the browser-reported type and the name. */
  protected fileIcon(file: File): string {
    if (file.type.startsWith('image/')) return 'faSolidFileImage';
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      return 'faSolidFilePdf';
    }
    return 'faSolidFileLines';
  }

  /** Maps the structured rejection reason onto a decorative glyph. */
  protected reasonIcon(reason: HellFileRejectionReason): string {
    switch (reason) {
      case 'type':
        return 'faSolidBan';
      case 'size':
        return 'faSolidWeightHanging';
      case 'count':
        return 'faSolidLayerGroup';
      case 'custom':
        return 'faSolidCircleExclamation';
    }
  }
}
