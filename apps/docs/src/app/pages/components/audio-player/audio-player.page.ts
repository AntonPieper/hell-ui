import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { AudioPlayerSpeechTranscriptExample } from './examples/speech-transcript.example';
import audioPlayerSpeechTranscriptExampleCodeRaw from './examples/speech-transcript.example.ts?raw' with {
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
import { AudioPlayerStylingExample } from './examples/styling.example';
import audioPlayerStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-audio-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    AudioPlayerWithTitleAndDateExample,
    AudioPlayerUntitledControlsOnlyExample,
    AudioPlayerSpeechTranscriptExample, AudioPlayerStylingExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Audio player"
        icon="faSolidPlay"
        category="Composite"
        importPath="@hell-ui/angular/audio-player"
        stylesPath="@hell-ui/angular/audio-player/styles.css"
      >
        A compact player for recorded audio: play/pause, seek, volume, optional download — and an explicitly opt-in, best-effort browser speech transcript.
      </hd-page-header>
      <p>
        Compact player wrapping a native <code>&lt;audio&gt;</code> element with play/pause,
        draggable scrubber, mute, volume slider, an optional download button, and — when the
        optional transcript provider is imported and the browser supports
        <code>SpeechRecognition</code> + <code>captureStream()</code> — an unobtrusive speech
        transcript strip.
      </p>
      <p>
        The speech transcript is experimental and relies on browser speech-recognition and
        media-capture APIs from <code>@hell-ui/angular/features/audio-transcript</code>. It is
        intentionally best-effort only, not accessibility-grade captions or timed text; treat it as a
        convenience aid and never as a replacement for provided captions, transcripts, or
        server-generated accessibility content. Remote media capture also depends on the audio
        server's CORS headers and the configured <code>crossorigin</code> mode.
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

      <h2>Speech transcript</h2>
      <p>
        Import <code>provideHellAudioTranscript()</code> from
        <code>@hell-ui/angular/features/audio-transcript</code>, then use the transcript toggle to
        open the strip when you want it. Speech recognition auto-starts with playback and auto-stops
        on pause — the dedicated speed pill (1× → 1.25× → …) lives inside the strip so the main
        controls stay clean. Mute the audio entirely if you only want the transcript. Seeking or
        replaying clears the best-effort transcript so it follows current playback.
      </p>
      <hd-example-tabs [code]="audioPlayerSpeechTranscriptExampleCode">
        <app-audio-player-speech-transcript-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        The audio player is an owned-anatomy Composite: <code>HellAudioPlayerUi</code> names player-owned parts such as <code>playButton</code>, <code>seek</code>, and <code>title</code> — not the internals of the primitives it happens to render.
      </p>
      <hd-example-tabs [code]="audioPlayerStylingExampleCode" previewClass="grid gap-3">
        <app-audio-player-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>src</code>: required audio URL</li>
        <li><code>title</code>: optional display title (hidden when not set)</li>
        <li><code>date</code>: <code>Date | string</code> shown next to the title</li>
        <li><code>downloadName</code>: filename for the download link</li>
        <li><code>allowDownload</code>: show / hide download button (default <code>true</code>)</li>
        <li>
          <code>ui</code>: Part Style Map overrides for root, metadata, controls, transport,
          sliders, action buttons, time labels, and transcript/caption regions via
          <code>HellAudioPlayerUi</code>.
        </li>
        <li>
          <code>crossOrigin</code> / <code>crossorigin</code>: forwarded to the native audio
          element. Defaults to <code>anonymous</code>; use <code>use-credentials</code> only
          when the media server is configured for credentialed CORS, or <code>null</code> to omit
          the attribute.
        </li>
        <li>
          <code>allowSpeechTranscript</code>: opt into experimental browser speech transcription
          after importing <code>provideHellAudioTranscript()</code> from the optional feature
          entrypoint (default <code>false</code>). It is best-effort only and not intended as
          accessibility-grade captions/timed text. <code>allowLiveCaptions</code> remains a
          deprecated compatibility alias.
        </li>
        <li>
          <code>lang</code>: BCP-47 hint for <code>SpeechRecognition</code>. Defaults to
          <code>&lt;html lang&gt;</code> or <code>en-US</code>.
        </li>
        <li>
          <code>hellAudioSpeechSupported()</code>: import this support probe from
          <code>@hell-ui/angular/features/audio-transcript</code>. The old
          <code>@hell-ui/angular/audio-player</code> export is a deprecated compatibility stub.
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
          The transcript button only appears after the optional transcript provider is imported and
          the browser exposes <code>SpeechRecognition</code> and
          <code>HTMLMediaElement.captureStream()</code> — currently Chromium-based desktops are
          common. Results are best-effort only, so recognition accuracy and timing may drift. Audio
          is piped via <code>start(track)</code>, so no microphone permission is needed. For remote
          audio, capture may still fail unless the response permits the selected
          <code>crossorigin</code> mode and the browser allows media-element capture.
        </li>
        <li>
          Toggling the transcript while paused only opens the panel. Transcription follows the
          audio: pause the audio and recognition pauses; press play to resume capture.
        </li>
        <li>
          Seeking or replaying clears the current best-effort transcript before capture resumes from
          the new playback position.
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>Transport controls are native buttons with Label Contract names; the seek and volume sliders expose value text.</li>
        <li>Playback state changes are reflected through structured state, not color alone.</li>
        <li>Treat the speech transcript as a convenience aid, never as provided captions or an accessibility substitute.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>
          Provide a clear <code>title</code> and <code>date</code> for recorded calls or messages.
        </li>
        <li>Use provided captions or transcripts when accessibility must be reliable.</li>
        <li>
          Import <code>provideHellAudioTranscript()</code> and set
          <code>[allowSpeechTranscript]="true"</code> only for best-effort browser speech
          transcripts.
        </li>
        <li>Disable downloads when audio is sensitive.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't rely on waveform or timing alone to communicate state.</li>
        <li>Don't treat browser speech transcripts as production-grade accessibility content.</li>
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
  protected readonly audioPlayerSpeechTranscriptExampleCode = audioPlayerSpeechTranscriptExampleCodeRaw;
  protected readonly audioPlayerStylingExampleCode = audioPlayerStylingExampleCodeRaw;
}
