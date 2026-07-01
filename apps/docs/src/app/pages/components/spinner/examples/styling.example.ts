import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellSpinner } from '@hell-ui/angular/skeleton';

@Component({
  selector: 'app-spinner-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSpinner],
  template: `
    <!-- Spinner inherits currentColor; class is the additive color hook. -->
    <span hellSpinner size="lg" class="text-hell-primary"></span>
    <!-- ui font-size deterministically beats the recipe size variant. -->
    <span hellSpinner size="md" ui="text-[36px] text-hell-success"></span>
    <span hellSpinner size="md" [ui]="{ root: 'text-[36px] text-hell-danger' }"></span>
  `,
})
export class SpinnerStylingExample {}
