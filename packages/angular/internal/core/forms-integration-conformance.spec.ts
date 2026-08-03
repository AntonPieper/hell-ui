import { Component, type Provider, type Type, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import {
  FormField,
  disabled as disabledSchema,
  form,
  max as maxSchema,
  maxDate as maxDateSchema,
  min as minSchema,
  minDate as minDateSchema,
  required as requiredSchema,
} from '@angular/forms/signals';
import { By } from '@angular/platform-browser';

import { HellCheckbox } from '../../checkbox/checkbox';
import { HELL_COMBOBOX_IMPORTS } from '../../combobox/combobox';
import { HellDateInput } from '../../date-input/date-input';
import {
  HELL_CODE_EDITOR_RUNTIME_FACTORY,
  HellCodeEditor,
} from '../../features/code-editor/code-editor';
import type {
  HellCodeEditorRuntimeAccessibilityOptions,
  HellCodeEditorRuntimeOptions,
  HellCodeEditorRuntimePort,
} from '../../features/code-editor/code-editor.runtime';
import { HellNumberInput, HellNumberStep } from '../../number-input/number-input';
import { HellRadio, HellRadioGroup } from '../../radio/radio';
import { HELL_SELECT_IMPORTS } from '../../select/select';
import { HellSlider } from '../../slider/slider';
import { HellSwitch } from '../../switch/switch';
import { HellTimeInput, type HellTimeValue } from '../../time-input/time-input';
import { HellToggleGroup, HellToggleGroupItem } from '../../toggle/toggle';

/**
 * Central ownership of the shared forms-integration Value Authority contract.
 *
 * This spec is the single place that proves, for every registered control,
 * the four integration behaviors every Hell control commits to:
 *
 * - two-way binding synchronizes through one value authority without
 *   duplicate commits,
 * - Reactive Forms writes flow in without echoing `valueChange`, and one user
 *   commit lands in the control exactly once,
 * - template-driven forms (`ngModel`) commit without touching and only mark
 *   touched on the entry's touch gesture,
 * - Signal Forms participation through `formField` (value/dirty/touched and
 *   field-driven disabled state).
 *
 * Component specs must not re-verify these four behaviors with their own
 * copies. A component spec still owns everything component-specific around
 * forms: draft/parse semantics, `updateOn: 'blur'` controls, native form
 * serialization, validation metadata that is not registered here, and any
 * mode-specific variants that go beyond the shared contract.
 *
 * To register a control, add one `conformanceEntry` to the REGISTRY below:
 * the entry declares the host template, how the value renders in the DOM,
 * two distinct sample values, the commit gesture (which must not touch), and
 * the touch gesture. All four behaviors then run automatically.
 */

// ---------------------------------------------------------------------------
// Registry contract
// ---------------------------------------------------------------------------

interface ConformanceContext {
  readonly fixture: ComponentFixture<unknown>;
  readonly root: HTMLElement;
}

/**
 * Narrow structural view of a Signal Forms field used by the conformance
 * bodies. Dynamic (JIT) host templates are not type-checked, so the real
 * `FieldTree` can be exposed through this stable shape without re-deriving
 * the library's deferred conditional types over a generic model.
 */
interface ConformanceField<T> {
  (): {
    readonly value: { set(next: T): void } & (() => T);
    readonly dirty: () => boolean;
    readonly touched: () => boolean;
    readonly invalid: () => boolean;
  };
}

/** Schema path handed to per-entry Signal Forms metadata rules. */
interface ConformanceSchemaPath {
  readonly value: never;
}

interface SignalConformanceContext<T> {
  readonly ctx: ConformanceContext;
  readonly field: ConformanceField<T>;
}

interface ConformanceEntryConfig<T> {
  readonly name: string;
  /** Signal Forms control interface the component implements. */
  readonly signalFormsRole: 'FormValueControl' | 'FormCheckboxControl';
  readonly imports: Type<unknown>[];
  /** Per-test providers; also the reset point for entry-held gesture state. */
  readonly providers?: () => Provider[];
  /** Full host markup with the mode-specific control bindings spliced in. */
  readonly template: (control: string) => string;
  /** Two-way bound value input (`value`, or `checked` for boolean controls). */
  readonly valueProp: string;
  /** Change output paired with the value input. */
  readonly changeOutput: string;
  /** Rendered on create (sample value A). */
  readonly initial: T;
  /** Written programmatically by parent/forms APIs (sample value B). */
  readonly programmatic: T;
  /** Value produced by one commit gesture from the given previous value. */
  readonly commitResult: (previous: T) => T;
  /** One user commit gesture; must not mark the control touched. */
  readonly commit: (ctx: ConformanceContext) => void | Promise<void>;
  /** Marks the control touched without another commit. */
  readonly touch: (ctx: ConformanceContext) => void | Promise<void>;
  /** Asserts the rendered control reflects a value (omit for portal pickers). */
  readonly expectValue?: (ctx: ConformanceContext, value: T) => void;
  /** Asserts forms-driven disabled state reached the rendered control. */
  readonly expectDisabled: (ctx: ConformanceContext) => void;
  /** Re-run the commit gesture while field-disabled and expect no movement. */
  readonly commitWhileDisabledIsIgnored?: boolean;
  /** Extra Signal Forms schema rules owned by the component (metadata). */
  readonly signalSchema?: (path: ConformanceSchemaPath) => void;
  /** Asserts schema metadata reached the rendered control before any write. */
  readonly expectSignalMetadata?: (sctx: SignalConformanceContext<T>) => void;
  /** Runs after commit + touch, before field-driven disabled assertions. */
  readonly expectSignalAfterCommit?: (
    sctx: SignalConformanceContext<T>,
  ) => void | Promise<void>;
  /** Removes portaled DOM the entry's gestures may leave behind. */
  readonly cleanup?: () => void;
}

interface RegisteredConformanceEntry {
  readonly name: string;
  readonly register: () => void;
}

// ---------------------------------------------------------------------------
// Dynamic conformance hosts (one shape per integration mode)
// ---------------------------------------------------------------------------

class TwoWayHostBase<T> {
  readonly value: ReturnType<typeof signal<T>>;
  readonly events: T[] = [];

  constructor(initial: T) {
    this.value = signal(initial);
  }
}

class ReactiveHostBase<T> {
  readonly control: FormControl<T>;
  readonly events: T[] = [];

  constructor(initial: T) {
    this.control = new FormControl<T>(initial, { nonNullable: true });
  }
}

class SignalHostBase<T> {
  readonly formDisabled = signal(false);
  readonly model: ReturnType<typeof signal<{ value: T }>>;
  readonly valueForm: { readonly value: ConformanceField<T> };
  readonly events: T[] = [];

  constructor(initial: T, schema?: (path: ConformanceSchemaPath) => void) {
    this.model = signal({ value: initial });
    this.valueForm = form(this.model, (path) => {
      disabledSchema(path.value as never, () => this.formDisabled());
      schema?.(path as unknown as ConformanceSchemaPath);
    }) as unknown as { readonly value: ConformanceField<T> };
  }
}

function defineHost<THost>(
  imports: Type<unknown>[],
  template: string,
  host: Type<THost>,
): Type<THost> {
  return Component({ imports, template })(host) as Type<THost>;
}

interface ConformanceHosts<T> {
  readonly twoWay: Type<TwoWayHostBase<T>>;
  readonly reactive: Type<ReactiveHostBase<T>>;
  readonly ngModel: Type<TwoWayHostBase<T>>;
  readonly signal: Type<SignalHostBase<T>>;
}

function buildHosts<T>(entry: ConformanceEntryConfig<T>): ConformanceHosts<T> {
  const events = (output: string): string => `(${output})="events.push($event)"`;

  return {
    twoWay: defineHost(
      entry.imports,
      entry.template(`[(${entry.valueProp})]="value" ${events(entry.changeOutput)}`),
      class extends TwoWayHostBase<T> {
        constructor() {
          super(entry.initial);
        }
      },
    ),
    reactive: defineHost(
      [ReactiveFormsModule, ...entry.imports],
      entry.template(`[formControl]="control" ${events(entry.changeOutput)}`),
      class extends ReactiveHostBase<T> {
        constructor() {
          super(entry.initial);
        }
      },
    ),
    ngModel: defineHost(
      [FormsModule, ...entry.imports],
      entry.template(`[(ngModel)]="value" ${events(entry.changeOutput)}`),
      class extends TwoWayHostBase<T> {
        constructor() {
          super(entry.initial);
        }
      },
    ),
    signal: defineHost(
      [FormField, ...entry.imports],
      entry.template(`[formField]="valueForm.value" ${events(entry.changeOutput)}`),
      class extends SignalHostBase<T> {
        constructor() {
          super(entry.initial, entry.signalSchema);
        }
      },
    ),
  };
}

// ---------------------------------------------------------------------------
// Shared drivers
// ---------------------------------------------------------------------------

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  await Promise.resolve();
  fixture.detectChanges();
}

