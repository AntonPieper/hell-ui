import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellAvatar } from '@hell-ui/angular/avatar';
import { HELL_CARD_IMPORTS } from '@hell-ui/angular/card';
import { HellChip } from '@hell-ui/angular/chip';

@Component({
  selector: 'app-avatar-with-card-profile-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellAvatar, HellChip, ...HELL_CARD_IMPORTS],
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
            <span hellChip variant="success">Active</span>
            <span hellChip variant="default">Platform team</span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AvatarWithCardProfileExample {}
