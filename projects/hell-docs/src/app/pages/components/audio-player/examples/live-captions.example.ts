import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellAudioPlayer } from '@hell-ui/angular/composites';

@Component({
  selector: 'app-audio-player-live-captions-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellAudioPlayer],
  template: `
    <hell-audio-player
      src="https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg"
      title="Read while you listen"
      [allowSpeechTranscript]="true"
    />
  `,
})
export class AudioPlayerLiveCaptionsExample {
  protected readonly exampleDate = new Date(2026, 3, 22);
}
