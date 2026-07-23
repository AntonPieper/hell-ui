import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellAudioPlayer } from 'hell-ui/audio-player';
import { provideHellAudioTranscript } from 'hell-ui/features/audio-transcript';

@Component({
  selector: 'app-audio-player-speech-transcript-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellAudioPlayer],
  providers: [provideHellAudioTranscript()],
  template: `
    <hell-audio-player
      src="https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg"
      title="Standup recording"
      [allowSpeechTranscript]="true"
    />
  `,
})
export class AudioPlayerSpeechTranscriptExample {}
