import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellAudioPlayer } from '@hell-ui/angular/composites';

@Component({
  selector: 'app-audio-player-with-title-and-date-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellAudioPlayer],
  template: `
    <hell-audio-player
      src="https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg"
      downloadName="example.ogg"
      title="Example track"
      [date]="exampleDate"
    />
  `,
})
export class AudioPlayerWithTitleAndDateExample {
  protected readonly exampleDate = new Date(2026, 3, 22);
}
