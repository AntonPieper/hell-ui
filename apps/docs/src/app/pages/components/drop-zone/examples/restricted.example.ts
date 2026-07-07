import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellDropZone } from '@hell-ui/angular/drop-zone';

@Component({
  selector: 'app-drop-zone-restricted-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDropZone],
  template: `
    <div hellDropzone [multiple]="false" accept="image/*,.pdf" (files)="onFiles($event)">
      <strong>Choose an avatar or ID scan</strong>
      <span class="hd-muted">PNG, JPG, WebP, or PDF &mdash; one file</span>
    </div>
    @if (file(); as picked) {
      <p class="hd-muted">Selected: {{ picked.name }}</p>
    }
  `,
})
export class DropZoneRestrictedExample {
  protected readonly file = signal<File | null>(null);

  protected onFiles(files: File[]): void {
    this.file.set(files[0] ?? null);
  }
}
