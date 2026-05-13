import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HellButton, HellSpinner } from '@hell-ui/angular/primitives';

@Component({
  selector: 'app-spinner-colour-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSpinner],
  template: `
    <span hellSpinner size="lg" class="text-hell-primary"></span>
    <span hellSpinner size="lg" variant="dots" class="text-hell-success"></span>
    <span hellSpinner size="lg" variant="bars" class="text-hell-danger"></span>
    <span hellSpinner size="lg" variant="pulse" class="text-hell-warning"></span>
  `,
})
export class SpinnerColourExample {}
