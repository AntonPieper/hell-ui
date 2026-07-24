import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_ALERT_IMPORTS, type HellAlertUi } from 'hell-ui/alert';

@Component({
  selector: 'app-alert-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_ALERT_IMPORTS],
  template: `
    <hell-alert variant="info" [ui]="compactUi">
      <h3 hellAlertTitle ui="text-xs">Compact density</h3>
      <p hellAlertDescription ui="text-xs">
        Tighter padding and a smaller glyph for dense screens — behavior and semantics are unchanged.
      </p>
    </hell-alert>
  `,
})
export class AlertStylingExample {
  protected readonly compactUi: HellAlertUi = {
    root: 'gap-hell-2 rounded-hell-sm p-hell-2',
    icon: 'mt-px h-3.5 w-3.5',
    content: 'gap-0',
  };
}
