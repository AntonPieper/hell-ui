import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { CheckboxForms } from './checkbox-forms';
import { StyledPrimitives } from './controls';
import { DateInputForms } from './date-input-forms';
import { StyledInputs } from './inputs';
import { NumberInputForms } from './number-input-forms';
import { ComboboxProjection } from './projection';
import { SliderForms } from './slider-forms';
import { SwitchForms } from './switch-forms';
import { StyledTable } from './table';
import { TimeInputForms } from './time-input-forms';

@Component({
  selector: 'app-root',
  imports: [
    StyledPrimitives,
    StyledInputs,
    ComboboxProjection,
    CheckboxForms,
    SwitchForms,
    SliderForms,
    DateInputForms,
    NumberInputForms,
    TimeInputForms,
    StyledTable,
  ],
  template: `
    <main data-test-id="styled-controls">
      <p data-test-id="styled-controls-status">Styled controls ready</p>
      <app-styled-primitives />
      <app-styled-inputs />
      <app-combobox-projection />
      <app-checkbox-forms />
      <app-switch-forms />
      <app-slider-forms />
      <app-date-input-forms />
      <app-number-input-forms />
      <app-time-input-forms />
      <app-styled-table />
    </main>
  `,
})
class App {}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
