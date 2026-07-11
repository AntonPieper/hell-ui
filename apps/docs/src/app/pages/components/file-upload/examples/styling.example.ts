import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  HellFileUpload,
  type HellFileUploadItem,
  type HellFileUploadUi,
} from '@hell-ui/angular/file-upload';

// The `ui` input takes a Part Style Map keyed by the twelve public parts. Here a
// compact layout tightens the list and dresses the drop zone in a dashed accent
// border — refinements merge over the recipe through Hell's Tailwind merge.
@Component({
  selector: 'app-file-upload-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellFileUpload],
  template: `
    <hell-file-upload [items]="items()" [ui]="ui" (removed)="remove($event)" />
  `,
})
export class FileUploadStylingExample {
  protected readonly ui: HellFileUploadUi = {
    dropzone: 'min-h-[96px] border-hell-primary bg-hell-primary-soft/40',
    list: 'gap-hell-1',
    item: 'p-hell-2',
    itemName: 'text-[13px]',
  };

  protected readonly items = signal<readonly HellFileUploadItem[]>([
    { id: 'a', name: 'q3-forecast.xlsx', size: 48_210, status: 'done' },
    { id: 'b', name: 'board-deck.pdf', size: 2_401_882, status: 'uploading', progress: 0.66 },
  ]);

  protected remove(id: string): void {
    this.items.update((current) => current.filter((item) => item.id !== id));
  }
}
