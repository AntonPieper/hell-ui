import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { StyleModeSurfaces } from './surfaces';

@Component({
  selector: 'app-root',
  imports: [StyleModeSurfaces],
  template: `
    <main data-test-id="style-mode">
      <p data-test-id="style-mode-status">Style mode surfaces ready</p>
      <app-style-mode-surfaces />
    </main>
  `,
})
class App {}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
