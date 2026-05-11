import { Directive } from '@angular/core';
import { NgpProgress, NgpProgressIndicator } from 'ng-primitives/progress';
import { HellStyleable } from '../../core/styleable';

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
export class HellProgress extends HellStyleable {}

@Directive({
  selector: '[hellProgressBar]',
  hostDirectives: [NgpProgressIndicator],
  host: { '[class.hell-progress-bar]': '!unstyled()' },
})
export class HellProgressBar extends HellStyleable {}
