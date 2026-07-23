import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellRadio, HellRadioGroup, HellRadioIndicator } from 'hell-ui/radio';
import { HELL_CARD_IMPORTS } from 'hell-ui/card';
import { HELL_FIELD_IMPORTS } from 'hell-ui/field';
import { HellChip } from 'hell-ui/chip';

type Plan = 'starter' | 'team' | 'enterprise';

@Component({
  selector: 'app-radio-plan-picker-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellRadioGroup,
    HellRadio,
    HellRadioIndicator,
    ...HELL_CARD_IMPORTS,
    ...HELL_FIELD_IMPORTS,
    HellChip,
  ],
  template: `
    <div hellCard class="max-w-md" [elevation]="0">
      <div hellCardHeader>Choose a plan</div>
      <div hellCardBody>
        <div
          hellRadioGroup
          aria-label="Plan"
          orientation="vertical"
          [required]="true"
          [value]="plan()"
          (valueChange)="plan.set($event!)"
          class="grid gap-hell-4"
        >
          <div hellField orientation="horizontal" class="items-start">
            <button
              id="plan-starter"
              hellRadio
              value="starter"
              type="button"
              class="mt-hell-1"
              aria-label="Starter"
            >
              <span ngpRadioIndicator></span>
            </button>
            <label hellFieldLabel for="plan-starter">Starter</label>
            <div hellFieldDescription>1 seat, community support.</div>
          </div>

          <div hellField orientation="horizontal" class="items-start">
            <button
              id="plan-team"
              hellRadio
              value="team"
              type="button"
              class="mt-hell-1"
              aria-label="Team"
            >
              <span ngpRadioIndicator></span>
            </button>
            <label hellFieldLabel for="plan-team" class="gap-hell-2">
              Team
              <span hellChip variant="primary">Popular</span>
            </label>
            <div hellFieldDescription>Up to 20 seats, priority support.</div>
          </div>

          <div hellField orientation="horizontal" class="items-start">
            <button
              id="plan-enterprise"
              hellRadio
              value="enterprise"
              type="button"
              class="mt-hell-1"
              aria-label="Enterprise"
            >
              <span ngpRadioIndicator></span>
            </button>
            <label hellFieldLabel for="plan-enterprise">Enterprise</label>
            <div hellFieldDescription>Unlimited seats, SSO, and an account manager.</div>
          </div>
        </div>
      </div>
      <div hellCardFooter>
        <span class="text-xs text-hell-foreground-muted">
          Selected: <code>{{ plan() }}</code>
        </span>
      </div>
    </div>
  `,
})
export class RadioPlanPickerExample {
  protected readonly plan = signal<Plan>('team');
}
