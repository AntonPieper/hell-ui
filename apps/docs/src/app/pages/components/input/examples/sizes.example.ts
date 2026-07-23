import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellInput } from 'hell-ui/input';

@Component({
  selector: 'app-input-sizes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellInput],
  template: `
    <input hellInput size="sm" placeholder="Small" aria-label="Small input" />
    <input hellInput size="md" placeholder="Medium (default)" aria-label="Medium input" />
    <input hellInput size="lg" placeholder="Large" aria-label="Large input" />
    <input hellInput placeholder="Invalid" invalid aria-label="Invalid input" />
    <input hellInput placeholder="Disabled" disabled aria-label="Disabled input" />
  `,
})
export class InputSizesExample {}
