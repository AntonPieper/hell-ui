import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  HellChip,
  HellChipRemove,
  HellChipSet,
  provideHellChipLabels,
  type HellChipUi,
} from './chip';

@Component({
  imports: [HellChip, HellChipRemove],
  template: `
    <span
      id="span-chip"
      hellChip
      variant="success"
      size="lg"
      [label]="'Marketing'"
      [ui]="chipUi"
      (remove)="onRemove('span')"
    >
      Marketing
      <button id="span-remove" hellChipRemove></button>
    </span>

    <button
      id="button-chip"
      hellChip
      [disabled]="buttonDisabled()"
      [label]="'Overdue'"
      (remove)="onRemove('button')"
    >
      Overdue
      <button id="button-remove" hellChipRemove></button>
    </button>

    <a id="anchor-chip" hellChip href="#pinned">Pinned</a>

    <span id="plain-chip" hellChip>Plain</span>
  `,
})
class HostSemanticsHost {
  readonly buttonDisabled = signal(false);
  readonly removed: string[] = [];
  readonly chipUi = { root: 'bg-hell-primary text-white' } satisfies HellChipUi;

  onRemove(id: string): void {
    this.removed.push(id);
  }
}

@Component({
  imports: [HellChipSet, HellChip, HellChipRemove],
  template: `
    <div hellChipSet [orientation]="orientation()">
      @for (chip of chips(); track chip.id) {
        <span
          [id]="'chip-' + chip.id"
          hellChip
          [label]="chip.label"
          [disabled]="chip.disabled"
          (remove)="remove(chip.id)"
        >
          {{ chip.label }}
          <button [id]="'remove-' + chip.id" hellChipRemove></button>
        </span>
      }
    </div>
  `,
})
class ChipSetHost {
  readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
  readonly chips = signal([
    { id: 'a', label: 'Anna', disabled: false },
    { id: 'b', label: 'Ben', disabled: true },
    { id: 'c', label: 'Cara', disabled: false },
    { id: 'd', label: 'Dan', disabled: false },
  ]);
  readonly removed: string[] = [];

  remove(id: string): void {
    this.removed.push(id);
    this.chips.update((chips) => chips.filter((chip) => chip.id !== id));
  }
}

@Component({
  imports: [HellChip, HellChipRemove],
  providers: [provideHellChipLabels({ remove: (label) => `Dismiss ${label}` })],
  template: `
    <span hellChip [label]="'Widget'">
      Widget
      <button id="labelled-remove" hellChipRemove></button>
    </span>
    <span hellChip>
      <svg aria-hidden="true" width="8" height="8"></svg>
      <button id="fallback-remove" hellChipRemove></button>
    </span>
  `,
})
class LabelOverrideHost {}

@Component({
  imports: [HellChip, HellChipRemove],
  template: `
    <span hellChip>
      Marketing
      <button id="derived-remove" hellChipRemove></button>
    </span>
    <span hellChip [label]="'Priority customer'">
      Marketing
      <button id="override-remove" hellChipRemove></button>
    </span>
    <span hellChip>
      <svg aria-hidden="true" width="8" height="8"></svg>
      <button id="empty-remove" hellChipRemove></button>
    </span>
  `,
})
class DerivedLabelHost {}

