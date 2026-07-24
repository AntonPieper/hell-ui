import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HellButton } from 'hell-ui/button';
import { HellToaster, HellToastService, type HellToastPosition } from 'hell-ui/toast';

const PLACEMENTS: readonly HellToastPosition[] = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];

@Component({
  selector: 'app-toast-placement-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // A component-scoped service + local toaster keeps the placement demo out of
  // the app's global bottom-right toaster.
  providers: [HellToastService],
  imports: [HellButton, HellToaster],
  template: `
    <div class="grid w-fit grid-cols-3 gap-2">
      @for (placement of placements; track placement) {
        <button
          hellButton
          [variant]="placement === position() ? 'primary' : 'ghost'"
          type="button"
          (click)="showAt(placement)"
        >
          {{ placement }}
        </button>
      }
    </div>

    <hell-toaster [position]="position()" />
  `,
})
export class ToastPlacementExample {
  private readonly svc = inject(HellToastService);
  private count = 0;

  protected readonly placements = PLACEMENTS;
  protected readonly position = signal<HellToastPosition>('bottom-right');

  protected showAt(placement: HellToastPosition): void {
    if (this.position() !== placement) {
      this.svc.dismissAll();
      this.count = 0;
      this.position.set(placement);
    }
    this.count += 1;
    this.svc.info(`Draft saved #${this.count}`, {
      description: `Anchored to ${placement}.`,
      duration: 0,
    });
  }
}
