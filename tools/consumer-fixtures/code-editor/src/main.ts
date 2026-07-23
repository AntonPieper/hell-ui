import { Component, computed, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { bootstrapApplication } from '@angular/platform-browser';
import { HellCodeEditor } from 'hell-ui/features/code-editor';

/**
 * Code Editor Control Value Authority boundary coverage (#290): the packed
 * `hell-code-editor` binds one `value` model across direct property binding,
 * two-way binding, Signal Forms `[formField]`, Reactive Forms
 * `[formControl]`, and Template-driven Forms `[(ngModel)]`, and every path
 * reports the same committed document at runtime.
 */
@Component({
  selector: 'app-code-editor-forms',
  imports: [FormsModule, ReactiveFormsModule, FormField, HellCodeEditor],
  template: `
    <hell-code-editor
      ariaLabel="Property document"
      [value]="propertyValue()"
      (valueChange)="propertyValue.set($event)"
    />
    <hell-code-editor ariaLabel="Two-way document" [(value)]="twoWayValue" />
    <hell-code-editor ariaLabel="Signal Forms document" [formField]="scriptForm.source" />
    <hell-code-editor ariaLabel="Reactive document" [formControl]="reactiveControl" />
    <hell-code-editor ariaLabel="Template-driven document" [(ngModel)]="ngModelValue" />
    <p data-test-id="code-editor-forms-status">{{ status() }}</p>
  `,
})
class CodeEditorForms {
  protected readonly propertyValue = signal('property');
  protected readonly twoWayValue = signal('two-way');
  protected readonly formModel = signal({ source: 'signal-forms' });
  protected readonly scriptForm = form(this.formModel);
  protected readonly reactiveControl = new FormControl('reactive', { nonNullable: true });
  protected readonly ngModelValue = signal('template-driven');

  protected readonly status = computed(
    () =>
      `Code editor forms ready ${this.propertyValue()}-${this.twoWayValue()}-` +
      `${this.scriptForm.source().value()}-${this.reactiveControl.value}-${this.ngModelValue()}`,
  );
}

// Code editor boundary: the kept optional CodeMirror feature entry compiles
// and boots only when the CodeMirror peer group is installed.
@Component({
  selector: 'app-root',
  imports: [HellCodeEditor, CodeEditorForms],
  template: `
    <hell-code-editor [value]="code" readOnly />
    <app-code-editor-forms />
  `,
})
class App {
  protected readonly code = 'console.log("hell")';
}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
