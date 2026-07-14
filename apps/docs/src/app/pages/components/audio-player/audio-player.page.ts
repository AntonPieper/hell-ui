import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { AudioPlayerBasicExample } from './examples/basic.example';
import audioPlayerBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { AudioPlayerWithTitleAndDateExample } from './examples/with-title-and-date.example';
import audioPlayerWithTitleAndDateExampleCodeRaw from './examples/with-title-and-date.example.ts?raw' with {
  loader: 'text',
};
import { AudioPlayerSpeechTranscriptExample } from './examples/speech-transcript.example';
import audioPlayerSpeechTranscriptExampleCodeRaw from './examples/speech-transcript.example.ts?raw' with {
  loader: 'text',
};
import { AudioPlayerVoicemailInboxExample } from './examples/voicemail-inbox.example';
import audioPlayerVoicemailInboxExampleCodeRaw from './examples/voicemail-inbox.example.ts?raw' with {
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
    PageHeader,
    AudioPlayerBasicExample,
    AudioPlayerWithTitleAndDateExample,
    AudioPlayerSpeechTranscriptExample,
    AudioPlayerVoicemailInboxExample,
    AudioPlayerStylingExample,
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
        A compact player for recorded audio — play/pause, seek, mute, volume, and optional download —
        with a title/date meta row and an opt-in, best-effort browser speech transcript.
      </hd-page-header>
      <p>
        <code>hell-audio-player</code> wraps a native <code>&lt;audio&gt;</code> element in a
        single dense row of Hell controls: a play/pause button, an elapsed/duration pair around a
        draggable seek slider, a mute button, a volume slider, and an optional download link. It
        composes the <code>Button</code>, <code>Slider</code>, and <code>Icon</code>
        primitives, and its playback, seek, and volume logic live in a small
        internal Audio Runtime rather than the template.
      </p>
      <p>
        Reach for it wherever a business app surfaces short recordings inline — voicemail and call
        recordings, meeting or standup clips, dictated notes, support-ticket attachments — and you
        want consistent controls and keyboard support without hand-rolling a media element. Set a
        <code>title</code> and <code>date</code> to identify the clip, and disable
        <code>allowDownload</code> for sensitive audio.
      </p>
      <p>
        The player never fetches or transcodes media; it plays whatever URL you pass in
        <code>src</code>. The speech transcript is experimental, opt-in, and browser-backed only —
        treat it as a convenience aid, never as accessibility-grade captions or timed text.
      </p>

      <h2>Basic</h2>
      <p>
        The smallest usage is a single <code>src</code>. With no <code>title</code> or
        <code>date</code> the meta row is omitted entirely, leaving just the control row. The
        download link shows by default; pass <code>[allowDownload]="false"</code> to hide it.
      </p>
      <hd-example-tabs [code]="basicCode">
        <app-audio-player-basic-example />
      </hd-example-tabs>

      <h2>Title and date</h2>
      <p>
        Add a <code>title</code> and a <code>date</code> (a <code>Date</code> or an
        <code>YYYY-MM-DD</code> string) to render the meta row above the controls. Bare ISO dates
        are formatted for the current locale; any other string is shown verbatim. Set
        <code>downloadName</code> to control the saved filename.
      </p>
      <hd-example-tabs [code]="withTitleAndDateCode">
        <app-audio-player-with-title-and-date-example />
      </hd-example-tabs>

      <h2>Speech transcript</h2>
      <p>
        Import <code>provideHellAudioTranscript()</code> from
        <code>@hell-ui/angular/features/audio-transcript</code> and set
        <code>[allowSpeechTranscript]="true"</code> to expose the transcript toggle. The toggle only
        appears when the provider is present <em>and</em> the browser exposes
        <code>SpeechRecognition</code> plus <code>HTMLMediaElement.captureStream()</code> — currently
        Chromium-based desktops. Audio is piped through <code>start(track)</code>, so no microphone
        permission is requested.
      </p>
      <p>
        Recognition follows playback: it auto-starts on play, auto-stops on pause, and clears when
        you seek or replay so the text tracks the current position. The strip carries a playback-speed
        pill (1× → 1.25× → 1.5× → 2× → 0.75×) plus copy and clear actions. Use the <code>lang</code>
        input to hint the recognizer's BCP-47 language. Results are best-effort and may drift.
      </p>
      <hd-example-tabs [code]="speechTranscriptCode">
        <app-audio-player-speech-transcript-example />
      </hd-example-tabs>

      <h2>With a voicemail inbox</h2>
      <p>
        A realistic pairing: a <code>Card</code> lists recorded voicemails, each row uses
        <code>Tag</code> to flag unread and urgent messages, and an inline player lets the user
        listen without leaving the list. Downloads are disabled because the recordings are private.
      </p>
      <hd-example-tabs [code]="voicemailInboxCode">
        <app-audio-player-voicemail-inbox-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        The audio player is an owned-anatomy Composite with a single exported module,
        <code>HellAudioPlayer</code>. Its <code>ui</code> input follows the Part Style Map contract:
        a shorthand string refines the default <code>root</code> part, while a
        <code>HellAudioPlayerUi</code> map refines any named part. It styles only the DOM the player
        owns — the nested <code>Button</code> and <code>Slider</code> primitives expose their own
        parts if you reach them directly.
      </p>
      <p>The public parts of <code>HellAudioPlayer</code>:</p>
      <ul>
        <li><code>root</code> — the player container (default part).</li>
        <li><code>meta</code> — the title/date row above the controls.</li>
        <li><code>title</code> — the display title text.</li>
        <li><code>date</code> — the formatted date/timestamp.</li>
        <li><code>controls</code> — the wrapper around the transport and action groups.</li>
        <li><code>transport</code> — the play button, time labels, and seek group.</li>
        <li><code>playButton</code> — the play/pause button.</li>
        <li><code>time</code> — the elapsed and duration labels.</li>
        <li><code>seek</code> — the seek-slider wrapper.</li>
        <li><code>actions</code> — the trailing mute/volume/caption/download group.</li>
        <li><code>muteButton</code> — the mute/unmute button.</li>
        <li><code>volume</code> — the volume-slider wrapper.</li>
        <li><code>captionToggle</code> — the transcript toggle button.</li>
        <li><code>downloadButton</code> — the download link.</li>
        <li><code>captions</code> — the transcript strip anchored below the player.</li>
        <li><code>captionsBar</code> — the strip's header row.</li>
        <li><code>captionsStatus</code> — the status label (Live / Paused / Error).</li>
        <li><code>captionsDot</code> — the status indicator dot.</li>
        <li><code>captionsActions</code> — the speed/copy/clear action group.</li>
        <li><code>captionAction</code> — each action button in the strip.</li>
        <li><code>captionsBody</code> — the scrolling transcript region.</li>
        <li><code>captionsError</code> — the error message paragraph.</li>
        <li><code>captionsText</code> — the finalized transcript text.</li>
        <li><code>captionsInterim</code> — the interim (unstable) transcript text.</li>
        <li><code>captionsEmpty</code> — the empty / listening placeholder.</li>
      </ul>
      <p>
        This example refines every public part with Hell design tokens, including the opt-in
        transcript strip — open the transcript toggle to see the caption parts.
      </p>
      <hd-example-tabs [code]="stylingCode">
        <app-audio-player-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>src</code>: <code>string</code> (required) — audio URL passed to the native element.</li>
        <li>
          <code>title</code>: <code>string | null</code> (default <code>null</code>) — display title;
          the meta row is hidden when both title and date are absent.
        </li>
        <li>
          <code>date</code>: <code>string | Date | null</code> (default <code>null</code>) — shown
          next to the title. Bare <code>YYYY-MM-DD</code> strings are locale-formatted; other strings
          render verbatim.
        </li>
        <li>
          <code>allowDownload</code>: <code>boolean</code> (default <code>true</code>) — show / hide
          the download link.
        </li>
        <li>
          <code>downloadName</code>: <code>string | null</code> (default <code>null</code>) — filename
          for the download link's <code>download</code> attribute.
        </li>
        <li>
          <code>crossOrigin</code> / <code>crossorigin</code>:
          <code>'anonymous' | 'use-credentials' | null</code> (default <code>'anonymous'</code>) —
          forwarded to the native audio element. Use <code>null</code> to omit the attribute.
        </li>
        <li>
          <code>allowSpeechTranscript</code>: <code>boolean</code> (default <code>false</code>) — opt
          into the experimental browser speech transcript. Requires
          <code>provideHellAudioTranscript()</code> and browser support.
        </li>
        <li>
          <code>lang</code>: <code>string | null</code> (default <code>null</code>) — BCP-47 hint for
          the transcript recognizer. Falls back to the document <code>lang</code> or
          <code>en-US</code>.
        </li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;HellAudioPlayerPart&gt;</code> — Part Style Map. A
          string refines <code>root</code>; a <code>HellAudioPlayerUi</code> map refines named parts.
        </li>
      </ul>
      <p>
        The entry point also exports the <code>HellAudioPlayerPart</code> and
        <code>HellAudioPlayerUi</code> styling types, the <code>HellAudioPlayerLabels</code> interface
        with its <code>HELL_AUDIO_PLAYER_LABELS</code> token and
        <code>provideHellLabels(HELL_AUDIO_PLAYER_LABELS, …)</code> for the Label Contract, and the
        <code>HellAudioRuntime</code> / <code>hellHtmlAudioElementAdapter</code> runtime primitives.
        This module has no outputs; playback state stays internal to its Audio Runtime.
      </p>

      <h2>Accessibility</h2>
      <ul>
        <li>
          The play/pause and mute buttons are native <code>button</code>s with
          <code>aria-label</code>s from the Label Contract that flip with state (Play/Pause,
          Mute/Unmute).
        </li>
        <li>
          The seek and volume controls are Hell sliders with <code>aria-label</code>s; the seek bar
          supports <kbd>←</kbd>/<kbd>→</kbd> and <kbd>↑</kbd>/<kbd>↓</kbd> to jump 5 seconds and
          <kbd>Home</kbd>/<kbd>End</kbd> to jump to the start/end.
        </li>
        <li>
          Dragging the volume slider to 0 mutes; the mute button's icon reflects the level
          (high / low / muted), so state is not conveyed by color alone.
        </li>
        <li>
          The transcript toggle exposes <code>aria-pressed</code>; the transcript strip is a labelled
          <code>section</code> whose body is an <code>aria-live="polite"</code> region.
        </li>
        <li>
          The download control is an anchor with <code>rel="noopener"</code> and a Label Contract
          label.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Set a clear <code>title</code> and <code>date</code> for recorded calls and messages.</li>
        <li>Disable <code>allowDownload</code> for private or sensitive recordings.</li>
        <li>
          Enable <code>allowSpeechTranscript</code> only for best-effort convenience text, alongside
          real captions or transcripts when accessibility must be reliable.
        </li>
        <li>Refine appearance through <code>ui</code> parts rather than targeting private DOM.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't treat browser speech transcripts as production-grade accessibility content.</li>
        <li>Don't expose the download link for recordings that must stay private.</li>
        <li>Don't rely on waveform or timing alone to communicate playback state.</li>
      </ul>
    </article>
  `,
})
export class AudioPlayerPage {
  protected readonly basicCode = audioPlayerBasicExampleCodeRaw;
  protected readonly withTitleAndDateCode = audioPlayerWithTitleAndDateExampleCodeRaw;
  protected readonly speechTranscriptCode = audioPlayerSpeechTranscriptExampleCodeRaw;
  protected readonly voicemailInboxCode = audioPlayerVoicemailInboxExampleCodeRaw;
  protected readonly stylingCode = audioPlayerStylingExampleCodeRaw;
}
