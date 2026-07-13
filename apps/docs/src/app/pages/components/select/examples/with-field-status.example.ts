import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { type HellChipVariant } from '@hell-ui/angular/core';
import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/field';
import { HellSelect } from '@hell-ui/angular/select';
import { HellChip } from '@hell-ui/angular/chip';

type Decision = 'Approved' | 'Changes requested' | 'Rejected';

const DECISIONS: readonly Decision[] = ['Approved', 'Changes requested', 'Rejected'];

const DECISION_OPTIONS = DECISIONS.map((decision) => ({ value: decision, label: decision }));

const DECISION_VARIANT: Record<Decision, HellChipVariant> = {
  Approved: 'success',
  'Changes requested': 'warning',
  Rejected: 'danger',
};

@Component({
  selector: 'app-select-with-field-status-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSelect, ...HELL_FIELD_DIRECTIVES, HellButton, HellChip],
  template: `
    <form class="grid max-w-96 gap-hell-4" (submit)="submit($event)">
      <div hellField>
        <label hellFieldLabel for="review-decision">
          Review decision
          @if (decision(); as current) {
            <span hellChip [variant]="variantFor(current)">{{ current }}</span>
          }
        </label>
        <hell-select
          id="review-decision"
          placeholder="Choose a decision"
          [options]="decisionOptions"
          [value]="decision()"
          (valueChange)="onDecisionChange($any($event))"
        />
        <div hellFieldDescription>The author is notified as soon as you submit.</div>
        @if (showError()) {
          <div hellFieldError>Pick a decision before submitting the review.</div>
        }
      </div>

      <button hellButton variant="primary" type="submit" class="justify-self-start">
        Submit review
      </button>
    </form>
  `,
})
export class SelectWithFieldStatusExample {
  protected readonly decisionOptions = DECISION_OPTIONS;
  protected readonly decision = signal<Decision | null>(null);
  private readonly submitted = signal(false);
  protected readonly showError = computed(() => this.submitted() && this.decision() === null);

  protected onDecisionChange(next: Decision | null): void {
    this.decision.set(next);
  }

  protected variantFor(decision: Decision): HellChipVariant {
    return DECISION_VARIANT[decision];
  }

  protected submit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
  }
}
