import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HellButton } from '@hell-ui/angular/button';
import { HellSpinner } from '@hell-ui/angular/skeleton';

@Component({
  selector: 'app-spinner-inside-a-button-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellSpinner],
  template: `
    <button hellButton variant="primary" disabled>
      <span hellSpinner size="sm"></span>
      Saving…
    </button>
    <button hellButton variant="default" disabled>
      <span hellSpinner size="sm" variant="dots"></span>
      Loading
    </button>
    <button hellButton variant="ghost" disabled>
      <span hellSpinner size="sm" variant="pulse"></span>
    </button>
  `,
})
export class SpinnerInsideAButtonExample {}
