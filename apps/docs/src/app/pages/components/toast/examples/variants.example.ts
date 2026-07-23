import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HellButton } from 'hell-ui/button';
import { HellToastService } from 'hell-ui/toast';

@Component({
  selector: 'app-toast-variants-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton],
  template: `
    <button
      hellButton
      variant="ghost"
      type="button"
      (click)="svc.message('Saved as draft', { description: 'Your changes are stored locally.' })"
    >
      Default
    </button>
    <button
      hellButton
      variant="ghost"
      type="button"
      (click)="svc.success('Invoice sent', { description: 'INV-2043 was emailed to the client.' })"
    >
      Success
    </button>
    <button
      hellButton
      variant="ghost"
      type="button"
      (click)="svc.info('Sync running', { description: 'Refreshing your library in the background.' })"
    >
      Info
    </button>
    <button
      hellButton
      variant="ghost"
      type="button"
      (click)="svc.warning('Storage almost full', { description: '92% of your quota is used.' })"
    >
      Warning
    </button>
    <button
      hellButton
      variant="ghost"
      type="button"
      (click)="svc.error('Upload failed', { description: 'Network unreachable. We will retry shortly.' })"
    >
      Danger
    </button>
  `,
})
export class ToastVariantsExample {
  protected readonly svc = inject(HellToastService);
}