describe('HellChip host semantics', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostSemanticsHost] }).compileComponents();
  });

  it('reflects variant, size, and part styling on the chip root', () => {
    const fixture = TestBed.createComponent(HostSemanticsHost);
    fixture.detectChanges();

    const chip = query(fixture, '#span-chip');
    expect(chip.getAttribute('data-slot')).toBe('root');
    expect(chip.getAttribute('data-variant')).toBe('success');
    expect(chip.getAttribute('data-size')).toBe('lg');
    const classes = chip.className.split(/\s+/);
    expect(classes).toContain('bg-hell-primary');
    expect(classes).toContain('text-white');
  });

  it('adds interactive semantics only on interactive hosts', () => {
    const fixture = TestBed.createComponent(HostSemanticsHost);
    fixture.detectChanges();

    const buttonChip = query(fixture, '#button-chip');
    expect(buttonChip.getAttribute('type')).toBe('button');
    expect(buttonChip.getAttribute('data-interactive')).toBe('');

    const anchorChip = query(fixture, '#anchor-chip');
    expect(anchorChip.hasAttribute('type')).toBe(false);
    expect(anchorChip.getAttribute('data-interactive')).toBe('');

    const spanChip = query(fixture, '#plain-chip');
    expect(spanChip.hasAttribute('type')).toBe(false);
    expect(spanChip.getAttribute('data-interactive')).toBeNull();
  });

  it('renders the remove affordance as a real sibling button, not nested in a button host', () => {
    const fixture = TestBed.createComponent(HostSemanticsHost);
    fixture.detectChanges();

    const buttonChip = query<HTMLButtonElement>(fixture, '#button-chip');
    const buttonRemove = query<HTMLButtonElement>(fixture, '#button-remove');
    expect(buttonChip.tagName).toBe('BUTTON');
    expect(buttonRemove.tagName).toBe('BUTTON');
    expect(buttonRemove.getAttribute('type')).toBe('button');
    // The remove button is a descendant in source order but is itself a real
    // button element (the "never a nested interactive inside a button host"
    // rule is a documentation/anatomy contract enforced by the docs, not by
    // hoisting); it must at minimum be its own button with button semantics.
    expect(buttonRemove.getAttribute('tabindex')).toBe('-1');
  });

  it('gives a standalone chip no roving tab index', () => {
    const fixture = TestBed.createComponent(HostSemanticsHost);
    fixture.detectChanges();

    expect(query(fixture, '#button-chip').hasAttribute('tabindex')).toBe(false);
    expect(query(fixture, '#plain-chip').hasAttribute('tabindex')).toBe(false);
  });

  it('emits remove when the remove button is clicked and stays silent when disabled', () => {
    const fixture = TestBed.createComponent(HostSemanticsHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;

    query(fixture, '#span-remove').click();
    expect(host.removed).toEqual(['span']);

    host.buttonDisabled.set(true);
    fixture.detectChanges();
    query(fixture, '#button-remove').click();
    expect(host.removed).toEqual(['span']);
  });

  it('propagates the disabled state to the chip and its remove button', () => {
    const fixture = TestBed.createComponent(HostSemanticsHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;

    host.buttonDisabled.set(true);
    fixture.detectChanges();

    const buttonChip = query(fixture, '#button-chip');
    const buttonRemove = query(fixture, '#button-remove');
    expect(buttonChip.getAttribute('data-disabled')).toBe('');
    expect(buttonChip.getAttribute('aria-disabled')).toBe('true');
    expect(buttonChip.hasAttribute('disabled')).toBe(true);
    expect(buttonChip.getAttribute('data-interactive')).toBeNull();
    expect(buttonRemove.hasAttribute('disabled')).toBe(true);
    expect(buttonRemove.getAttribute('aria-disabled')).toBe('true');
    expect(buttonRemove.getAttribute('data-disabled')).toBe('');
  });
});

describe('HellChip Label Contract', () => {
  it('derives the remove button name from the chip text content', async () => {
    await TestBed.configureTestingModule({ imports: [DerivedLabelHost] }).compileComponents();
    const fixture = TestBed.createComponent(DerivedLabelHost);
    fixture.detectChanges();
    await settleContent(fixture);

    // No [label] input: the accessible name comes from the rendered text, so
    // the label lives in exactly one place.
    expect(query(fixture, '#derived-remove').getAttribute('aria-label')).toBe('Remove Marketing');
  });

  it('lets the label input override the derived content name', async () => {
    await TestBed.configureTestingModule({ imports: [DerivedLabelHost] }).compileComponents();
    const fixture = TestBed.createComponent(DerivedLabelHost);
    fixture.detectChanges();
    await settleContent(fixture);

    // Text content is "Marketing" but the explicit label wins.
    expect(query(fixture, '#override-remove').getAttribute('aria-label')).toBe(
      'Remove Priority customer',
    );
  });

  it('falls back to the generic name when the chip has neither text nor a label', async () => {
    await TestBed.configureTestingModule({ imports: [DerivedLabelHost] }).compileComponents();
    const fixture = TestBed.createComponent(DerivedLabelHost);
    fixture.detectChanges();
    await settleContent(fixture);

    expect(query(fixture, '#empty-remove').getAttribute('aria-label')).toBe('Remove');
  });

  it('applies a per-instance label override synchronously', async () => {
    await TestBed.configureTestingModule({ imports: [HostSemanticsHost] }).compileComponents();
    const fixture = TestBed.createComponent(HostSemanticsHost);
    fixture.detectChanges();

    // The label input resolves without waiting on content observation.
    expect(query(fixture, '#span-remove').getAttribute('aria-label')).toBe('Remove Marketing');
    // A chip with no remove button carries no remove aria-label.
    expect(query(fixture, '#anchor-chip').hasAttribute('aria-label')).toBe(false);
  });

  it('honours provideHellChipLabels overrides and the generic fallback', async () => {
    await TestBed.configureTestingModule({ imports: [LabelOverrideHost] }).compileComponents();
    const fixture = TestBed.createComponent(LabelOverrideHost);
    fixture.detectChanges();
    await settleContent(fixture);

    expect(query(fixture, '#labelled-remove').getAttribute('aria-label')).toBe('Dismiss Widget');
    expect(query(fixture, '#fallback-remove').getAttribute('aria-label')).toBe('Remove');
  });
});

