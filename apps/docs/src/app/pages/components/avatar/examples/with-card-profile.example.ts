import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellAvatar } from '@hell-ui/angular/avatar';
import { HELL_CARD_DIRECTIVES } from '@hell-ui/angular/card';
import { HellTag } from '@hell-ui/angular/tag';

@Component({
  selector: 'app-avatar-with-card-profile-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellAvatar, HellTag, ...HELL_CARD_DIRECTIVES],
  template: `
    <div hellCard class="max-w-sm">
      <div hellCardBody class="flex items-start gap-hell-4">
        <hell-avatar
          size="lg"
          image="https://i.pravatar.cc/96?img=12"
          fallback="AP"
          alt="Anna Petrova"
        />
        <div class="flex min-w-0 flex-col gap-hell-1">
          <span class="truncate text-sm font-semibold text-hell-foreground">Anna Petrova</span>
          <span class="truncate text-xs text-hell-foreground-muted">Engineering Manager</span>
          <div class="mt-hell-1 flex flex-wrap gap-hell-1">
            <span hellTag variant="success">Active</span>
            <span hellTag variant="default">Platform team</span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AvatarWithCardProfileExample {}
