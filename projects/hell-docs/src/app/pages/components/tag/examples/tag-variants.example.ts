import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellBadge, HellKbd, HellTag } from 'hell/primitives';

@Component({
  selector: 'app-tag-tag-variants-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellTag],
  template: `
    <span hellTag>default</span>
    <span hellTag variant="primary">primary</span>
    <span hellTag variant="info">info</span>
    <span hellTag variant="success">success</span>
    <span hellTag variant="warning">warning</span>
    <span hellTag variant="danger">danger</span>
  `,
})
export class TagTagVariantsExample {}
