import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellAudioPlayer } from '@hell-ui/angular/audio-player';
import { provideHellAudioTranscript } from '@hell-ui/angular/features/audio-transcript';

@Component({
  selector: 'app-audio-player-speech-transcript-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellAudioPlayer],
  providers: [...provideHellAudioTranscript()],
  template: `
    <hell-audio-player
      src="https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg"
      title="Read while you listen"
      [allowSpeechTranscript]="true"
    />
  `,
})
export class AudioPlayerSpeechTranscriptExample {
  protected readonly exampleDate = new Date(2026, 3, 22);
}
