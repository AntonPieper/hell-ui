import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellAvatar } from 'hell-ui/avatar';

@Component({
  selector: 'app-avatar-broken-image-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellAvatar],
  template: `
    <!-- Loads fine: the fallback initials stay hidden once the image reports "loaded". -->
    <hell-avatar image="https://i.pravatar.cc/64?img=13" fallback="BS" alt="Bjorn S." />
    <!-- 404s: the image reports "error" and the initials fallback takes over automatically. -->
    <hell-avatar image="https://example.invalid/missing.png" fallback="DO" alt="Dana O." />
    <!-- No image at all: fallback renders immediately. -->
    <hell-avatar fallback="NG" alt="Noor G." />
  `,
})
export class AvatarBrokenImageExample {}