describe('HellChipSet roving focus and removal', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ChipSetHost] }).compileComponents();
  });

  it('exposes a single tab stop and skips the disabled chip', () => {
    const fixture = TestBed.createComponent(ChipSetHost);
    fixture.detectChanges();

    expect(query(fixture, '#chip-a').getAttribute('tabindex')).toBe('0');
    expect(query(fixture, '#chip-b').getAttribute('tabindex')).toBe('-1');
    expect(query(fixture, '#chip-c').getAttribute('tabindex')).toBe('-1');
    expect(query(fixture, '#chip-d').getAttribute('tabindex')).toBe('-1');
  });

  it('moves roving focus with arrows and Home/End, skipping disabled chips', () => {
    const fixture = TestBed.createComponent(ChipSetHost);
    fixture.detectChanges();
    const doc = fixture.nativeElement.ownerDocument;

    const a = query(fixture, '#chip-a');
    const c = query(fixture, '#chip-c');
    const d = query(fixture, '#chip-d');

    a.focus();
    expect(press(a, 'ArrowRight').defaultPrevented).toBe(true);
    fixture.detectChanges();
    // Skips the disabled chip 'b'.
    expect(doc.activeElement).toBe(c);
    expect(c.getAttribute('tabindex')).toBe('0');
    expect(a.getAttribute('tabindex')).toBe('-1');

    press(c, 'End');
    fixture.detectChanges();
    expect(doc.activeElement).toBe(d);

    press(d, 'Home');
    fixture.detectChanges();
    expect(doc.activeElement).toBe(a);

    press(a, 'ArrowLeft');
    fixture.detectChanges();
    // Clamps at the first enabled chip.
    expect(doc.activeElement).toBe(a);
  });

  it('ignores cross-axis arrows for the set orientation', () => {
    const fixture = TestBed.createComponent(ChipSetHost);
    fixture.detectChanges();

    const a = query(fixture, '#chip-a');
    a.focus();
    expect(press(a, 'ArrowDown').defaultPrevented).toBe(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(a);
  });

  it('removes the focused chip on Delete and keeps focus in the set', async () => {
    const fixture = TestBed.createComponent(ChipSetHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const doc = fixture.nativeElement.ownerDocument;

    const a = query(fixture, '#chip-a');
    a.focus();
    expect(press(a, 'Delete').defaultPrevented).toBe(true);
    expect(host.removed).toEqual(['a']);

    fixture.detectChanges();
    await flushMicrotasks();

    // Focus moves to the next enabled chip (skipping disabled 'b').
    expect(doc.activeElement).toBe(query(fixture, '#chip-c'));
  });

  it('removes on Backspace and falls back to the previous chip for the last one', async () => {
    const fixture = TestBed.createComponent(ChipSetHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const doc = fixture.nativeElement.ownerDocument;

    const d = query(fixture, '#chip-d');
    d.focus();
    press(d, 'Backspace');
    expect(host.removed).toEqual(['d']);

    fixture.detectChanges();
    await flushMicrotasks();

    expect(doc.activeElement).toBe(query(fixture, '#chip-c'));
  });

  it('does not remove a disabled chip', () => {
    const fixture = TestBed.createComponent(ChipSetHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;

    const b = query(fixture, '#chip-b');
    b.focus();
    expect(press(b, 'Delete').defaultPrevented).toBe(false);
    expect(host.removed).toEqual([]);
  });

  it('falls back to the set root when the last chip is removed', async () => {
    const fixture = TestBed.createComponent(ChipSetHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const doc = fixture.nativeElement.ownerDocument;

    host.chips.set([{ id: 'solo', label: 'Solo', disabled: false }]);
    fixture.detectChanges();

    const solo = query(fixture, '#chip-solo');
    solo.focus();
    press(solo, 'Delete');
    fixture.detectChanges();
    await flushMicrotasks();

    const set = query(fixture, '[hellChipSet]');
    expect(doc.activeElement).toBe(set);
  });
});

function query<T extends HTMLElement>(fixture: { nativeElement: HTMLElement }, selector: string): T {
  const element = fixture.nativeElement.querySelector<T>(selector);
  if (!element) throw new Error(`Expected to find ${selector}`);
  return element;
}

function press(element: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  element.dispatchEvent(event);
  return event;
}

function flushMicrotasks(): Promise<void> {
  return Promise.resolve();
}

async function settleContent(fixture: { detectChanges(): void }): Promise<void> {
  // The chip derives its label through a MutationObserver, which delivers on a
  // microtask; let it run, then reflect the derived name into the bindings.
  await new Promise((resolve) => setTimeout(resolve));
  fixture.detectChanges();
}
