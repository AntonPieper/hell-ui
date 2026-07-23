import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellAvatar } from 'hell-ui/avatar';

@Component({
  selector: 'app-avatar-shape-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellAvatar],
  template: `
    <hell-avatar image="https://i.pravatar.cc/64?img=12" fallback="AP" alt="Anna P." />
    <hell-avatar
      shape="square"
      image="https://i.pravatar.cc/64?img=15"
      fallback="ID"
      alt="Iris D., Acme Inc."
    />
  `,
})
export class AvatarShapeExample {}
