import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellAudioPlayer } from '@hell-ui/angular/audio-player';

@Component({
  selector: 'app-audio-player-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellAudioPlayer],
  template: `
    <!-- The Composite exposes flat, player-owned Public Parts. -->
    <hell-audio-player
      src="https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg"
      title="Styled briefing"
      [ui]="{
        root: 'border-hell-primary',
        playButton: 'bg-hell-primary text-hell-foreground-inverse',
        title: 'text-hell-primary',
      }"
    />
  `,
})
export class AudioPlayerStylingExample {}
