import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellAudioPlayer } from '@hell-ui/angular/audio-player';

@Component({
  selector: 'app-audio-player-untitled-controls-only-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellAudioPlayer],
  template: `
    <hell-audio-player
      src="https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg"
      [allowDownload]="false"
    />
  `,
})
export class AudioPlayerUntitledControlsOnlyExample {
  protected readonly exampleDate = new Date(2026, 3, 22);
}
