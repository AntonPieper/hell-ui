import {
  HellAudioSpeechTranscriptRuntime,
  hellAudioSpeechSupported,
  provideHellAudioTranscript,
} from './audio-transcript';
import { type HellAudioTranscriptRuntime } from '@hell-ui/angular/internal/audio-transcript';

describe('HellAudioSpeechTranscriptRuntime', () => {
  const nativeSpeechRecognition = (window as unknown as { SpeechRecognition?: unknown })
    .SpeechRecognition;
  const nativeWebkitSpeechRecognition = (
    window as unknown as { webkitSpeechRecognition?: unknown }
  ).webkitSpeechRecognition;
  const nativeCaptureStream = (HTMLMediaElement.prototype as { captureStream?: unknown })
    .captureStream;

  let recognitions: FakeSpeechRecognition[];
  let tracks: { stop: ReturnType<typeof vi.fn> }[];
  let throwOnTrackStart = false;

  beforeEach(() => {
    recognitions = [];
    tracks = [{ stop: vi.fn() }];
    throwOnTrackStart = false;
    Object.defineProperty(window, 'SpeechRecognition', {
      configurable: true,
      value: class extends FakeSpeechRecognition {
        constructor() {
          super();
          if (throwOnTrackStart) {
            this.start.mockImplementation(() => {
              throw new Error('Track start unsupported in this runtime');
            });
          }
          recognitions.push(this);
        }
      },
    });
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'captureStream', {
      configurable: true,
      value: vi.fn(() => ({
        getAudioTracks: () => tracks,
        getTracks: () => tracks,
      })),
    });
  });

  afterEach(() => {
    restoreWindowCtor('SpeechRecognition', nativeSpeechRecognition);
    restoreWindowCtor('webkitSpeechRecognition', nativeWebkitSpeechRecognition);
    if (nativeCaptureStream === undefined) {
      delete (HTMLMediaElement.prototype as { captureStream?: unknown }).captureStream;
    } else {
      Object.defineProperty(HTMLMediaElement.prototype, 'captureStream', {
        configurable: true,
        value: nativeCaptureStream,
      });
    }
  });

  it('provides a fresh runtime factory for the optional transcript seam', () => {
    const provider = provideHellAudioTranscript()[0] as {
      readonly useValue: () => HellAudioTranscriptRuntime;
    };

    expect(provider.useValue()).toBeInstanceOf(HellAudioSpeechTranscriptRuntime);
    expect(provider.useValue()).not.toBe(provider.useValue());
  });

  it('reports media-track speech support only when the feature seam is imported', () => {
    expect(hellAudioSpeechSupported()).toBe(true);

    delete (HTMLMediaElement.prototype as { captureStream?: unknown }).captureStream;

    expect(hellAudioSpeechSupported()).toBe(false);
  });

  it('uses ownerDocument lang as a fallback when lang is not explicitly set', () => {
    const runtime = new HellAudioSpeechTranscriptRuntime();
    const audio = document.createElement('audio');
    audio.ownerDocument.documentElement.lang = 'es-ES';

    runtime.startRecognition(audio, null);

    expect(recognitions[0].lang).toBe('es-ES');
  });

  it('captures final and interim speech results from the browser adapter', () => {
    const runtime = new HellAudioSpeechTranscriptRuntime();
    const audio = document.createElement('audio');

    runtime.startRecognition(audio, 'de-DE');

    const recognition = recognitions[0];
    expect(recognition.lang).toBe('de-DE');
    expect(recognition.continuous).toBe(true);
    expect(recognition.interimResults).toBe(true);
    expect(recognition.start).toHaveBeenCalledWith(tracks[0]);
    expect(runtime.transcribing()).toBe(true);

    recognition.onresult?.({
      resultIndex: 0,
      results: [
        speechResult('ship it', true),
        speechResult('still talking', false),
      ],
    });

    expect(runtime.transcript()).toBe('ship it');
    expect(runtime.interim()).toBe('still talking');
  });

  it('stops browser capture tracks when transcription stops', () => {
    const runtime = new HellAudioSpeechTranscriptRuntime();

    runtime.startRecognition(document.createElement('audio'), 'en-US');
    runtime.stopRecognition();

    expect(recognitions[0].stop).toHaveBeenCalled();
    expect(tracks[0].stop).toHaveBeenCalled();
    expect(runtime.transcribing()).toBe(false);
  });

  it('fails track-based recognition without falling back to generic start()', () => {
    throwOnTrackStart = true;
    const runtime = new HellAudioSpeechTranscriptRuntime();

    runtime.startRecognition(document.createElement('audio'), 'en-US');

    expect(recognitions[0].start).toHaveBeenCalledTimes(1);
    expect(recognitions[0].start).toHaveBeenCalledWith(tracks[0]);
    expect(runtime.speechSupported()).toBe(false);
    expect(runtime.error()).toContain('Track start unsupported in this runtime');
    expect(runtime.isRecognizing()).toBe(false);
    expect(runtime.transcribing()).toBe(false);
  });

  it('reports speech errors and tears down recognition', () => {
    const runtime = new HellAudioSpeechTranscriptRuntime();

    runtime.startRecognition(document.createElement('audio'), 'en-US');
    recognitions[0].onerror?.({ error: 'network' });

    expect(runtime.error()).toBe('Speech error: network');
    expect(runtime.isRecognizing()).toBe(false);
    expect(runtime.transcribing()).toBe(false);
  });
});

interface FakeSpeechRecognitionResultEvent {
  readonly resultIndex: number;
  readonly results: ArrayLike<{ readonly isFinal: boolean; readonly 0: { readonly transcript: string } }>;
}

interface FakeSpeechRecognitionErrorEvent {
  readonly error?: string;
}

class FakeSpeechRecognition extends EventTarget {
  lang = '';
  continuous = false;
  interimResults = false;
  maxAlternatives = 0;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
  onresult: ((e: FakeSpeechRecognitionResultEvent) => void) | null = null;
  onerror: ((e: FakeSpeechRecognitionErrorEvent) => void) | null = null;
  onend: (() => void) | null = null;
}

function speechResult(transcript: string, isFinal: boolean) {
  return {
    0: { transcript },
    isFinal,
  };
}

function restoreWindowCtor(name: 'SpeechRecognition' | 'webkitSpeechRecognition', value: unknown) {
  if (value === undefined) {
    delete (window as unknown as Record<string, unknown>)[name];
  } else {
    Object.defineProperty(window, name, { configurable: true, value });
  }
}
