import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellAvatar } from '@hell-ui/angular/avatar';
import { HellButton } from '@hell-ui/angular/button';
import { HELL_CARD_IMPORTS } from '@hell-ui/angular/card';
import { HellSkeleton } from '@hell-ui/angular/skeleton';

@Component({
  selector: 'app-skeleton-with-card-avatar-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_CARD_IMPORTS, HellAvatar, HellButton, HellSkeleton],
  template: `
    <div hellCard class="max-w-95" [elevation]="2" [attr.aria-busy]="loading()">
      <div hellCardHeader>
        @if (loading()) {
          <div class="flex items-center gap-3">
            <div hellSkeleton shape="circle" class="size-8"></div>
            <div hellSkeleton class="h-3 w-32"></div>
          </div>
        } @else {
          <div class="flex items-center gap-3">
            <hell-avatar fallback="MK" />
            <span>Mira Khatri</span>
          </div>
        }
      </div>
      <div hellCardBody class="flex flex-col gap-2">
        @if (loading()) {
          <div hellSkeleton class="h-3 w-full"></div>
          <div hellSkeleton class="h-3 w-4/5"></div>
        } @else {
          <p>Renewal due in 12 days. Usage is trending 18% above plan.</p>
        }
      </div>
      <div hellCardFooter>
        <button hellButton variant="ghost" type="button" (click)="loading.set(!loading())">
          {{ loading() ? 'Show loaded' : 'Show loading' }}
        </button>
      </div>
    </div>
  `,
})
export class SkeletonWithCardAvatarExample {
  protected readonly loading = signal(true);
}
