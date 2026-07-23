import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { FormField, disabled as disabledSchema, form } from '@angular/forms/signals';
import type { Extension } from '@codemirror/state';

import type { HellUiInput } from '@hell-ui/angular/core';
import {
  HELL_CODE_EDITOR_RUNTIME_FACTORY,
  HellCodeEditor,
  type HellCodeEditorPart,
  type HellCodeEditorUi,
} from './code-editor';
import type {
  HellCodeEditorRuntimeAccessibilityOptions,
  HellCodeEditorRuntimeOptions,
  HellCodeEditorRuntimePort,
} from './code-editor.runtime';
import { sortClasses } from '../../spec-helpers';

class FakeCodeEditorRuntime implements HellCodeEditorRuntimePort {
  values: string[] = [];
  extensions: Extension[] = [];
  readOnlyStates: boolean[] = [];
  accessibilityStates: HellCodeEditorRuntimeAccessibilityOptions[] = [];
  destroyed = false;
  private document: string;

  constructor(readonly options: HellCodeEditorRuntimeOptions) {
    this.document = options.value;
  }

  /** Editor-originated edit: updates the live document and echoes the change. */
  edit(next: string): void {
    this.document = next;
    this.options.onValueChange(next);
  }

  setValue(next: string): void {
    // Mirrors the real runtime port: an external write equal to the live
    // document resolves to a no-op and records no transaction.
    if (this.document === next) return;
    this.document = next;
    this.values.push(next);
  }

  setExtensions(extensions: Extension): void {
    this.extensions.push(extensions);
  }

  setReadOnly(readOnly: boolean): void {
    this.readOnlyStates.push(readOnly);
  }

  setAccessibility(options: HellCodeEditorRuntimeAccessibilityOptions): void {
    this.accessibilityStates.push(options);
  }

  destroy(): void {
    this.destroyed = true;
  }
}

@Component({
  imports: [HellCodeEditor],
  template: `<hell-code-editor
    [value]="value()"
    [readOnly]="readOnly()"
    [ariaLabel]="ariaLabel()"
    [ui]="ui()"
    (valueChange)="valueEvents.push($event)"
  />`,
})
class CodeEditorHost {
  readonly value = signal('alpha');
  readonly readOnly = signal(false);
  readonly ariaLabel = signal('Example source code');
  readonly objectUi = {
    root: 'max-h-[24rem] rounded-none',
    editor: 'min-h-[12rem]',
  } satisfies HellCodeEditorUi;
  readonly ui = signal<HellUiInput<HellCodeEditorPart>>('max-h-[16rem]');
  readonly valueEvents: string[] = [];
}

@Component({
  imports: [HellCodeEditor],
  template: `<hell-code-editor [(value)]="value" (valueChange)="valueEvents.push($event)" />`,
})
class CodeEditorTwoWayHost {
  readonly value = signal('alpha');
  readonly valueEvents: string[] = [];
}

@Component({
  imports: [ReactiveFormsModule, HellCodeEditor],
  template: `<hell-code-editor [formControl]="control" (valueChange)="valueEvents.push($event)" />`,
})
class CodeEditorFormHost {
  readonly control = new FormControl<string>('alpha', { nonNullable: true });
  readonly valueEvents: string[] = [];
}

@Component({
  imports: [FormsModule, HellCodeEditor],
  template: `<hell-code-editor [(ngModel)]="value" (valueChange)="valueEvents.push($event)" />`,
})
class CodeEditorNgModelHost {
  readonly value = signal('alpha');
  readonly model = viewChild.required(NgModel);
  readonly valueEvents: string[] = [];
}

@Component({
  imports: [FormField, HellCodeEditor],
  template: `<hell-code-editor
    [formField]="scriptForm.source"
    (valueChange)="valueEvents.push($event)"
  />`,
})
class CodeEditorSignalFormsHost {
  readonly formDisabled = signal(false);
  readonly model = signal({ source: 'alpha' });
  readonly scriptForm = form(this.model, (path) => {
    disabledSchema(path.source, () => this.formDisabled());
  });
  readonly valueEvents: string[] = [];
}

