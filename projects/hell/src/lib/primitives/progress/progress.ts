import { Directive, booleanAttribute, input } from '@angular/core';
import { NgpProgress, NgpProgressIndicator } from 'ng-primitives/progress';

@Directive({
  selector: '[hellProgress]',
  hostDirectives: [
    {
      directive: NgpProgress,
      inputs: ['ngpProgressValue:value', 'ngpProgressMax:max'],
    },
  ],
  host: { '[class.hell-progress]': '!unstyled()' },
})
export class HellProgress {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: '[hellProgressBar]',
  hostDirectives: [NgpProgressIndicator],
  host: { '[class.hell-progress-bar]': '!unstyled()' },
})
export class HellProgressBar {
  readonly unstyled = input(false, { transform: booleanAttribute });
}
