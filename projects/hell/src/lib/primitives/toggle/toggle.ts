import { DestroyRef, Directive, ElementRef, forwardRef, inject, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgpToggle } from 'ng-primitives/toggle';
import {
  NgpToggleGroup,
  NgpToggleGroupItem,
  injectToggleGroupState,
} from 'ng-primitives/toggle-group';
import { HellControlValueAccessorBridge } from '../../core/control-value-accessor';
import { HellSize } from '../../core/types';
import { HellStyleable } from '../../core/styleable';

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
  private readonly groupState = injectToggleGroupState();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cva = new HellControlValueAccessorBridge<string[]>();

  constructor() {
    super();
    const valueSub = this.group.valueChange.subscribe((value) => {
      this.cva.emitValue(value);
    });
    this.destroyRef.onDestroy(() => valueSub.unsubscribe());
  }

  writeValue(value: readonly string[] | null): void {
    this.groupState().setValue(Array.isArray(value) ? [...value] : [], { emit: false });
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.cva.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.cva.registerOnTouched(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    this.groupState().setDisabled(isDisabled);
  }

  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !this.host.nativeElement.contains(next)) {
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
