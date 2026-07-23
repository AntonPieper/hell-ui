import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { HELL_SELECT_IMPORTS } from 'hell-ui/select';

const ENVIRONMENTS = ['Staging', 'Preview', 'Production'];

@Component({
  selector: 'app-select-forms-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, ...HELL_SELECT_IMPORTS],
  template: `
    <button
      hellSelect
      type="button"
      aria-label="Deploy environment"
      class="max-w-60"
      [formField]="deployForm.environment"
    >
      @if (deployForm.environment().value(); as current) {
        <span hellSelectValue>{{ current }}</span>
      } @else {
        <span hellSelectPlaceholder>Choose an environment…</span>
      }
      <ng-template hellSelectPortal>
        <div hellSelectDropdown>
          @for (environment of environments; track environment) {
            <div hellSelectOption [value]="environment">{{ environment }}</div>
          }
        </div>
      </ng-template>
    </button>
    <p class="m-0 mt-hell-3 text-hell-sm text-hell-foreground-muted">
      A <code>required()</code> rule keeps the field invalid until a value is picked. Selected:
      <code>{{ deployForm.environment().value() ?? 'none' }}</code> · Invalid:
      <code>{{ deployForm.environment().invalid() }}</code> · Touched:
      <code>{{ deployForm.environment().touched() }}</code>
    </p>
  `,
})
export class SelectFormsExample {
  protected readonly environments = ENVIRONMENTS;
  protected readonly deploy = signal<{ environment: string | null }>({ environment: null });
  protected readonly deployForm = form(this.deploy, (path) => {
    required(path.environment);
  });
}
