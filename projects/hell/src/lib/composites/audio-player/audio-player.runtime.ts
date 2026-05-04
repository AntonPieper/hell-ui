import { signal } from '@angular/core';

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

/** Best-effort browser caption session behind HellAudioPlayer. */
export class HellAudioRuntime {
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
