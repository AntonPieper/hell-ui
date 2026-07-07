import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellTag } from '@hell-ui/angular/tag';

@Component({
  selector: 'app-tag-variants-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellTag],
  template: `
    <span hellTag>Default</span>
    <span hellTag variant="primary">Primary</span>
    <span hellTag variant="info">Info</span>
    <span hellTag variant="success">Success</span>
    <span hellTag variant="warning">Warning</span>
    <span hellTag variant="danger">Danger</span>
  `,
})
export class TagVariantsExample {}
