import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidBars,
  faSolidChevronDown,
  faSolidChevronRight,
  faSolidCircleInfo,
  faSolidCircleCheck,
  faSolidTriangleExclamation,
  faSolidXmark,
  faSolidMagnifyingGlass,
  faSolidPlay,
  faSolidPause,
  faSolidVolumeHigh,
  faSolidVolumeXmark,
  faSolidArrowDown,
  faSolidPhone,
  faSolidUpload,
  faSolidCheck,
  faSolidEllipsisVertical,
} from '@ng-icons/font-awesome/solid';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })),
    provideIcons({
      faSolidBars,
      faSolidChevronDown,
      faSolidChevronRight,
      faSolidCircleInfo,
      faSolidCircleCheck,
      faSolidTriangleExclamation,
      faSolidXmark,
      faSolidMagnifyingGlass,
      faSolidPlay,
      faSolidPause,
      faSolidVolumeHigh,
      faSolidVolumeXmark,
      faSolidArrowDown,
      faSolidPhone,
      faSolidUpload,
      faSolidCheck,
      faSolidEllipsisVertical,
    }),
  ],
};
