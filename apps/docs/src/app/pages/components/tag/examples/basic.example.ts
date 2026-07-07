import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellTag } from '@hell-ui/angular/tag';

@Component({
  selector: 'app-tag-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellTag],
  template: `<span hellTag variant="success">Active</span>`,
})
export class TagBasicExample {}
