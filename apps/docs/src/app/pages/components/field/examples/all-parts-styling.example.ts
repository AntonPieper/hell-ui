import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/field';
import { HellInput } from '@hell-ui/angular/input';

@Component({
  selector: 'app-field-all-parts-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_DIRECTIVES, HellInput],
  template: `
    <!-- Every field module owns a single 'root' part — refine each module's -->
    <!-- own ui input rather than styling descendants from hellField. -->
    <div hellField ui="gap-hell-3 rounded-hell-lg border border-hell-primary bg-hell-primary-soft p-hell-4">
      <label
        hellFieldLabel
        for="styling-callsign"
        [ui]="{ root: 'text-hell-primary-soft-foreground' }"
      >
        Call sign
      </label>
      <input id="styling-callsign" hellInput placeholder="Maverick" />
      <div hellFieldDescription ui="text-hell-primary-soft-foreground">
        Shown on the roster and in dispatch logs.
      </div>
      <div hellFieldError ui="font-semibold text-hell-danger-strong">
        Call signs must be unique.
      </div>
    </div>
  `,
})
export class FieldAllPartsStylingExample {}
