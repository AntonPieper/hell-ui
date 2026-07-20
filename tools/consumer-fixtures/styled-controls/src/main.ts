import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { StyledPrimitives } from './controls';
import { StyledInputs } from './inputs';
import { ComboboxProjection } from './projection';
import { StyledTable } from './table';

@Component({
  selector: 'app-root',
  imports: [StyledPrimitives, StyledInputs, ComboboxProjection, StyledTable],
  template: `
    <main data-test-id="styled-controls">
      <p data-test-id="styled-controls-status">Styled controls ready</p>
      <app-styled-primitives />
      <app-styled-inputs />
      <app-combobox-projection />
      <app-styled-table />
    </main>
  `,
})
class App {}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
