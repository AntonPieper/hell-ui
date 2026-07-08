import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellInput, type HellInputUi } from '@hell-ui/angular/input';
import { HELL_EMBEDDED_INPUT_UI } from './embedded-input-ui';

@Component({
  imports: [HellInput],
  template: `
    <input id="embedded" hellInput [ui]="embeddedUi" aria-label="Embedded input" />
    <input
      id="embedded-disabled"
      hellInput
      disabled
      invalid
      [ui]="embeddedUi"
      aria-label="Embedded disabled input"
    />
  `,
})
class EmbeddedInputHost {
  protected readonly embeddedUi = HELL_EMBEDDED_INPUT_UI;
}

describe('HELL_EMBEDDED_INPUT_UI', () => {
  it('exposes only the root part as a HellInput Part Style Map', () => {
    const embeddedUi: HellInputUi = HELL_EMBEDDED_INPUT_UI;

    expect(Object.keys(embeddedUi)).toEqual(['root']);
    expect(typeof HELL_EMBEDDED_INPUT_UI.root).toBe('string');
  });

  it('strips the surrounding chrome so the input reads as embedded', () => {
    const classes = HELL_EMBEDDED_INPUT_UI.root.split(/\s+/);

    expect(classes).toContain('border-0');
    expect(classes).toContain('bg-transparent');
    expect(classes).toContain('shadow-none');
    expect(classes).toContain('px-0');
    expect(classes).toContain('py-0');
    expect(classes).toContain('flex-1');
    expect(classes).toContain('min-w-0');
    expect(classes).toContain('h-full');
  });

  it('neutralizes hover, focus, disabled and invalid chrome states', () => {
    const classes = HELL_EMBEDDED_INPUT_UI.root.split(/\s+/);

    expect(classes).toContain('data-hover:border-transparent');
    expect(classes).toContain('data-focus:border-transparent');
    expect(classes).toContain('data-focus:shadow-none');
    expect(classes).toContain('focus:border-transparent');
    expect(classes).toContain('focus:shadow-none');
    expect(classes).toContain('disabled:bg-transparent');
    expect(classes).toContain('data-disabled:bg-transparent');
    expect(classes).toContain('aria-invalid:!border-transparent');
    expect(classes).toContain('invalid:!border-transparent');
  });

  describe('when applied to a HellInput host', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [EmbeddedInputHost],
      }).compileComponents();
    });

    it('merges the embedded root part over the input recipe', () => {
      const fixture = TestBed.createComponent(EmbeddedInputHost);
      fixture.detectChanges();

      const input = byId(fixture.nativeElement, 'embedded');

      expect(input.getAttribute('data-slot')).toBe('root');
      expect(input.classList.contains('border-0')).toBe(true);
      expect(input.classList.contains('bg-transparent')).toBe(true);
      expect(input.classList.contains('shadow-none')).toBe(true);
      expect(input.classList.contains('px-0')).toBe(true);
    });

    it('wins the tailwind-merge conflict against the recipe defaults', () => {
      const fixture = TestBed.createComponent(EmbeddedInputHost);
      fixture.detectChanges();

      const input = byId(fixture.nativeElement, 'embedded');

      // Recipe defaults that the embedded map is meant to override must be gone.
      expect(input.classList.contains('border')).toBe(false);
      expect(input.classList.contains('bg-hell-surface-elevated')).toBe(false);
      expect(input.classList.contains('px-hell-4')).toBe(false);
    });

    it('preserves the underlying input state attributes and layout hooks', () => {
      const fixture = TestBed.createComponent(EmbeddedInputHost);
      fixture.detectChanges();

      const embedded = byId<HTMLInputElement>(fixture.nativeElement, 'embedded-disabled');

      expect(embedded.disabled).toBe(true);
      expect(embedded.getAttribute('data-disabled')).toBe('');
      expect(embedded.getAttribute('aria-invalid')).toBe('true');
      expect(embedded.classList.contains('h-full')).toBe(true);
      expect(embedded.classList.contains('flex-1')).toBe(true);
    });
  });
});

function byId<T extends HTMLElement = HTMLElement>(root: HTMLElement, id: string): T {
  const element = root.querySelector(`#${id}`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected #${id}.`);
  return element as T;
}
