import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellButton, type HellButtonUi } from '@hell-ui/angular/button';

@Component({
  selector: 'app-button-customization-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton],
  template: `
    <button hellButton [ui]="confirmUi">Confirm transfer</button>
    <button hellButton variant="ghost" [ui]="auditUi">Audit log</button>
  `,
})
export class ButtonCustomizationExample {
  protected readonly confirmUi = {
    root: 'rounded-hell-pill bg-hell-success-strong text-hell-foreground-inverse data-hover:bg-hell-success-hover data-press:bg-hell-success-active',
  } satisfies HellButtonUi;

  protected readonly auditUi = {
    root: 'border-hell-border-strong bg-hell-surface-subtle text-hell-foreground-muted data-hover:bg-hell-surface-muted',
  } satisfies HellButtonUi;
}
