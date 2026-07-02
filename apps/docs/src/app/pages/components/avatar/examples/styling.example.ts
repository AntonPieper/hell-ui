import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellAvatar } from '@hell-ui/angular/avatar';

@Component({
  selector: 'app-avatar-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellAvatar],
  template: `
    <!-- ui string shorthand refines the default root Public Part. -->
    <hell-avatar fallback="HK" ui="bg-hell-success text-hell-foreground-inverse" />
    <!-- The explicit Part Style Map names the part. -->
    <hell-avatar
      fallback="AP"
      shape="square"
      [ui]="{ root: 'border-hell-primary bg-hell-primary-soft' }"
    />
  `,
})
export class AvatarStylingExample {}
