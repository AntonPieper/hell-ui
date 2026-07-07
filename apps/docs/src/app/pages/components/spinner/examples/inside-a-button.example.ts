import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellSpinner } from '@hell-ui/angular/skeleton';

@Component({
  selector: 'app-spinner-inside-a-button-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellSpinner],
  template: `
    <button hellButton variant="primary" disabled type="button">
      <span hellSpinner size="sm"></span>
      Saving…
    </button>
    <button hellButton variant="default" disabled type="button">
      <span hellSpinner size="sm" variant="dots"></span>
      Loading
    </button>
    <button hellButton iconOnly variant="ghost" disabled type="button" aria-label="Refreshing">
      <span hellSpinner size="sm" variant="pulse"></span>
    </button>
  `,
})
export class SpinnerInsideAButtonExample {}
