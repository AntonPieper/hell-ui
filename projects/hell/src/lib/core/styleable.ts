import { booleanAttribute, Directive, input } from '@angular/core';

/**
 * Applied as a host directive on every styled `hell` component.
 * Exposes an `unstyled` input that consumers can use to opt out of all
 * library-provided styling for that element. The associated component is
 * expected to bind its host class as `[class.hell-xxx]="!unstyled()"`.
 */
@Directive({
  selector: '[hellStyleable]',
  exportAs: 'hellStyleable',
})
export class HellStyleable {
  /**
   * When true, the component does not apply its host styling class.
   * Behavior, accessibility wiring and data attributes still apply.
   */
  readonly unstyled = input(false, {
    transform: booleanAttribute,
    alias: 'unstyled',
  });
}
