import { Component } from '@angular/core';
import { HellButton } from '@hell-ui/angular/primitives';

@Component({
  selector: 'app-getting-started-button-demo',
  imports: [HellButton],
  template: `<button hellButton variant="primary">Save changes</button>`,
})
export class GettingStartedButtonDemo {}
