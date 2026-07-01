import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellDropZone } from '@hell-ui/angular/drop-zone';

@Component({
  selector: 'app-drop-zone-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDropZone],
  template: `
    <!-- ui refines the drop zone's root Public Part; behavior stays intact. -->
    <div
      hellDropzone
      ui="rounded-hell-lg border-2 border-dashed border-hell-primary bg-hell-primary-soft/40"
      (files)="onFiles($event)"
    >
      <strong>Drop invoices here</strong>
      <span class="hd-muted">PDF or CSV</span>
    </div>
    @if (files().length) {
      <p class="hd-muted">Picked {{ files().length }} file(s)</p>
    }
  `,
})
export class DropZoneStylingExample {
  protected readonly files = signal<File[]>([]);
  protected onFiles(files: File[]) {
    this.files.set(files);
  }
}
