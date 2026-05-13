import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellAvatar } from '@hell-ui/angular/primitives';

@Component({
  selector: 'app-avatar-sizes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellAvatar],
  template: `
    <hell-avatar size="xs" fallback="XS" />
    <hell-avatar size="sm" fallback="SM" />
    <hell-avatar size="md" fallback="MD" />
    <hell-avatar size="lg" fallback="LG" />
    <hell-avatar size="xl" fallback="XL" />
  `,
})
export class AvatarSizesExample {}
