import { computed, Directive } from '@angular/core';
import { HellPartStyleable, type HellRecipe, type HellUi } from '@hell-ui/angular/core';
import {
  NgpAccordion,
  NgpAccordionItem,
  NgpAccordionTrigger,
  NgpAccordionContent,
  injectAccordionItemState,
} from 'ng-primitives/accordion';

export type HellAccordionPart = 'root';
export type HellAccordionUi = HellUi<HellAccordionPart>;

export type HellAccordionItemPart = 'root';
export type HellAccordionItemUi = HellUi<HellAccordionItemPart>;

export type HellAccordionTriggerPart = 'root';
export type HellAccordionTriggerUi = HellUi<HellAccordionTriggerPart>;

export type HellAccordionContentPart = 'root';
export type HellAccordionContentUi = HellUi<HellAccordionContentPart>;

const HELL_ACCORDION_RECIPE = {
  root: 'flex flex-col overflow-clip rounded-hell-md border border-solid border-hell-border bg-hell-surface-elevated',
} satisfies HellRecipe<HellAccordionPart>;

const HELL_ACCORDION_ITEM_RECIPE = {
  root: 'border-b border-hell-border last:border-0',
} satisfies HellRecipe<HellAccordionItemPart>;

const HELL_ACCORDION_TRIGGER_RECIPE = {
  root: 'flex w-full cursor-pointer items-center justify-between gap-hell-4 border-0 border-solid bg-transparent px-hell-5 py-hell-4 text-start font-[inherit] text-[13px] font-semibold text-hell-foreground transition-[background-color] duration-[var(--hell-duration-fast)] ease-hell-out data-hover:bg-hell-surface-subtle data-focus-visible:outline-2 data-focus-visible:outline-hell-focus-ring data-focus-visible:outline-offset-[-2px]',
} satisfies HellRecipe<HellAccordionTriggerPart>;

const HELL_ACCORDION_CONTENT_RECIPE = {
  root: 'block h-0 overflow-hidden text-[13px] leading-[1.55] text-hell-foreground-muted transition-[height] duration-[var(--hell-duration-base)] ease-hell-out [interpolate-size:allow-keywords]',
} satisfies HellRecipe<HellAccordionContentPart>;

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
export class HellAccordion extends HellPartStyleable<HellAccordionPart> {
  protected readonly recipe = HELL_ACCORDION_RECIPE;
  protected readonly defaultUiPart = 'root';
}

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
export class HellAccordionItem extends HellPartStyleable<HellAccordionItemPart> {
  protected readonly recipe = HELL_ACCORDION_ITEM_RECIPE;
  protected readonly defaultUiPart = 'root';
}

@Directive({
  selector: 'button[hellAccordionTrigger]',
  hostDirectives: [NgpAccordionTrigger],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    type: 'button',
  },
})
export class HellAccordionTrigger extends HellPartStyleable<HellAccordionTriggerPart> {
  protected readonly recipe = HELL_ACCORDION_TRIGGER_RECIPE;
  protected readonly defaultUiPart = 'root';
}

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
export class HellAccordionContent extends HellPartStyleable<HellAccordionContentPart> {
  protected readonly recipe = HELL_ACCORDION_CONTENT_RECIPE;
  protected readonly defaultUiPart = 'root';

  private readonly accordionItem = injectAccordionItemState<unknown>();
  protected readonly closed = computed(() => !this.accordionItem().open());
}

export const HELL_ACCORDION_DIRECTIVES = [
  HellAccordion,
  HellAccordionItem,
  HellAccordionTrigger,
  HellAccordionContent,
] as const;
