import { Directive, inject } from '@angular/core';
import { HellPartStyleable, type HellRecipe, type HellUi } from '@hell-ui/angular/core';
import {
  NgpListbox,
  NgpListboxHeader,
  NgpListboxOption,
  NgpListboxSection,
  NgpListboxTrigger,
} from 'ng-primitives/listbox';

export type HellListboxPart = 'root';
export type HellListboxUi = HellUi<HellListboxPart>;

export type HellListboxOptionPart = 'root';
export type HellListboxOptionUi = HellUi<HellListboxOptionPart>;

export type HellListboxSectionPart = 'root';
export type HellListboxSectionUi = HellUi<HellListboxSectionPart>;

export type HellListboxHeaderPart = 'root';
export type HellListboxHeaderUi = HellUi<HellListboxHeaderPart>;

const HELL_LISTBOX_RECIPE = {
  root: 'grid gap-hell-2 outline-none',
} satisfies HellRecipe<HellListboxPart>;

const HELL_LISTBOX_OPTION_RECIPE = {
  root: 'grid cursor-pointer gap-0.5 rounded-hell-md border border-transparent px-hell-3 py-hell-2 text-left text-sm text-hell-foreground outline-none data-active:bg-hell-surface-subtle data-disabled:cursor-not-allowed data-disabled:opacity-50 data-selected:border-hell-border-focus data-selected:bg-hell-primary-soft aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-selected:border-hell-border-focus aria-selected:bg-hell-primary-soft',
} satisfies HellRecipe<HellListboxOptionPart>;

const HELL_LISTBOX_SECTION_RECIPE = {
  root: 'grid gap-hell-2',
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
export class HellListbox extends HellPartStyleable<HellListboxPart> {
  protected readonly recipe = HELL_LISTBOX_RECIPE;
  protected readonly defaultUiPart = 'root';
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
export class HellListboxOption extends HellPartStyleable<HellListboxOptionPart> {
  protected readonly recipe = HELL_LISTBOX_OPTION_RECIPE;
  protected readonly defaultUiPart = 'root';
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
export class HellListboxSection extends HellPartStyleable<HellListboxSectionPart> {
  protected readonly recipe = HELL_LISTBOX_SECTION_RECIPE;
  protected readonly defaultUiPart = 'root';
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
export class HellListboxHeader extends HellPartStyleable<HellListboxHeaderPart> {
  protected readonly recipe = HELL_LISTBOX_HEADER_RECIPE;
  protected readonly defaultUiPart = 'root';
}

export const HELL_LISTBOX_DIRECTIVES = [
  HellListbox,
  HellListboxTrigger,
  HellListboxOption,
  HellListboxSection,
  HellListboxHeader,
] as const;
