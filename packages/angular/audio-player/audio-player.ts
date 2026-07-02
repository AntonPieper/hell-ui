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
import { HellPartStyleable, type HellRecipe, type HellUi } from '@hell-ui/angular/core';
import { HellAudioRuntime, hellHtmlAudioElementAdapter } from './audio-player.runtime';
import {
  HELL_AUDIO_TRANSCRIPT_RUNTIME_FACTORY,
  HellAudioTranscriptUnavailableRuntime,
  type HellAudioTranscriptRuntimeFactory,
} from '@hell-ui/angular/internal/audio-transcript';
export { hellAudioSpeechSupported } from '@hell-ui/angular/internal/audio-transcript';

export type HellAudioPlayerPart =
  | 'root'
  | 'meta'
  | 'title'
  | 'date'
  | 'controls'
  | 'transport'
  | 'playButton'
  | 'time'
  | 'seek'
  | 'actions'
  | 'muteButton'
  | 'volume'
  | 'captionToggle'
  | 'downloadButton'
  | 'captions'
  | 'captionsBar'
  | 'captionsStatus'
  | 'captionsDot'
  | 'captionsActions'
  | 'captionAction'
  | 'captionsBody'
  | 'captionsError'
  | 'captionsInterim'
  | 'captionsEmpty';

export type HellAudioPlayerUi = HellUi<HellAudioPlayerPart>;

