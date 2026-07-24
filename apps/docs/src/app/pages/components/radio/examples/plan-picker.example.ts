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
          <div hellField orientation="horizontal" [ui]="fieldUi">
            <button
              id="plan-starter"
              hellRadio
              value="starter"
              type="button"
              aria-label="Starter"
            >
              <span ngpRadioIndicator></span>
            </button>
            <label hellFieldLabel for="plan-starter">Starter</label>
            <div hellFieldDescription class="col-start-2">1 seat, community support.</div>
          </div>

          <div hellField orientation="horizontal" [ui]="fieldUi">
            <button id="plan-team" hellRadio value="team" type="button" aria-label="Team">
              <span ngpRadioIndicator></span>
            </button>
            <label hellFieldLabel for="plan-team">
              Team
              <span hellChip variant="primary">Popular</span>
            </label>
            <div hellFieldDescription class="col-start-2">Up to 20 seats, priority support.</div>
          </div>

          <div hellField orientation="horizontal" [ui]="fieldUi">
            <button
              id="plan-enterprise"
              hellRadio
              value="enterprise"
              type="button"
              aria-label="Enterprise"
            >
              <span ngpRadioIndicator></span>
            </button>
            <label hellFieldLabel for="plan-enterprise">Enterprise</label>
            <div hellFieldDescription class="col-start-2">
              Unlimited seats, SSO, and an account manager.
            </div>
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

  /**
   * Refine the horizontal field row into a control/text grid: the radio fills
   * the first column, label (plus optional chip) and description share the
   * second, so the description lines up under the label instead of the
   * control. The rows keep the field's centered cross-axis alignment, which
   * holds whether or not a chip stretches the label row.
   */
  protected readonly fieldUi =
    'grid grid-cols-[auto_minmax(0,1fr)] data-[orientation=horizontal]:gap-hell-1 data-[orientation=horizontal]:gap-x-hell-3';
}
