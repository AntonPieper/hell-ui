import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_SELECT_BASIC_DIRECTIVES } from '@hell-ui/angular/select';

const REGIONS = ['eu-central', 'eu-west', 'us-east', 'ap-south'];

@Component({
  selector: 'app-select-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_SELECT_BASIC_DIRECTIVES],
  template: `
    <!-- HellSelectBasicPart: root | trigger | value | placeholder | dropdown | option. -->
    <hell-select-basic
      class="max-w-60"
      aria-label="Deployment region"
      placeholder="Pick region"
      [options]="options"
      [value]="value()"
      [ui]="{
        trigger: 'border-hell-primary font-mono',
        dropdown: 'border-hell-primary',
        option: 'font-mono data-active:bg-hell-primary-soft',
      }"
      (valueChange)="value.set($event === null ? null : $any($event))"
    />
  `,
})
export class SelectStylingExample {
  protected readonly options = REGIONS;
  protected readonly value = signal<string | null>('eu-central');
}
