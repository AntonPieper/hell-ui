import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellInput, HellNativeSelect, HellTextarea } from 'hell/primitives';

@Component({
  selector: 'app-input-textarea-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellTextarea],
  template: `
    <textarea hellTextarea size="sm" rows="3" placeholder="Small textarea"></textarea>
    <textarea hellTextarea rows="4" placeholder="Type a message…"></textarea>
    <textarea hellTextarea size="lg" rows="5" placeholder="Large textarea"></textarea>
    <textarea hellTextarea rows="3" placeholder="Invalid" invalid></textarea>
  `,
})
export class InputTextareaExample {}
