import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HellDialpad } from 'hell-ui/features/dialpad';
import { HellToggleGroup, HellToggleGroupItem, type HellToggleGroupValue } from 'hell-ui/toggle';

@Component({
  selector: 'app-dialpad-states-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDialpad, HellToggleGroup, HellToggleGroupItem],
  template: `
    <div class="grid gap-3">
      <hell-dialpad
        value="5550137"
        [disabled]="disabled()"
        [readOnly]="readOnly()"
        [invalid]="invalid()"
        [showCallButton]="showCallButton()"
      />

      <div
        hellToggleGroup
        type="multiple"
        class="flex flex-wrap"
        aria-label="Dialpad states"
        [value]="states()"
        (valueChange)="onStatesChange($event)"
      >
        <button hellToggleGroupItem type="button" value="disabled">Disabled</button>
        <button hellToggleGroupItem type="button" value="readonly">Read-only</button>
        <button hellToggleGroupItem type="button" value="invalid">Invalid</button>
        <button hellToggleGroupItem type="button" value="noCall">Hide call button</button>
      </div>
    </div>
  `,
})
export class DialpadStatesExample {
  protected readonly states = signal<string[]>([]);
  protected readonly disabled = computed(() => this.states().includes('disabled'));
  protected readonly readOnly = computed(() => this.states().includes('readonly'));
  protected readonly invalid = computed(() => this.states().includes('invalid'));
  protected readonly showCallButton = computed(() => !this.states().includes('noCall'));

  protected onStatesChange(value: HellToggleGroupValue): void {
    this.states.set(Array.isArray(value) ? [...value] : value ? [value] : []);
  }
}
