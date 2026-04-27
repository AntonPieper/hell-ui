import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellInput, HellSelect, HellTextarea } from 'hell';

@Component({
  selector: 'app-input-sizes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellInput],
  template: `
    <input hellInput size="sm" placeholder="Small" />
    <input hellInput size="md" placeholder="Medium (default)" />
    <input hellInput size="lg" placeholder="Large" />
  `,
})
export class InputSizesExample {}
