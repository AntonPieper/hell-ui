import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_ALERT_DIRECTIVES } from '@hell-ui/angular/alert';

@Component({
  selector: 'app-alert-banner-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_ALERT_DIRECTIVES],
  template: `
    <div class="overflow-hidden rounded-hell-md border border-hell-border">
      <hell-alert variant="warning" layout="banner">
        <h3 hellAlertTitle>Unsupported browser</h3>
        <p hellAlertDescription>
          Some call-control features need a current browser. Update to keep the console fully
          functional.
        </p>
      </hell-alert>
      <div class="p-hell-4 text-sm text-hell-foreground-muted">App content sits below the banner.</div>
    </div>
  `,
})
export class AlertBannerExample {}
