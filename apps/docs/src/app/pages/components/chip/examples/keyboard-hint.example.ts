import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellKbd } from 'hell-ui/chip';

@Component({
  selector: 'app-chip-keyboard-hint-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellKbd],
  template: ` Press <kbd hellKbd>⌘</kbd> + <kbd hellKbd>K</kbd> to open the command palette. `,
})
export class ChipKeyboardHintExample {}
