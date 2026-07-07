import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';

@Component({
  selector: 'app-button-sizes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton],
  template: `
    <button hellButton size="xs" type="button">XS</button>
    <button hellButton size="sm" type="button">Small</button>
    <button hellButton size="md" type="button">Medium</button>
    <button hellButton size="lg" type="button">Large</button>
    <button hellButton size="xl" type="button">XL</button>
  `,
})
export class ButtonSizesExample {}
