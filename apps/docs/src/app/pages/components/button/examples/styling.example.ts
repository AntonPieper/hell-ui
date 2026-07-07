import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellButton, type HellButtonUi } from '@hell-ui/angular/button';

@Component({
  selector: 'app-button-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton],
  template: `
    <button
      hellButton
      ui="rounded-hell-pill bg-hell-success-strong text-hell-foreground-inverse data-hover:bg-hell-success-hover data-press:bg-hell-success-active"
      type="button"
    >
      Confirm transfer
    </button>

    <button
      hellButton
      variant="ghost"
      ui="rounded-hell-sm border-hell-border-strong bg-hell-surface-subtle text-hell-foreground-muted data-hover:bg-hell-surface-muted"
      type="button"
    >
      Audit log
    </button>

    <button hellButton [ui]="rootPartMap" type="button">Escalate incident</button>
  `,
})
export class ButtonStylingExample {
  protected readonly rootPartMap: HellButtonUi = {
    root: 'rounded-hell-lg bg-hell-danger px-hell-7 text-hell-foreground-inverse shadow-hell-lg data-hover:bg-hell-danger-hover data-press:bg-hell-danger-active',
  };
}
