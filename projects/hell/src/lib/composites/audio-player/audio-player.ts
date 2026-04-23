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
import { HellButton } from '../../primitives/button/button';
import { HellSlider } from '../../primitives/slider/slider';

/**
 * Compact audio player with seek bar, play/pause, mute, volume slider and
 * download button. Lightweight (uses native `<audio>` underneath).
 */
@Component({
  selector: 'hell-audio-player',
  imports: [HellButton, HellSlider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.hell-audio]': '!unstyled()',
  },
  template: `
    <audio
      #audio
      [src]="src()"
      preload="metadata"
      (timeupdate)="onTime()"
      (loadedmetadata)="onMeta()"
      (ended)="playing.set(false)"
    ></audio>

    <button
      hellButton
      variant="ghost"
      [iconOnly]="true"
      type="button"
      [attr.aria-label]="playing() ? 'Pause' : 'Play'"
      (click)="toggle()"
    >
      @if (playing()) {
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><rect x="4" y="3" width="3" height="10" rx="1"/><rect x="9" y="3" width="3" height="10" rx="1"/></svg>
      } @else {
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4 3l9 5-9 5z"/></svg>
      }
    </button>

    <span class="hell-audio-time">{{ format(currentTime()) }}</span>

    <div
      class="hell-audio-track"
      role="slider"
      tabindex="0"
      [attr.aria-valuemin]="0"
      [attr.aria-valuemax]="duration()"
      [attr.aria-valuenow]="currentTime()"
      (click)="seek($event)"
      (keydown)="onSeekKey($event)"
    >
      <div class="hell-audio-track-fill" [style.width.%]="progress()"></div>
    </div>

    <span class="hell-audio-time">{{ format(duration()) }}</span>

    <button
      hellButton
      variant="ghost"
      [iconOnly]="true"
      type="button"
      [attr.aria-label]="muted() ? 'Unmute' : 'Mute'"
      (click)="toggleMute()"
    >
      @if (muted()) {
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 6v4h2l3 2V4L5 6H3zm9 .3l1.4-1.4 1 1L13 7.3l1.4 1.4-1 1L12 8.3l-1.4 1.4-1-1L11 7.3 9.6 5.9l1-1z"/></svg>
      } @else {
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 6v4h2l3 2V4L5 6H3zm8 2c0-1-.5-1.8-1.3-2.3v4.6C10.5 9.8 11 9 11 8z"/></svg>
      }
    </button>

    <hell-slider
      class="hell-audio-volume"
      size="sm"
      [value]="volume() * 100"
      [min]="0"
      [max]="100"
      [step]="1"
      (valueChange)="onVolume($event)"
      aria-label="Volume"
    />

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
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1v8.6L5.4 7l-1 1L8 11.6 11.6 8l-1-1L9 9.6V1H7zm-5 13v1h12v-1H3z"/></svg>
      </a>
    }
  `,
})
export class HellAudioPlayer {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly src = input.required<string>();
  readonly downloadName = input<string | null>(null);
  readonly allowDownload = input(true, { transform: booleanAttribute });

  protected readonly playing = signal(false);
  protected readonly currentTime = signal(0);
  protected readonly duration = signal(0);
  protected readonly volume = signal(1);
  protected readonly muted = signal(false);

  protected readonly progress = computed(() => {
    const d = this.duration();
    return d ? (this.currentTime() / d) * 100 : 0;
  });

  private readonly audio = viewChild.required<ElementRef<HTMLAudioElement>>('audio');
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;

  constructor() {
    effect(() => {
      const a = this.audio().nativeElement;
      a.volume = this.volume();
      a.muted = this.muted();
    });
  }

  protected toggle() {
    const a = this.audio().nativeElement;
    if (this.playing()) {
      a.pause();
      this.playing.set(false);
    } else {
      void a.play();
      this.playing.set(true);
    }
  }

  protected toggleMute() {
    this.muted.update(v => !v);
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

  protected seek(e: MouseEvent) {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const a = this.audio().nativeElement;
    a.currentTime = ratio * (this.duration() || 0);
  }

  protected onSeekKey(e: KeyboardEvent) {
    const a = this.audio().nativeElement;
    if (e.key === 'ArrowRight') a.currentTime = Math.min(a.duration, a.currentTime + 5);
    if (e.key === 'ArrowLeft') a.currentTime = Math.max(0, a.currentTime - 5);
  }

  protected format(s: number): string {
    if (!Number.isFinite(s)) return '--:--';
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const ss = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${ss}`;
  }
}
