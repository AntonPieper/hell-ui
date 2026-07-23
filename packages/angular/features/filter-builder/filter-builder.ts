import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
  output,
} from '@angular/core';
import {
  type HellUi,
  type HellUiInput,
} from 'hell-ui/core';

import {
  HellFilterBuilderEditor,
  HellFilterBuilderEditorRegistry,
} from './filter-builder.contracts';
import {
  HellFilterBuilderRenderer,
  type HellFilterBuilderPart,
} from './filter-builder.renderer';
import type {
  HellFilter,
  HellFilterFieldDescriptor,
  HellFilterIdentity,
} from './filter-builder.state';

export {
  HELL_FILTER_BUILDER_LABELS,
  HellFilterBuilderEditor,
  type HellFilterBuilderEditorContext,
  type HellFilterBuilderLabels,
} from './filter-builder.contracts';
export type {
  HellFilter,
  HellFilterFieldDescriptor,
  HellFilterIdentity,
  HellFilterIdentityValue,
} from './filter-builder.state';
export type { HellFilterBuilderPart } from './filter-builder.renderer';

/** Part Style Map accepted by the Filter Builder `ui` input. */
export type HellFilterBuilderUi = HellUi<HellFilterBuilderPart>;

/**
 * Controlled projected-editor Filter Builder.
 *
 * Applications own field schemas, expression values, editor rendering, and
 * Search Resources. The feature owns only token navigation, field selection,
 * create/edit lifecycle, floating containment, focus restoration, and status
 * announcements. It never mutates or initially emits the supplied array.
 */
@Component({
  selector: 'hell-filter-builder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellFilterBuilderRenderer],
  providers: [HellFilterBuilderEditorRegistry],
  host: {
    class: 'contents',
  },
  template: `
    <hell-filter-builder-renderer
      [ui]="ui()"
      [fields]="fields()"
      [value]="value()"
      [identify]="identify()"
      [disabled]="disabled()"
      [placeholder]="placeholder()"
      [aria-label]="ariaLabel()"
      (valueChange)="valueChange.emit($event)"
    >
      <ng-content />
    </hell-filter-builder-renderer>
  `,
})
export class HellFilterBuilder<TFilter extends HellFilter = HellFilter> {
  /** Tailwind class refinements for durable public parts. */
  readonly ui = input(undefined as HellUiInput<HellFilterBuilderPart>, { alias: 'ui' });

  /** Typed application field descriptors. */
  readonly fields = input.required<readonly HellFilterFieldDescriptor<TFilter>[]>();
  /** Complete controlled expression array. */
  readonly value = input<readonly TFilter[]>([]);
  /** Required stable identity callback for controlled recreation and reorder. */
  readonly identify = input.required<HellFilterIdentity<TFilter>>();
  /** Disables field selection, editing, removal, and clear-all. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Optional field-picker placeholder. */
  readonly placeholder = input<string | null>(null);
  /** Accessible name; defaults to the Label Contract's `input` value. */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  /** Emits the complete next controlled array after valid user actions. */
  readonly valueChange = output<readonly TFilter[]>();

}

/** Root component and projected-editor directive for convenient standalone imports. */
export const HELL_FILTER_BUILDER_IMPORTS = [
  HellFilterBuilder,
  HellFilterBuilderEditor,
] as const;
