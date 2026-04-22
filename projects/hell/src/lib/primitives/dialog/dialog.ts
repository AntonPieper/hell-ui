import { Directive, booleanAttribute, input } from '@angular/core';
import {
  NgpDialog,
  NgpDialogOverlay,
  NgpDialogTitle,
  NgpDialogDescription,
  NgpDialogTrigger,
} from 'ng-primitives/dialog';
import { HellSize } from '../../core/types';

/**
 * Wrap your trigger element with this directive and bind to a `<ng-template>`.
 *
 *   <button hellButton [hellDialogTrigger]="dialog">Open</button>
 *   <ng-template #dialog let-close="close"> … </ng-template>
 */
@Directive({
  selector: '[hellDialogTrigger]',
  hostDirectives: [
    {
      directive: NgpDialogTrigger,
      inputs: [
        'ngpDialogTrigger:hellDialogTrigger',
        'ngpDialogTriggerCloseOnEscape:closeOnEscape',
        'ngpDialogTriggerCloseOnOutsideClick:closeOnOutsideClick',
      ],
      outputs: ['ngpDialogTriggerClosed:closed'],
    },
  ],
})
export class HellDialogTrigger {}

@Directive({
  selector: '[hellDialogOverlay]',
  hostDirectives: [NgpDialogOverlay],
  host: { '[class.hell-dialog-overlay]': '!unstyled()' },
})
export class HellDialogOverlay {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: '[hellDialog]',
  hostDirectives: [NgpDialog],
  host: {
    '[class.hell-dialog]': '!unstyled()',
    '[attr.data-size]': 'size()',
  },
})
export class HellDialog {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly size = input<HellSize>('md');
}

@Directive({
  selector: '[hellDialogHeader]',
  host: { '[class.hell-dialog-header]': '!unstyled()' },
})
export class HellDialogHeader {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: '[hellDialogTitle]',
  hostDirectives: [NgpDialogTitle],
  host: { '[class.hell-dialog-title]': '!unstyled()' },
})
export class HellDialogTitle {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: '[hellDialogDescription]',
  hostDirectives: [NgpDialogDescription],
  host: { '[class.hell-dialog-description]': '!unstyled()' },
})
export class HellDialogDescription {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: '[hellDialogBody]',
  host: { '[class.hell-dialog-body]': '!unstyled()' },
})
export class HellDialogBody {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: '[hellDialogFooter]',
  host: { '[class.hell-dialog-footer]': '!unstyled()' },
})
export class HellDialogFooter {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

export const HELL_DIALOG_DIRECTIVES = [
  HellDialogTrigger,
  HellDialogOverlay,
  HellDialog,
  HellDialogHeader,
  HellDialogTitle,
  HellDialogDescription,
  HellDialogBody,
  HellDialogFooter,
] as const;
