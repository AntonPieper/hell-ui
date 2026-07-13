import { Directive, inject, input } from '@angular/core';
import { hellPartStyler, type HellRecipe, type HellUiInput } from '@hell-ui/angular/core';
import {
  HELL_OPTION_SURFACE_METRICS,
  HELL_OPTION_SURFACE_SELECTED_STATES,
} from '@hell-ui/angular/internal/option';
import {
  NgpListbox,
  NgpListboxHeader,
  NgpListboxOption,
  NgpListboxSection,
  NgpListboxTrigger,
} from 'ng-primitives/listbox';

const HELL_LISTBOX_RECIPE = {
  root: 'flex w-full flex-col gap-px rounded-hell-md border border-solid border-hell-border bg-hell-surface-elevated p-hell-2 outline-none transition-[border-color,box-shadow] duration-[var(--hell-duration-fast)] ease-hell-out focus-visible:border-hell-border-focus focus-visible:shadow-[0_0_0_3px_var(--color-hell-focus-ring)]',
} satisfies HellRecipe<'root'>;

const HELL_LISTBOX_OPTION_RECIPE = {
  root: `grid gap-0.5 border-0 text-start font-[inherit] ${HELL_OPTION_SURFACE_METRICS} hover:bg-hell-surface-muted ${HELL_OPTION_SURFACE_SELECTED_STATES} aria-selected:bg-hell-primary-soft aria-selected:font-medium aria-selected:text-hell-primary-soft-foreground data-disabled:cursor-not-allowed data-disabled:opacity-50 data-disabled:hover:bg-transparent aria-disabled:cursor-not-allowed aria-disabled:opacity-50`,
} satisfies HellRecipe<'root'>;

const HELL_LISTBOX_SECTION_RECIPE = {
  root: 'flex flex-col gap-px',
} satisfies HellRecipe<'root'>;

const HELL_LISTBOX_HEADER_RECIPE = {
  root: 'px-hell-2 pb-hell-1 text-xs font-semibold text-hell-foreground-muted',
} satisfies HellRecipe<'root'>;

/**
 * Headless ARIA listbox wrapper. Use `[value]` / `(valueChange)` for the
 * selected item, `[mode]="multiple"` for multi-select, and `[compareWith]`
 * when values are objects. Child `hellListboxOption` directives provide the
 * option values; sections and headers are structural grouping aids.
 */
@Directive({
  selector: '[hellListbox]',
  hostDirectives: [
    {
      directive: NgpListbox,
      inputs: [
        'id',
        'ngpListboxMode:mode',
        'ngpListboxValue:value',
        'ngpListboxDisabled:disabled',
        'ngpListboxCompareWith:compareWith',
      ],
      outputs: ['ngpListboxValueChange:valueChange'],
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellListbox {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_LISTBOX_RECIPE,
  });
}

/** Optional trigger used by composed controls that open a separate listbox. */
@Directive({
  selector: '[hellListboxTrigger]',
  hostDirectives: [NgpListboxTrigger],
})
export class HellListboxTrigger {}

/** Selectable listbox row. `[value]` is compared against the parent value. */
@Directive({
  selector: '[hellListboxOption]',
  hostDirectives: [
    {
      directive: NgpListboxOption,
      inputs: ['id', 'ngpListboxOptionValue:value', 'ngpListboxOptionDisabled:disabled'],
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.aria-selected]': 'option.selected() ? "true" : "false"',
  },
})
export class HellListboxOption {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_LISTBOX_OPTION_RECIPE,
  });
  /** Underlying ng-primitives listbox option state. */
  protected readonly option = inject(NgpListboxOption);
}

/** Groups related options while preserving listbox keyboard behavior. */
@Directive({
  selector: '[hellListboxSection]',
  hostDirectives: [NgpListboxSection],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellListboxSection {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_LISTBOX_SECTION_RECIPE,
  });
}

/** Non-selectable label/header for a listbox section. */
@Directive({
  selector: '[hellListboxHeader]',
  hostDirectives: [{ directive: NgpListboxHeader, inputs: ['id'] }],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellListboxHeader {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_LISTBOX_HEADER_RECIPE,
  });
}

/** All directives exported by the listbox entry point, for bulk `imports`. */
export const HELL_LISTBOX_DIRECTIVES = [
  HellListbox,
  HellListboxTrigger,
  HellListboxOption,
  HellListboxSection,
  HellListboxHeader,
] as const;
