import { booleanAttribute, Directive, input } from '@angular/core';

/**
 * Base contract for every styled `hell` module.
 *
 * Subclasses inherit the `unstyled` input and bind their own host styling
 * class as `[class.hell-xxx]="!unstyled()"`. Behavior, accessibility wiring,
 * and data attributes remain local to the concrete module.
 */
@Directive()
export abstract class HellStyleable {
  /**
   * When true, the component does not apply its host styling class.
   * Behavior, accessibility wiring and data attributes still apply.
   */
  readonly unstyled = input(false, {
    transform: booleanAttribute,
    alias: 'unstyled',
  });
}
