import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellInput, HellNativeSelect, HellTextarea } from 'hell';

@Component({
  selector: 'app-input-states-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellInput],
  template: `
    <input hellInput placeholder="Default" />
    <input hellInput placeholder="Invalid" invalid />
    <input hellInput placeholder="Disabled" disabled />
  `,
})
export class InputStatesExample {}
