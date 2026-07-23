import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_ALERT_IMPORTS } from 'hell-ui/alert';

@Component({
  selector: 'app-alert-banner-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_ALERT_IMPORTS],
  template: `
    <div class="overflow-hidden rounded-hell-md border border-hell-border">
      <!-- The banner look is a Part Style Map refinement, not a component mode. -->
      <hell-alert variant="warning" ui="w-full rounded-none border-x-0">
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
