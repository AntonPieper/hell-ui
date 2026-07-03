import { Directive, inject, input } from '@angular/core';
import { hellPartStyler, type HellRecipe, type HellUi, type HellUiInput } from '@hell-ui/angular/core';
import {
  NgpListbox,
  NgpListboxHeader,
  NgpListboxOption,
  NgpListboxSection,
  NgpListboxTrigger,
} from 'ng-primitives/listbox';

/** Public parts of the HellListbox module, styleable through its Part Style Map. */
export type HellListboxPart = 'root';
/** Part Style Map accepted by the HellListbox `ui` input. */
export type HellListboxUi = HellUi<HellListboxPart>;

/** Public parts of the HellListboxOption module, styleable through its Part Style Map. */
export type HellListboxOptionPart = 'root';
/** Part Style Map accepted by the HellListboxOption `ui` input. */
export type HellListboxOptionUi = HellUi<HellListboxOptionPart>;

/** Public parts of the HellListboxSection module, styleable through its Part Style Map. */
export type HellListboxSectionPart = 'root';
/** Part Style Map accepted by the HellListboxSection `ui` input. */
export type HellListboxSectionUi = HellUi<HellListboxSectionPart>;

/** Public parts of the HellListboxHeader module, styleable through its Part Style Map. */
export type HellListboxHeaderPart = 'root';
/** Part Style Map accepted by the HellListboxHeader `ui` input. */
export type HellListboxHeaderUi = HellUi<HellListboxHeaderPart>;

const HELL_LISTBOX_RECIPE = {
  root: 'flex w-full flex-col gap-px rounded-hell-md border border-solid border-hell-border bg-hell-surface-elevated p-hell-2 outline-none transition-[border-color,box-shadow] duration-[var(--hell-duration-fast)] ease-hell-out focus-visible:border-hell-border-focus focus-visible:shadow-[0_0_0_3px_var(--color-hell-focus-ring)]',
} satisfies HellRecipe<HellListboxPart>;

const HELL_LISTBOX_OPTION_RECIPE = {
  root: 'grid cursor-pointer gap-0.5 rounded-hell-sm border-0 bg-transparent px-[calc(var(--spacing)*2.5)] py-[calc(var(--spacing)*1.5)] text-start font-[inherit] text-[13px] text-hell-foreground outline-none hover:bg-hell-surface-muted data-active:bg-hell-surface-muted data-selected:bg-hell-primary-soft data-selected:font-medium data-selected:text-hell-primary-soft-foreground aria-selected:bg-hell-primary-soft aria-selected:font-medium aria-selected:text-hell-primary-soft-foreground data-disabled:cursor-not-allowed data-disabled:opacity-50 data-disabled:hover:bg-transparent aria-disabled:cursor-not-allowed aria-disabled:opacity-50 [&[data-selected][data-active]]:bg-[color-mix(in_oklab,var(--color-hell-primary)_18%,var(--color-hell-surface-muted))]',
} satisfies HellRecipe<HellListboxOptionPart>;

const HELL_LISTBOX_SECTION_RECIPE = {
  root: 'flex flex-col gap-px',
} satisfies HellRecipe<HellListboxSectionPart>;

const HELL_LISTBOX_HEADER_RECIPE = {
  root: 'px-hell-2 pb-hell-1 text-xs font-semibold text-hell-foreground-muted',
} satisfies HellRecipe<HellListboxHeaderPart>;

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
  readonly ui = input<HellUiInput<HellListboxPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellListboxPart>(this.ui, {
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
  readonly ui = input<HellUiInput<HellListboxOptionPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellListboxOptionPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_LISTBOX_OPTION_RECIPE,
  });
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
  readonly ui = input<HellUiInput<HellListboxSectionPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellListboxSectionPart>(this.ui, {
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
  readonly ui = input<HellUiInput<HellListboxHeaderPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellListboxHeaderPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_LISTBOX_HEADER_RECIPE,
  });
}

export const HELL_LISTBOX_DIRECTIVES = [
  HellListbox,
  HellListboxTrigger,
  HellListboxOption,
  HellListboxSection,
  HellListboxHeader,
] as const;
