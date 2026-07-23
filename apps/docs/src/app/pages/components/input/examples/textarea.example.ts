import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellTextarea } from 'hell-ui/input';

@Component({
  selector: 'app-input-textarea-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellTextarea],
  template: `
    <textarea hellTextarea size="sm" rows="3" placeholder="Small textarea" aria-label="Small textarea"></textarea>
    <textarea hellTextarea rows="4" placeholder="Type a message…" aria-label="Default textarea"></textarea>
    <textarea hellTextarea size="lg" rows="5" placeholder="Large textarea" aria-label="Large textarea"></textarea>
    <textarea hellTextarea rows="3" placeholder="Invalid" invalid aria-label="Invalid textarea"></textarea>
  `,
})
export class InputTextareaExample {}
