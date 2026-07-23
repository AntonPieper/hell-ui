import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HellAudioPlayer } from 'hell-ui/audio-player';
import { HellDatePicker, HellDateRangePicker } from 'hell-ui/date-picker';
import { provideHellAudioTranscript } from 'hell-ui/features/audio-transcript';
import { HellDialpad, type HellDialpadUi } from 'hell-ui/features/dialpad';
import { HellIcon } from 'hell-ui/icon';
import { provideIcons } from '@ng-icons/core';
import { faSolidCheck } from '@ng-icons/font-awesome/solid';

// Icon-backed boundary: entries whose implementations import @ng-icons/core
// and @ng-icons/font-awesome compile and run only when the icon peers are
// installed; the transcript feature provider opts in without heavy peers.
@Component({
  selector: 'app-root',
  imports: [HellAudioPlayer, HellDatePicker, HellDateRangePicker, HellDialpad, HellIcon],
  providers: [provideIcons({ faSolidCheck })],
  template: `
    <main data-test-id="icon-audio">
      <p data-test-id="icon-audio-status">Icon-backed components ready</p>
      <hell-icon name="faSolidCheck" aria-hidden="true" [ui]="iconUi" />
      <hell-date-picker [date]="date" />
      <hell-date-range-picker [startDate]="rangeStart" [endDate]="rangeEnd" />
      <hell-dialpad [ui]="dialpadUi" />
      <hell-audio-player src="/sample.ogg" title="Status recording" allowSpeechTranscript />
    </main>
  `,
})
class App {
  protected readonly iconUi = { root: 'text-hell-info' };
  protected readonly date = new Date(2026, 3, 22);
  protected readonly rangeStart = new Date(2026, 3, 5);
  protected readonly rangeEnd = new Date(2026, 3, 12);
  protected readonly dialpadUi = {
    root: 'max-w-[320px]',
    keyButton: 'rounded-full',
  } satisfies HellDialpadUi;
}

bootstrapApplication(App, {
  providers: [...provideHellAudioTranscript()],
}).catch((error: unknown) => console.error(error));
