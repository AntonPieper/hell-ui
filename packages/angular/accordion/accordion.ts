import { computed, Directive, input } from '@angular/core';
import type { HellUiInput } from 'hell-ui/core';
import { hellPartStyler, type HellRecipe } from 'hell-ui/internal/core';
import {
  NgpAccordion,
  NgpAccordionItem,
  NgpAccordionTrigger,
  NgpAccordionContent,
  injectAccordionItemState,
} from 'ng-primitives/accordion';

const HELL_ACCORDION_RECIPE = {
  root: 'flex flex-col overflow-clip rounded-hell-md border border-solid border-hell-border bg-hell-surface-elevated',
} satisfies HellRecipe<'root'>;

const HELL_ACCORDION_ITEM_RECIPE = {
  root: 'border-b border-hell-border last:border-0',
} satisfies HellRecipe<'root'>;

const HELL_ACCORDION_TRIGGER_RECIPE = {
  root: 'flex w-full cursor-pointer items-center justify-between gap-hell-4 border-0 border-solid bg-transparent px-hell-5 py-hell-4 text-start font-[family-name:inherit] text-[13px] font-semibold text-hell-foreground transition-[background-color] duration-[var(--hell-duration-fast)] ease-hell-out data-hover:bg-hell-surface-subtle data-focus-visible:outline-2 data-focus-visible:outline-hell-focus-ring data-focus-visible:outline-offset-[-2px]',
} satisfies HellRecipe<'root'>;

const HELL_ACCORDION_CONTENT_RECIPE = {
  root: 'block overflow-hidden text-[13px] leading-[1.55] text-hell-foreground-muted transition-[height] duration-[var(--hell-duration-base)] ease-hell-out [interpolate-size:allow-keywords]',
} satisfies HellRecipe<'root'>;

/** Container coordinating a group of collapsible `HellAccordionItem` sections. */
@Directive({
  selector: '[hellAccordion]',
  hostDirectives: [
    {
      directive: NgpAccordion,
      inputs: [
        'ngpAccordionValue:value',
        'ngpAccordionType:type',
        'ngpAccordionCollapsible:collapsible',
        'ngpAccordionDisabled:disabled',
        'ngpAccordionOrientation:orientation',
      ],
      outputs: ['ngpAccordionValueChange:valueChange'],
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellAccordion {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_ACCORDION_RECIPE,
  });
}

/** Single collapsible section within a `HellAccordion`, pairing a trigger with its content. */
@Directive({
  selector: '[hellAccordionItem]',
  hostDirectives: [
    {
      directive: NgpAccordionItem,
      inputs: ['ngpAccordionItemValue:value', 'ngpAccordionItemDisabled:disabled'],
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellAccordionItem {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_ACCORDION_ITEM_RECIPE,
  });
}

/** Button that toggles its enclosing accordion item's open state. */
@Directive({
  selector: 'button[hellAccordionTrigger]',
  hostDirectives: [NgpAccordionTrigger],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    type: 'button',
  },
})
export class HellAccordionTrigger {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_ACCORDION_TRIGGER_RECIPE,
  });
}

/** Collapsible content panel of an accordion item, hidden from assistive tech while closed. */
@Directive({
  selector: '[hellAccordionContent]',
  hostDirectives: [NgpAccordionContent],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.aria-hidden]': 'closed() ? "true" : null',
    '[attr.inert]': 'closed() ? "" : null',
  },
})
export class HellAccordionContent {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_ACCORDION_CONTENT_RECIPE,
  });

  private readonly accordionItem = injectAccordionItemState<unknown>();
  /** Whether the enclosing accordion item is currently closed. */
  protected readonly closed = computed(() => !this.accordionItem().open());
}

/** All directives that make up the accordion entry point, for bulk `imports`. */
export const HELL_ACCORDION_IMPORTS = [
  HellAccordion,
  HellAccordionItem,
  HellAccordionTrigger,
  HellAccordionContent,
] as const;
