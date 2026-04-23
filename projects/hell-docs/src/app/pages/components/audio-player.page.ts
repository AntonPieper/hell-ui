import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellAudioPlayer } from 'hell';

@Component({
  selector: 'hd-audio-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellAudioPlayer],
  template: `
    <article class="hd-prose">
      <h1>Audio player</h1>
      <p>Compact player wrapping a native <code>&lt;audio&gt;</code> element
        with play/pause, scrubber, mute, volume slider and an optional
        download button.</p>

      <h2>Example</h2>
      <div class="hd-example">
        <hell-audio-player
          src="https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg"
          downloadName="example.ogg"
          title="Example track"
          [date]="exampleDate"
        />
      </div>

      <h2>Without download</h2>
      <div class="hd-example">
        <hell-audio-player
          src="https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg"
          [allowDownload]="false"
        />
      </div>

      <h2>API</h2>
      <ul>
        <li><code>src</code>: required audio URL</li>
        <li><code>title</code>: display title (defaults to filename from <code>src</code>)</li>
        <li><code>date</code>: <code>Date | string</code> shown next to the title</li>
        <li><code>downloadName</code>: filename for the download link</li>
        <li><code>allowDownload</code>: show / hide download button (default <code>true</code>)</li>
      </ul>
    </article>
  `,
})
export class AudioPlayerPage {
  protected readonly exampleDate = new Date('2026-04-22');
}
