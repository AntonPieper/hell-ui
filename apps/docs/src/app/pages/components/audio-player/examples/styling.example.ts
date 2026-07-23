import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellAudioPlayer, type HellAudioPlayerUi } from 'hell-ui/audio-player';
import { provideHellAudioTranscript } from 'hell-ui/features/audio-transcript';

@Component({
  selector: 'app-audio-player-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellAudioPlayer],
  providers: [provideHellAudioTranscript()],
  template: `
    <!-- Every public part refined: meta row, transport, action buttons, and
         the opt-in transcript strip. Open the CC toggle to see the strip. -->
    <hell-audio-player
      src="https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg"
      title="Quarterly briefing"
      [date]="recordedOn"
      [allowSpeechTranscript]="true"
      [ui]="playerUi"
    />
  `,
})
export class AudioPlayerStylingExample {
  protected readonly recordedOn = new Date(2026, 3, 22);

  protected readonly playerUi: HellAudioPlayerUi = {
    root: 'border-hell-primary bg-hell-primary-soft rounded-hell-lg',
    meta: 'border-b border-hell-border pb-hell-2',
    title: 'text-hell-primary',
    date: 'text-hell-primary',
    controls: 'gap-hell-3',
    transport: 'gap-hell-3',
    playButton: 'bg-hell-primary text-hell-foreground-inverse rounded-hell-pill',
    time: 'text-hell-primary font-semibold',
    seek: 'px-hell-2',
    actions: 'gap-hell-3',
    muteButton: 'text-hell-primary',
    volume: 'px-hell-2',
    captionToggle: 'text-hell-primary',
    downloadButton: 'text-hell-primary',
    captions: 'border-hell-primary bg-hell-surface rounded-hell-lg',
    captionsBar: 'border-b border-hell-border pb-hell-2',
    captionsStatus: 'text-hell-primary',
    captionsDot: 'bg-hell-primary',
    captionsActions: 'gap-hell-2',
    captionAction: 'text-hell-primary',
    captionsBody: 'bg-hell-primary-soft rounded-hell-md',
    captionsError: 'text-hell-danger font-semibold',
    captionsText: 'text-hell-foreground',
    captionsInterim: 'text-hell-primary italic',
    captionsEmpty: 'text-hell-primary',
  };
}