describe('HellCodeEditor', () => {
  let runtime: FakeCodeEditorRuntime | null;

  beforeEach(async () => {
    runtime = null;
    await TestBed.configureTestingModule({
      imports: [
        CodeEditorHost,
        CodeEditorTwoWayHost,
        CodeEditorFormHost,
        CodeEditorNgModelHost,
        CodeEditorSignalFormsHost,
      ],
      providers: [
        {
          provide: HELL_CODE_EDITOR_RUNTIME_FACTORY,
          useValue: (options: HellCodeEditorRuntimeOptions) =>
            (runtime = new FakeCodeEditorRuntime(options)),
        },
      ],
    }).compileComponents();
  });

  it('uses the injected Code Editor Runtime seam and cleans it up', async () => {
    const fixture = TestBed.createComponent(CodeEditorHost);

    await settle(fixture);

    expect(runtime?.options.value).toBe('alpha');
    expect(runtime?.options.readOnly).toBe(false);
    expect(runtime?.options.accessibility).toEqual({
      ariaLabel: 'Example source code',
      ariaLabelledby: null,
      ariaDescribedby: null,
      readOnly: false,
    });

    fixture.componentInstance.value.set('beta');
    fixture.componentInstance.readOnly.set(true);
    fixture.componentInstance.ariaLabel.set('Read-only example source code');
    await settle(fixture);

    expect(runtime?.values).toContain('beta');
    expect(runtime?.readOnlyStates).toContain(true);
    expect(runtime?.accessibilityStates).toContainEqual({
      ariaLabel: 'Read-only example source code',
      ariaLabelledby: null,
      ariaDescribedby: null,
      readOnly: true,
    });

    fixture.destroy();

    expect(runtime?.destroyed).toBe(true);
  });

  it('applies Part Style Map shorthand and object classes to the shell and editor host', async () => {
    const fixture = TestBed.createComponent(CodeEditorHost);

    await settle(fixture);

    const root = fixture.nativeElement.querySelector('hell-code-editor') as HTMLElement;
    const editor = root.querySelector('[data-slot="editor"]') as HTMLElement;

    expect(root.getAttribute('data-slot')).toBe('root');
    // String shorthand routes to the root part; the editor part is asserted
    // through its consumer map entry below and pinned by the recipe snapshot.
    expect(root.className).toContain('max-h-[16rem]');
    expect(editor.getAttribute('data-slot')).toBe('editor');

    fixture.componentInstance.ui.set(fixture.componentInstance.objectUi);
    fixture.componentInstance.readOnly.set(true);
    await settle(fixture);

    // The consumer ui classes are the test's own contract fixtures; recipe
    // conflict resolution is owned centrally by the Part-Class Pipeline spec.
    expect(root.className).toContain('max-h-[24rem]');
    expect(root.className).toContain('rounded-none');
    expect(root.getAttribute('data-readonly')).toBe('true');
    expect(editor.className).toContain('min-h-[12rem]');
  });

  describe('recipes', () => {
    // Part-Class Pipeline merge semantics are owned centrally by
    // `core/part-class-pipeline.spec.ts`; the snapshot pins the default part
    // classes without asserting individual utilities elsewhere.
    it('keeps the default part classes stable', async () => {
      const fixture = TestBed.createComponent(CodeEditorHost);
      await settle(fixture);

      const root = fixture.nativeElement.querySelector('hell-code-editor') as HTMLElement;

      expect({
        root: sortClasses(root.className),
        editor: sortClasses(
          root.querySelector('[data-slot="editor"]')?.getAttribute('class') ?? '',
        ),
      }).toMatchSnapshot('codeEditor');
    });
  });

  it('synchronizes two-way binding through one value authority without duplicate commits', async () => {
    const fixture = TestBed.createComponent(CodeEditorTwoWayHost);

    await settle(fixture);

    const host = fixture.componentInstance;

    expect(runtime?.options.value).toBe('alpha');

    // External parent write reconfigures the editor without echoing a change.
    host.value.set('beta');
    await settle(fixture);

    expect(runtime?.values).toEqual(['beta']);
    expect(host.valueEvents).toEqual([]);

    // One editor-originated edit commits exactly once: parent state and one
    // event, with no duplicate external write destroying editor state.
    runtime?.edit('gamma');
    await settle(fixture);

    expect(host.value()).toBe('gamma');
    expect(host.valueEvents).toEqual(['gamma']);
    expect(runtime?.values).toEqual(['beta']);
  });

  it('keeps direct property binding on the same authority without echoing external writes', async () => {
    const fixture = TestBed.createComponent(CodeEditorHost);

    await settle(fixture);

    const host = fixture.componentInstance;

    host.value.set('beta');
    await settle(fixture);

    expect(runtime?.values).toEqual(['beta']);
    expect(host.valueEvents).toEqual([]);

    runtime?.edit('gamma');
    await settle(fixture);

    expect(host.valueEvents).toEqual(['gamma']);
  });

  it('integrates with reactive forms without echoing programmatic writes', async () => {
    const fixture = TestBed.createComponent(CodeEditorFormHost);

    await settle(fixture);

    expect(runtime?.options.value).toBe('alpha');

    fixture.componentInstance.control.setValue('beta');
    await settle(fixture);

    expect(runtime?.values).toContain('beta');
    expect(fixture.componentInstance.valueEvents).toEqual([]);

    runtime?.edit('gamma');
    await settle(fixture);

    expect(fixture.componentInstance.control.value).toBe('gamma');
    expect(fixture.componentInstance.valueEvents).toEqual(['gamma']);

    const host = fixture.nativeElement.querySelector('div') as HTMLDivElement;
    host.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.control.touched).toBe(true);
  });

  it('maps reactive-form disabled state to read-only runtime state', async () => {
    const fixture = TestBed.createComponent(CodeEditorFormHost);

    await settle(fixture);

    fixture.componentInstance.control.disable();
    await settle(fixture);

    expect(runtime?.readOnlyStates).toContain(true);

    const root = fixture.nativeElement.querySelector('hell-code-editor') as HTMLElement;
    expect(root.getAttribute('data-readonly')).toBe('true');
  });

  it('integrates with template-driven forms through ngModel', async () => {
    const fixture = TestBed.createComponent(CodeEditorNgModelHost);

    await settle(fixture);

    const host = fixture.componentInstance;

    // NgModel's initial null write is coerced to an empty document before the
    // model value lands asynchronously; no editor commit is echoed for either.
    expect(runtime?.values).toContain('alpha');
    expect(host.valueEvents).toEqual([]);

    runtime?.edit('beta');
    await settle(fixture);

    expect(host.value()).toBe('beta');
    expect(host.valueEvents).toEqual(['beta']);
    expect(host.model().touched).toBe(false);

    const editorHost = fixture.nativeElement.querySelector('div') as HTMLDivElement;
    editorHost.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    fixture.detectChanges();

    expect(host.model().touched).toBe(true);

    host.value.set('gamma');
    await settle(fixture);

    expect(runtime?.values).toContain('gamma');
    expect(host.valueEvents).toEqual(['beta']);
  });

  it('participates in Signal Forms as a FormValueControl through formField', async () => {
    const fixture = TestBed.createComponent(CodeEditorSignalFormsHost);

    await settle(fixture);

    const host = fixture.componentInstance;

    expect(runtime?.options.value).toBe('alpha');

    // Form-driven writes flow in without echoing an editor commit.
    host.scriptForm.source().value.set('beta');
    await settle(fixture);

    expect(runtime?.values).toEqual(['beta']);
    expect(host.valueEvents).toEqual([]);
    expect(host.scriptForm.source().dirty()).toBe(false);

    // One editor-originated edit commits exactly once into field and model.
    runtime?.edit('gamma');
    await settle(fixture);

    expect(host.scriptForm.source().value()).toBe('gamma');
    expect(host.model().source).toBe('gamma');
    expect(host.valueEvents).toEqual(['gamma']);
    expect(host.scriptForm.source().dirty()).toBe(true);
    expect(host.scriptForm.source().touched()).toBe(false);

    const editorHost = fixture.nativeElement.querySelector('div') as HTMLDivElement;
    editorHost.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    fixture.detectChanges();

    expect(host.scriptForm.source().touched()).toBe(true);

    // Field-driven disabled state maps onto the same read-only editor policy.
    host.formDisabled.set(true);
    await settle(fixture);

    expect(runtime?.readOnlyStates).toContain(true);
    expect(runtime?.accessibilityStates.at(-1)?.readOnly).toBe(true);

    const root = fixture.nativeElement.querySelector('hell-code-editor') as HTMLElement;
    expect(root.getAttribute('data-readonly')).toBe('true');
  });
});

async function settle(fixture: { detectChanges(): void; whenStable(): Promise<unknown> }) {
  fixture.detectChanges();
  await fixture.whenStable();
  await Promise.resolve();
  fixture.detectChanges();
}
