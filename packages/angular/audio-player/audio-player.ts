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
import { HellButton } from '@hell-ui/angular/button';
import { HellFlyout, HellFlyoutTrigger } from '@hell-ui/angular/flyout';
import { HellIcon } from '@hell-ui/angular/icon';
import { HellSlider } from '@hell-ui/angular/slider';
import { type HellLabels, HELL_LABELS } from '@hell-ui/angular/core';
import { HellStyleable } from '@hell-ui/angular/core';
import { HellAudioRuntime, hellHtmlAudioElementAdapter } from './audio-player.runtime';
import {
  HELL_AUDIO_TRANSCRIPT_RUNTIME_FACTORY,
  HellAudioTranscriptUnavailableRuntime,
  type HellAudioTranscriptRuntimeFactory,
} from '@hell-ui/angular/internal/audio-transcript';
export { hellAudioSpeechSupported } from '@hell-ui/angular/internal/audio-transcript';

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
 * download button and an opt-in speech-transcript strip. Browser transcript
 * capture is available only when the optional
 * `@hell-ui/angular/features/audio-transcript` provider is imported. The toggle
 * is hidden unless enabled and the provider reports support for the media.
 *
 * @experimental Browser speech transcripts are best-effort convenience text,
 * not accessibility captions, timed text, or a replacement for transcripts.
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
      [attr.crossorigin]="crossOrigin()"
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
      <div class="hell-a-g" data-slot="transport">
        <button
          hellButton
          variant="ghost"
          [iconOnly]="true"
          type="button"
          [attr.aria-label]="playing() ? labels.audioPlayer.pause : labels.audioPlayer.play"
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
          [attr.aria-label]="labels.audioPlayer.seek"
        />

        <span data-slot="time">{{ format(duration()) }}</span>
      </div>

      <div class="hell-a-g" data-slot="actions">
        <button
          hellButton
          variant="ghost"
          [iconOnly]="true"
          type="button"
          [attr.aria-label]="muted() ? labels.audioPlayer.unmute : labels.audioPlayer.mute"
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
          [attr.aria-label]="labels.audioPlayer.volume"
        />

        @if (speechTranscriptEnabled() && speechSupported()) {
          <button
            hellButton
            hellFlyoutTrigger
            #ccTrigger="hellFlyoutTrigger"
            variant="ghost"
            [iconOnly]="true"
            type="button"
            data-slot="cc-toggle"
            [attr.aria-pressed]="captions()"
            [attr.aria-label]="
              captions() ? labels.audioPlayer.hideLiveCaptions : labels.audioPlayer.showLiveCaptions
            "
            [attr.data-active]="captions() ? 'true' : null"
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
            [attr.aria-label]="labels.audioPlayer.download"
          >
            <hell-icon name="faSolidDownload" />
          </a>
        }
      </div>
    </div>

    @if (captions() && ccTrigger(); as ccTriggerInstance) {
      <section
        [hellFlyout]="ccTriggerInstance"
        [boundary]="hostElement"
        data-slot="captions"
        [aria-label]="speechTranscriptLabel"
        [attr.data-state]="transcribing() ? 'live' : 'idle'"
      >
        <header data-slot="captions-bar">
          <span data-slot="captions-status">
            <span data-slot="captions-dot" aria-hidden="true"></span>
            @if (error()) {
              {{ labels.audioPlayer.errorStatus }}
            } @else if (transcribing()) {
              {{ labels.audioPlayer.liveStatus }}
            } @else {
              {{ labels.audioPlayer.pausedStatus }}
            }
          </span>

          <div data-slot="captions-actions">
            <button
              hellButton
              size="sm"
              variant="ghost"
              type="button"
              [attr.aria-label]="labels.audioPlayer.playbackSpeed(playbackRate())"
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
                [attr.aria-label]="labels.audioPlayer.copyTranscript"
                (click)="copyTranscript()"
              >
                {{ copied() ? labels.audioPlayer.copied : labels.audioPlayer.copy }}
              </button>

              <button
                hellButton
                size="sm"
                variant="ghost"
                type="button"
                [attr.aria-label]="labels.audioPlayer.clearTranscript"
                (click)="clearTranscript()"
              >
                {{ labels.audioPlayer.clear }}
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
            <p data-slot="captions-empty">{{ labels.audioPlayer.listening }}</p>
          } @else {
            <p data-slot="captions-empty">{{ labels.audioPlayer.pressPlayForCaptions }}</p>
          }
        </div>
      </section>
    }
  `,
})
export class HellAudioPlayer extends HellStyleable {
  readonly src = input.required<string>();
  /**
   * CORS mode forwarded to the native audio element. Defaults to `anonymous`.
   * Set to `null` to omit the `crossorigin` attribute. Remote speech transcript
   * capture depends on media CORS headers plus browser media-capture support.
   */
  readonly crossOrigin = input<'anonymous' | 'use-credentials' | null>('anonymous', {
    alias: 'crossorigin',
  });
  readonly downloadName = input<string | null>(null);
  readonly allowDownload = input(true, { transform: booleanAttribute });
  /** Show / hide the experimental Chromium-only speech-transcript feature. */
  readonly allowSpeechTranscript = input(false, { transform: booleanAttribute });
  /** @deprecated Use `allowSpeechTranscript`; this alias remains for compatibility. */
  readonly allowLiveCaptions = input(false, { transform: booleanAttribute });
  /** Optional display title shown above the controls. Hidden when `null`. */
  readonly title = input<string | null>(null);
  /** Display a date/timestamp next to the title. Accepts a string or Date. */
  readonly date = input<string | Date | null>(null);
  /** BCP-47 language hint for the optional transcript recognizer. Defaults to audio element document `lang` or `en-US`. */
  readonly lang = input<string | null>(null);

  protected readonly captions = signal(false);
  protected readonly speechTranscriptEnabled = computed(
    () => this.allowSpeechTranscript() || this.allowLiveCaptions(),
  );
  private readonly audioRuntime = new HellAudioRuntime();
  private readonly createTranscriptRuntime = inject<HellAudioTranscriptRuntimeFactory | null>(
    HELL_AUDIO_TRANSCRIPT_RUNTIME_FACTORY,
    {
      optional: true,
    },
  );
  private readonly transcriptRuntime =
    this.createTranscriptRuntime?.() ?? new HellAudioTranscriptUnavailableRuntime();
  protected readonly playing = this.audioRuntime.playing;
  protected readonly currentTime = this.audioRuntime.currentTime;
  protected readonly duration = this.audioRuntime.duration;
  protected readonly volume = this.audioRuntime.volume;
  protected readonly muted = this.audioRuntime.muted;
  protected readonly playbackRate = this.audioRuntime.playbackRate;
  protected readonly seekMax = this.audioRuntime.seekMax;
  protected readonly volumeLevel = this.audioRuntime.volumeLevel;
  protected readonly transcript = this.transcriptRuntime.transcript;
  protected readonly interim = this.transcriptRuntime.interim;
  protected readonly transcribing = this.transcriptRuntime.transcribing;
  protected readonly error = this.transcriptRuntime.error;
  protected readonly copied = this.transcriptRuntime.copied;
  protected readonly speechSupported = this.transcriptRuntime.speechSupported;
  protected readonly labels = inject<HellLabels>(HELL_LABELS);
  protected readonly speechTranscriptLabel =
    this.labels.audioPlayer.speechTranscript ?? 'Speech transcript';

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

  /** Host element — passed to the transcript flyout as its boundary so all
   * player controls (seek slider, play, volume, etc.) keep the flyout
   * open when interacted with. */
  protected readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    super();
    inject(DestroyRef).onDestroy(() => {
      this.transcriptRuntime.destroy();
      if (this.seekRestartTimer) clearTimeout(this.seekRestartTimer);
    });
    // Apply audio properties from runtime state.
    effect(() => this.audioRuntime.syncMedia(this.media));

    // Auto start/stop recognition based on transcript toggle + playback.
    effect(() => {
      const wantLive =
        this.speechTranscriptEnabled() &&
        this.captions() &&
        this.playing() &&
        this.speechSupported();
      if (wantLive && !this.transcriptRuntime.isRecognizing()) {
        this.startRecognition();
      } else if (!wantLive && this.transcriptRuntime.isRecognizing()) {
        this.stopRecognition();
      }
    });

    // Auto-scroll transcript panel.
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
    if (result.resetTimeline) this.resetTranscriptSession();
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
    if (result.resetTimeline) this.resetTranscriptSession(this.shouldRestartRecognition());
  }

  /**
   * Slider-driven seek. Fires for every step change while dragging; we
   * commit immediately and debounce transcript recovery so we only restart
   * the optional transcript recognizer once the user finishes scrubbing.
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
        !this.transcriptRuntime.isRecognizing()
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
      this.transcriptRuntime.isRecognizing()
    );
  }

  private resetTranscriptSession(restartRecognition = false) {
    this.resetTranscriptState();
    if (!restartRecognition) return;

    this.stopRecognition();
    queueMicrotask(() => {
      if (
        this.captions() &&
        this.playing() &&
        this.speechSupported() &&
        !this.transcriptRuntime.isRecognizing()
      ) {
        this.startRecognition();
      }
    });
  }

  private startRecognition() {
    this.transcriptRuntime.startRecognition(
      this.audio().nativeElement,
      this.lang(),
      () => this.captions() && this.playing() && this.speechSupported(),
    );
  }

  private stopRecognition() {
    this.transcriptRuntime.stopRecognition();
  }

  protected clearTranscript() {
    this.resetTranscriptState();
  }

  private resetTranscriptState() {
    this.transcriptRuntime.resetTranscriptState();
  }

  protected async copyTranscript() {
    await this.transcriptRuntime.copyTranscript();
  }

  protected format(s: number): string {
    if (!Number.isFinite(s)) return '--:--';

    const total = Math.floor(s);
    const seconds = (total % 60).toString().padStart(2, '0');
    const minutes = Math.floor(total / 60)
      .toString()
      .padStart(2, '0');

    const hours = Math.floor(total / 3600);
    if (hours > 0) {
      const mins = Math.floor((total % 3600) / 60)
        .toString()
        .padStart(2, '0');
      return `${hours}:${mins}:${seconds}`;
    }

    return `${minutes}:${seconds}`;
  }
}
