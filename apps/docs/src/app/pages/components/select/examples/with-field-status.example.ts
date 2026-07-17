import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { type HellChipVariant } from '@hell-ui/angular/core';
import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';
import { HELL_SELECT_IMPORTS } from '@hell-ui/angular/select';
import { HellChip } from '@hell-ui/angular/chip';

type Decision = 'Approved' | 'Changes requested' | 'Rejected';

const DECISIONS: readonly Decision[] = ['Approved', 'Changes requested', 'Rejected'];

const DECISION_VARIANT: Record<Decision, HellChipVariant> = {
  Approved: 'success',
  'Changes requested': 'warning',
  Rejected: 'danger',
};

@Component({
  selector: 'app-select-with-field-status-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_SELECT_IMPORTS, ...HELL_FIELD_IMPORTS, HellButton, HellChip],
  template: `
    <form class="grid max-w-96 gap-hell-4" (submit)="submit($event)">
      <div hellField>
        <div class="flex items-center gap-hell-2">
          <label hellFieldLabel for="review-decision">Review decision</label>
          @if (decision(); as current) {
            <span hellChip [variant]="variantFor(current)">{{ current }}</span>
          }
        </div>
        <button
          id="review-decision"
          hellSelect
          type="button"
          [value]="decision()"
          (valueChange)="onDecisionChange($any($event))"
        >
          @if (decision(); as current) {
            <span hellSelectValue>{{ current }}</span>
          } @else {
            <span hellSelectPlaceholder>Choose a decision</span>
          }
          <ng-template hellSelectPortal>
            <div hellSelectDropdown>
              @for (option of decisions; track option) {
                <div hellSelectOption [value]="option">{{ option }}</div>
              }
            </div>
          </ng-template>
        </button>
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
  protected readonly decisions = DECISIONS;
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
