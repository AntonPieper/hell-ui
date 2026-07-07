import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellBadge } from '@hell-ui/angular/tag';

@Component({
  selector: 'app-tag-badge-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellBadge],
  template: `
    <span class="relative inline-flex pr-6">
      Inbox
      <span hellBadge class="absolute -top-1 right-0">3</span>
    </span>
    <span class="relative inline-flex pr-6">
      Notifications
      <span hellBadge class="absolute -top-1 right-0">99+</span>
    </span>
  `,
})
export class TagBadgeExample {}
