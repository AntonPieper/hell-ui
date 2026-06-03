import { computed, signal } from '@angular/core';

const HELL_AUDIO_PLAYBACK_RATES = [1, 1.25, 1.5, 2, 0.75] as const;
export type HellAudioPlaybackRate = (typeof HELL_AUDIO_PLAYBACK_RATES)[number];
export type HellAudioVolumeLevel = 'mute' | 'low' | 'mid' | 'high';

export interface HellAudioMediaAdapter {
  readonly currentTime: number;
  readonly duration: number;
  play(): Promise<void> | void;
  pause(): void;
  setCurrentTime(value: number): void;
  applyAudioState(state: {
    readonly volume: number;
    readonly muted: boolean;
    readonly playbackRate: number;
  }): void;
}

export interface HellAudioTimelineResult {
  readonly changed: boolean;
  readonly currentTime: number;
  readonly resetTimeline: boolean;
}

export function hellHtmlAudioElementAdapter(
  getAudio: () => HTMLAudioElement,
): HellAudioMediaAdapter {
  return {
    get currentTime() {
      return getAudio().currentTime;
    },
    get duration() {
      return getAudio().duration;
    },
    play: () => getAudio().play(),
    pause: () => getAudio().pause(),
    setCurrentTime: (value) => {
      getAudio().currentTime = value;
    },
    applyAudioState: ({ volume, muted, playbackRate }) => {
      const audio = getAudio();
      audio.volume = volume;
      audio.muted = muted;
      audio.playbackRate = playbackRate;
    },
  };
}

/** Playback, seek, and volume runtime behind HellAudioPlayer. */
export class HellAudioRuntime {
  readonly playing = signal(false);
  readonly currentTime = signal(0);
  readonly duration = signal(0);
  readonly volume = signal(1);
  readonly muted = signal(false);
  readonly playbackRate = signal<HellAudioPlaybackRate>(1);

  readonly seekMax = computed(() => this.duration() || 1);
  readonly volumeLevel = computed<HellAudioVolumeLevel>(() => {
    if (this.muted() || this.volume() === 0) return 'mute';
    const value = this.volume();
    if (value < 0.34) return 'low';
    if (value < 0.67) return 'mid';
    return 'high';
  });

  private playbackEnded = false;

  syncMedia(adapter: HellAudioMediaAdapter): void {
    adapter.applyAudioState({
      volume: this.volume(),
      muted: this.muted(),
      playbackRate: this.playbackRate(),
    });
  }

  togglePlayback(adapter: HellAudioMediaAdapter): void {
    if (this.playing()) adapter.pause();
    else void adapter.play();
  }

  markPlayed(adapter: HellAudioMediaAdapter): HellAudioTimelineResult {
    const currentTime = adapter.currentTime;
    const resetTimeline = this.playbackEnded || currentTime <= 0.25;
    this.playing.set(true);
    this.playbackEnded = false;
    return { changed: true, currentTime, resetTimeline };
  }

  markPaused(): void {
    this.playing.set(false);
  }

  markEnded(): void {
    this.playing.set(false);
    this.playbackEnded = true;
  }

  updateCurrentTime(adapter: HellAudioMediaAdapter): void {
    this.currentTime.set(adapter.currentTime);
  }

  updateMetadata(adapter: HellAudioMediaAdapter): void {
    this.duration.set(adapter.duration || 0);
  }

  toggleMute(): void {
    this.muted.update((value) => !value);
  }

  setVolumePercent(percent: number): void {
    const next = Math.max(0, Math.min(1, percent / 100));
    this.volume.set(next);
    this.muted.set(next === 0);
  }

  cyclePlaybackRate(): void {
    const current = this.playbackRate();
    const idx = HELL_AUDIO_PLAYBACK_RATES.indexOf(current);
    const next =
      HELL_AUDIO_PLAYBACK_RATES[
        (idx + 1 + HELL_AUDIO_PLAYBACK_RATES.length) % HELL_AUDIO_PLAYBACK_RATES.length
      ];
    this.playbackRate.set(next);
  }

  syncExternalSeek(adapter: HellAudioMediaAdapter): HellAudioTimelineResult {
    const currentTime = adapter.currentTime;
    if (Math.abs(currentTime - this.currentTime()) <= 0.01) {
      this.currentTime.set(currentTime);
      return { changed: false, currentTime, resetTimeline: false };
    }

    this.currentTime.set(currentTime);
    this.playbackEnded = false;
    return { changed: true, currentTime, resetTimeline: true };
  }

  seekTo(adapter: HellAudioMediaAdapter, seconds: number): HellAudioTimelineResult {
    const duration = adapter.duration;
    const next = Math.max(0, Math.min(Number.isFinite(duration) ? duration : seconds, seconds));
    if (Math.abs(next - adapter.currentTime) <= 0.01) {
      this.currentTime.set(adapter.currentTime);
      return { changed: false, currentTime: adapter.currentTime, resetTimeline: false };
    }

    adapter.setCurrentTime(next);
    this.currentTime.set(next);
    this.playbackEnded = false;
    return { changed: true, currentTime: next, resetTimeline: true };
  }

  seekBy(adapter: HellAudioMediaAdapter, delta: number): HellAudioTimelineResult {
    return this.seekTo(adapter, this.currentTime() + delta);
  }
}
