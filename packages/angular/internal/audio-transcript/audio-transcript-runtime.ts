import { InjectionToken, type Signal, signal } from '@angular/core';

export interface HellAudioTranscriptRuntime {
  readonly transcript: Signal<string>;
  readonly interim: Signal<string>;
  readonly transcribing: Signal<boolean>;
  readonly error: Signal<string | null>;
  readonly copied: Signal<boolean>;
  readonly speechSupported: Signal<boolean>;
  isRecognizing(): boolean;
  startRecognition(
    audio: HTMLAudioElement,
    lang: string | null,
    shouldRestart?: () => boolean,
  ): void;
  stopRecognition(): void;
  resetTranscriptState(): void;
  copyTranscript(): Promise<void>;
  destroy(): void;
}

export type HellAudioTranscriptRuntimeFactory = () => HellAudioTranscriptRuntime;

const audioTranscriptRuntimeFactoryTokenKey = Symbol.for(
  'hell-ui/audio-transcript/runtime-factory-token',
);
const globalAudioTranscriptTokens = globalThis as typeof globalThis & Record<symbol, unknown>;

export const HELL_AUDIO_TRANSCRIPT_RUNTIME_FACTORY =
  (globalAudioTranscriptTokens[audioTranscriptRuntimeFactoryTokenKey] ??=
    new InjectionToken<HellAudioTranscriptRuntimeFactory>(
      'Hell audio transcript runtime factory',
    )) as InjectionToken<HellAudioTranscriptRuntimeFactory>;

export class HellAudioTranscriptUnavailableRuntime implements HellAudioTranscriptRuntime {
  readonly transcript = signal('');
  readonly interim = signal('');
  readonly transcribing = signal(false);
  readonly error = signal<string | null>(null);
  readonly copied = signal(false);
  readonly speechSupported = signal(false);

  isRecognizing(): boolean {
    return false;
  }

  startRecognition(): void {
    this.speechSupported.set(false);
  }

  stopRecognition(): void {
    this.transcribing.set(false);
  }

  resetTranscriptState(): void {
    this.transcript.set('');
    this.interim.set('');
    this.error.set(null);
    this.copied.set(false);
  }

  copyTranscript(): Promise<void> {
    return Promise.resolve();
  }

  destroy(): void {
    this.stopRecognition();
  }
}
