import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellAvatar, type HellAvatarUi } from '@hell-ui/angular/avatar';

@Component({
  selector: 'app-avatar-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellAvatar],
  template: `
    <!-- ui string shorthand refines the default "root" part. -->
    <hell-avatar fallback="HK" ui="bg-hell-success text-hell-foreground-inverse" />

    <!-- The HellAvatarUi map can target every public part: root, image, fallback. -->
    <hell-avatar
      image="https://i.pravatar.cc/64?img=14"
      fallback="MP"
      alt="Mika P."
      [ui]="avatarUi"
    />
  `,
})
export class AvatarStylingExample {
  protected readonly avatarUi = {
    root: 'rounded-hell-md border-hell-primary bg-hell-primary-soft p-hell-1',
    image: 'grayscale',
    fallback: 'text-hell-primary-soft-foreground tracking-normal',
  } satisfies HellAvatarUi;
}
