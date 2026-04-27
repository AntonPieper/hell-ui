import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellAvatar } from 'hell';

@Component({
  selector: 'app-avatar-square-shape-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellAvatar],
  template: `
    <hell-avatar shape="square" fallback="CO" />
    <hell-avatar shape="square" image="https://i.pravatar.cc/64?img=15" fallback="ID" />
  `,
})
export class AvatarSquareShapeExample {}
