import { type Provider, signal } from '@angular/core';
import {
  HELL_AUDIO_TRANSCRIPT_RUNTIME_FACTORY,
  type HellAudioTranscriptRuntime,
} from '../../composites/audio-player/audio-player.transcript';

interface SpeechRecognitionAlternativeLike {
  readonly transcript: string;
}

interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly 0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionResultListLike {
  readonly length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionResultEventLike {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike {
  readonly error?: string;
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(track?: MediaStreamTrack): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionCtor {
  new (): SpeechRecognitionLike;
}

const HELL_AUDIO_RECOGNITION_UNSUPPORTED_MESSAGE =
  'Speech transcript is unavailable for this browser and media element.';

function resolveCaptionLang(audio: HTMLAudioElement, lang: string | null): string {
  if (lang) return lang;
  const doc = audio.ownerDocument;
  const candidate = doc?.documentElement?.getAttribute('lang') ?? doc?.documentElement?.lang;
  return candidate?.trim() || 'en-US';
}

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * @experimental Optional provider that enables the browser speech transcript runtime for
 * `HellAudioPlayer`. Import it from `@hell-ui/angular/features/audio-transcript` only in
 * apps/routes that deliberately opt into best-effort transcript capture.
 */
export function provideHellAudioTranscript(): Provider[] {
  return [
    {
      provide: HELL_AUDIO_TRANSCRIPT_RUNTIME_FACTORY,
      useValue: () => new HellAudioSpeechTranscriptRuntime(),
    },
  ];
}

/**
 * @experimental True when this browser supports media-track `SpeechRecognition` and
 * `captureStream()` for the optional audio transcript provider.
 */
export function hellAudioSpeechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    getSpeechRecognition() !== null &&
    typeof (HTMLMediaElement.prototype as HTMLMediaElement & { captureStream?: unknown })
      .captureStream === 'function'
  );
}

/**
 * @experimental Browser speech transcript runtime for `HellAudioPlayer`.
 * Best-effort only; not accessibility captions or production timed text.
 */
export class HellAudioSpeechTranscriptRuntime implements HellAudioTranscriptRuntime {
  readonly transcript = signal<string>('');
  readonly interim = signal<string>('');
  readonly transcribing = signal(false);
  readonly error = signal<string | null>(null);
  readonly copied = signal(false);
  readonly speechSupported = signal(hellAudioSpeechSupported());

  private recognition: SpeechRecognitionLike | null = null;
  private capturedStream: MediaStream | null = null;
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;

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
    if (!Ctor || typeof source.captureStream !== 'function') {
      this.speechSupported.set(false);
      this.error.set(HELL_AUDIO_RECOGNITION_UNSUPPORTED_MESSAGE);
      return;
    }

    const rec = new Ctor();
    rec.lang = resolveCaptionLang(audio, lang);
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
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
    rec.onerror = (e) => {
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
        this.stopCapturedStream();
        if (shouldRestart()) this.startRecognition(audio, lang, shouldRestart);
      }
    };

    let stream: MediaStream;
    try {
      stream = source.captureStream();
    } catch (err) {
      this.speechSupported.set(false);
      this.error.set(err instanceof Error ? err.message : String(err));
      return;
    }

    const track = stream.getAudioTracks()?.[0];
    if (!track) {
      stream.getTracks().forEach((capturedTrack) => capturedTrack.stop());
      this.speechSupported.set(false);
      this.error.set(HELL_AUDIO_RECOGNITION_UNSUPPORTED_MESSAGE);
      return;
    }

    this.capturedStream = stream;
    this.recognition = rec;
    this.transcribing.set(true);
    this.error.set(null);

    try {
      rec.start(track);
    } catch (err) {
      this.speechSupported.set(false);
      this.error.set(err instanceof Error ? err.message : String(err));
      this.stopRecognition();
    }
  }

  stopRecognition(): void {
    try {
      this.recognition?.stop();
    } catch {
      /* noop */
    }
    this.recognition = null;
    this.stopCapturedStream();
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
    const clipboard = globalThis.navigator?.clipboard;
    if (!text || !clipboard) return;
    try {
      await clipboard.writeText(text);
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

  private stopCapturedStream(): void {
    this.capturedStream?.getTracks().forEach((track) => track.stop());
    this.capturedStream = null;
  }
}
