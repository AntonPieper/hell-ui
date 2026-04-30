import {
  Component,
  ChangeDetectionStrategy,
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

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(track?: MediaStreamTrack): void;
  stop(): void;
  abort(): void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionCtor {
  new (): SpeechRecognitionLike;
}

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** True when this browser supports `SpeechRecognition` and `captureStream()`. */
export function hellAudioSpeechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    getSpeechRecognition() !== null &&
    typeof (HTMLMediaElement.prototype as any).captureStream === 'function'
  );
}

const PLAYBACK_RATES = [1, 1.25, 1.5, 2, 0.75] as const;

const HELL_AUDIO_PLAYER_ICONS = {
  faSolidClosedCaptioning,
  faSolidDownload,
  faSolidPause,
  faSolidPlay,
  faSolidVolumeHigh,
  faSolidVolumeLow,
  faSolidVolumeXmark,
};

/**
 * Compact audio player with seek bar, play/pause, mute, volume slider,
 * download button and an optional inline live-captions strip backed by the
 * Web Speech API (Chromium-only). The captions toggle is hidden when the
 * browser lacks `SpeechRecognition` + `HTMLMediaElement.captureStream()`.
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

      @if (speechSupported()) {
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
  /** Optional display title shown above the controls. Hidden when `null`. */
  readonly title = input<string | null>(null);
  /** Display a date/timestamp next to the title. Accepts a string or Date. */
  readonly date = input<string | Date | null>(null);
  /** BCP-47 language hint for SpeechRecognition. Defaults to `<html lang>` or `en-US`. */
  readonly lang = input<string | null>(null);

  protected readonly playing = signal(false);
  protected readonly currentTime = signal(0);
  protected readonly duration = signal(0);
  protected readonly volume = signal(1);
  protected readonly muted = signal(false);
  protected readonly playbackRate = signal(1);

  protected readonly captions = signal(false);
  protected readonly transcript = signal<string>('');
  protected readonly interim = signal<string>('');
  protected readonly transcribing = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly copied = signal(false);
  protected readonly speechSupported = signal(hellAudioSpeechSupported());

  private recognition: SpeechRecognitionLike | null = null;
  private capturedStream: MediaStream | null = null;
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;
  private seekRestartTimer: ReturnType<typeof setTimeout> | null = null;
  private playbackEnded = false;

  protected readonly progress = computed(() => {
    const d = this.duration();
    return d ? (this.currentTime() / d) * 100 : 0;
  });

  /** Slider max — fall back to 1 while metadata is still loading. */
  protected readonly seekMax = computed(() => this.duration() || 1);

  protected readonly volumeLevel = computed<'mute' | 'low' | 'mid' | 'high'>(() => {
    if (this.muted() || this.volume() === 0) return 'mute';
    const v = this.volume();
    if (v < 0.34) return 'low';
    if (v < 0.67) return 'mid';
    return 'high';
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
    const date = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(date.valueOf())) return typeof d === 'string' ? d : null;
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  });

  private readonly audio = viewChild.required<ElementRef<HTMLAudioElement>>('audio');
  private readonly captionScroll = viewChild<ElementRef<HTMLElement>>('captionScroll');
  protected readonly ccTrigger = viewChild('ccTrigger', { read: HellFlyoutTrigger });

  /** Host element — passed to the captions flyout as its boundary so all
   * player controls (seek slider, play, volume, etc.) keep the flyout
   * open when interacted with. */
  protected readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    super();
    // Apply audio properties from signals.
    effect(() => {
      const a = this.audio().nativeElement;
      a.volume = this.volume();
      a.muted = this.muted();
      a.playbackRate = this.playbackRate();
    });

    // Auto start/stop recognition based on captions toggle + playback.
    effect(() => {
      const wantLive = this.captions() && this.playing() && this.speechSupported();
      if (wantLive && !this.recognition) {
        this.startRecognition();
      } else if (!wantLive && this.recognition) {
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
    const a = this.audio().nativeElement;
    if (this.playing()) a.pause();
    else void a.play();
  }

  protected onPlay() {
    const currentTime = this.audio().nativeElement.currentTime;
    this.playing.set(true);
    if (this.playbackEnded || currentTime <= 0.25) {
      this.resetCaptionSession();
    }
    this.playbackEnded = false;
  }

  protected onPause() {
    this.playing.set(false);
  }

  protected onEnded() {
    this.playing.set(false);
    this.playbackEnded = true;
  }

  protected toggleMute() {
    this.muted.update((v) => !v);
  }

  protected onVolume(v: number) {
    const next = Math.max(0, Math.min(1, v / 100));
    this.volume.set(next);
    this.muted.set(next === 0);
  }

  protected onTime() {
    this.currentTime.set(this.audio().nativeElement.currentTime);
  }
  protected onMeta() {
    this.duration.set(this.audio().nativeElement.duration || 0);
  }

  protected cyclePlaybackRate() {
    const cur = this.playbackRate();
    const idx = PLAYBACK_RATES.indexOf(cur as (typeof PLAYBACK_RATES)[number]);
    const next = PLAYBACK_RATES[(idx + 1 + PLAYBACK_RATES.length) % PLAYBACK_RATES.length];
    this.playbackRate.set(next);
  }

  protected toggleCaptions(_trigger?: HellFlyoutTrigger) {
    // Kept for back-compat; trigger drives state via openChange now.
    this.captions.update((v) => !v);
  }

  protected onSeeking() {
    const next = this.audio().nativeElement.currentTime;
    if (Math.abs(next - this.currentTime()) <= 0.01) {
      this.currentTime.set(next);
      return;
    }

    this.currentTime.set(next);
    this.playbackEnded = false;
    this.resetCaptionSession(this.shouldRestartRecognition());
  }

  /**
   * Slider-driven seek. Fires for every step change while dragging; we
   * commit immediately and debounce caption recovery so we only restart
   * `SpeechRecognition` once the user finishes scrubbing.
   */
  protected onSeek(value: number) {
    const restartRecognition = this.shouldRestartRecognition();
    if (!this.setCurrentTime(value)) return;

    this.resetTranscriptState();
    if (!restartRecognition) return;

    this.stopRecognition();
    if (this.seekRestartTimer) clearTimeout(this.seekRestartTimer);
    this.seekRestartTimer = setTimeout(() => {
      this.seekRestartTimer = null;
      if (this.captions() && this.playing() && this.speechSupported() && !this.recognition) {
        this.startRecognition();
      }
    }, 200);
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
    this.onSeek(this.currentTime() + delta);
  }

  private setCurrentTime(nextTime: number): boolean {
    const a = this.audio().nativeElement;
    const next = Math.max(
      0,
      Math.min(Number.isFinite(a.duration) ? a.duration : nextTime, nextTime),
    );
    if (Math.abs(next - a.currentTime) <= 0.01) return false;

    a.currentTime = next;
    this.currentTime.set(next);
    this.playbackEnded = false;
    return true;
  }

  private shouldRestartRecognition(): boolean {
    return this.playing() && this.captions() && this.speechSupported() && this.recognition !== null;
  }

  private resetCaptionSession(restartRecognition = false) {
    this.resetTranscriptState();
    if (!restartRecognition) return;

    this.stopRecognition();
    queueMicrotask(() => {
      if (this.captions() && this.playing() && this.speechSupported() && !this.recognition) {
        this.startRecognition();
      }
    });
  }

  private startRecognition() {
    const Ctor = getSpeechRecognition();
    const audio = this.audio().nativeElement as HTMLAudioElement & {
      captureStream?(): MediaStream;
    };
    if (!Ctor || typeof audio.captureStream !== 'function') return;

    const rec = new Ctor();
    rec.lang = this.lang() ?? (document.documentElement.lang || 'en-US');
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (e: any) => {
      let finalAdd = '';
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalAdd += r[0].transcript;
        else interim += r[0].transcript;
      }
      if (finalAdd) {
        this.transcript.update((t) => (t ? t + ' ' : '') + finalAdd.trim());
      }
      this.interim.set(interim.trim());
    };
    rec.onerror = (e: any) => {
      const code = e?.error;
      // 'no-speech' / 'aborted' are benign — service ends, we just restart on next play.
      if (code && code !== 'no-speech' && code !== 'aborted') {
        this.error.set(`Speech error: ${code}`);
      }
      this.stopRecognition();
    };
    rec.onend = () => {
      this.transcribing.set(false);
      this.interim.set('');
      // If the recogniser ended but the user is still playing with captions
      // on, restart it (service auto-stops after silence).
      if (this.captions() && this.playing() && this.recognition === rec) {
        this.recognition = null;
        this.startRecognition();
      }
    };

    try {
      const stream = audio.captureStream();
      this.capturedStream = stream;
      const track = stream.getAudioTracks()[0];
      this.recognition = rec;
      this.transcribing.set(true);
      this.error.set(null);
      // start(track) — Chromium 138+. Falls back to mic if unsupported.
      try {
        rec.start(track);
      } catch {
        rec.start();
      }
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : String(err));
      this.transcribing.set(false);
      this.recognition = null;
    }
  }

  private stopRecognition() {
    try {
      this.recognition?.stop();
    } catch {
      /* noop */
    }
    this.recognition = null;
    this.capturedStream?.getTracks().forEach((t) => t.stop());
    this.capturedStream = null;
    this.transcribing.set(false);
  }

  protected clearTranscript() {
    this.resetTranscriptState();
  }

  private resetTranscriptState() {
    this.transcript.set('');
    this.interim.set('');
    this.error.set(null);
    this.copied.set(false);
  }

  protected async copyTranscript() {
    const text = (this.transcript() + ' ' + this.interim()).trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      this.copied.set(true);
      if (this.copiedTimer) clearTimeout(this.copiedTimer);
      this.copiedTimer = setTimeout(() => this.copied.set(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
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
