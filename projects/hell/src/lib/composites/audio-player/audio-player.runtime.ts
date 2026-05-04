import { computed, signal } from '@angular/core';

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

/** Playback, seek, volume, and best-effort browser caption runtime behind HellAudioPlayer. */
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

  readonly transcript = signal<string>('');
  readonly interim = signal<string>('');
  readonly transcribing = signal(false);
  readonly error = signal<string | null>(null);
  readonly copied = signal(false);
  readonly speechSupported = signal(hellAudioSpeechSupported());

  private recognition: SpeechRecognitionLike | null = null;
  private capturedStream: MediaStream | null = null;
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;
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

  isRecognizing(): boolean {
    return this.recognition !== null;
  }

  startRecognition(
    audio: HTMLAudioElement,
    lang: string | null,
    shouldRestart: () => boolean = () => false,
  ): void {
    const Ctor = getSpeechRecognition();
    const source = audio as HTMLAudioElement & { captureStream?(): MediaStream };
    if (!Ctor || typeof source.captureStream !== 'function') return;

    const rec = new Ctor();
    rec.lang = lang ?? (document.documentElement.lang || 'en-US');
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
      if (finalAdd) this.transcript.update((t) => (t ? t + ' ' : '') + finalAdd.trim());
      this.interim.set(interim.trim());
    };
    rec.onerror = (e: any) => {
      const code = e?.error;
      if (code && code !== 'no-speech' && code !== 'aborted') {
        this.error.set(`Speech error: ${code}`);
      }
      this.stopRecognition();
    };
    rec.onend = () => {
      this.transcribing.set(false);
      this.interim.set('');
      if (this.recognition === rec) {
        this.recognition = null;
        if (shouldRestart()) this.startRecognition(audio, lang, shouldRestart);
      }
    };

    try {
      const stream = source.captureStream();
      this.capturedStream = stream;
      const track = stream.getAudioTracks()[0];
      this.recognition = rec;
      this.transcribing.set(true);
      this.error.set(null);
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

  stopRecognition(): void {
    try {
      this.recognition?.stop();
    } catch {
      /* noop */
    }
    this.recognition = null;
    this.capturedStream?.getTracks().forEach((track) => track.stop());
    this.capturedStream = null;
    this.transcribing.set(false);
  }

  resetTranscriptState(): void {
    this.transcript.set('');
    this.interim.set('');
    this.error.set(null);
    this.copied.set(false);
  }

  async copyTranscript(): Promise<void> {
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

  destroy(): void {
    this.stopRecognition();
    if (this.copiedTimer) clearTimeout(this.copiedTimer);
    this.copiedTimer = null;
  }
}