function createContext<THost>(
  host: Type<THost>,
): { fixture: ComponentFixture<THost>; instance: THost; ctx: ConformanceContext } {
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  return {
    fixture,
    instance: fixture.componentInstance,
    ctx: { fixture, root: fixture.nativeElement as HTMLElement },
  };
}

function conformanceEntry<T>(entry: ConformanceEntryConfig<T>): RegisteredConformanceEntry {
  return { name: entry.name, register: () => describeEntry(entry) };
}

function describeEntry<T>(entry: ConformanceEntryConfig<T>): void {
  describe(entry.name, () => {
    const hosts = buildHosts(entry);

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        providers: entry.providers?.() ?? [],
      }).compileComponents();
    });

    afterEach(() => {
      entry.cleanup?.();
    });

    it('synchronizes two-way binding through one value authority without duplicate commits', async () => {
      const { fixture, instance, ctx } = createContext(hosts.twoWay);
      await settle(fixture);
      entry.expectValue?.(ctx, entry.initial);

      // External parent write flows in without echoing a change event.
      instance.value.set(entry.programmatic);
      await settle(fixture);
      entry.expectValue?.(ctx, entry.programmatic);
      expect(instance.events).toEqual([]);

      // One user commit updates parent state and emits exactly one event.
      const committed = entry.commitResult(entry.programmatic);
      await entry.commit(ctx);
      await settle(fixture);
      expect(instance.value()).toEqual(committed);
      expect(instance.events).toEqual([committed]);
      entry.expectValue?.(ctx, committed);
    });

    it('integrates with reactive forms without echoing programmatic writes', async () => {
      const { fixture, instance, ctx } = createContext(hosts.reactive);
      await settle(fixture);
      entry.expectValue?.(ctx, entry.initial);

      // Programmatic control writes flow in without echoing a change event.
      instance.control.setValue(entry.programmatic);
      await settle(fixture);
      entry.expectValue?.(ctx, entry.programmatic);
      expect(instance.events).toEqual([]);

      // One user commit updates the control exactly once without touching.
      const committed = entry.commitResult(entry.programmatic);
      await entry.commit(ctx);
      await settle(fixture);
      expect(instance.control.value).toEqual(committed);
      expect(instance.events).toEqual([committed]);
      expect(instance.control.touched).toBe(false);

      await entry.touch(ctx);
      await settle(fixture);
      expect(instance.control.touched).toBe(true);

      // Control-driven disabled state reaches the rendered control.
      instance.control.disable();
      await settle(fixture);
      entry.expectDisabled(ctx);
    });

    it('integrates with template-driven forms through ngModel', async () => {
      const { fixture, instance, ctx } = createContext(hosts.ngModel);
      await settle(fixture);
      entry.expectValue?.(ctx, entry.initial);
      expect(instance.events).toEqual([]);

      const model = fixture.debugElement.query(By.directive(NgModel)).injector.get(NgModel);

      // The commit gesture updates the model without touching it.
      const committed = entry.commitResult(entry.initial);
      await entry.commit(ctx);
      await settle(fixture);
      expect(instance.value()).toEqual(committed);
      expect(instance.events).toEqual([committed]);
      expect(model.touched).toBe(false);

      await entry.touch(ctx);
      await settle(fixture);
      expect(model.touched).toBe(true);

      // External writes synchronize without echoing an interaction commit.
      instance.value.set(entry.programmatic);
      await settle(fixture);
      entry.expectValue?.(ctx, entry.programmatic);
      expect(instance.events).toEqual([committed]);
    });

    it(`participates in Signal Forms as a ${entry.signalFormsRole} through formField`, async () => {
      const { fixture, instance, ctx } = createContext(hosts.signal);
      await settle(fixture);
      const field = instance.valueForm.value;
      entry.expectValue?.(ctx, entry.initial);
      entry.expectSignalMetadata?.({ ctx, field });

      // Form-driven writes flow in without echoing an interaction commit.
      field().value.set(entry.programmatic);
      await settle(fixture);
      entry.expectValue?.(ctx, entry.programmatic);
      expect(instance.events).toEqual([]);
      expect(field().dirty()).toBe(false);

      // One user commit updates the field and the model exactly once.
      const committed = entry.commitResult(entry.programmatic);
      await entry.commit(ctx);
      await settle(fixture);
      expect(field().value()).toEqual(committed);
      expect(instance.model().value).toEqual(committed);
      expect(instance.events).toEqual([committed]);
      expect(field().dirty()).toBe(true);
      expect(field().touched()).toBe(false);

      await entry.touch(ctx);
      await settle(fixture);
      expect(field().touched()).toBe(true);

      await entry.expectSignalAfterCommit?.({ ctx, field });

      // Field-driven disabled state reaches the rendered control.
      instance.formDisabled.set(true);
      await settle(fixture);
      entry.expectDisabled(ctx);

      if (entry.commitWhileDisabledIsIgnored) {
        const before = field().value();
        const eventsBefore = instance.events.length;
        await entry.commit(ctx);
        await settle(fixture);
        expect(field().value()).toEqual(before);
        expect(instance.events.length).toBe(eventsBefore);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// DOM gesture helpers
// ---------------------------------------------------------------------------

function query<E extends HTMLElement>(root: ParentNode, selector: string): E {
  const element = root.querySelector<E>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}

function click(ctx: ConformanceContext, selector: string): void {
  query<HTMLElement>(ctx.root, selector).click();
  ctx.fixture.detectChanges();
}

function blur(ctx: ConformanceContext, selector: string): void {
  query<HTMLElement>(ctx.root, selector).dispatchEvent(
    new FocusEvent('blur', { bubbles: true }),
  );
  ctx.fixture.detectChanges();
}

function focusoutToNull(ctx: ConformanceContext, selector: string): void {
  query<HTMLElement>(ctx.root, selector).dispatchEvent(
    new FocusEvent('focusout', { bubbles: true, relatedTarget: null }),
  );
  ctx.fixture.detectChanges();
}

function typeText(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function pressKey(element: HTMLElement, key: string): void {
  element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

/** Types text and commits it with Enter (commit-without-touch for text inputs). */
function typeAndEnter(ctx: ConformanceContext, selector: string, text: string): void {
  const input = query<HTMLInputElement>(ctx.root, selector);
  typeText(input, text);
  ctx.fixture.detectChanges();
  pressKey(input, 'Enter');
  ctx.fixture.detectChanges();
}

// Portaled picker helpers (mirrors select.spec.ts / combobox.spec.ts).

async function findPortaledDropdown(
  fixture: ComponentFixture<unknown>,
  selector: string,
  timeoutMs: number,
): Promise<HTMLElement | null> {
  const timeout = Date.now() + timeoutMs;

  while (Date.now() < timeout) {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const dropdown = document.querySelector<HTMLElement>(selector);
    if (dropdown) return dropdown;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return null;
}

async function openPortaledDropdown(
  fixture: ComponentFixture<unknown>,
  selector: string,
  attempts: ReadonlyArray<() => void>,
): Promise<HTMLElement> {
  for (const attempt of attempts) {
    attempt();
    const dropdown = await findPortaledDropdown(fixture, selector, 250);
    if (dropdown) return dropdown;
  }

  const dropdown = await findPortaledDropdown(fixture, selector, 1000);
  if (dropdown) return dropdown;
  throw new Error(`Expected ${selector}.`);
}

async function waitForPortaledDropdownRemoval(
  fixture: ComponentFixture<unknown>,
  selector: string,
): Promise<void> {
  const timeout = Date.now() + 3000;

  while (Date.now() < timeout) {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    if (!document.querySelector(selector)) return;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  throw new Error(`Expected ${selector} to be removed.`);
}

function cleanupPortaledTestElements(selector: string): void {
  for (const element of document.querySelectorAll(selector)) element.remove();
}

async function openSelectDropdown(ctx: ConformanceContext): Promise<HTMLElement> {
  const trigger = query<HTMLButtonElement>(ctx.root, 'button[hellSelect]');
  return openPortaledDropdown(ctx.fixture, '[hellSelectDropdown]', [
    () => trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })),
    () => pressKey(trigger, 'ArrowDown'),
    () => pressKey(trigger, 'Enter'),
    () =>
      trigger.dispatchEvent(
        new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true }),
      ),
  ]);
}

async function openComboboxDropdown(ctx: ConformanceContext): Promise<HTMLElement> {
  const input = query<HTMLInputElement>(ctx.root, 'input[hellComboboxInput]');
  const button = query<HTMLButtonElement>(ctx.root, 'button[hellComboboxButton]');
  return openPortaledDropdown(ctx.fixture, '[hellComboboxDropdown]', [
    () => button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })),
    () => pressKey(input, 'ArrowDown'),
  ]);
}

