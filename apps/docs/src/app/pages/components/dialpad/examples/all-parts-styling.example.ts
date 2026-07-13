import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellDialpad, type HellDialpadUi } from '@hell-ui/angular/features/dialpad';

@Component({
  selector: 'app-dialpad-all-parts-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDialpad],
  template: `<hell-dialpad value="5550137" [ui]="dialpadUi" />`,
})
export class DialpadAllPartsStylingExample {
  protected readonly dialpadUi: HellDialpadUi = {
    root: 'max-w-[320px] gap-hell-3 rounded-hell-lg bg-hell-surface-subtle p-hell-3',
    display: 'rounded-hell-sm border-hell-primary bg-hell-primary-soft',
    displayLabel: 'text-hell-primary',
    numberInput: 'text-hell-primary',
    controls: 'gap-hell-3',
    clearButton: 'rounded-hell-pill border-hell-foreground-muted bg-hell-foreground-muted',
    backspaceButton: 'rounded-hell-pill border-hell-foreground-muted bg-hell-foreground-muted',
    grid: 'gap-hell-3',
    keyButton: 'rounded-hell-md border-hell-primary/40 bg-hell-surface-elevated',
    digit: 'text-hell-primary',
    letters: 'text-hell-foreground-subtle',
    lowerGrid: 'gap-hell-3',
    callButton: 'rounded-hell-pill bg-hell-success shadow-hell-md',
  };
}
