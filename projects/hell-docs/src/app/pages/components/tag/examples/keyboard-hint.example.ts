import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellBadge, HellKbd, HellTag } from '@hell-ui/angular/tag';

@Component({
  selector: 'app-tag-keyboard-hint-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellKbd],
  template: ` Press <kbd hellKbd>⌘</kbd> + <kbd hellKbd>K</kbd> to open the command palette. `,
})
export class TagKeyboardHintExample {}
