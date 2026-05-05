import { HellAudioRuntime, type HellAudioMediaAdapter } from './audio-player.runtime';

class FakeAudioAdapter implements HellAudioMediaAdapter {
  currentTime = 0;
  duration = 0;
  readonly play = vi.fn();
  readonly pause = vi.fn();
  readonly applyAudioState = vi.fn();

  setCurrentTime(value: number): void {
    this.currentTime = value;
  }
}

describe('HellAudioRuntime playback state', () => {
  it('applies volume, muted state, and playback rate to the media adapter', () => {
    const runtime = new HellAudioRuntime();
    const media = new FakeAudioAdapter();

    runtime.setVolumePercent(50);
    runtime.toggleMute();
    runtime.cyclePlaybackRate();
    runtime.syncMedia(media);

    expect(media.applyAudioState).toHaveBeenCalledWith({
      volume: 0.5,
      muted: true,
      playbackRate: 1.25,
    });
  });

  it('derives volume level from volume and muted state', () => {
    const runtime = new HellAudioRuntime();

    expect(runtime.volumeLevel()).toBe('high');

    runtime.setVolumePercent(50);
    expect(runtime.volumeLevel()).toBe('mid');

    runtime.setVolumePercent(20);
    expect(runtime.volumeLevel()).toBe('low');

    runtime.setVolumePercent(0);
    expect(runtime.muted()).toBe(true);
    expect(runtime.volumeLevel()).toBe('mute');
  });

  it('clamps seeks and reports timeline resets only when the media time changes', () => {
    const runtime = new HellAudioRuntime();
    const media = new FakeAudioAdapter();
    media.currentTime = 10;
    media.duration = 60;
    runtime.updateCurrentTime(media);

    expect(runtime.seekTo(media, 15)).toEqual({
      changed: true,
      currentTime: 15,
      resetTimeline: true,
    });
    expect(media.currentTime).toBe(15);
    expect(runtime.currentTime()).toBe(15);

    expect(runtime.seekTo(media, 15.005)).toEqual({
      changed: false,
      currentTime: 15,
      resetTimeline: false,
    });

    expect(runtime.seekTo(media, 100)).toEqual({
      changed: true,
      currentTime: 60,
      resetTimeline: true,
    });
    expect(media.currentTime).toBe(60);
  });

  it('resets captions when playback starts at the beginning or after ending', () => {
    const runtime = new HellAudioRuntime();
    const media = new FakeAudioAdapter();

    media.currentTime = 0.2;
    expect(runtime.markPlayed(media).resetTimeline).toBe(true);

    media.currentTime = 10;
    expect(runtime.markPlayed(media).resetTimeline).toBe(false);

    runtime.markEnded();
    expect(runtime.playing()).toBe(false);
    expect(runtime.markPlayed(media).resetTimeline).toBe(true);
    expect(runtime.playing()).toBe(true);
  });

  it('toggles playback through the media adapter', () => {
    const runtime = new HellAudioRuntime();
    const media = new FakeAudioAdapter();

    runtime.togglePlayback(media);
    expect(media.play).toHaveBeenCalledTimes(1);

    runtime.markPlayed(media);
    runtime.togglePlayback(media);
    expect(media.pause).toHaveBeenCalledTimes(1);
  });
});

describe('HellAudioRuntime live captions', () => {
  const nativeSpeechRecognition = (window as unknown as { SpeechRecognition?: unknown })
    .SpeechRecognition;
  const nativeWebkitSpeechRecognition = (
    window as unknown as { webkitSpeechRecognition?: unknown }
  ).webkitSpeechRecognition;
  const nativeCaptureStream = (HTMLMediaElement.prototype as { captureStream?: unknown })
    .captureStream;

  let recognitions: FakeSpeechRecognition[];
  let tracks: { stop: ReturnType<typeof vi.fn> }[];

  beforeEach(() => {
    recognitions = [];
    tracks = [{ stop: vi.fn() }];
    Object.defineProperty(window, 'SpeechRecognition', {
      configurable: true,
      value: class extends FakeSpeechRecognition {
        constructor() {
          super();
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

  it('captures final and interim speech results from the browser adapter', () => {
    const runtime = new HellAudioRuntime();
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

  it('stops browser capture tracks when captions stop', () => {
    const runtime = new HellAudioRuntime();

    runtime.startRecognition(document.createElement('audio'), 'en-US');
    runtime.stopRecognition();

    expect(recognitions[0].stop).toHaveBeenCalled();
    expect(tracks[0].stop).toHaveBeenCalled();
    expect(runtime.transcribing()).toBe(false);
  });

  it('reports speech errors and tears down recognition', () => {
    const runtime = new HellAudioRuntime();

    runtime.startRecognition(document.createElement('audio'), 'en-US');
    recognitions[0].onerror?.({ error: 'network' });

    expect(runtime.error()).toBe('Speech error: network');
    expect(runtime.isRecognizing()).toBe(false);
    expect(runtime.transcribing()).toBe(false);
  });
});

class FakeSpeechRecognition extends EventTarget {
  lang = '';
  continuous = false;
  interimResults = false;
  maxAlternatives = 0;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
  onresult: ((e: any) => void) | null = null;
  onerror: ((e: any) => void) | null = null;
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