const HELL_AUDIO_PLAYER_RECIPE = {
  root: 'relative flex min-w-0 w-full max-w-[var(--hell-audio-max-width,none)] flex-col gap-hell-2 rounded-hell-md border border-hell-border bg-hell-surface-elevated px-hell-4 py-hell-3 text-xs leading-normal text-hell-foreground max-[480px]:px-hell-3',
  meta: 'flex min-w-0 items-baseline justify-between gap-hell-3 text-xs leading-normal max-[480px]:flex-col max-[480px]:items-start max-[480px]:gap-hell-1',
  title:
    'min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold text-hell-foreground',
  date: 'shrink-0 text-hell-foreground-muted tabular-nums max-[480px]:whitespace-nowrap',
  controls: 'flex min-w-0 w-full flex-wrap items-center gap-hell-2',
  transport: 'flex min-w-0 flex-1 items-center gap-hell-2 max-[480px]:basis-full',
  playButton: 'shrink-0',
  time: 'min-w-[5ch] text-center text-hell-foreground-muted tabular-nums',
  /* Slider wrappers center the control vertically and reserve the 7px thumb
     overhang (14px sm thumb centered on the track ends) so the thumb never
     collides with adjacent time labels or buttons. */
  seek: 'flex min-w-20 flex-1 items-center px-[7px]',
  actions: 'ms-auto flex min-w-0 items-center gap-hell-2 max-[480px]:ms-0 max-[480px]:basis-full',
  muteButton: 'shrink-0',
  volume: 'flex min-w-[7.5rem] flex-[0_0_7.5rem] items-center px-[7px] max-[480px]:flex-1',
  captionToggle:
    'shrink-0 data-[active=true]:bg-[color-mix(in_oklab,var(--color-hell-primary)_12%,transparent)] data-[active=true]:text-hell-primary',
  downloadButton: 'shrink-0',
  captions:
    'absolute inset-x-0 top-full z-5 mt-hell-2 flex max-w-none origin-top flex-col gap-hell-2 rounded-hell-md border border-hell-border bg-hell-surface-elevated px-hell-3 py-hell-2 shadow-[0_1px_2px_rgb(0_0_0_/_0.04),0_12px_28px_-16px_rgb(0_0_0_/_0.25)] animate-[hell-audio-captions-in_200ms_var(--ease-hell-out,ease)]',
  captionsBar: 'flex items-center justify-between gap-hell-3',
  captionsStatus:
    'inline-flex items-center gap-hell-2 text-xs font-semibold uppercase tracking-[0.04em] text-hell-foreground-muted',
  captionsDot: 'inline-block h-1.5 w-1.5 rounded-full bg-hell-foreground-muted',
  captionsActions: 'inline-flex items-center gap-hell-1',
  captionAction: '',
  captionsBody:
    'max-h-36 overflow-auto rounded-hell-sm bg-hell-surface px-hell-3 py-hell-2 text-sm leading-[1.55] text-hell-foreground',
  captionsError: 'm-0 text-sm text-hell-danger',
  captionsInterim: 'text-hell-foreground-muted italic',
  captionsEmpty: 'text-xs text-hell-foreground-muted',
} satisfies HellRecipe<HellAudioPlayerPart>;

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
  host: { '[class]': "part('root')", 'data-slot': 'root' },
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
      <div data-slot="meta" [class]="part('meta')">
        @if (title(); as t) {
          <span data-slot="title" [class]="part('title')" [attr.title]="t">{{ t }}</span>
        }
        @if (resolvedDate()) {
          <span data-slot="date" [class]="part('date')">{{ resolvedDate() }}</span>
        }
      </div>
    }

    <div data-slot="controls" [class]="part('controls')">
      <div data-slot="transport" [class]="part('transport')">
        <button
          hellButton
          variant="ghost"
          [ui]="part('playButton')"
          data-slot="playButton"
          [iconOnly]="true"
          type="button"
          [attr.aria-label]="playing() ? labels.audioPlayer.pause : labels.audioPlayer.play"
          (click)="toggle()"
        >
          <hell-icon [name]="playing() ? 'faSolidPause' : 'faSolidPlay'" />
        </button>

        <span data-slot="time" data-time="elapsed" [class]="part('time')">
          {{ format(currentTime()) }}
        </span>

        <div data-slot="seek" [class]="part('seek')">
          <hell-slider
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
        </div>

        <span data-slot="time" data-time="duration" [class]="part('time')">
          {{ format(duration()) }}
        </span>
      </div>

      <div data-slot="actions" [class]="part('actions')">
        <button
          hellButton
          variant="ghost"
          [ui]="part('muteButton')"
          data-slot="muteButton"
          [iconOnly]="true"
          type="button"
          [attr.aria-label]="muted() ? labels.audioPlayer.unmute : labels.audioPlayer.mute"
          (click)="toggleMute()"
        >
          <hell-icon [name]="volumeIcon()" />
        </button>

        <div data-slot="volume" [class]="part('volume')">
          <hell-slider
            size="sm"
            [value]="volume() * 100"
            [min]="0"
            [max]="100"
            [step]="1"
            (valueChange)="onVolume($event)"
            [attr.aria-label]="labels.audioPlayer.volume"
          />
        </div>

        @if (speechTranscriptEnabled() && speechSupported()) {
          <button
            hellButton
            hellFlyoutTrigger
            #ccTrigger="hellFlyoutTrigger"
            variant="ghost"
            [ui]="part('captionToggle')"
            [iconOnly]="true"
            type="button"
            data-slot="captionToggle"
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
            [ui]="part('downloadButton')"
            data-slot="downloadButton"
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
      <!-- Captions strip anchors below the player through its own recipe; the
           classes flow through the flyout's Part Style Map so the strip's
           absolute anchoring deterministically replaces the flyout's fixed
           floating-ui positioning. -->
      <section
        [hellFlyout]="ccTriggerInstance"
        [boundary]="hostElement"
        data-slot="captions"
        [ui]="part('captions')"
        [aria-label]="speechTranscriptLabel"
        [attr.data-state]="transcribing() ? 'live' : 'idle'"
      >
        <header data-slot="captionsBar" [class]="part('captionsBar')">
          <span data-slot="captionsStatus" [class]="part('captionsStatus')">
            <span data-slot="captionsDot" [class]="part('captionsDot')" aria-hidden="true"></span>
            @if (error()) {
              {{ labels.audioPlayer.errorStatus }}
            } @else if (transcribing()) {
              {{ labels.audioPlayer.liveStatus }}
            } @else {
              {{ labels.audioPlayer.pausedStatus }}
            }
          </span>

          <div data-slot="captionsActions" [class]="part('captionsActions')">
            <button
              hellButton
              size="sm"
              variant="ghost"
              [ui]="part('captionAction')"
              type="button"
              data-slot="captionAction"
              data-action="rate"
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
                [ui]="part('captionAction')"
                type="button"
                data-slot="captionAction"
                data-action="copy"
                [attr.aria-label]="labels.audioPlayer.copyTranscript"
                (click)="copyTranscript()"
              >
                {{ copied() ? labels.audioPlayer.copied : labels.audioPlayer.copy }}
              </button>

              <button
                hellButton
                size="sm"
                variant="ghost"
                [ui]="part('captionAction')"
                type="button"
                data-slot="captionAction"
                data-action="clear"
                [attr.aria-label]="labels.audioPlayer.clearTranscript"
                (click)="clearTranscript()"
              >
                {{ labels.audioPlayer.clear }}
              </button>
            }
          </div>
        </header>

        <div
          #captionScroll
          data-slot="captionsBody"
          [class]="part('captionsBody')"
          aria-live="polite"
          aria-atomic="false"
        >
          @if (error(); as err) {
            <p data-slot="captionsError" [class]="part('captionsError')">{{ err }}</p>
          } @else if (transcript() || interim()) {
            <p>
              <span>{{ transcript() }}</span>
              @if (interim(); as i) {
                <span data-slot="captionsInterim" [class]="part('captionsInterim')">
                  {{ i }}
                </span>
              }
            </p>
          } @else if (transcribing()) {
            <p data-slot="captionsEmpty" [class]="part('captionsEmpty')">
              {{ labels.audioPlayer.listening }}
            </p>
          } @else {
            <p data-slot="captionsEmpty" [class]="part('captionsEmpty')">
              {{ labels.audioPlayer.pressPlayForCaptions }}
            </p>
          }
        </div>
      </section>
    }
  `,
})
export class HellAudioPlayer extends HellPartStyleable<HellAudioPlayerPart> {
  protected readonly recipe = HELL_AUDIO_PLAYER_RECIPE;
  protected readonly defaultUiPart = 'root';

  readonly src = input.required<string>();
  /**
   * CORS mode forwarded to the native audio element. Defaults to `anonymous`.
   * Set to `null` to leave off the `crossorigin` attribute. Remote speech transcript
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
