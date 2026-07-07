import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';

@Component({
  selector: 'app-button-variants-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton],
  template: `
    <button hellButton variant="primary" type="button">Primary</button>
    <button hellButton variant="default" type="button">Default</button>
    <button hellButton variant="soft" type="button">Soft</button>
    <button hellButton variant="ghost" type="button">Ghost</button>
    <a hellButton variant="link" href="#" (click)="$event.preventDefault()">Link</a>
    <button hellButton variant="danger" type="button">Danger</button>
    <button hellButton variant="success" type="button">Success</button>
    <button hellButton variant="primary" type="button" disabled>Disabled</button>
  `,
})
export class ButtonVariantsExample {}
