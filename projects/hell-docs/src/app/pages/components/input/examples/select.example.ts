import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellInput, HellNativeSelect, HellTextarea } from 'hell';

@Component({
  selector: 'app-input-select-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellNativeSelect],
  template: `
    <select hellNativeSelect size="sm" aria-label="Small select">
      <option>Small</option>
      <option>Compact choice</option>
    </select>
    <select hellNativeSelect aria-label="Default select">
      <option>Default</option>
      <option>Second option</option>
    </select>
    <select hellNativeSelect size="lg" aria-label="Large select">
      <option>Large</option>
      <option>More comfortable</option>
    </select>
    <select hellNativeSelect invalid aria-label="Invalid select">
      <option>Invalid</option>
    </select>
    <select hellNativeSelect disabled aria-label="Disabled select">
      <option>Disabled</option>
    </select>
  `,
})
export class InputSelectExample {}
