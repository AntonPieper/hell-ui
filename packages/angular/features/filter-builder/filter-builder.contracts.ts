import {
  DestroyRef,
  Directive,
  Injectable,
  InjectionToken,
  TemplateRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { hellCreateLabels, type HellLabels } from '@hell-ui/angular/core';

import type { HellFilter, HellFilterFieldDescriptor } from './filter-builder.state';

/** Context received by one typed projected Filter Builder editor. */
export interface HellFilterBuilderEditorContext<
  TFilter extends HellFilter = HellFilter,
> {
  /** The complete context, exposed as the template's implicit value. */
  readonly $implicit: HellFilterBuilderEditorContext<TFilter>;
  /** Typed field descriptor bound to the projected editor template. */
  readonly descriptor: HellFilterFieldDescriptor<TFilter>;
  /** Latest controlled expression for edit mode, or `null` while creating. */
  readonly filter: TFilter | null;
  /** Whether this editor is creating or editing an expression. */
  readonly mode: 'create' | 'edit';
  /** Invoke the descriptor-owned display callback. */
  display(filter: TFilter): string;
  /** Invoke the descriptor-owned validation callback. */
  validate(filter: TFilter): boolean;
  /** Validate and request an immutable whole-array commit. */
  commit(filter: TFilter): boolean;
  /** Discard the projected editor without emitting a value. */
  cancel(): void;
}

const HELL_FILTER_BUILDER_EDITOR_TEMPLATES = new WeakMap<object, TemplateRef<unknown>>();

/** Registers a typed projected editor for one field descriptor. */
@Directive({ selector: 'ng-template[hellFilterBuilderEditor]' })
export class HellFilterBuilderEditor<TFilter extends HellFilter = HellFilter> {
  /** Descriptor whose expressions this template creates and edits. */
  readonly descriptor = input.required<HellFilterFieldDescriptor<TFilter>>({
    alias: 'hellFilterBuilderEditor',
  });

  constructor() {
    HELL_FILTER_BUILDER_EDITOR_TEMPLATES.set(this, inject<TemplateRef<unknown>>(TemplateRef));
    const registry = inject(HellFilterBuilderEditorRegistry, { optional: true });
    if (!registry) return;
    registry.register(this);
    inject(DestroyRef).onDestroy(() => registry.unregister(this));
  }

  /** Supplies Angular template type checking with the projected context type. */
  static ngTemplateContextGuard<TFilter extends HellFilter>(
    _directive: HellFilterBuilderEditor<TFilter>,
    _context: unknown,
  ): _context is HellFilterBuilderEditorContext<TFilter> {
    return true;
  }
}

/** Host-scoped package-local registry populated directly by projected editor directives. */
@Injectable()
export class HellFilterBuilderEditorRegistry {
  readonly #registrations = signal<readonly object[]>([]);
  readonly editors = this.#registrations.asReadonly();

  register(editor: object): void {
    if (this.#registrations().includes(editor)) return;
    this.#registrations.update((current) => [...current, editor]);
  }

  unregister(editor: object): void {
    this.#registrations.update((current) => current.filter((candidate) => candidate !== editor));
  }
}

/** Package-local template locator; deliberately absent from the entrypoint barrel. */
export function hellFilterBuilderEditorTemplate<TFilter extends HellFilter>(
  registration: HellFilterBuilderEditor<TFilter>,
): TemplateRef<HellFilterBuilderEditorContext<TFilter>> {
  const template = HELL_FILTER_BUILDER_EDITOR_TEMPLATES.get(registration);
  if (!template) throw new Error('Filter Builder editor template was not registered.');
  return template as TemplateRef<HellFilterBuilderEditorContext<TFilter>>;
}

/** Built-in accessibility and status copy owned by the Filter Builder entry point. */
export interface HellFilterBuilderLabels {
  /** Default accessible name for the token group and field picker. */
  readonly input: string;
  /** Default field-picker placeholder. */
  readonly placeholder: string;
  /** Clear-all button copy. */
  readonly clearAll: string;
  /** Accessible edit-trigger label. */
  readonly edit: (filter: string) => string;
  /** Polite announcement after an expression is added. */
  readonly added: (filter: string) => string;
  /** Polite announcement after an expression is updated. */
  readonly updated: (filter: string) => string;
  /** Polite announcement after an expression is removed. */
  readonly removed: (filter: string) => string;
  /** Polite announcement after all expressions are cleared. */
  readonly cleared: string;
}

/** Injection token resolving to the effective Filter Builder labels. */
export const HELL_FILTER_BUILDER_LABELS: InjectionToken<HellLabels<HellFilterBuilderLabels>> =
  hellCreateLabels<HellFilterBuilderLabels>('HELL_FILTER_BUILDER_LABELS', {
    input: 'Filters',
    placeholder: 'Add filter',
    clearAll: 'Clear all filters',
    edit: (filter) => `Edit ${filter}`,
    added: (filter) => `${filter} added`,
    updated: (filter) => `${filter} updated`,
    removed: (filter) => `${filter} removed`,
    cleared: 'All filters cleared',
  });
