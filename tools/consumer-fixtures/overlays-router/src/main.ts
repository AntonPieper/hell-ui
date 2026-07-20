import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { FilterBuilder } from './filters';
import { CompositeLayout } from './layout';
import { OverlayPrompts } from './prompts';
import { CompositeShell } from './shell';

@Component({
  selector: 'app-root',
  imports: [CompositeShell, OverlayPrompts, CompositeLayout, FilterBuilder],
  template: `
    <main data-test-id="overlays-router">
      <p data-test-id="overlays-router-status">Overlays and router ready</p>
      <app-composite-shell />
      <app-overlay-prompts />
      <app-composite-layout />
      <app-filter-builder />
    </main>
  `,
})
class App {}

// The router peer is installed and wired: composite overlays must coexist
// with an application router without pulling one in as a hard dependency.
bootstrapApplication(App, {
  providers: [provideRouter([])],
}).catch((error: unknown) => console.error(error));
