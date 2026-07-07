import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellDropZone, type HellDropZoneUi } from '@hell-ui/angular/drop-zone';

@Component({
  selector: 'app-drop-zone-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDropZone],
  template: `
    <!-- ui string shorthand refines the single root Public Part. -->
    <div
      hellDropzone
      ui="rounded-hell-lg border-2 border-hell-primary bg-hell-primary-soft/40 p-hell-6 text-hell-primary"
      (files)="onFiles($event)"
    >
      <strong>Drop invoices here</strong>
      <span class="hd-muted">PDF or CSV</span>
    </div>

    <!-- Equivalent explicit HellDropZoneUi map form. -->
    <div hellDropzone [ui]="dangerZone" (files)="onFiles($event)">
      <strong>Drop signed contracts here</strong>
      <span class="hd-muted">PDF only &mdash; legal review required</span>
    </div>

    @if (files().length) {
      <p class="hd-muted">Picked {{ files().length }} file(s)</p>
    }
  `,
})
export class DropZoneStylingExample {
  protected readonly files = signal<File[]>([]);

  protected readonly dangerZone: HellDropZoneUi = {
    root: 'rounded-hell-sm border-hell-danger bg-hell-danger-soft p-hell-6 text-hell-danger-strong',
  };

  protected onFiles(files: File[]): void {
    this.files.set(files);
  }
}
