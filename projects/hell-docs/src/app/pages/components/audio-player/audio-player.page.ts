import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { AudioPlayerLiveCaptionsExample } from './examples/live-captions.example';
import audioPlayerLiveCaptionsExampleCodeRaw from './examples/live-captions.example.ts?raw' with {
  loader: 'text',
};
import { AudioPlayerUntitledControlsOnlyExample } from './examples/untitled-controls-only.example';
import audioPlayerUntitledControlsOnlyExampleCodeRaw from './examples/untitled-controls-only.example.ts?raw' with {
  loader: 'text',
};
import { AudioPlayerWithTitleAndDateExample } from './examples/with-title-and-date.example';
import audioPlayerWithTitleAndDateExampleCodeRaw from './examples/with-title-and-date.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-audio-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    AudioPlayerWithTitleAndDateExample,
    AudioPlayerUntitledControlsOnlyExample,
    AudioPlayerLiveCaptionsExample,
  ],
  template: `
    <article class="hd-prose">
      <h1>Audio player</h1>
      <p>
        Compact player wrapping a native <code>&lt;audio&gt;</code> element with play/pause,
        draggable scrubber, mute, volume slider, an optional download button, and — when the browser
        supports <code>SpeechRecognition</code> + <code>captureStream()</code> — an unobtrusive live
        captions strip.
      </p>

      <h2>With title and date</h2>
      <hd-example-tabs [code]="audioPlayerWithTitleAndDateExampleCode">
        <app-audio-player-with-title-and-date-example />
      </hd-example-tabs>

      <h2>Untitled (controls only)</h2>
      <p>
        Omit <code>title</code> and <code>date</code> for a stripped-down player — the meta row
        disappears entirely.
      </p>
      <hd-example-tabs [code]="audioPlayerUntitledControlsOnlyExampleCode">
        <app-audio-player-untitled-controls-only-example />
      </hd-example-tabs>

      <h2>Live captions</h2>
      <p>
        Use the CC toggle to open the captions strip when you want it. Captions auto-start with
        playback and auto-stop on pause — the dedicated speed pill (1× → 1.25× → …) lives inside the
        strip so the main controls stay clean. Mute the audio entirely if you only want the
        transcript. Seeking or replaying clears the live transcript so captions stay aligned with
        current playback.
      </p>
      <hd-example-tabs [code]="audioPlayerLiveCaptionsExampleCode">
        <app-audio-player-live-captions-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>src</code>: required audio URL</li>
        <li><code>title</code>: optional display title (hidden when not set)</li>
        <li><code>date</code>: <code>Date | string</code> shown next to the title</li>
        <li><code>downloadName</code>: filename for the download link</li>
        <li><code>allowDownload</code>: show / hide download button (default <code>true</code>)</li>
        <li>
          <code>lang</code>: BCP-47 hint for <code>SpeechRecognition</code>. Defaults to
          <code>&lt;html lang&gt;</code> or <code>en-US</code>.
        </li>
      </ul>

      <h2>Interactions</h2>
      <ul>
        <li>
          Click <em>or</em> drag the seek bar to scrub. Hover/focus enlarges the track and reveals
          the thumb.
        </li>
        <li><kbd>←</kbd> / <kbd>→</kbd> on the focused seek bar jumps 5s.</li>
        <li>Volume slider doubles as a mute toggle when dragged to 0.</li>
        <li>
          The CC button only appears in browsers that expose <code>SpeechRecognition</code> and
          <code>HTMLMediaElement.captureStream()</code> — currently Chromium-based desktops. Audio
          is piped via <code>start(track)</code>, so no microphone permission is needed.
        </li>
        <li>
          Toggling CC while paused only opens the captions panel. Captions follow the audio: pause
          the audio and recognition pauses; press play to resume live capture.
        </li>
        <li>
          Seeking or replaying clears the current transcript before capture resumes from the new
          playback position.
        </li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>
          Provide a clear <code>title</code> and <code>date</code> for recorded calls or messages.
        </li>
        <li>Use <code>lang</code> and captions when transcript language matters.</li>
        <li>Disable downloads when audio is sensitive.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't rely on waveform or timing alone to communicate state.</li>
        <li>Don't expose download actions for private recordings.</li>
      </ul>
    </article>
  `,
})
export class AudioPlayerPage {
  protected readonly audioPlayerWithTitleAndDateExampleCode =
    audioPlayerWithTitleAndDateExampleCodeRaw;
  protected readonly audioPlayerUntitledControlsOnlyExampleCode =
    audioPlayerUntitledControlsOnlyExampleCodeRaw;
  protected readonly audioPlayerLiveCaptionsExampleCode = audioPlayerLiveCaptionsExampleCodeRaw;
}
