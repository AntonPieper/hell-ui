import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HellButton } from 'hell-ui/button';
import { HellToastService } from 'hell-ui/toast';

@Component({
  selector: 'app-toast-action-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton],
  template: `
    <button hellButton variant="danger" type="button" (click)="moveToTrash()">
      Move to trash
    </button>
  `,
})
export class ToastActionExample {
  protected readonly svc = inject(HellToastService);

  protected moveToTrash() {
    this.svc.message('Moved to trash', {
      description: '“Roadmap Q4”',
      duration: 6000,
      action: {
        label: 'Undo',
        onClick: (dismiss) => {
          dismiss();
          this.svc.success('Restored', { description: '“Roadmap Q4” is back where it was.' });
        },
      },
    });
  }
}
