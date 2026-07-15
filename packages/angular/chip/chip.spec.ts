import { provideHellLabels } from '@hell-ui/angular/core';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  HellBadge,
  HellChip,
  HellChipInput,
  HellChipRemove,
  HellChipSet,
  HellKbd,
  HELL_CHIP_LABELS,
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
  readonly chipUi = { root: 'bg-hell-primary text-white' };

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
  imports: [HellChipSet, HellChipInput, HellChip, HellChipRemove],
  template: `
    <div hellChipSet aria-label="Recipients">
      @for (chip of chips(); track chip.id) {
        <span
          [id]="'input-chip-' + chip.id"
          hellChip
          [disabled]="chip.disabled"
          (remove)="remove(chip.id)"
        >
          {{ chip.label }}
          @if (chip.removable) {
            <button hellChipRemove></button>
          }
        </span>
      }
      <input id="chip-input" hellChipInput [value]="inputValue()" />
    </div>
  `,
})
class ChipInputHost {
  readonly inputValue = signal('');
  readonly chips = signal([
    { id: 'a', label: 'Anna', disabled: false, removable: true },
    { id: 'b', label: 'Ben', disabled: true, removable: true },
    { id: 'c', label: 'Cara', disabled: false, removable: true },
    { id: 'd', label: 'Dan', disabled: true, removable: true },
  ]);
  readonly removed: string[] = [];

  remove(id: string): void {
    this.removed.push(id);
    this.chips.update((chips) => chips.filter((chip) => chip.id !== id));
  }
}

@Component({
  imports: [HellChipSet, HellChipInput],
  template: `
    <div hellChipSet>
      <input hellChipInput aria-label="First chip input" />
      <input hellChipInput aria-label="Second chip input" />
    </div>
  `,
})
class MultipleChipInputsHost {}

