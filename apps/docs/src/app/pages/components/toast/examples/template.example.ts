import { ChangeDetectionStrategy, Component, TemplateRef, inject, viewChild } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellToastService, type HellToastRef } from '@hell-ui/angular/toast';

@Component({
  selector: 'app-toast-template-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton],
  template: `
    <button hellButton variant="primary" type="button" (click)="notify()">New comment</button>

    <ng-template #comment let-toast>
      <div class="flex items-center gap-hell-3">
        <span
          class="grid size-9 place-items-center rounded-full bg-hell-info-soft font-semibold text-hell-info-strong"
        >
          SS
        </span>
        <div class="min-w-0">
          <div class="font-semibold text-hell-foreground">Sara Severin</div>
          <div class="hd-muted">commented on “Q4 plan”</div>
        </div>
        <button hellButton size="sm" variant="primary" type="button" (click)="toast.dismiss()">
          View
        </button>
      </div>
    </ng-template>
  `,
})
export class ToastTemplateExample {
  protected readonly svc = inject(HellToastService);
  private readonly comment = viewChild.required<TemplateRef<{ $implicit: HellToastRef }>>('comment');

  protected notify() {
    this.svc.show({
      template: this.comment(),
      duration: 0,
      announcement: 'Sara Severin commented on Q4 plan',
    });
  }
}
