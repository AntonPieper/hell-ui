import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidClosedCaptioning,
  faSolidDownload,
  faSolidPause,
  faSolidPlay,
  faSolidVolumeHigh,
  faSolidVolumeLow,
  faSolidVolumeXmark,
} from '@ng-icons/font-awesome/solid';
import { HellButton } from '../../primitives/button/button';
import { HellFlyout, HellFlyoutTrigger } from '../../primitives/flyout/flyout';
import { HellIcon } from '../../primitives/icon/icon';
import { HellSlider } from '../../primitives/slider/slider';
import { HellStyleable } from '../../core/styleable';
import { HellAudioRuntime, hellHtmlAudioElementAdapter } from './audio-player.runtime';
export { hellAudioSpeechSupported } from './audio-player.runtime';

const HELL_AUDIO_PLAYER_ICONS = {
  faSolidClosedCaptioning,
  faSolidDownload,
  faSolidPause,
  faSolidPlay,
  faSolidVolumeHigh,
  faSolidVolumeLow,
  faSolidVolumeXmark,
};

function parseIsoDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}

/**
 * Compact audio player with seek bar, play/pause, mute, volume slider,
 * download button and an opt-in inline live-captions strip backed by the
 * Web Speech API (Chromium-only). The captions toggle is hidden unless enabled
 * and the browser exposes `SpeechRecognition` + `HTMLMediaElement.captureStream()`.
 *
 * @experimental Live captions are best-effort browser sugar, not a replacement
 * for provided captions or transcripts.
 */
@Component({
  selector: 'hell-audio-player',
  imports: [HellButton, HellFlyout, HellFlyoutTrigger, HellIcon, HellSlider],
  providers: [provideIcons(HELL_AUDIO_PLAYER_ICONS)],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.hell-audio]': '!unstyled()' },
  template: `
    <audio
      #audio
      [src]="src()"
      preload="metadata"
      crossorigin="anonymous"
      (timeupdate)="onTime()"
      (loadedmetadata)="onMeta()"
      (play)="onPlay()"
      (pause)="onPause()"
      (ended)="onEnded()"
      (seeking)="onSeeking()"
    ></audio>

    @if (title() || resolvedDate()) {
      <div data-slot="meta">
        @if (title(); as t) {
          <span data-slot="title" [attr.title]="t">{{ t }}</span>
        }
        @if (resolvedDate()) {
          <span data-slot="date">{{ resolvedDate() }}</span>
        }
      </div>
    }

    <div data-slot="controls">
      <button
        hellButton
        variant="ghost"
        [iconOnly]="true"
        type="button"
        [attr.aria-label]="playing() ? 'Pause' : 'Play'"
        (click)="toggle()"
      >
        <hell-icon [name]="playing() ? 'faSolidPause' : 'faSolidPlay'" />
      </button>

      <span data-slot="time">{{ format(currentTime()) }}</span>

      <hell-slider
        data-slot="seek"
        size="sm"
        grow
        thumb="hover"
        [value]="currentTime()"
        [min]="0"
        [max]="seekMax()"
        [step]="0.1"
        (valueChange)="onSeek($event)"
        (keydown)="onSeekKey($event)"
        aria-label="Seek"
      />

      <span data-slot="time">{{ format(duration()) }}</span>

      <button
        hellButton
        variant="ghost"
        [iconOnly]="true"
        type="button"
        [attr.aria-label]="muted() ? 'Unmute' : 'Mute'"
        (click)="toggleMute()"
      >
        <hell-icon [name]="volumeIcon()" />
      </button>

      <hell-slider
        data-slot="volume"
        size="sm"
        [value]="volume() * 100"
        [min]="0"
        [max]="100"
        [step]="1"
        (valueChange)="onVolume($event)"
        aria-label="Volume"
      />

      @if (allowLiveCaptions() && speechSupported()) {
        <button
          hellButton
          hellFlyoutTrigger
          #ccTrigger="hellFlyoutTrigger"
          variant="ghost"
          [iconOnly]="true"
          type="button"
          data-slot="cc-toggle"
          [attr.aria-pressed]="captions()"
          [attr.aria-label]="captions() ? 'Hide live captions' : 'Show live captions'"
          [attr.data-active]="captions() ? 'true' : null"
          (click)="ccTrigger.toggle()"
          (openChange)="captions.set($event)"
        >
          <hell-icon name="faSolidClosedCaptioning" />
        </button>
      }

      @if (allowDownload()) {
        <a
          hellButton
          variant="ghost"
          [iconOnly]="true"
          [href]="src()"
          [download]="downloadName()"
          target="_blank"
          rel="noopener"
          aria-label="Download"
        >
          <hell-icon name="faSolidDownload" />
        </a>
      }
    </div>

    @if (captions() && ccTrigger(); as ccTriggerInstance) {
      <section
        [hellFlyout]="ccTriggerInstance"
        [boundary]="hostElement"
        data-slot="captions"
        [attr.data-state]="transcribing() ? 'live' : 'idle'"
      >
        <header data-slot="captions-bar">
          <span data-slot="captions-status">
            <span data-slot="captions-dot" aria-hidden="true"></span>
            @if (error()) {
              Error
            } @else if (transcribing()) {
              Live
            } @else {
              Paused
            }
          </span>

          <div data-slot="captions-actions">
            <button
              hellButton
              size="sm"
              variant="ghost"
              type="button"
              [attr.aria-label]="'Playback speed ' + playbackRate() + 'x'"
              (click)="cyclePlaybackRate()"
            >
              {{ playbackRate() }}×
            </button>

            @if (transcript() || interim()) {
              <button
                hellButton
                size="sm"
                variant="ghost"
                type="button"
                aria-label="Copy transcript"
                (click)="copyTranscript()"
              >
                {{ copied() ? 'Copied' : 'Copy' }}
              </button>

              <button
                hellButton
                size="sm"
                variant="ghost"
                type="button"
                aria-label="Clear transcript"
                (click)="clearTranscript()"
              >
                Clear
              </button>
            }
          </div>
        </header>

        <div #captionScroll data-slot="captions-body" aria-live="polite" aria-atomic="false">
          @if (error(); as err) {
            <p data-slot="captions-error">{{ err }}</p>
          } @else if (transcript() || interim()) {
            <p>
              <span>{{ transcript() }}</span>
              @if (interim(); as i) {
                <span data-slot="captions-interim"> {{ i }}</span>
              }
            </p>
          } @else if (transcribing()) {
            <p data-slot="captions-empty">Listening…</p>
          } @else {
            <p data-slot="captions-empty">Press play to capture captions.</p>
          }
        </div>
      </section>
    }
  `,
})
export class HellAudioPlayer extends HellStyleable {
  readonly src = input.required<string>();
  readonly downloadName = input<string | null>(null);
  readonly allowDownload = input(true, { transform: booleanAttribute });
  /** Show / hide the experimental Chromium-only live captions feature. */
  readonly allowLiveCaptions = input(false, { transform: booleanAttribute });
  /** Optional display title shown above the controls. Hidden when `null`. */
  readonly title = input<string | null>(null);
  /** Display a date/timestamp next to the title. Accepts a string or Date. */
  readonly date = input<string | Date | null>(null);
  /** BCP-47 language hint for SpeechRecognition. Defaults to `<html lang>` or `en-US`. */
  readonly lang = input<string | null>(null);

