import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HellButton } from '@hell-ui/angular/button';
import { HellSpinner } from '@hell-ui/angular/skeleton';

@Component({
  selector: 'app-spinner-variants-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSpinner],
  template: `
    <div class="flex flex-col items-center gap-2">
      <span hellSpinner variant="ring" size="lg"></span>
      <code>ring</code>
    </div>
    <div class="flex flex-col items-center gap-2">
      <span hellSpinner variant="dots" size="lg"></span>
      <code>dots</code>
    </div>
    <div class="flex flex-col items-center gap-2">
      <span hellSpinner variant="bars" size="lg"></span>
      <code>bars</code>
    </div>
    <div class="flex flex-col items-center gap-2">
      <span hellSpinner variant="pulse" size="lg"></span>
      <code>pulse</code>
    </div>
  `,
})
export class SpinnerVariantsExample {}
