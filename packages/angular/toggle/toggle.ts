import { DestroyRef, Directive, ElementRef, forwardRef, inject, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgpToggle } from 'ng-primitives/toggle';
import {
  NgpToggleGroup,
  NgpToggleGroupItem,
} from 'ng-primitives/toggle-group';
import { containsNode } from '@hell-ui/angular/internal/core';
import { HellControlValueAccessorBridge } from '@hell-ui/angular/internal/core';
import { HellSize, HellPartStyleable, type HellRecipe, type HellUi } from '@hell-ui/angular/core';

export type HellToggleGroupValue = string | null | readonly string[];

export type HellTogglePart = 'root';
export type HellToggleUi = HellUi<HellTogglePart>;

export type HellToggleGroupPart = 'root';
export type HellToggleGroupUi = HellUi<HellToggleGroupPart>;

export type HellToggleGroupItemPart = 'root';
export type HellToggleGroupItemUi = HellUi<HellToggleGroupItemPart>;

const HELL_TOGGLE_BASE_RECIPE =
  'inline-flex cursor-pointer select-none items-center justify-center gap-hell-2 whitespace-nowrap rounded-hell-md border border-transparent bg-transparent font-[inherit] font-medium leading-none text-hell-foreground shadow-none transition-[background-color,border-color,color,box-shadow,scale] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] data-hover:bg-hell-surface-muted data-press:bg-hell-surface-muted data-press:scale-[0.97] data-focus-visible:outline-2 data-focus-visible:outline-hell-focus-ring data-focus-visible:outline-offset-1 data-disabled:cursor-not-allowed data-disabled:opacity-50 data-disabled:saturate-[0.65]';

const HELL_TOGGLE_SELECTED_RECIPE =
  'data-selected:border-hell-primary data-selected:bg-hell-primary data-selected:text-hell-primary-foreground data-[selected][data-hover]:border-hell-primary-hover data-[selected][data-hover]:bg-hell-primary-hover';

const HELL_TOGGLE_GROUP_ITEM_SELECTED_RECIPE =
  'hover:bg-hell-surface-subtle active:bg-hell-surface-muted active:scale-[0.97] data-selected:border-transparent data-selected:bg-hell-primary-soft data-selected:text-hell-primary-soft-foreground data-selected:shadow-none data-selected:hover:border-transparent data-selected:hover:bg-hell-primary-soft data-selected:hover:text-hell-primary-soft-foreground data-selected:active:border-transparent data-selected:active:bg-hell-primary-soft data-selected:active:text-hell-primary-soft-foreground data-disabled:hover:bg-transparent data-disabled:active:bg-transparent data-[selected][data-hover]:border-transparent data-[selected][data-hover]:bg-hell-primary-soft data-[selected][data-hover]:text-hell-primary-soft-foreground data-[selected][data-press]:border-transparent data-[selected][data-press]:bg-hell-primary-soft data-[selected][data-press]:text-hell-primary-soft-foreground data-[disabled][data-hover]:bg-transparent data-[disabled][data-press]:bg-transparent';

const HELL_TOGGLE_SIZE_RECIPE: Record<HellSize, string> = {
  xs: 'h-hell-control-xs px-hell-3 text-xs',
  sm: 'h-hell-control-sm px-hell-4 text-[13px]',
  md: 'h-hell-control-md px-hell-5 text-[13px]',
  lg: 'h-hell-control-lg px-hell-6 text-sm',
  xl: 'h-hell-control-xl px-hell-7 text-[15px]',
};

const HELL_TOGGLE_GROUP_RECIPE = {
  root: 'inline-flex gap-[2px] rounded-hell-md border border-hell-border bg-hell-surface-muted p-[3px]',
} satisfies HellRecipe<HellToggleGroupPart>;

/**
 * Single press-toggle button. Adds the on/off state from the toggle primitive.
 */
@Directive({
  selector: 'button[hellToggle]',
  hostDirectives: [
    {
      directive: NgpToggle,
      inputs: ['ngpToggleSelected:selected', 'ngpToggleDisabled:disabled'],
      outputs: ['ngpToggleSelectedChange:selectedChange'],
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-size]': 'size()',
    '[attr.data-variant]': '"ghost"',
    type: 'button',
  },
})
export class HellToggle extends HellPartStyleable<HellTogglePart> {
  protected readonly defaultUiPart = 'root';
  readonly size = input<HellSize>('md');

  protected get recipe(): HellRecipe<HellTogglePart> {
    return {
      root: [HELL_TOGGLE_BASE_RECIPE, HELL_TOGGLE_SIZE_RECIPE[this.size()], HELL_TOGGLE_SELECTED_RECIPE].join(
        ' ',
      ),
    };
  }
}

@Directive({
  selector: '[hellToggleGroup]',
  hostDirectives: [
    {
      directive: NgpToggleGroup,
      inputs: [
        'ngpToggleGroupValue:value',
        'ngpToggleGroupType:type',
        'ngpToggleGroupDisabled:disabled',
      ],
      outputs: ['ngpToggleGroupValueChange:valueChange'],
    },
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HellToggleGroup),
      multi: true,
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '(focusout)': 'onFocusOut($event)',
    role: 'group',
  },
})
export class HellToggleGroup
  extends HellPartStyleable<HellToggleGroupPart>
  implements ControlValueAccessor
{
  protected readonly recipe = HELL_TOGGLE_GROUP_RECIPE;
  protected readonly defaultUiPart = 'root';

  private readonly group = inject(NgpToggleGroup);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly valueAccessor = new HellControlValueAccessorBridge<HellToggleGroupValue>();

  constructor() {
    super();
    const valueSub = this.group.valueChange.subscribe((value) => {
      this.valueAccessor.emitValue(this.asControlValue(value));
    });
    this.destroyRef.onDestroy(() => valueSub.unsubscribe());
  }

  writeValue(value: HellToggleGroupValue): void {
    this.group.setValue(this.asGroupValue(value), { emit: false });
  }

  private asGroupValue(value: HellToggleGroupValue): string[] {
    if (value == null) return [];
    if (this.group.type() === 'single') {
      const next = Array.isArray(value) ? value[0] : value;
      return next == null ? [] : [next];
    }

    return Array.isArray(value) ? [...value] : [value as string];
  }

  private asControlValue(value: readonly string[]): HellToggleGroupValue {
    return this.group.type() === 'multiple' ? [...value] : value[0] ?? null;
  }

  registerOnChange(fn: (value: HellToggleGroupValue) => void): void {
    this.valueAccessor.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.valueAccessor.registerOnTouched(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    this.group.setDisabled(isDisabled);
  }

  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (!containsNode(this.host.nativeElement, next)) {
      this.valueAccessor.markTouched();
    }
  }
}

@Directive({
  selector: 'button[hellToggleGroupItem]',
  hostDirectives: [
    {
      directive: NgpToggleGroupItem,
      inputs: ['ngpToggleGroupItemValue:value', 'ngpToggleGroupItemDisabled:disabled'],
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-size]': 'size()',
    '[attr.data-variant]': '"ghost"',
    type: 'button',
  },
})
export class HellToggleGroupItem extends HellPartStyleable<HellToggleGroupItemPart> {
  protected readonly defaultUiPart = 'root';
  readonly size = input<HellSize>('sm');

  protected get recipe(): HellRecipe<HellToggleGroupItemPart> {
    return {
      root: [
        HELL_TOGGLE_BASE_RECIPE,
        HELL_TOGGLE_SIZE_RECIPE[this.size()],
        HELL_TOGGLE_GROUP_ITEM_SELECTED_RECIPE,
      ].join(' '),
    };
  }
}
