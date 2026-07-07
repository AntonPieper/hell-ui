import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellAudioPlayer } from '@hell-ui/angular/audio-player';

@Component({
  selector: 'app-audio-player-with-title-and-date-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellAudioPlayer],
  template: `
    <hell-audio-player
      src="https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg"
      title="Onboarding call — Acme Corp"
      [date]="recordedOn"
      downloadName="acme-onboarding-call.ogg"
    />
  `,
})
export class AudioPlayerWithTitleAndDateExample {
  protected readonly recordedOn = new Date(2026, 3, 22);
}
