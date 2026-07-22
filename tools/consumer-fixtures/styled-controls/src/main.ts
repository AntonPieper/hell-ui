import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { StyledPrimitives } from './controls';
import { DateInputForms } from './date-input-forms';
import { StyledInputs } from './inputs';
import { NumberInputForms } from './number-input-forms';
import { ComboboxProjection } from './projection';
import { SliderForms } from './slider-forms';
import { StyledTable } from './table';

@Component({
  selector: 'app-root',
  imports: [
    StyledPrimitives,
    StyledInputs,
    ComboboxProjection,
    SliderForms,
    DateInputForms,
    NumberInputForms,
    StyledTable,
  ],
  template: `
    <main data-test-id="styled-controls">
      <p data-test-id="styled-controls-status">Styled controls ready</p>
      <app-styled-primitives />
      <app-styled-inputs />
      <app-combobox-projection />
      <app-slider-forms />
      <app-date-input-forms />
      <app-number-input-forms />
      <app-styled-table />
    </main>
  `,
})
class App {}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
