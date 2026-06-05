import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { Extension } from '@codemirror/state';

import { HELL_CODE_EDITOR_RUNTIME_FACTORY, HellCodeEditor } from './code-editor';
import type {
  HellCodeEditorRuntimeAccessibilityOptions,
  HellCodeEditorRuntimeOptions,
  HellCodeEditorRuntimePort,
} from './code-editor.runtime';

class FakeCodeEditorRuntime implements HellCodeEditorRuntimePort {
  values: string[] = [];
  extensions: Extension[] = [];
  readOnlyStates: boolean[] = [];
  accessibilityStates: HellCodeEditorRuntimeAccessibilityOptions[] = [];
  destroyed = false;

  constructor(readonly options: HellCodeEditorRuntimeOptions) {}

  setValue(next: string): void {
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
  />`,
})
class CodeEditorHost {
  readonly value = signal('alpha');
  readonly readOnly = signal(false);
  readonly ariaLabel = signal('Example source code');
}

@Component({
  imports: [ReactiveFormsModule, HellCodeEditor],
  template: `<hell-code-editor [formControl]="control" (valueChange)="values.push($event)" />`,
})
class CodeEditorFormHost {
  readonly control = new FormControl<string>('alpha', { nonNullable: true });
  values: string[] = [];
}

describe('HellCodeEditor', () => {
  let runtime: FakeCodeEditorRuntime | null;

  beforeEach(async () => {
    runtime = null;
    await TestBed.configureTestingModule({
      imports: [CodeEditorHost, CodeEditorFormHost],
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

  it('integrates with reactive forms without echoing programmatic writes', async () => {
    const fixture = TestBed.createComponent(CodeEditorFormHost);

    await settle(fixture);

    expect(runtime?.options.value).toBe('alpha');

    fixture.componentInstance.control.setValue('beta');
    await settle(fixture);

    expect(runtime?.values).toContain('beta');
    expect(fixture.componentInstance.values).toEqual([]);

    runtime?.options.onValueChange('gamma');
    await settle(fixture);

    expect(fixture.componentInstance.control.value).toBe('gamma');
    expect(fixture.componentInstance.values).toEqual(['gamma']);

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
  });
});

async function settle(fixture: { detectChanges(): void; whenStable(): Promise<unknown> }) {
  fixture.detectChanges();
  await fixture.whenStable();
  await Promise.resolve();
  fixture.detectChanges();
}