// jsdom has no Web Animations API; the select/combobox exit transitions ask
// for element.getAnimations() before removal (mirrors their component specs).
const nativeGetAnimations = HTMLElement.prototype.getAnimations;

beforeAll(() => {
  if (!nativeGetAnimations) {
    Object.defineProperty(HTMLElement.prototype, 'getAnimations', {
      configurable: true,
      value: () => [],
    });
  }
});

afterAll(() => {
  if (!nativeGetAnimations) delete (HTMLElement.prototype as Partial<HTMLElement>).getAnimations;
});

// ---------------------------------------------------------------------------
// Value formatting helpers for typed text inputs
// ---------------------------------------------------------------------------

function formatDate(date: Date | null): string {
  if (!date) return '';
  const year = date.getFullYear().toString().padStart(4, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function time(hour: number, minute = 0, second = 0): HellTimeValue {
  return { hour, minute, second };
}

function formatTime(value: HellTimeValue | null): string {
  if (!value) return '';
  const pad = (part: number): string => part.toString().padStart(2, '0');
  return `${pad(value.hour)}:${pad(value.minute)}`;
}

// ---------------------------------------------------------------------------
// Code editor runtime seam (mirrors code-editor.spec.ts's fake runtime)
// ---------------------------------------------------------------------------

class ConformanceCodeEditorRuntime implements HellCodeEditorRuntimePort {
  document: string;
  readOnly: boolean;

  constructor(readonly options: HellCodeEditorRuntimeOptions) {
    this.document = options.value;
    this.readOnly = options.readOnly;
  }

  /** Editor-originated edit: updates the live document and echoes the change. */
  edit(next: string): void {
    this.document = next;
    this.options.onValueChange(next);
  }

  setValue(next: string): void {
    this.document = next;
  }

  setExtensions(): void {
    // Extensions are irrelevant to the value-authority contract.
  }

  setReadOnly(readOnly: boolean): void {
    this.readOnly = readOnly;
  }

  setAccessibility(options: HellCodeEditorRuntimeAccessibilityOptions): void {
    this.readOnly = options.readOnly;
  }

  destroy(): void {
    // Nothing to release.
  }
}

let codeEditorRuntime: ConformanceCodeEditorRuntime | null = null;

function requireCodeEditorRuntime(): ConformanceCodeEditorRuntime {
  if (!codeEditorRuntime) throw new Error('Expected the code editor runtime to be created.');
  return codeEditorRuntime;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const REGISTRY: readonly RegisteredConformanceEntry[] = [
  conformanceEntry<boolean>({
    name: 'checkbox',
    signalFormsRole: 'FormCheckboxControl',
    imports: [HellCheckbox],
    template: (control) =>
      `<button hellCheckbox aria-label="Conformance checkbox" ${control}></button>`,
    valueProp: 'checked',
    changeOutput: 'checkedChange',
    initial: false,
    programmatic: true,
    commitResult: (previous) => !previous,
    commit: (ctx) => click(ctx, 'button[hellCheckbox]'),
    touch: (ctx) => blur(ctx, 'button[hellCheckbox]'),
    expectValue: (ctx, value) => {
      expect(query(ctx.root, 'button[hellCheckbox]').getAttribute('aria-checked')).toBe(
        String(value),
      );
    },
    expectDisabled: (ctx) => {
      expect(query<HTMLButtonElement>(ctx.root, 'button[hellCheckbox]').disabled).toBe(true);
    },
    commitWhileDisabledIsIgnored: true,
  }),

  conformanceEntry<boolean>({
    name: 'switch',
    signalFormsRole: 'FormCheckboxControl',
    imports: [HellSwitch],
    template: (control) =>
      `<button hellSwitch aria-label="Conformance switch" ${control}></button>`,
    valueProp: 'checked',
    changeOutput: 'checkedChange',
    initial: false,
    programmatic: true,
    commitResult: (previous) => !previous,
    commit: (ctx) => click(ctx, 'button[hellSwitch]'),
    touch: (ctx) => blur(ctx, 'button[hellSwitch]'),
    expectValue: (ctx, value) => {
      expect(query(ctx.root, 'button[hellSwitch]').getAttribute('aria-checked')).toBe(
        String(value),
      );
    },
    expectDisabled: (ctx) => {
      expect(query<HTMLButtonElement>(ctx.root, 'button[hellSwitch]').disabled).toBe(true);
    },
    commitWhileDisabledIsIgnored: true,
  }),

  conformanceEntry<string | null>({
    name: 'radio group',
    signalFormsRole: 'FormValueControl',
    imports: [HellRadioGroup, HellRadio],
    template: (control) => `
      <div hellRadioGroup aria-label="Conformance plan" orientation="horizontal" ${control}>
        <button hellRadio type="button" value="a">A</button>
        <button hellRadio type="button" value="b">B</button>
      </div>
    `,
    valueProp: 'value',
    changeOutput: 'valueChange',
    initial: null,
    programmatic: 'b',
    commitResult: () => 'a',
    commit: (ctx) => click(ctx, 'button[hellRadio][value="a"]'),
    touch: (ctx) => focusoutToNull(ctx, '[hellRadioGroup]'),
    expectValue: (ctx, value) => {
      for (const option of ['a', 'b']) {
        expect(
          query(ctx.root, `button[hellRadio][value="${option}"]`).getAttribute('aria-checked'),
        ).toBe(String(value === option));
      }
    },
    expectDisabled: (ctx) => {
      expect(query<HTMLButtonElement>(ctx.root, 'button[hellRadio][value="a"]').disabled).toBe(
        true,
      );
      expect(query<HTMLButtonElement>(ctx.root, 'button[hellRadio][value="b"]').disabled).toBe(
        true,
      );
    },
    commitWhileDisabledIsIgnored: true,
    signalSchema: (path) => {
      requiredSchema(path.value);
    },
    expectSignalMetadata: ({ ctx, field }) => {
      // The field's required() metadata drives the reserved required input.
      expect(query(ctx.root, '[hellRadioGroup]').getAttribute('aria-required')).toBe('true');
      expect(query(ctx.root, '[hellRadioGroup]').getAttribute('data-required')).toBe('true');
      expect(field().invalid()).toBe(true);
    },
    expectSignalAfterCommit: ({ field }) => {
      expect(field().invalid()).toBe(false);
    },
  }),

  conformanceEntry<string | null>({
    name: 'toggle group (single)',
    signalFormsRole: 'FormValueControl',
    imports: [HellToggleGroup, HellToggleGroupItem],
    template: (control) => `
      <div hellToggleGroup type="single" aria-label="Conformance align" ${control}>
        <button hellToggleGroupItem value="left" type="button">Left</button>
        <button hellToggleGroupItem value="right" type="button">Right</button>
      </div>
      <button data-testid="outside" type="button">Outside</button>
    `,
    valueProp: 'value',
    changeOutput: 'valueChange',
    initial: null,
    programmatic: 'right',
    commitResult: () => 'left',
    commit: (ctx) => click(ctx, '[hellToggleGroupItem][value="left"]'),
    touch: (ctx) => {
      query(ctx.root, '[hellToggleGroup]').dispatchEvent(
        new FocusEvent('focusout', {
          bubbles: true,
          relatedTarget: query(ctx.root, '[data-testid="outside"]'),
        }),
      );
      ctx.fixture.detectChanges();
    },
    expectValue: (ctx, value) => {
      for (const option of ['left', 'right']) {
        expect(
          query(ctx.root, `[hellToggleGroupItem][value="${option}"]`).hasAttribute(
            'data-selected',
          ),
        ).toBe(value === option);
      }
    },
    expectDisabled: (ctx) => {
      expect(query(ctx.root, '[hellToggleGroup]').hasAttribute('data-disabled')).toBe(true);
    },
    commitWhileDisabledIsIgnored: true,
  }),

  conformanceEntry<readonly string[]>({
    name: 'toggle group (multiple)',
    signalFormsRole: 'FormValueControl',
    imports: [HellToggleGroup, HellToggleGroupItem],
    template: (control) => `
      <div hellToggleGroup type="multiple" aria-label="Conformance format" ${control}>
        <button hellToggleGroupItem value="bold" type="button">Bold</button>
        <button hellToggleGroupItem value="italic" type="button">Italic</button>
      </div>
      <button data-testid="outside" type="button">Outside</button>
    `,
    valueProp: 'value',
    changeOutput: 'valueChange',
    initial: ['italic'],
    programmatic: [],
    commitResult: (previous) =>
      previous.includes('bold')
        ? previous.filter((value) => value !== 'bold')
        : [...previous, 'bold'],
    commit: (ctx) => click(ctx, '[hellToggleGroupItem][value="bold"]'),
    touch: (ctx) => {
      query(ctx.root, '[hellToggleGroup]').dispatchEvent(
        new FocusEvent('focusout', {
          bubbles: true,
          relatedTarget: query(ctx.root, '[data-testid="outside"]'),
        }),
      );
      ctx.fixture.detectChanges();
    },
    expectValue: (ctx, value) => {
      for (const option of ['bold', 'italic']) {
        expect(
          query(ctx.root, `[hellToggleGroupItem][value="${option}"]`).hasAttribute(
            'data-selected',
          ),
        ).toBe(value.includes(option));
      }
    },
    expectDisabled: (ctx) => {
      expect(query(ctx.root, '[hellToggleGroup]').hasAttribute('data-disabled')).toBe(true);
    },
    commitWhileDisabledIsIgnored: true,
  }),

  conformanceEntry<number>({
    name: 'slider',
    signalFormsRole: 'FormValueControl',
    imports: [HellSlider],
    template: (control) => `<hell-slider aria-label="Conformance volume" ${control} />`,
    valueProp: 'value',
    changeOutput: 'valueChange',
    initial: 30,
    programmatic: 60,
    commitResult: (previous) => previous + 1,
    commit: (ctx) => {
      pressKey(query(ctx.root, '[data-slot="thumb"]'), 'ArrowRight');
      ctx.fixture.detectChanges();
    },
    touch: (ctx) => focusoutToNull(ctx, 'hell-slider'),
    expectValue: (ctx, value) => {
      expect(query(ctx.root, '[data-slot="thumb"]').getAttribute('aria-valuenow')).toBe(
        String(value),
      );
    },
    expectDisabled: (ctx) => {
      expect(query(ctx.root, '[data-slot="thumb"]').hasAttribute('data-disabled')).toBe(true);
      expect(query(ctx.root, '[data-slot="thumb"]').getAttribute('aria-disabled')).toBe('true');
    },
    commitWhileDisabledIsIgnored: true,
    signalSchema: (path) => {
      maxSchema(path.value, 95);
    },
    expectSignalMetadata: ({ ctx }) => {
      // The field's max validator metadata drives the slider's own max bound.
      expect(query(ctx.root, '[data-slot="thumb"]').getAttribute('aria-valuemax')).toBe('95');
    },
  }),

  conformanceEntry<number | null>({
    name: 'number input',
    signalFormsRole: 'FormValueControl',
    imports: [HellNumberInput, HellNumberStep],
    template: (control) => `
      <input #number="hellNumberInput" hellNumberInput aria-label="Conformance number" ${control} />
      <button data-testid="increment" hellNumberStep="increment" [hellNumberStepFor]="number">
        +
      </button>
    `,
    valueProp: 'value',
    changeOutput: 'valueChange',
    initial: 10,
    programmatic: 25,
    commitResult: () => 40,
    commit: (ctx) => typeAndEnter(ctx, 'input[hellNumberInput]', '40'),
    touch: (ctx) => blur(ctx, 'input[hellNumberInput]'),
    expectValue: (ctx, value) => {
      expect(query<HTMLInputElement>(ctx.root, 'input[hellNumberInput]').value).toBe(
        value === null ? '' : String(value),
      );
    },
    expectDisabled: (ctx) => {
      expect(query<HTMLInputElement>(ctx.root, 'input[hellNumberInput]').disabled).toBe(true);
      expect(
        query(ctx.root, 'input[hellNumberInput]').hasAttribute('data-disabled'),
      ).toBe(true);
    },
    signalSchema: (path) => {
      minSchema(path.value, 1);
      maxSchema(path.value, 65535);
    },
    expectSignalMetadata: ({ ctx }) => {
      // The field's min()/max() validator metadata drives the input's own
      // bounds, including the static spinbutton ARIA metadata.
      expect(query(ctx.root, 'input[hellNumberInput]').getAttribute('aria-valuemin')).toBe('1');
      expect(query(ctx.root, 'input[hellNumberInput]').getAttribute('aria-valuemax')).toBe(
        '65535',
      );
    },
    expectSignalAfterCommit: async ({ ctx, field }) => {
      // Metadata-driven bounds also clamp stepping: End jumps to the field
      // max, and the increment stepper disables at that bound.
      pressKey(query(ctx.root, 'input[hellNumberInput]'), 'End');
      await settle(ctx.fixture);
      expect(field().value()).toBe(65535);
      expect(
        query<HTMLButtonElement>(ctx.root, '[data-testid="increment"]').disabled,
      ).toBe(true);
    },
  }),

  conformanceEntry<Date | null>({
    name: 'date input',
    signalFormsRole: 'FormValueControl',
    imports: [HellDateInput],
    template: (control) => `<input hellDateInput aria-label="Conformance date" ${control} />`,
    valueProp: 'value',
    changeOutput: 'valueChange',
    initial: new Date(2026, 3, 22),
    programmatic: new Date(2026, 3, 25),
    commitResult: () => new Date(2026, 3, 28),
    commit: (ctx) => typeAndEnter(ctx, 'input[hellDateInput]', '2026-04-28'),
    touch: (ctx) => {
      query(ctx.root, 'input[hellDateInput]').dispatchEvent(
        new Event('blur', { bubbles: true }),
      );
      ctx.fixture.detectChanges();
    },
    expectValue: (ctx, value) => {
      expect(query<HTMLInputElement>(ctx.root, 'input[hellDateInput]').value).toBe(
        formatDate(value),
      );
    },
    expectDisabled: (ctx) => {
      expect(query<HTMLInputElement>(ctx.root, 'input[hellDateInput]').disabled).toBe(true);
      expect(query(ctx.root, 'input[hellDateInput]').hasAttribute('data-disabled')).toBe(true);
    },
    signalSchema: (path) => {
      minDateSchema(path.value, new Date(2026, 3, 1));
      maxDateSchema(path.value, new Date(2026, 3, 30));
    },
    expectSignalMetadata: ({ ctx }) => {
      // The field's minDate()/maxDate() validator metadata drives the input's
      // own bounds, including the stable native attributes.
      expect(query(ctx.root, 'input[hellDateInput]').getAttribute('min')).toBe('2026-04-01');
      expect(query(ctx.root, 'input[hellDateInput]').getAttribute('max')).toBe('2026-04-30');
    },
  }),

  conformanceEntry<HellTimeValue | null>({
    name: 'time input',
    signalFormsRole: 'FormValueControl',
    imports: [HellTimeInput],
    template: (control) => `<input hellTimeInput aria-label="Conformance time" ${control} />`,
    valueProp: 'value',
    changeOutput: 'valueChange',
    initial: time(8, 30),
    programmatic: time(12, 45),
    commitResult: () => time(13, 15),
    commit: (ctx) => typeAndEnter(ctx, 'input[hellTimeInput]', '13:15'),
    touch: (ctx) => {
      query(ctx.root, 'input[hellTimeInput]').dispatchEvent(
        new Event('blur', { bubbles: true }),
      );
      ctx.fixture.detectChanges();
    },
    expectValue: (ctx, value) => {
      expect(query<HTMLInputElement>(ctx.root, 'input[hellTimeInput]').value).toBe(
        formatTime(value),
      );
    },
    expectDisabled: (ctx) => {
      expect(query<HTMLInputElement>(ctx.root, 'input[hellTimeInput]').disabled).toBe(true);
      expect(query(ctx.root, 'input[hellTimeInput]').hasAttribute('data-disabled')).toBe(true);
    },
  }),

  conformanceEntry<string | null>({
    name: 'select',
    signalFormsRole: 'FormValueControl',
    imports: [...HELL_SELECT_IMPORTS],
    template: (control) => `
      <button hellSelect type="button" aria-label="Conformance select" ${control}>
        <span hellSelectValue>Selection</span>
        <div *hellSelectPortal hellSelectDropdown>
          <div hellSelectOption value="low">Low</div>
          <div hellSelectOption value="high">High</div>
        </div>
      </button>
    `,
    valueProp: 'value',
    changeOutput: 'valueChange',
    initial: null,
    programmatic: 'high',
    commitResult: () => 'low',
    commit: async (ctx) => {
      const dropdown = await openSelectDropdown(ctx);
      query<HTMLElement>(dropdown, '[hellSelectOption][value="low"]').click();
      await waitForPortaledDropdownRemoval(ctx.fixture, '[hellSelectDropdown]');
    },
    touch: (ctx) => focusoutToNull(ctx, 'button[hellSelect]'),
    expectDisabled: (ctx) => {
      expect(query(ctx.root, 'button[hellSelect]').getAttribute('data-disabled')).toBe('');
      expect(query<HTMLButtonElement>(ctx.root, 'button[hellSelect]').tabIndex).toBe(-1);
    },
    signalSchema: (path) => {
      requiredSchema(path.value);
    },
    expectSignalMetadata: ({ field }) => {
      expect(field().invalid()).toBe(true);
    },
    expectSignalAfterCommit: ({ field }) => {
      expect(field().invalid()).toBe(false);
    },
    cleanup: () => cleanupPortaledTestElements('[hellSelectDropdown]'),
  }),

  conformanceEntry<string | null>({
    name: 'combobox (single)',
    signalFormsRole: 'FormValueControl',
    imports: [...HELL_COMBOBOX_IMPORTS],
    template: (control) => `
      <div hellCombobox ${control}>
        <input hellComboboxInput aria-label="Conformance assignee" />
        <button hellComboboxButton type="button" aria-label="Toggle assignees"></button>
        <div *hellComboboxPortal hellComboboxDropdown>
          <div hellComboboxOption value="atlas">Atlas</div>
          <div hellComboboxOption value="nova">Nova</div>
        </div>
      </div>
    `,
    valueProp: 'value',
    changeOutput: 'valueChange',
    initial: null,
    programmatic: 'nova',
    commitResult: () => 'atlas',
    commit: async (ctx) => {
      const dropdown = await openComboboxDropdown(ctx);
      query<HTMLElement>(dropdown, '[hellComboboxOption][value="atlas"]').click();
      await waitForPortaledDropdownRemoval(ctx.fixture, '[hellComboboxDropdown]');
    },
    touch: (ctx) => focusoutToNull(ctx, '[hellCombobox]'),
    expectDisabled: (ctx) => {
      expect(query(ctx.root, '[hellCombobox]').getAttribute('data-disabled')).toBe('');
      expect(query<HTMLInputElement>(ctx.root, 'input[hellComboboxInput]').disabled).toBe(true);
    },
    cleanup: () => cleanupPortaledTestElements('[hellComboboxDropdown]'),
  }),

  conformanceEntry<readonly string[]>({
    name: 'combobox (multiple)',
    signalFormsRole: 'FormValueControl',
    imports: [...HELL_COMBOBOX_IMPORTS],
    template: (control) => `
      <div hellCombobox multiple ${control}>
        <input hellComboboxInput aria-label="Conformance assignees" />
        <button hellComboboxButton type="button" aria-label="Toggle assignees"></button>
        <div *hellComboboxPortal hellComboboxDropdown>
          <div hellComboboxOption value="atlas">Atlas</div>
          <div hellComboboxOption value="nova">Nova</div>
        </div>
      </div>
    `,
    valueProp: 'value',
    changeOutput: 'valueChange',
    initial: [],
    programmatic: ['nova'],
    commitResult: (previous) =>
      previous.includes('atlas')
        ? previous.filter((value) => value !== 'atlas')
        : [...previous, 'atlas'],
    commit: async (ctx) => {
      // Multiple mode keeps the dropdown open across selection commits.
      const dropdown = await openComboboxDropdown(ctx);
      query<HTMLElement>(dropdown, '[hellComboboxOption][value="atlas"]').click();
      await settle(ctx.fixture);
    },
    touch: (ctx) => focusoutToNull(ctx, '[hellCombobox]'),
    expectDisabled: (ctx) => {
      expect(query(ctx.root, '[hellCombobox]').getAttribute('data-disabled')).toBe('');
      expect(query<HTMLInputElement>(ctx.root, 'input[hellComboboxInput]').disabled).toBe(true);
    },
    cleanup: () => cleanupPortaledTestElements('[hellComboboxDropdown]'),
  }),

  conformanceEntry<string>({
    name: 'code editor',
    signalFormsRole: 'FormValueControl',
    imports: [HellCodeEditor],
    providers: () => {
      codeEditorRuntime = null;
      return [
        {
          provide: HELL_CODE_EDITOR_RUNTIME_FACTORY,
          useValue: (options: HellCodeEditorRuntimeOptions) =>
            (codeEditorRuntime = new ConformanceCodeEditorRuntime(options)),
        },
      ];
    },
    template: (control) => `<hell-code-editor ${control} />`,
    valueProp: 'value',
    changeOutput: 'valueChange',
    initial: 'alpha',
    programmatic: 'beta',
    commitResult: () => 'gamma',
    commit: () => {
      requireCodeEditorRuntime().edit('gamma');
    },
    touch: (ctx) => {
      query(ctx.root, 'hell-code-editor div').dispatchEvent(
        new FocusEvent('focusout', { bubbles: true }),
      );
      ctx.fixture.detectChanges();
    },
    expectValue: (_ctx, value) => {
      expect(requireCodeEditorRuntime().document).toBe(value);
    },
    expectDisabled: (ctx) => {
      // Forms-driven disabled state maps onto the read-only editor policy.
      expect(requireCodeEditorRuntime().readOnly).toBe(true);
      expect(query(ctx.root, 'hell-code-editor').getAttribute('data-readonly')).toBe('true');
    },
  }),
];

describe('Forms Integration Conformance', () => {
  for (const entry of REGISTRY) entry.register();
});
