import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellInput, HellSelect, HellTextarea } from 'hell';

@Component({
  selector: 'app-input-select-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSelect],
  template: `
    <select hellSelect size="sm" aria-label="Small select">
      <option>Small</option>
      <option>Compact choice</option>
    </select>
    <select hellSelect aria-label="Default select">
      <option>Default</option>
      <option>Second option</option>
    </select>
    <select hellSelect size="lg" aria-label="Large select">
      <option>Large</option>
      <option>More comfortable</option>
    </select>
    <select hellSelect invalid aria-label="Invalid select">
      <option>Invalid</option>
    </select>
    <select hellSelect disabled aria-label="Disabled select">
      <option>Disabled</option>
    </select>
  `,
})
export class InputSelectExample {}
