import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HellButton } from 'hell-ui/button';
import { HellToaster, HellToastService, type HellToasterUi } from 'hell-ui/toast';

@Component({
  selector: 'app-toast-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // A component-scoped service + local toaster keeps these styled toasts out of
  // the app's global bottom-right toaster.
  providers: [HellToastService],
  imports: [HellButton, HellToaster],
  template: `
    <div class="flex flex-wrap gap-2">
      <button hellButton variant="ghost" type="button" (click)="promote()">
        Promote to production
      </button>
      <button hellButton variant="ghost" type="button" (click)="burst()">Send a few</button>
    </div>

    <hell-toaster position="top-center" [ui]="ui" />
  `,
})
export class ToastStylingExample {
  protected readonly svc = inject(HellToastService);

  protected readonly ui: HellToasterUi = {
    root: '[--hell-toaster-w:380px]',
    region: 'rounded-hell-xl',
    viewport: 'pe-hell-3',
    list: 'px-px',
    toast: 'rounded-hell-xl border-hell-primary/40 bg-hell-primary-soft shadow-hell-lg',
    glyph: 'text-hell-primary',
    body: 'gap-hell-1',
    title: 'text-hell-primary',
    description: 'text-hell-foreground',
    action: 'rounded-hell-md border-hell-primary bg-hell-primary text-hell-foreground-inverse',
    close: 'rounded-hell-md data-hover:text-hell-danger',
    toolbar: 'gap-hell-2',
    dismissAll: 'rounded-hell-md border-hell-primary text-hell-primary',
  };

  protected promote() {
    this.svc.success('Promoted to production', {
      description: 'release-42 is now live for all users.',
      duration: 0,
      action: { label: 'View', onClick: (dismiss) => dismiss() },
    });
  }

  protected burst() {
    this.svc.info('Cache warmed', { description: 'Edge nodes are serving fresh content.', duration: 0 });
    this.svc.warning('Old release retained', { description: 'release-41 kept for rollback.', duration: 0 });
  }
}
