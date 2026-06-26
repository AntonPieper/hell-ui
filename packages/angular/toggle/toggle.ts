import { DestroyRef, Directive, ElementRef, forwardRef, inject, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgpToggle } from 'ng-primitives/toggle';
import {
  NgpToggleGroup,
  NgpToggleGroupItem,
} from 'ng-primitives/toggle-group';
import { containsNode } from '@hell-ui/angular/internal/core';
import { HellControlValueAccessorBridge } from '@hell-ui/angular/internal/core';
import { HellSize } from '@hell-ui/angular/core';
import { HellStyleable } from '@hell-ui/angular/core';

export type HellToggleGroupValue = string | null | readonly string[];

/**
 * Single press-toggle button. Pairs with `hell-button`'s utility class for
 * styling but adds the on/off `data-state` from the toggle primitive.
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
    '[class.hell-button]': '!unstyled()',
    '[class.hell-toggle]': '!unstyled()',
    '[attr.data-size]': 'size()',
    '[attr.data-variant]': '"ghost"',
    type: 'button',
  },
})
export class HellToggle extends HellStyleable {
  readonly size = input<HellSize>('md');
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
    '[class.hell-toggle-group]': '!unstyled()',
    '(focusout)': 'onFocusOut($event)',
    role: 'group',
  },
})
export class HellToggleGroup extends HellStyleable implements ControlValueAccessor {
  private readonly group = inject(NgpToggleGroup);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cva = new HellControlValueAccessorBridge<HellToggleGroupValue>();

  constructor() {
    super();
    const valueSub = this.group.valueChange.subscribe((value) => {
      this.cva.emitValue(this.asControlValue(value));
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
    this.cva.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.cva.registerOnTouched(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    this.group.setDisabled(isDisabled);
  }

  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (!containsNode(this.host.nativeElement, next)) {
      this.cva.markTouched();
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
    '[class.hell-button]': '!unstyled()',
    '[class.hell-toggle]': '!unstyled()',
    '[attr.data-size]': 'size()',
    '[attr.data-variant]': '"ghost"',
    type: 'button',
  },
})
export class HellToggleGroupItem extends HellStyleable {
  readonly size = input<HellSize>('sm');
}
