import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HellButton } from '@hell-ui/angular/button';
import { HellSpinner } from '@hell-ui/angular/skeleton';

@Component({
  selector: 'app-spinner-sizes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSpinner],
  template: `
    <span hellSpinner size="xs"></span>
    <span hellSpinner size="sm"></span>
    <span hellSpinner size="md"></span>
    <span hellSpinner size="lg"></span>
    <span hellSpinner size="xl"></span>
    <span hellSpinner class="text-[64px]"></span>
  `,
})
export class SpinnerSizesExample {}