@Component({
  imports: [HellChip, HellChipRemove],
  providers: [provideHellLabels(HELL_CHIP_LABELS, { remove: (label) => `Dismiss ${label}` })],
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

  it('honours HELL_CHIP_LABELS overrides and the generic fallback', async () => {
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

  it('keeps ArrowRight clamped on the final chip when no chip input is present', () => {
    const fixture = TestBed.createComponent(ChipSetHost);
    fixture.detectChanges();
    const d = query(fixture, '#chip-d');

    d.focus();
    expect(press(d, 'ArrowRight').defaultPrevented).toBe(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(d);

    // Preserve the standalone set's pre-existing modifier handling. Chip Input
    // opts its composed interaction out without changing this path.
    expect(press(d, 'ArrowRight', { altKey: true }).defaultPrevented).toBe(true);
    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(d);
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

describe('HellChipInput public keyboard behavior', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChipInputHost, MultipleChipInputsHost],
    }).compileComponents();
  });

  it('uses the first empty Backspace to focus the final eligible chip and the second to remove it', async () => {
    const fixture = TestBed.createComponent(ChipInputHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const doc = fixture.nativeElement.ownerDocument;
    const input = query<HTMLInputElement>(fixture, '#chip-input');

    input.focus();
    expect(press(input, 'Backspace').defaultPrevented).toBe(true);
    fixture.detectChanges();

    const finalEligible = query(fixture, '#input-chip-c');
    expect(doc.activeElement).toBe(finalEligible);
    expect(host.removed).toEqual([]);

    expect(press(finalEligible, 'Backspace').defaultPrevented).toBe(true);
    expect(host.removed).toEqual(['c']);
    fixture.detectChanges();
    await flushMicrotasks();

    expect(doc.activeElement).toBe(input);
  });

  it('moves from an empty input to the final enabled chip with ArrowLeft and back with ArrowRight', () => {
    const fixture = TestBed.createComponent(ChipInputHost);
    fixture.detectChanges();
    const doc = fixture.nativeElement.ownerDocument;
    const input = query<HTMLInputElement>(fixture, '#chip-input');

    input.focus();
    expect(press(input, 'ArrowLeft').defaultPrevented).toBe(true);
    fixture.detectChanges();

    const finalEligible = query(fixture, '#input-chip-c');
    expect(doc.activeElement).toBe(finalEligible);
    expect(press(finalEligible, 'ArrowRight').defaultPrevented).toBe(true);
    fixture.detectChanges();

    expect(doc.activeElement).toBe(input);
  });

  it('preserves mixed-chip roving order and removal focus before the true input boundary', async () => {
    const fixture = TestBed.createComponent(ChipInputHost);
    const host = fixture.componentInstance;
    host.chips.set([
      { id: 'removable', label: 'Removable', disabled: false, removable: true },
      { id: 'fixed', label: 'Fixed', disabled: false, removable: false },
    ]);
    fixture.detectChanges();
    const doc = fixture.nativeElement.ownerDocument;
    const input = query<HTMLInputElement>(fixture, '#chip-input');
    const removable = query(fixture, '#input-chip-removable');
    const fixed = query(fixture, '#input-chip-fixed');

    input.focus();
    expect(press(input, 'ArrowLeft').defaultPrevented).toBe(true);
    expect(doc.activeElement).toBe(fixed);
    expect(press(fixed, 'ArrowRight').defaultPrevented).toBe(true);
    expect(doc.activeElement).toBe(input);

    expect(press(input, 'Backspace').defaultPrevented).toBe(true);
    expect(doc.activeElement).toBe(removable);
    expect(press(removable, 'ArrowRight').defaultPrevented).toBe(true);
    expect(doc.activeElement).toBe(fixed);

    expect(press(fixed, 'ArrowRight', { altKey: true }).defaultPrevented).toBe(false);
    expect(doc.activeElement).toBe(fixed);
    expect(press(fixed, 'ArrowLeft', { altKey: true }).defaultPrevented).toBe(false);
    expect(doc.activeElement).toBe(fixed);

    removable.focus();
    expect(press(removable, 'Backspace').defaultPrevented).toBe(true);
    fixture.detectChanges();
    await flushMicrotasks();

    expect(host.removed).toEqual(['removable']);
    expect(doc.activeElement).toBe(fixed);
  });

  it('preserves native Backspace and ArrowLeft behavior while the input has text', () => {
    const fixture = TestBed.createComponent(ChipInputHost);
    const host = fixture.componentInstance;
    host.inputValue.set('draft');
    fixture.detectChanges();
    const input = query<HTMLInputElement>(fixture, '#chip-input');

    input.focus();
    expect(press(input, 'Backspace').defaultPrevented).toBe(false);
    expect(press(input, 'ArrowLeft').defaultPrevented).toBe(false);

    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(input);
    expect(host.removed).toEqual([]);
  });

  it('preserves modified Backspace and ArrowLeft shortcuts on an empty input', () => {
    const fixture = TestBed.createComponent(ChipInputHost);
    fixture.detectChanges();
    const input = query<HTMLInputElement>(fixture, '#chip-input');

    input.focus();
    expect(press(input, 'ArrowLeft', { altKey: true }).defaultPrevented).toBe(false);
    expect(press(input, 'Backspace', { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(press(input, 'ArrowLeft', { metaKey: true }).defaultPrevented).toBe(false);

    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(input);
  });

  it('rejects more than one Chip Input in the same Chip Set', () => {
    expect(() => {
      const fixture = TestBed.createComponent(MultipleChipInputsHost);
      fixture.detectChanges();
    }).toThrowError(/only one input\[hellChipInput\]/);
  });

  it('keeps Backspace native but lets ArrowLeft enter a set with no removable chip', () => {
    const fixture = TestBed.createComponent(ChipInputHost);
    const host = fixture.componentInstance;
    host.chips.set([
      { id: 'fixed', label: 'Fixed', disabled: false, removable: false },
    ]);
    fixture.detectChanges();
    const input = query<HTMLInputElement>(fixture, '#chip-input');

    input.focus();
    expect(press(input, 'Backspace').defaultPrevented).toBe(false);
    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(input);

    expect(press(input, 'ArrowLeft').defaultPrevented).toBe(true);
    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(
      query(fixture, '#input-chip-fixed'),
    );
  });
});

@Component({
  imports: [HellChip, HellBadge, HellKbd],
  template: `
    <span id="static-chip" hellChip variant="success">Ready</span>
    <span
      id="chip-string"
      hellChip
      variant="warning"
      ui="bg-hell-danger px-hell-4 text-hell-foreground-inverse"
    >
      Escalated
    </span>
    <span id="badge-string" hellBadge ui="min-w-hell-8 bg-hell-info">3</span>
    <kbd id="kbd-map" hellKbd [ui]="kbdUi">K</kbd>
  `,
})
class PillPartStyleHost {
  readonly kbdUi = {
    root: 'h-hell-6 border-hell-primary text-hell-primary',
  };
}

describe('HellChip static pill, Badge, and Kbd Part Style Maps', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PillPartStyleHost] }).compileComponents();
  });

  it('renders a standalone span chip as a non-interactive static pill with its variant', () => {
    const fixture = TestBed.createComponent(PillPartStyleHost);
    fixture.detectChanges();

    const chip = query(fixture, '#static-chip');
    expect(chip.getAttribute('data-slot')).toBe('root');
    expect(chip.getAttribute('data-variant')).toBe('success');
    expect(chip.getAttribute('data-interactive')).toBeNull();
    expect(chip.hasAttribute('tabindex')).toBe(false);
  });

  it('merges chip string shorthand over the recipe while preserving state attributes', () => {
    const fixture = TestBed.createComponent(PillPartStyleHost);
    fixture.detectChanges();

    const chip = query(fixture, '#chip-string');
    const classes = chip.className.split(/\s+/);
    expect(chip.getAttribute('data-variant')).toBe('warning');
    expect(classes).toContain('bg-hell-danger');
    expect(classes).toContain('px-hell-4');
    expect(classes).toContain('text-hell-foreground-inverse');
    expect(classes).not.toContain('px-hell-3');
  });

  it('merges conflicting Badge root classes through hellTwMerge', () => {
    const fixture = TestBed.createComponent(PillPartStyleHost);
    fixture.detectChanges();

    const badge = query(fixture, '#badge-string');
    const classes = badge.className.split(/\s+/);
    expect(badge.getAttribute('data-slot')).toBe('root');
    expect(classes).toContain('min-w-hell-8');
    expect(classes).toContain('bg-hell-info');
    expect(classes).not.toContain('min-w-hell-4');
    expect(classes).not.toContain('bg-hell-danger');
  });

  it('applies Kbd object maps to the root part', () => {
    const fixture = TestBed.createComponent(PillPartStyleHost);
    fixture.detectChanges();

    const kbd = query(fixture, '#kbd-map');
    expect(kbd.getAttribute('data-slot')).toBe('root');
    expect(kbd.className).toContain('h-hell-6');
    expect(kbd.className).toContain('border-hell-primary');
    expect(kbd.className).toContain('text-hell-primary');
  });
});

function query<T extends HTMLElement>(fixture: { nativeElement: HTMLElement }, selector: string): T {
  const element = fixture.nativeElement.querySelector<T>(selector);
  if (!element) throw new Error(`Expected to find ${selector}`);
  return element;
}

function press(
  element: HTMLElement,
  key: string,
  init: Omit<KeyboardEventInit, 'key'> = {},
): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { ...init, key, bubbles: true, cancelable: true });
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
