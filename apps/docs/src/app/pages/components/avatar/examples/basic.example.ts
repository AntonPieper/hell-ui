import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellAvatar } from '@hell-ui/angular/avatar';

@Component({
  selector: 'app-avatar-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellAvatar],
  template: `<hell-avatar image="https://i.pravatar.cc/64?img=11" fallback="HK" alt="Heinrich K." />`,
})
export class AvatarBasicExample {}