  protected readonly captions = signal(false);
  private readonly audioRuntime = new HellAudioRuntime();
  protected readonly playing = this.audioRuntime.playing;
  protected readonly currentTime = this.audioRuntime.currentTime;
  protected readonly duration = this.audioRuntime.duration;
  protected readonly volume = this.audioRuntime.volume;
  protected readonly muted = this.audioRuntime.muted;
  protected readonly playbackRate = this.audioRuntime.playbackRate;
  protected readonly seekMax = this.audioRuntime.seekMax;
  protected readonly volumeLevel = this.audioRuntime.volumeLevel;
  protected readonly transcript = this.audioRuntime.transcript;
  protected readonly interim = this.audioRuntime.interim;
  protected readonly transcribing = this.audioRuntime.transcribing;
  protected readonly error = this.audioRuntime.error;
  protected readonly copied = this.audioRuntime.copied;
  protected readonly speechSupported = this.audioRuntime.speechSupported;

  private seekRestartTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly progress = computed(() => {
    const d = this.duration();
    return d ? (this.currentTime() / d) * 100 : 0;
  });

  protected readonly volumeIcon = computed(() => {
    switch (this.volumeLevel()) {
      case 'mute':
        return 'faSolidVolumeXmark';
      case 'low':
        return 'faSolidVolumeLow';
      default:
        return 'faSolidVolumeHigh';
    }
  });

  protected readonly resolvedDate = computed<string | null>(() => {
    const d = this.date();
    if (!d) return null;
    const date = d instanceof Date ? d : parseIsoDateOnly(d);
    if (!date || Number.isNaN(date.valueOf())) return typeof d === 'string' ? d : null;
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  });

  private readonly audio = viewChild.required<ElementRef<HTMLAudioElement>>('audio');
  private readonly media = hellHtmlAudioElementAdapter(() => this.audio().nativeElement);
  private readonly captionScroll = viewChild<ElementRef<HTMLElement>>('captionScroll');
  protected readonly ccTrigger = viewChild('ccTrigger', { read: HellFlyoutTrigger });

  /** Host element — passed to the captions flyout as its boundary so all
   * player controls (seek slider, play, volume, etc.) keep the flyout
   * open when interacted with. */
  protected readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    super();
    inject(DestroyRef).onDestroy(() => {
      this.audioRuntime.destroy();
      if (this.seekRestartTimer) clearTimeout(this.seekRestartTimer);
    });
    // Apply audio properties from runtime state.
    effect(() => this.audioRuntime.syncMedia(this.media));

