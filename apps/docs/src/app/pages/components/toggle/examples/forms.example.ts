import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';
import { HellToggleGroup, HellToggleGroupItem } from '@hell-ui/angular/toggle';

@Component({
  selector: 'app-toggle-forms-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_IMPORTS, FormField, HellToggleGroup, HellToggleGroupItem],
  template: `
    <div hellField class="max-w-sm">
      <label hellFieldLabel id="forms-align-label" for="forms-align-group">Text align</label>
      <div
        hellToggleGroup
        id="forms-align-group"
        type="single"
        aria-labelledby="forms-align-label"
        [formField]="editorForm.align"
      >
        <button hellToggleGroupItem value="left" type="button">Left</button>
        <button hellToggleGroupItem value="center" type="button">Center</button>
        <button hellToggleGroupItem value="right" type="button">Right</button>
      </div>
      <div hellFieldDescription>
        The group and the field share one <code>string | null</code> value. Align:
        <code>{{ editorForm.align().value() ?? 'null' }}</code> · Dirty:
        <code>{{ editorForm.align().dirty() }}</code> · Touched:
        <code>{{ editorForm.align().touched() }}</code>
      </div>
    </div>
  `,
})
export class ToggleFormsExample {
  protected readonly editor = signal<{ align: string | null }>({ align: 'left' });
  protected readonly editorForm = form(this.editor);
}
