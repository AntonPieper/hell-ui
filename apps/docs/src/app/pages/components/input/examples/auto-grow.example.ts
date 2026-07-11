import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/field';
import { HellTextarea } from '@hell-ui/angular/input';

@Component({
  selector: 'app-input-auto-grow-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellTextarea, ...HELL_FIELD_DIRECTIVES],
  template: `
    <div hellField>
      <label hellFieldLabel for="auto-grow-note">Release note</label>
      <textarea
        id="auto-grow-note"
        hellTextarea
        autoGrow
        ui="[min-block-size:9rem] [max-block-size:13rem] overflow-y-auto"
        placeholder="Type a few lines — the field grows as you go…"
      ></textarea>
      <div hellFieldDescription>
        <code>min-block-size</code> holds the floor (it stays this tall even when emptied);
        <code>max-block-size</code> plus <code>overflow-y: auto</code> caps growth, then the
        content scrolls. No JavaScript measurement.
      </div>
    </div>
  `,
})
export class InputAutoGrowExample {}