    // Auto start/stop recognition based on captions toggle + playback.
    effect(() => {
      const wantLive =
        this.allowLiveCaptions() && this.captions() && this.playing() && this.speechSupported();
      if (wantLive && !this.audioRuntime.isRecognizing()) {
        this.startRecognition();
      } else if (!wantLive && this.audioRuntime.isRecognizing()) {
        this.stopRecognition();
      }
    });

    // Auto-scroll caption panel.
    effect(() => {
      this.transcript();
      this.interim();
      const el = this.captionScroll()?.nativeElement;
      if (el)
        queueMicrotask(() => {
          el.scrollTop = el.scrollHeight;
        });
    });
  }

  protected toggle() {
    this.audioRuntime.togglePlayback(this.media);
  }

  protected onPlay() {
    const result = this.audioRuntime.markPlayed(this.media);
    if (result.resetTimeline) this.resetCaptionSession();
  }

  protected onPause() {
    this.audioRuntime.markPaused();
  }

  protected onEnded() {
    this.audioRuntime.markEnded();
  }

  protected toggleMute() {
    this.audioRuntime.toggleMute();
  }

  protected onVolume(v: number) {
    this.audioRuntime.setVolumePercent(v);
  }

  protected onTime() {
    this.audioRuntime.updateCurrentTime(this.media);
  }
  protected onMeta() {
    this.audioRuntime.updateMetadata(this.media);
  }

  protected cyclePlaybackRate() {
    this.audioRuntime.cyclePlaybackRate();
  }

  protected toggleCaptions(_trigger?: HellFlyoutTrigger) {
    // Kept for back-compat; trigger drives state via openChange now.
    this.captions.update((v) => !v);
  }

  protected onSeeking() {
    const result = this.audioRuntime.syncExternalSeek(this.media);
    if (result.resetTimeline) this.resetCaptionSession(this.shouldRestartRecognition());
  }

  /**
   * Slider-driven seek. Fires for every step change while dragging; we
   * commit immediately and debounce caption recovery so we only restart
   * `SpeechRecognition` once the user finishes scrubbing.
   */
  protected onSeek(value: number) {
    this.handleSeekResult(this.audioRuntime.seekTo(this.media, value));
  }

  protected onSeekKey(event: KeyboardEvent) {
    const key = event.key;
    if (key === 'Home') {
      event.preventDefault();
      this.onSeek(0);
      return;
    }
    if (key === 'End') {
      event.preventDefault();
      this.onSeek(this.seekMax());
      return;
    }

    const delta =
      key === 'ArrowRight' || key === 'ArrowUp'
        ? 5
        : key === 'ArrowLeft' || key === 'ArrowDown'
          ? -5
          : 0;
    if (!delta) return;

    event.preventDefault();
    this.handleSeekResult(this.audioRuntime.seekBy(this.media, delta));
  }

  private handleSeekResult(result: { readonly changed: boolean }): void {
    const restartRecognition = this.shouldRestartRecognition();
    if (!result.changed) return;

    this.resetTranscriptState();
    if (!restartRecognition) return;

    this.stopRecognition();
    if (this.seekRestartTimer) clearTimeout(this.seekRestartTimer);
    this.seekRestartTimer = setTimeout(() => {
      this.seekRestartTimer = null;
      if (
        this.captions() &&
        this.playing() &&
        this.speechSupported() &&
        !this.audioRuntime.isRecognizing()
      ) {
        this.startRecognition();
      }
    }, 200);
  }

  private shouldRestartRecognition(): boolean {
    return (
      this.playing() &&
      this.captions() &&
      this.speechSupported() &&
      this.audioRuntime.isRecognizing()
    );
  }

  private resetCaptionSession(restartRecognition = false) {
    this.resetTranscriptState();
    if (!restartRecognition) return;

    this.stopRecognition();
    queueMicrotask(() => {
      if (
        this.captions() &&
        this.playing() &&
        this.speechSupported() &&
        !this.audioRuntime.isRecognizing()
      ) {
        this.startRecognition();
      }
    });
  }

  private startRecognition() {
    this.audioRuntime.startRecognition(
      this.audio().nativeElement,
      this.lang(),
      () => this.captions() && this.playing() && this.speechSupported(),
    );
  }

  private stopRecognition() {
    this.audioRuntime.stopRecognition();
  }

  protected clearTranscript() {
    this.resetTranscriptState();
  }

  private resetTranscriptState() {
    this.audioRuntime.resetTranscriptState();
  }

  protected async copyTranscript() {
    await this.audioRuntime.copyTranscript();
  }

  protected format(s: number): string {
    if (!Number.isFinite(s)) return '--:--';
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, '0');
    const ss = Math.floor(s % 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${ss}`;
  }
}
