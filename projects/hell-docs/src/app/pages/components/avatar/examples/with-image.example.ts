import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellAvatar } from '@hell-ui/angular/avatar';

@Component({
  selector: 'app-avatar-with-image-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellAvatar],
  template: `
    <hell-avatar image="https://i.pravatar.cc/64?img=11" fallback="HK" alt="Heinrich K." />
    <hell-avatar image="https://i.pravatar.cc/64?img=12" fallback="AP" alt="Anna P." />
    <hell-avatar image="https://i.pravatar.cc/64?img=13" fallback="BS" alt="Bjorn S." />
  `,
})
export class AvatarWithImageExample {}
