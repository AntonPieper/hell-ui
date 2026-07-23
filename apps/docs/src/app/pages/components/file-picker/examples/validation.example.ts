import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import {
  HellFilePicker,
  type HellFileSelection,
  type HellFileValidator,
} from 'hell-ui/file-picker';

@Component({
  selector: 'app-file-picker-validation-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellFilePicker],
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
      <strong>Choose up to two review files</strong>
      <span id="file-picker-validation-hint" class="hd-muted">
        PDF or image, at most 5 MB each; names containing “draft” are blocked
      </span>
    </div>

    @if (selection(); as result) {
      <div class="grid gap-hell-3 text-sm" data-file-picker-result>
        <section>
          <strong>Accepted ({{ result.accepted.length }})</strong>
          @if (result.accepted.length) {
            <ul class="hd-muted">
              @for (file of result.accepted; track file) {
                <li>{{ file.name }}</li>
              }
            </ul>
          } @else {
            <p class="hd-muted">None</p>
          }
        </section>

        <section>
          <strong>Rejected ({{ result.rejected.length }})</strong>
          @if (result.rejected.length) {
            <ul class="hd-muted" data-file-picker-rejections>
              @for (rejection of result.rejected; track rejection.file) {
                <li [attr.data-reason]="rejection.reason">
                  {{ rejection.file.name }} &mdash; {{ rejection.reason }}:
                  {{ rejection.message }}
                </li>
              }
            </ul>
          } @else {
            <p class="hd-muted">None</p>
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
}
