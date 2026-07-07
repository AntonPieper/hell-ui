import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellToastService } from '@hell-ui/angular/toast';

@Component({
  selector: 'app-toast-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton],
  template: `
    <button
      hellButton
      variant="primary"
      type="button"
      (click)="svc.success('Settings saved', { description: 'Your workspace preferences are up to date.' })"
    >
      Save settings
    </button>
  `,
})
export class ToastBasicExample {
  protected readonly svc = inject(HellToastService);
}
